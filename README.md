# Scrape

A modern, AI-powered web scraping application with built-in safety guardrails. Extract comprehensive data from public websites with advanced content analysis powered by OpenAI GPT-3.5-turbo.

![Scrape](https://img.shields.io/badge/Scrape-AI%20Powered-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)

## ✨ Features

### 🔒 Safety & Security
- **robots.txt Compliance** - Automatically respects robots.txt files
- **Login Detection** - Blocks pages with authentication forms
- **IP Protection** - Prevents scraping of localhost and private IPs
- **Size Limits** - Maximum 1MB download size protection
- **Content Type Validation** - Only processes HTML content
- **User-Agent Identification** - Proper identification for requests

### 📊 Comprehensive Data Extraction

#### Basic Metadata
- Page title and meta description
- Language detection (HTML lang attribute)
- Full text content with word count
- Text excerpt (first 1200 characters)

#### Links & Media
- **Outbound Links** - Up to 100 unique external links
- **Images** - Up to 50 image URLs with absolute paths
- **Videos** - Up to 20 video/iframe sources
- **Scripts** - Up to 30 JavaScript file URLs
- **Stylesheets** - Up to 20 CSS file URLs

#### Structured Content
- **Headings** - Complete H1-H6 hierarchy extraction
- **Tables** - Up to 20 tables with headers and rows
- **Forms** - Up to 10 forms with inputs, labels, methods, and actions
- **Buttons** - Up to 50 buttons with text, type, and classes
- **Lists** - Up to 30 ordered/unordered lists with items
- **Paragraphs** - Up to 100 paragraph texts
- **Quotes** - Up to 30 blockquotes and citations
- **Code Blocks** - Up to 20 code/pre elements

#### Meta Tags & Social Media
- Standard meta tags (keywords, author, viewport, etc.)
- Open Graph tags (og:title, og:description, og:image, etc.)
- Twitter Card tags (twitter:card, twitter:title, etc.)
- All meta tags extracted as key-value pairs

### 🤖 AI-Powered Analysis (OpenAI GPT-3.5-turbo)

#### Content Analysis
- **Summary** - Comprehensive 3-4 sentence overview
- **Key Points** - 5-7 main topics extracted
- **Category Detection** - Automatic content categorization:
  - News Article
  - Blog Post
  - Product Page
  - E-commerce
  - Documentation
  - Landing Page
  - And more...

#### Advanced AI Features
- **Sentiment Analysis** - Positive, Negative, Neutral, or Mixed
- **Entity Extraction** - People, Organizations, Locations, Products
- **Topic Extraction** - 5-7 main topics discussed
- **Keyword Extraction** - 10-15 important keywords
- **Structured Data** - Extracted structured information:
  - Purpose
  - Target audience
  - Main offer
  - Contact information
  - Pricing information
  - Features (if applicable)
- **Actionable Insights** - 2-3 insights about the content

### 💾 Export Functionality
- **JSON Export** - Complete data structure with all fields
- **CSV Export** - Formatted spreadsheet with all data
- **TXT Export** - Human-readable text report
- **Timestamped Filenames** - Automatic file naming with dates

### 🎨 Modern UI/UX
- **Beautiful Design** - Modern gradient-based interface
- **Animated Backgrounds** - Subtle animated blob effects
- **Glassmorphism** - Backdrop blur effects on cards
- **Smooth Animations** - Fade-in and slide-up transitions
- **Custom Scrollbars** - Styled scrollbars with gradients
- **Responsive Design** - Mobile-first, works on all devices
- **Interactive Elements** - Hover effects and transitions
- **Color-Coded Sections** - Visual organization with icons
- **Dark Code Blocks** - Syntax-highlighted code display
- **Image Gallery** - Grid layout with hover effects

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **JavaScript** - Plain JS, no TypeScript

### Backend
- **FastAPI 0.115** - Modern Python web framework
- **BeautifulSoup4 4.12** - HTML parsing and extraction
- **OpenAI API 1.54** - GPT-3.5-turbo for content analysis
- **Requests 2.32** - HTTP client for fetching pages
- **Python-dotenv 1.0** - Environment variable management
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **OpenAI API Key** (optional, for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Aby132/Scraper.git
cd Scraper
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows CMD:
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Copy .env.example to .env and add your OpenAI API key
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=your_key_here

# Start the server
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

**API Documentation**: Visit `http://localhost:8000/docs` for interactive API documentation

### 3. Frontend Setup

```bash
# From the root directory
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📖 Usage

1. **Open the application** in your browser (usually `http://localhost:5173`)
2. **Enter a URL** in the input field (e.g., `https://example.com`)
3. **Click "Scrape Now"** to extract data from the website
4. **View comprehensive results** including:
   - **AI-Powered Analysis**:
     - Summary and key points
     - Category and sentiment
     - Topics and keywords
     - Extracted entities
     - Structured data
     - Actionable insights
   - **Page Overview**:
     - Metadata (title, description, language)
     - Statistics (word count, links, images, etc.)
   - **Structured Content**:
     - Headings hierarchy
     - Tables with data
     - Forms with inputs
     - Lists and quotes
     - Code blocks
   - **Media**:
     - All outbound links
     - Image gallery
     - Video sources
5. **Download data** using the download buttons:
   - **JSON** - Complete structured data
   - **CSV** - Spreadsheet format
   - **TXT** - Human-readable report

## 🔧 Configuration

### Environment Variables

#### Backend (`server/.env`)

Create a `.env` file in the `server` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The OpenAI API key is optional. If not provided, scraping will work but AI analysis features will be disabled.

#### Frontend (optional)

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api/scrape
```

## 📡 API Documentation

### POST /api/scrape

Scrapes a website and returns comprehensive data with AI analysis.

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
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples...",
  "text_excerpt": "First 1200 characters...",
  "full_text": "Complete text content...",
  "links": ["https://example.com/page1", ...],
  "images": ["https://example.com/image.jpg", ...],
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"],
    "h3": [...],
    "h4": [...],
    "h5": [...],
    "h6": [...]
  },
  "meta_tags": {
    "keywords": "...",
    "author": "...",
    ...
  },
  "social_tags": {
    "og:title": "...",
    "og:description": "...",
    "twitter:card": "...",
    ...
  },
  "language": "en",
  "word_count": 1234,
  "tables": [
    {
      "headers": ["Column 1", "Column 2"],
      "rows": [["Data 1", "Data 2"], ...]
    }
  ],
  "forms": [
    {
      "action": "/submit",
      "method": "POST",
      "inputs": [
        {
          "type": "text",
          "name": "email",
          "placeholder": "Enter email",
          "label": "Email Address"
        }
      ]
    }
  ],
  "buttons": [
    {
      "text": "Submit",
      "type": "submit",
      "class": ["btn", "btn-primary"]
    }
  ],
  "videos": ["https://example.com/video.mp4", ...],
  "scripts": ["https://example.com/script.js", ...],
  "stylesheets": ["https://example.com/style.css", ...],
  "lists": [
    {
      "type": "ul",
      "items": ["Item 1", "Item 2", ...]
    }
  ],
  "paragraphs": ["Paragraph 1", "Paragraph 2", ...],
  "quotes": ["Quote 1", "Quote 2", ...],
  "code_blocks": ["code snippet 1", ...],
  "ai_summary": "This page provides comprehensive information about...",
  "ai_key_points": [
    "Main topic 1",
    "Main topic 2",
    ...
  ],
  "ai_category": "Blog Post",
  "ai_sentiment": "Positive",
  "ai_entities": [
    {
      "name": "John Doe",
      "type": "PERSON"
    },
    {
      "name": "Acme Corp",
      "type": "ORG"
    }
  ],
  "ai_topics": ["Topic 1", "Topic 2", ...],
  "ai_keywords": ["keyword1", "keyword2", ...],
  "ai_structured_data": {
    "purpose": "...",
    "target_audience": "...",
    "main_offer": "...",
    "contact_info": "...",
    "pricing_info": "...",
    "features": [...]
  },
  "ai_insights": "Actionable insights about the content...",
  "warnings": []
}
```

**Error Responses:**
- `400` - Invalid URL or login form detected
- `403` - robots.txt forbids scraping
- `413` - Page too large (>1MB)
- `415` - Unsupported content type
- `502` - Request failed

**Rate Limits:**
- OpenAI API: Subject to your OpenAI account limits
- Scraping: No built-in rate limiting (be respectful)

## 🏗️ Project Structure

```
Scraper/
├── server/                 # Backend API
│   ├── app.py             # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Environment variables (not in git)
│   ├── .env.example      # Environment template
│   └── README.md         # Backend documentation
├── src/                   # Frontend React app
│   ├── App.jsx           # Main application component
│   ├── App.css           # Custom styles and animations
│   ├── index.css         # Tailwind imports and base styles
│   └── main.jsx          # React entry point
├── public/                # Static assets
├── package.json           # Node.js dependencies
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.cjs    # PostCSS configuration
├── vite.config.js        # Vite configuration
├── .gitignore            # Git ignore rules
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
├── CHANGELOG.md          # Version history
└── README.md             # This file
```

## 🔒 Safety & Legal

### Built-in Safety Features

- ✅ **robots.txt Compliance** - Automatically checks and respects robots.txt
- ✅ **IP Protection** - Blocks localhost, private, and reserved IPs
- ✅ **Login Detection** - Detects password fields and login forms
- ✅ **Size Limits** - Maximum 1MB download size
- ✅ **Content Type Validation** - Only processes HTML content
- ✅ **User-Agent Identification** - Proper identification header
- ✅ **Error Handling** - Graceful error handling and user feedback

### Legal Reminder

**Important**: Only scrape websites that:
- You own or have explicit permission to scrape
- Are publicly accessible without authentication
- Comply with their Terms of Service
- Allow scraping in their robots.txt

Always review and respect:
- Website Terms of Service
- robots.txt files
- Copyright and intellectual property rights
- Data protection regulations (GDPR, CCPA, etc.)
- Rate limiting and server resources

**Disclaimer**: This tool is for educational and authorized use only. Users are responsible for ensuring their scraping activities comply with all applicable laws and website terms of service.

## 🧪 Development

### Running in Development Mode

```bash
# Terminal 1: Backend
cd server
.venv\Scripts\Activate.ps1  # Windows PowerShell
uvicorn app:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# The built files will be in the dist/ directory
# Serve with any static file server or integrate with backend
```

### Running Tests

```bash
# Backend tests (if implemented)
cd server
pytest

# Frontend tests (if implemented)
npm test
```

### Code Quality

```bash
# Lint frontend code
npm run lint

# Format code (if configured)
npm run format
```

## 📊 Data Extraction Limits

| Data Type | Limit | Notes |
|-----------|-------|-------|
| Links | 100 | External links only |
| Images | 50 | Absolute URLs only |
| Videos | 20 | Video and iframe sources |
| Scripts | 30 | External JavaScript files |
| Stylesheets | 20 | External CSS files |
| Tables | 20 | With headers and rows |
| Forms | 10 | With inputs and labels |
| Buttons | 50 | With text and type |
| Lists | 30 | Up to 50 items per list |
| Paragraphs | 100 | Full paragraph text |
| Quotes | 30 | Blockquotes and citations |
| Code Blocks | 20 | Up to 500 chars each |
| Page Size | 1MB | Maximum download size |

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on contributing to this project.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** - For GPT-3.5-turbo API
- **BeautifulSoup** - For excellent HTML parsing
- **FastAPI** - For the modern web framework
- **Tailwind CSS** - For the utility-first CSS framework
- **React** - For the component-based UI library
- **Vite** - For the fast build tool

## 📞 Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/Aby132/Scraper)
- Check existing issues for solutions
- Review the [CONTRIBUTING.md](CONTRIBUTING.md) guide

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

### Recent Updates

- ✨ Enhanced AI analysis with sentiment, entities, topics, and insights
- 📊 Added comprehensive data extraction (tables, forms, videos, etc.)
- 🎨 Modern UI/UX redesign with animations and gradients
- 💾 Improved export functionality with all new data fields
- 🔒 Enhanced safety features and error handling

## 🚀 Roadmap

- [ ] Batch scraping support
- [ ] Scheduled scraping jobs
- [ ] Database storage option
- [ ] API rate limiting
- [ ] More export formats (XML, Excel)
- [ ] Browser extension
- [ ] CLI tool
- [ ] Docker support
- [ ] Multi-language support

---

**Made with ❤️ using React, FastAPI, and OpenAI**

**Version**: 1.0.0  
**Last Updated**: 2024
