# Contributing to Scrape

Thank you for your interest in contributing to Scrape! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/webscraper.git
   cd webscraper
   ```
3. **Set up the development environment** (see main README.md)
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔧 Development Workflow

### Backend Development

```bash
cd server
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend Development

```bash
npm install
npm run dev
```

## 📝 Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Keep functions focused and single-purpose
- Use meaningful variable names

Example:
```python
def extract_metadata(html: str, base_url: str) -> dict:
    """
    Extract metadata from HTML content.
    
    Args:
        html: The HTML content to parse
        base_url: Base URL for resolving relative links
        
    Returns:
        Dictionary containing extracted metadata
    """
    # Implementation
    pass
```

### JavaScript (Frontend)

- Use modern ES6+ features
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable and function names

Example:
```javascript
const handleSubmit = async (event) => {
  event.preventDefault()
  // Implementation
}
```

### CSS

- Use Tailwind CSS utility classes
- Keep custom CSS minimal
- Follow mobile-first responsive design
- Ensure accessibility (WCAG 2.1 AA)

## 📦 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add image extraction functionality
fix: resolve robots.txt parsing issue
docs: update API documentation
style: format code with prettier
refactor: simplify metadata extraction
```

## 🔄 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features (if applicable)
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if applicable)
5. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots (for UI changes)
   - Testing instructions

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added/updated (if applicable)
- [ ] All tests pass

## 🐛 Reporting Bugs

Use the GitHub issue tracker and include:

1. **Clear title** describing the bug
2. **Description** of the issue
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Environment** (OS, Python version, Node version)
7. **Screenshots** (if applicable)
8. **Error messages** or logs

Example:
```markdown
## Bug: Login detection not working

### Description
The scraper doesn't detect login forms on certain pages.

### Steps to Reproduce
1. Go to https://example.com/login
2. Click "Scrape"
3. See that it scrapes instead of blocking

### Expected Behavior
Should detect login form and return error 400

### Environment
- OS: Windows 11
- Python: 3.12.4
- Node: 18.17.0
```

## 💡 Suggesting Features

Open an issue with:

1. **Clear title** for the feature
2. **Description** of the feature and use case
3. **Benefits** - why this feature would be useful
4. **Possible implementation** (if you have ideas)

Example:
```markdown
## Feature: Batch URL scraping

### Description
Allow users to scrape multiple URLs at once.

### Use Case
Users want to analyze multiple pages from the same website.

### Benefits
- Saves time
- Better for website audits
- Can compare multiple pages

### Implementation Ideas
- Add textarea for multiple URLs
- Process in queue
- Show progress for each URL
```

## 🧪 Testing

### Backend Testing

```bash
cd server
pytest
```

### Frontend Testing

```bash
npm test
```

## 📚 Documentation

- Update README.md for user-facing changes
- Update API documentation for backend changes
- Add code comments for complex logic
- Update CONTRIBUTING.md if workflow changes

## 🎯 Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage
- 🌐 Internationalization
- ♿ Accessibility improvements

## ❓ Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

Thank you for contributing to Scrape! 🎉

