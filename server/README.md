# Scrape Backend API

FastAPI backend for the Scrape web scraping application with OpenAI integration.

## Quick Start

1. **Create virtual environment:**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows PowerShell
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Run the server:**
```bash
uvicorn app:app --reload --port 8000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI-powered content analysis. If not provided, scraping works but AI features are disabled. |

## API Endpoints

### POST /api/scrape

Scrapes a website and returns comprehensive data including AI analysis.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "fetched_url": "https://example.com",
  "title": "Example",
  "description": "...",
  "text_excerpt": "...",
  "full_text": "...",
  "links": ["https://..."],
  "images": ["https://..."],
  "headings": {
    "h1": [...],
    "h2": [...]
  },
  "meta_tags": {...},
  "social_tags": {...},
  "language": "en",
  "word_count": 1234,
  "ai_summary": "AI-generated summary...",
  "ai_key_points": ["Point 1", "Point 2"],
  "ai_category": "Blog Post",
  "warnings": []
}
```

**Error Codes:**
- `400` - Invalid URL or login form detected
- `403` - robots.txt forbids scraping
- `413` - Page too large (>1MB)
- `415` - Unsupported content type
- `502` - Request failed

## Features

- ✅ Respects robots.txt
- ✅ Blocks login-protected pages
- ✅ Extracts comprehensive metadata
- ✅ AI-powered content analysis (if API key provided)
- ✅ Safe scraping with built-in guardrails
- ✅ Blocks localhost and private IPs
- ✅ Size limits (1MB max)

## Development

### Running in Development Mode

```bash
uvicorn app:app --reload --port 8000
```

### Running in Production

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

For production, consider using:
- Gunicorn with Uvicorn workers
- Reverse proxy (Nginx)
- Environment variable management
- Rate limiting
- Caching

## Project Structure

```
server/
├── app.py              # FastAPI application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
└── README.md          # This file
```

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `requests` - HTTP client
- `beautifulsoup4` - HTML parsing
- `openai` - OpenAI API client
- `python-dotenv` - Environment variable management

## License

See the main [LICENSE](../LICENSE) file.
