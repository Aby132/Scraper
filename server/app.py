from __future__ import annotations

import ipaddress
import os
import socket
from typing import List
from urllib.parse import urljoin, urlparse
from urllib import robotparser

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, HttpUrl

# Load environment variables
load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:
        openai_client = None


APP_NAME = "Scrape"
USER_AGENT = (
    "Scrape/1.0 (+https://example.com/contact) "
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
)
MAX_DOWNLOAD_BYTES = 1_000_000  # ~1MB cap to avoid heavy downloads
SCRAPABLE_CONTENT_TYPES = ("text/html", "application/xhtml+xml")
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0"}


class ScrapeRequest(BaseModel):
    url: HttpUrl


class ScrapeResponse(BaseModel):
    fetched_url: HttpUrl
    title: str | None = None
    description: str | None = None
    text_excerpt: str
    full_text: str
    links: List[str]
    images: List[str]
    headings: dict[str, List[str]]
    meta_tags: dict[str, str]
    social_tags: dict[str, str]
    language: str | None = None
    word_count: int
    ai_summary: str | None = None
    ai_key_points: List[str] | None = None
    ai_category: str | None = None
    warnings: List[str]


app = FastAPI(title=APP_NAME, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)


def _ensure_public_host(host: str) -> None:
    hostname = host.lower()
    if hostname in BLOCKED_HOSTS:
        raise HTTPException(status_code=400, detail="Local targets are not allowed.")

    try:
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        try:
            resolved_ip = socket.gethostbyname(hostname)
            ip = ipaddress.ip_address(resolved_ip)
        except (socket.gaierror, ValueError):
            return

    if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_multicast:
        raise HTTPException(
            status_code=400, detail="Private or internal addresses are blocked."
        )


def _is_allowed_by_robots(target_url: str) -> tuple[bool, list[str]]:
    parsed = urlparse(target_url)
    robots_url = urljoin(f"{parsed.scheme}://{parsed.netloc}", "/robots.txt")
    parser = robotparser.RobotFileParser()
    parser.set_url(robots_url)

    warnings: list[str] = []

    try:
        parser.read()
    except Exception:
        warnings.append("robots.txt could not be downloaded; assuming allow.")
        return True, warnings

    allowed = parser.can_fetch(USER_AGENT, target_url)
    return allowed, warnings


def _extract_metadata(html: str, base_url: str) -> tuple[str | None, str | None, str, str, list[str], list[str], dict[str, list[str]], dict[str, str], dict[str, str], str | None, int, list[str]]:
    soup = BeautifulSoup(html, "html.parser")

    # Basic metadata
    title = soup.title.string.strip() if soup.title and soup.title.string else None
    description_tag = soup.find("meta", attrs={"name": "description"})
    description = (
        description_tag.get("content", "").strip() if description_tag else None
    )

    # Language detection
    lang = soup.html.get("lang") if soup.html else None
    if not lang:
        lang_tag = soup.find("meta", attrs={"http-equiv": "Content-Language"})
        if lang_tag:
            lang = lang_tag.get("content", "").split(",")[0].strip()

    # Remove scripts and styles
    for script in soup(["script", "style", "noscript", "iframe"]):
        script.decompose()

    # Extract full text
    text = soup.get_text(separator="\n")
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    word_count = len(text.split())
    excerpt = text[:1200] + ("…" if len(text) > 1200 else "")

    # Extract links
    links = []
    seen_links = set()
    for link in soup.find_all("a", href=True):
        absolute = urljoin(base_url, link["href"])
        if absolute not in seen_links and absolute.startswith(("http://", "https://")):
            links.append(absolute)
            seen_links.add(absolute)
            if len(links) == 100:  # Increased limit
                break

    # Extract images
    images = []
    seen_images = set()
    for img in soup.find_all("img", src=True):
        absolute = urljoin(base_url, img["src"])
        if absolute not in seen_images and absolute.startswith(("http://", "https://")):
            images.append(absolute)
            seen_images.add(absolute)
            if len(images) == 50:
                break

    # Extract headings
    headings = {
        "h1": [],
        "h2": [],
        "h3": [],
        "h4": [],
        "h5": [],
        "h6": [],
    }
    for level in headings.keys():
        for heading in soup.find_all(level):
            text_content = heading.get_text(strip=True)
            if text_content:
                headings[level].append(text_content)

    # Extract meta tags
    meta_tags = {}
    for meta in soup.find_all("meta"):
        name = meta.get("name") or meta.get("property") or meta.get("http-equiv")
        content = meta.get("content")
        if name and content:
            meta_tags[name.lower()] = content

    # Extract social media tags (Open Graph, Twitter Cards)
    social_tags = {}
    og_tags = soup.find_all("meta", property=lambda x: x and x.startswith("og:"))
    for tag in og_tags:
        prop = tag.get("property", "").replace("og:", "")
        content = tag.get("content", "")
        if prop and content:
            social_tags[f"og:{prop}"] = content

    twitter_tags = soup.find_all("meta", attrs={"name": lambda x: x and x.startswith("twitter:")})
    for tag in twitter_tags:
        name = tag.get("name", "").replace("twitter:", "")
        content = tag.get("content", "")
        if name and content:
            social_tags[f"twitter:{name}"] = content

    # Check for login forms
    warnings = []
    if soup.find("input", {"type": "password"}) or soup.find("form", {"id": lambda x: x and "login" in x.lower()}) or "login" in text.lower()[:500]:
        warnings.append("Login form detected; scraping aborted.")

    return title, description, excerpt, text, links, images, headings, meta_tags, social_tags, lang, word_count, warnings


