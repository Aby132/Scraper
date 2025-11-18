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
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI client initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")
        openai_client = None
else:
    print("Warning: OPENAI_API_KEY not found in environment variables. AI features will be disabled.")


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
    # Enhanced data extraction
    tables: List[dict] = []
    forms: List[dict] = []
    buttons: List[dict] = []
    videos: List[str] = []
    scripts: List[str] = []
    stylesheets: List[str] = []
    lists: List[dict] = []
    paragraphs: List[str] = []
    quotes: List[str] = []
    code_blocks: List[str] = []
    # AI-powered analysis
    ai_summary: str | None = None
    ai_key_points: List[str] | None = None
    ai_category: str | None = None
    ai_sentiment: str | None = None
    ai_entities: List[dict] | None = None
    ai_topics: List[str] | None = None
    ai_keywords: List[str] | None = None
    ai_structured_data: dict | None = None
    ai_insights: str | None = None
    warnings: List[str]


app = FastAPI(title=APP_NAME, version="1.0.0", description="AI-powered web scraping API with comprehensive data extraction")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "name": APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "openai_configured": openai_client is not None,
        "endpoints": {
            "scrape": "/api/scrape",
            "docs": "/docs",
            "health": "/health"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "openai_available": openai_client is not None
    }


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


def _extract_metadata(html: str, base_url: str) -> tuple[str | None, str | None, str, str, list[str], list[str], dict[str, list[str]], dict[str, str], dict[str, str], str | None, int, list[dict], list[dict], list[dict], list[str], list[str], list[str], list[dict], list[str], list[str], list[str], list[str], list[str]]:
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

    # Extract tables
    tables = []
    for table in soup.find_all("table"):
        table_data = {"headers": [], "rows": []}
        headers = table.find_all("th")
        if headers:
            table_data["headers"] = [th.get_text(strip=True) for th in headers]
        for row in table.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if cells:
                table_data["rows"].append([cell.get_text(strip=True) for cell in cells])
        if table_data["rows"] or table_data["headers"]:
            tables.append(table_data)
            if len(tables) >= 20:  # Limit to 20 tables
                break

    # Extract forms
    forms = []
    for form in soup.find_all("form"):
        form_data = {
            "action": form.get("action", ""),
            "method": form.get("method", "get").upper(),
            "inputs": []
        }
        for input_tag in form.find_all(["input", "textarea", "select"]):
            input_data = {
                "type": input_tag.get("type", input_tag.name),
                "name": input_tag.get("name", ""),
                "placeholder": input_tag.get("placeholder", ""),
                "label": ""
            }
            # Try to find associated label
            if input_tag.get("id"):
                label = soup.find("label", {"for": input_tag.get("id")})
                if label:
                    input_data["label"] = label.get_text(strip=True)
            form_data["inputs"].append(input_data)
        if form_data["inputs"]:
            forms.append(form_data)
            if len(forms) >= 10:  # Limit to 10 forms
                break

    # Extract buttons
    buttons = []
    for button in soup.find_all(["button", "input"]):
        if button.get("type") in ["button", "submit", "reset"] or button.name == "button":
            button_data = {
                "text": button.get_text(strip=True) or button.get("value", ""),
                "type": button.get("type", "button"),
                "class": button.get("class", [])
            }
            buttons.append(button_data)
            if len(buttons) >= 50:
                break

    # Extract videos
    videos = []
    for video in soup.find_all(["video", "iframe"]):
        src = video.get("src") or video.get("data-src")
        if not src and video.name == "iframe":
            src = video.get("src")
        if src:
            absolute = urljoin(base_url, src)
            if absolute.startswith(("http://", "https://")):
                videos.append(absolute)
                if len(videos) >= 20:
                    break

    # Extract scripts
    scripts = []
    for script in soup.find_all("script", src=True):
        src = script.get("src")
        if src:
            absolute = urljoin(base_url, src)
            if absolute.startswith(("http://", "https://")):
                scripts.append(absolute)
                if len(scripts) >= 30:
                    break

    # Extract stylesheets
    stylesheets = []
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href")
        if href:
            absolute = urljoin(base_url, href)
            if absolute.startswith(("http://", "https://")):
                stylesheets.append(absolute)
                if len(stylesheets) >= 20:
                    break

    # Extract lists
    lists_data = []
    for list_tag in soup.find_all(["ul", "ol"]):
        items = [li.get_text(strip=True) for li in list_tag.find_all("li")]
        if items:
            lists_data.append({
                "type": list_tag.name,
                "items": items[:50]  # Limit items per list
            })
            if len(lists_data) >= 30:
                break

    # Extract paragraphs
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    paragraphs = paragraphs[:100]  # Limit to 100 paragraphs

    # Extract quotes
    quotes = []
    for quote in soup.find_all(["blockquote", "q", "cite"]):
        quote_text = quote.get_text(strip=True)
        if quote_text:
            quotes.append(quote_text)
            if len(quotes) >= 30:
                break

    # Extract code blocks
    code_blocks = []
    for code in soup.find_all(["code", "pre"]):
        code_text = code.get_text(strip=True)
        if code_text and len(code_text) > 10:  # Only meaningful code blocks
            code_blocks.append(code_text[:500])  # Limit length
            if len(code_blocks) >= 20:
                break

    # Check for login forms
    warnings = []
    if soup.find("input", {"type": "password"}) or soup.find("form", {"id": lambda x: x and "login" in x.lower()}) or "login" in text.lower()[:500]:
        warnings.append("Login form detected; scraping aborted.")

    return title, description, excerpt, text, links, images, headings, meta_tags, social_tags, lang, word_count, tables, forms, buttons, videos, scripts, stylesheets, lists_data, paragraphs, quotes, code_blocks, warnings


