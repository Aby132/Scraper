# Scrape

A modern, AI-powered web scraping application with built-in safety guardrails. Extract comprehensive data from public websites with automatic content analysis powered by OpenAI.

![Scrape](https://img.shields.io/badge/Scrape-AI%20Powered-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Functionality
- 🔒 **Safety-first scraping** - Respects robots.txt and blocks protected content
- 🤖 **AI-powered analysis** - Automatic content summarization and categorization
- 📊 **Comprehensive data extraction**:
  - Page metadata (title, description, language)
  - Full text content with word count
  - All outbound links (up to 100)
  - All images (up to 50)
  - Heading structure (H1-H6)
  - Meta tags and social media tags (Open Graph, Twitter Cards)
- 💾 **Export functionality** - Download data as JSON, CSV, or TXT
- 🎨 **Modern UI** - Built with React and Tailwind CSS
- 🚫 **Login detection** - Automatically blocks pages with authentication

### AI Analysis
- **Summary**: Concise 2-3 sentence overview of the content
- **Key Points**: 3-5 main topics extracted from the page
- **Category Detection**: Automatically categorizes content type (Blog Post, Product Page, News Article, etc.)

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript** - Plain JS, no TypeScript

### Backend
- **FastAPI** - Modern Python web framework
- **BeautifulSoup4** - HTML parsing and extraction
- **OpenAI API** - GPT-3.5-turbo for content analysis
- **Requests** - HTTP client for fetching pages
- **Python-dotenv** - Environment variable management

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **OpenAI API Key** (optional, for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd webscraper
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

### 3. Frontend Setup

```bash
# From the root webscraper directory
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📖 Usage

1. **Open the application** in your browser (usually `http://localhost:5173`)
2. **Enter a URL** in the input field (e.g., `https://example.com`)
3. **Click "Scrape"** to extract data from the website
4. **View results** including:
   - AI-powered summary and analysis
   - Page metadata and statistics
   - Extracted links and images
   - Full text content
5. **Download data** using the download buttons (JSON, CSV, or TXT)

## 🔧 Configuration

### Environment Variables

#### Backend (`server/.env`)

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

Scrapes a website and returns comprehensive data.

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
  "text_excerpt": "...",
  "full_text": "...",
  "links": ["https://example.com/page1", ...],
  "images": ["https://example.com/image.jpg", ...],
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"],
    ...
  },
  "meta_tags": {...},
  "social_tags": {...},
  "language": "en",
  "word_count": 1234,
  "ai_summary": "This page provides information about...",
  "ai_key_points": ["Point 1", "Point 2", ...],
  "ai_category": "Blog Post",
  "warnings": []
}
```

**Error Responses:**
- `400` - Invalid URL or login form detected
- `403` - robots.txt forbids scraping
- `413` - Page too large (>1MB)
- `415` - Unsupported content type
- `502` - Request failed

## 🏗️ Project Structure

```
webscraper/
├── server/                 # Backend API
│   ├── app.py             # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Environment variables (not in git)
│   ├── .env.example      # Environment template
│   └── README.md         # Backend documentation
├── src/                   # Frontend React app
│   ├── App.jsx           # Main application component
│   ├── App.css           # Custom styles
│   ├── index.css         # Tailwind imports
│   └── main.jsx          # React entry point
├── public/                # Static assets
├── package.json           # Node.js dependencies
├── tailwind.config.js    # Tailwind configuration
├── vite.config.js        # Vite configuration
└── README.md             # This file
```

## 🔒 Safety & Legal

### Built-in Safety Features

- ✅ Respects `robots.txt` files
- ✅ Blocks localhost and private IP addresses
- ✅ Detects and blocks login forms
- ✅ Limits download size (1MB max)
- ✅ Only processes HTML content
- ✅ User-agent identification

### Legal Reminder

**Important**: Only scrape websites that:
- You own or have explicit permission to scrape
- Are publicly accessible without authentication
- Comply with their Terms of Service

Always review and respect:
- Website Terms of Service
- robots.txt files
- Copyright and intellectual property rights
- Data protection regulations (GDPR, CCPA, etc.)

## 🧪 Development

### Running Tests

```bash
# Backend tests (if implemented)
cd server
pytest

# Frontend tests (if implemented)
npm test
```

### Building for Production

```bash
# Build frontend
npm run build

# The built files will be in the dist/ directory
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-3.5-turbo API
- BeautifulSoup for HTML parsing
- FastAPI for the excellent web framework
- Tailwind CSS for the utility-first CSS framework

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Basic web scraping functionality
- AI-powered content analysis
- Modern UI with Tailwind CSS
- Export functionality (JSON, CSV, TXT)
- Comprehensive data extraction

---

**Made with ❤️ using React, FastAPI, and OpenAI**