def _get_ai_analysis(text: str, title: str | None) -> tuple[str | None, list[str] | None, str | None]:
    """Use OpenAI to analyze and summarize the scraped content."""
    if not openai_client:
        return None, None, None

    try:
        # Limit text length for API (keep first 8000 characters)
        text_for_analysis = text[:8000] if len(text) > 8000 else text
        
        prompt = f"""Analyze the following webpage content and provide:
1. A concise summary (2-3 sentences)
2. 3-5 key points or main topics
3. The primary category/type of content (e.g., "News Article", "Product Page", "Blog Post", "Documentation", "E-commerce", etc.)

Title: {title or 'Not provided'}
Content: {text_for_analysis}

Format your response as:
SUMMARY: [your summary here]
KEY_POINTS:
- [point 1]
- [point 2]
- [point 3]
CATEGORY: [category name]"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes web content and provides concise summaries and insights."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )

        content = response.choices[0].message.content
        
        # Parse the response
        summary = None
        key_points = []
        category = None

        if "SUMMARY:" in content:
            summary = content.split("SUMMARY:")[1].split("KEY_POINTS:")[0].strip()
        
        if "KEY_POINTS:" in content:
            key_points_section = content.split("KEY_POINTS:")[1]
            if "CATEGORY:" in key_points_section:
                key_points_section = key_points_section.split("CATEGORY:")[0]
            key_points = [point.strip().lstrip("- ").strip() for point in key_points_section.strip().split("\n") if point.strip() and point.strip().startswith("-")]
        
        if "CATEGORY:" in content:
            category = content.split("CATEGORY:")[1].strip()

        return summary, key_points if key_points else None, category

    except Exception as e:
        # If AI analysis fails, return None values (graceful degradation)
        print(f"AI analysis failed: {e}")
        return None, None, None


def _fetch_html(target_url: str) -> tuple[str, list[str]]:
    try:
        response = requests.get(
            target_url,
            headers={"User-Agent": USER_AGENT},
            timeout=(5, 15),
            allow_redirects=True,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Request failed: {exc}") from exc

    content_type = response.headers.get("content-type", "")
    if not any(ct in content_type for ct in SCRAPABLE_CONTENT_TYPES):
        raise HTTPException(status_code=415, detail="Unsupported content type.")

    if len(response.content) > MAX_DOWNLOAD_BYTES:
        raise HTTPException(
            status_code=413, detail="Page is too large to fetch safely."
        )

    return response.text, [f"Content-Type: {content_type}"]


@app.post("/api/scrape", response_model=ScrapeResponse)
def scrape(request: ScrapeRequest) -> ScrapeResponse:
    parsed = urlparse(str(request.url))
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Only HTTP/S URLs are supported.")

    _ensure_public_host(parsed.hostname or "")

    allowed, robot_warnings = _is_allowed_by_robots(str(request.url))
    if not allowed:
        raise HTTPException(status_code=403, detail="robots.txt forbids scraping.")

    html, response_warnings = _fetch_html(str(request.url))
    title, description, excerpt, full_text, links, images, headings, meta_tags, social_tags, lang, word_count, login_warnings = _extract_metadata(
        html, str(request.url)
    )

    if login_warnings:
        raise HTTPException(status_code=400, detail=login_warnings[0])

    # Get AI analysis
    ai_summary, ai_key_points, ai_category = _get_ai_analysis(full_text, title)

    warnings = robot_warnings + response_warnings

    return ScrapeResponse(
        fetched_url=request.url,
        title=title,
        description=description,
        text_excerpt=excerpt,
        full_text=full_text,
        links=links,
        images=images,
        headings=headings,
        meta_tags=meta_tags,
        social_tags=social_tags,
        language=lang,
        word_count=word_count,
        ai_summary=ai_summary,
        ai_key_points=ai_key_points,
        ai_category=ai_category,
        warnings=warnings,
    )