def _get_ai_analysis(text: str, title: str | None, tables: list, forms: list, links: list) -> tuple[str | None, list[str] | None, str | None, str | None, list[dict] | None, list[str] | None, list[str] | None, dict | None, str | None]:
    """Use OpenAI to comprehensively analyze and extract structured data from scraped content."""
    if not openai_client:
        print("OpenAI client not available, skipping AI analysis")
        return None, None, None, None, None, None, None, None, None

    try:
        # Prepare context for AI
        text_for_analysis = text[:12000] if len(text) > 12000 else text
        if not text_for_analysis or len(text_for_analysis.strip()) < 10:
            print("Warning: Text content too short for AI analysis")
            return None, None, None, None, None, None, None, None, None
            
        tables_info = f"Found {len(tables)} tables" if tables else "No tables found"
        forms_info = f"Found {len(forms)} forms" if forms else "No forms found"
        links_count = len(links)
        
        prompt = f"""Analyze the following webpage content comprehensively and provide detailed insights:

Title: {title or 'Not provided'}
Content: {text_for_analysis}
Additional Info: {tables_info}, {forms_info}, {links_count} links found

Please provide:
1. SUMMARY: A comprehensive 3-4 sentence summary
2. KEY_POINTS: 5-7 main topics or key points (one per line, prefixed with "-")
3. CATEGORY: Primary content type (e.g., "News Article", "Product Page", "Blog Post", "Documentation", "E-commerce", "Landing Page", etc.)
4. SENTIMENT: Overall sentiment (Positive, Negative, Neutral, or Mixed)
5. ENTITIES: Extract important entities (people, organizations, locations, products) as JSON array: [{{"name": "...", "type": "PERSON|ORG|LOCATION|PRODUCT"}}]
6. TOPICS: List 5-7 main topics discussed (one per line, prefixed with "-")
7. KEYWORDS: Extract 10-15 important keywords (comma-separated)
8. STRUCTURED_DATA: Extract structured information as JSON object with keys like: purpose, target_audience, main_offer, contact_info, pricing_info, features (if applicable)
9. INSIGHTS: Provide 2-3 actionable insights about the content

Format your response exactly as:
SUMMARY: [summary text]
KEY_POINTS:
- [point 1]
- [point 2]
CATEGORY: [category]
SENTIMENT: [sentiment]
ENTITIES: [JSON array]
TOPICS:
- [topic 1]
- [topic 2]
KEYWORDS: [comma-separated keywords]
STRUCTURED_DATA: [JSON object]
INSIGHTS: [insights text]"""

        print("Calling OpenAI API for content analysis...")
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert web content analyst that extracts comprehensive structured data and insights from web pages. Always provide valid JSON when requested."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7,
            timeout=30.0,  # 30 second timeout
        )

        if not response or not response.choices or len(response.choices) == 0:
            print("Error: Empty response from OpenAI API")
            return None, None, None, None, None, None, None, None, None

        content = response.choices[0].message.content
        
        if not content:
            print("Error: No content in OpenAI response")
            return None, None, None, None, None, None, None, None, None
        
        print(f"OpenAI API response received ({len(content)} characters)")
        
        # Parse the comprehensive response
        summary = None
        key_points = []
        category = None
        sentiment = None
        entities = None
        topics = []
        keywords = []
        structured_data = None
        insights = None

        if "SUMMARY:" in content:
            summary = content.split("SUMMARY:")[1].split("KEY_POINTS:")[0].strip()
        
        if "KEY_POINTS:" in content:
            key_points_section = content.split("KEY_POINTS:")[1].split("CATEGORY:")[0] if "CATEGORY:" in content else content.split("KEY_POINTS:")[1]
            key_points = [point.strip().lstrip("- ").strip() for point in key_points_section.strip().split("\n") if point.strip() and point.strip().startswith("-")]
        
        if "CATEGORY:" in content:
            category_section = content.split("CATEGORY:")[1]
            category = category_section.split("SENTIMENT:")[0].strip() if "SENTIMENT:" in category_section else category_section.split("\n")[0].strip()
        
        if "SENTIMENT:" in content:
            sentiment_section = content.split("SENTIMENT:")[1]
            sentiment = sentiment_section.split("ENTITIES:")[0].strip() if "ENTITIES:" in sentiment_section else sentiment_section.split("\n")[0].strip()
        
        if "ENTITIES:" in content:
            entities_section = content.split("ENTITIES:")[1].split("TOPICS:")[0] if "TOPICS:" in content else content.split("ENTITIES:")[1]
            try:
                import json
                # Try to extract JSON from the section
                entities_text = entities_section.strip()
                # Remove any markdown code blocks if present
                if entities_text.startswith("```"):
                    entities_text = entities_text.split("```")[1]
                    if entities_text.startswith("json"):
                        entities_text = entities_text[4:]
                entities_text = entities_text.strip()
                entities = json.loads(entities_text)
                print(f"Extracted {len(entities) if isinstance(entities, list) else 0} entities")
            except json.JSONDecodeError as e:
                print(f"Warning: Could not parse entities JSON: {e}")
                entities = None
        
        if "TOPICS:" in content:
            topics_section = content.split("TOPICS:")[1].split("KEYWORDS:")[0] if "KEYWORDS:" in content else content.split("TOPICS:")[1]
            topics = [topic.strip().lstrip("- ").strip() for topic in topics_section.strip().split("\n") if topic.strip() and topic.strip().startswith("-")]
        
        if "KEYWORDS:" in content:
            keywords_section = content.split("KEYWORDS:")[1].split("STRUCTURED_DATA:")[0] if "STRUCTURED_DATA:" in content else content.split("KEYWORDS:")[1]
            keywords = [kw.strip() for kw in keywords_section.strip().split(",") if kw.strip()]
        
        if "STRUCTURED_DATA:" in content:
            structured_section = content.split("STRUCTURED_DATA:")[1].split("INSIGHTS:")[0] if "INSIGHTS:" in content else content.split("STRUCTURED_DATA:")[1]
            try:
                import json
                # Try to extract JSON from the section
                structured_text = structured_section.strip()
                # Remove any markdown code blocks if present
                if structured_text.startswith("```"):
                    structured_text = structured_text.split("```")[1]
                    if structured_text.startswith("json"):
                        structured_text = structured_text[4:]
                structured_text = structured_text.strip()
                structured_data = json.loads(structured_text)
                print("Successfully extracted structured data")
            except json.JSONDecodeError as e:
                print(f"Warning: Could not parse structured_data JSON: {e}")
                structured_data = None
        
        if "INSIGHTS:" in content:
            insights = content.split("INSIGHTS:")[1].strip()

        print("AI analysis completed successfully")
        return summary, key_points if key_points else None, category, sentiment, entities, topics if topics else None, keywords if keywords else None, structured_data, insights

    except Exception as e:
        import traceback
        print(f"AI analysis failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return None, None, None, None, None, None, None, None, None


def _fetch_html(target_url: str) -> tuple[str, list[str]]:
    """Fetch HTML content from the target URL with proper error handling."""
    try:
        print(f"Fetching URL: {target_url}")
        response = requests.get(
            target_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            },
            timeout=(10, 30),  # Increased timeout
            allow_redirects=True,
            stream=True,  # Stream to check size before downloading
        )
        response.raise_for_status()  # Raise exception for bad status codes
        
        print(f"Response status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'unknown')}")
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timeout: The server took too long to respond.")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="Connection error: Could not connect to the server.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code if e.response else 502, detail=f"HTTP error: {e}")
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Request failed: {str(exc)}") from exc

    content_type = response.headers.get("content-type", "").lower()
    if not any(ct in content_type for ct in SCRAPABLE_CONTENT_TYPES):
        raise HTTPException(
            status_code=415, 
            detail=f"Unsupported content type: {content_type}. Only HTML content is supported."
        )

    # Check content length
    content_length = response.headers.get("content-length")
    if content_length and int(content_length) > MAX_DOWNLOAD_BYTES:
        raise HTTPException(
            status_code=413, 
            detail=f"Page is too large ({content_length} bytes). Maximum size is {MAX_DOWNLOAD_BYTES} bytes."
        )

    # Read content with size check
    content = b""
    for chunk in response.iter_content(chunk_size=8192):
        content += chunk
        if len(content) > MAX_DOWNLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Page is too large. Maximum size is {MAX_DOWNLOAD_BYTES} bytes."
            )
    
    print(f"Successfully fetched {len(content)} bytes")
    return content.decode("utf-8", errors="ignore"), [f"Content-Type: {content_type}"]


@app.post("/api/scrape", response_model=ScrapeResponse)
def scrape(request: ScrapeRequest) -> ScrapeResponse:
    """Main scraping endpoint that fetches and analyzes web content."""
    try:
        print(f"\n{'='*60}")
        print(f"Scraping request received for: {request.url}")
        print(f"{'='*60}\n")
        
        parsed = urlparse(str(request.url))
        if parsed.scheme not in {"http", "https"}:
            raise HTTPException(status_code=400, detail="Only HTTP/S URLs are supported.")

        _ensure_public_host(parsed.hostname or "")
        print(f"Host validation passed: {parsed.hostname}")

        allowed, robot_warnings = _is_allowed_by_robots(str(request.url))
        if not allowed:
            raise HTTPException(status_code=403, detail="robots.txt forbids scraping.")
        print(f"robots.txt check passed. Warnings: {robot_warnings}")

        print("Fetching HTML content...")
        html, response_warnings = _fetch_html(str(request.url))
        print(f"HTML fetched successfully ({len(html)} characters)")

        print("Extracting metadata...")
        title, description, excerpt, full_text, links, images, headings, meta_tags, social_tags, lang, word_count, tables, forms, buttons, videos, scripts, stylesheets, lists_data, paragraphs, quotes, code_blocks, login_warnings = _extract_metadata(
            html, str(request.url)
        )
        print(f"Metadata extracted: {len(links)} links, {len(images)} images, {word_count} words")

        if login_warnings:
            raise HTTPException(status_code=400, detail=login_warnings[0])

        # Get comprehensive AI analysis using OpenAI
        print("Starting AI analysis with OpenAI...")
        ai_summary, ai_key_points, ai_category, ai_sentiment, ai_entities, ai_topics, ai_keywords, ai_structured_data, ai_insights = _get_ai_analysis(
            full_text, title, tables, forms, links
        )
        
        if ai_summary:
            print("AI analysis completed successfully")
        else:
            print("AI analysis skipped or failed (non-critical)")

        warnings = robot_warnings + response_warnings

        print(f"\n{'='*60}")
        print("Scraping completed successfully!")
        print(f"{'='*60}\n")

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
            tables=tables,
            forms=forms,
            buttons=buttons,
            videos=videos,
            scripts=scripts,
            stylesheets=stylesheets,
            lists=lists_data,
            paragraphs=paragraphs,
            quotes=quotes,
            code_blocks=code_blocks,
            ai_summary=ai_summary,
            ai_key_points=ai_key_points,
            ai_category=ai_category,
            ai_sentiment=ai_sentiment,
            ai_entities=ai_entities,
            ai_topics=ai_topics,
            ai_keywords=ai_keywords,
            ai_structured_data=ai_structured_data,
            ai_insights=ai_insights,
            warnings=warnings,
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        import traceback
        error_msg = f"Unexpected error during scraping: {str(e)}"
        print(f"ERROR: {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg) from e


