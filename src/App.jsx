import { useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/scrape'

const safetyRules = [
  'Respect robots.txt and each site\'s terms of service.',
  'Do not scrape pages that require authentication or contain login forms.',
  'Only process public, non-sensitive information.',
  'Throttle requests and keep downloads lightweight (<1 MB).',
  'Review scraped data before storing or sharing it.',
]

function App() {
  const [targetUrl, setTargetUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const disabled = status === 'loading'

  const legalNotice = useMemo(
    () =>
      'Scrape fetches a single public page, respects robots.txt, and blocks pages that look protected or contain login forms. Use only on sites you own or have clear permission to audit.',
    [],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!targetUrl.trim()) {
      setError('Enter a full URL (https://example.com)')
      return
    }

    try {
      setStatus('loading')
      setError('')
      setResult(null)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.detail ?? 'The scrape request was rejected.')
      }

      setResult(payload)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong.')
    }
  }

  const downloadData = (format) => {
    if (!result) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const domain = new URL(result.fetched_url).hostname.replace(/\./g, '_')
    const filename = `scrape_${domain}_${timestamp}`

    if (format === 'json') {
      const dataStr = JSON.stringify(result, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const rows = [
        ['Field', 'Value'],
        ['URL', result.fetched_url],
        ['Title', result.title || ''],
        ['Description', result.description || ''],
        ['Language', result.language || ''],
        ['Word Count', result.word_count || 0],
        ['Links Count', result.links?.length || 0],
        ['Images Count', result.images?.length || 0],
        ['AI Category', result.ai_category || ''],
        ['AI Summary', result.ai_summary || ''],
        ['', ''],
        ['AI Key Points', ''],
        ...(result.ai_key_points || []).map(point => ['', point]),
        ['', ''],
        ['Links', ''],
        ...(result.links || []).map(link => ['', link]),
        ['', ''],
        ['Images', ''],
        ...(result.images || []).map(img => ['', img]),
      ]
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'txt') {
      let text = `WEB SCRAPE REPORT\n`
      text += `================\n\n`
      text += `URL: ${result.fetched_url}\n`
      text += `Title: ${result.title || 'N/A'}\n`
      text += `Description: ${result.description || 'N/A'}\n`
      text += `Language: ${result.language || 'N/A'}\n`
      text += `Word Count: ${result.word_count || 0}\n`
      text += `Links Found: ${result.links?.length || 0}\n`
      text += `Images Found: ${result.images?.length || 0}\n`
      if (result.ai_category) {
        text += `AI Category: ${result.ai_category}\n`
      }
      if (result.ai_summary) {
        text += `\nAI SUMMARY:\n${'='.repeat(50)}\n${result.ai_summary}\n\n`
        if (result.ai_key_points && result.ai_key_points.length > 0) {
          text += `AI KEY POINTS:\n${'='.repeat(50)}\n`
          result.ai_key_points.forEach((point, i) => {
            text += `${i + 1}. ${point}\n`
          })
          text += '\n'
        }
      }
      text += `\nFULL TEXT:\n${'='.repeat(50)}\n${result.full_text || result.text_excerpt}\n\n`
      if (result.links && result.links.length > 0) {
        text += `\nLINKS:\n${'='.repeat(50)}\n`
        result.links.forEach((link, i) => {
          text += `${i + 1}. ${link}\n`
        })
      }
      if (result.images && result.images.length > 0) {
        text += `\nIMAGES:\n${'='.repeat(50)}\n`
        result.images.forEach((img, i) => {
          text += `${i + 1}. ${img}\n`
        })
      }
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
            <span>🔒</span>
            <span>Safety-first scraping</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Scrape
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Extract comprehensive data from public websites with built-in safety guardrails.
            Respects robots.txt and blocks protected content automatically.
          </p>
        </header>

        {/* Main Panel */}
        <main className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700">
              <span className="inline-flex items-center gap-2">
                <span>🌐</span>
                Website URL
              </span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                required
                disabled={disabled}
                autoComplete="off"
                spellCheck="false"
                inputMode="url"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
              <button
                type="submit"
                disabled={disabled}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-w-[140px]"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Scrape</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">{legalNotice}</p>
          </form>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 font-medium">
                <span className="mr-2">⚠️</span>
                <strong>Request blocked:</strong> {error}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <section className="mt-8 space-y-6">
              {/* Results Header with Download Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📊</span>
                  Scraping Results
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadData('json')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    title="Download as JSON"
                  >
                    <span>📥</span>
                    JSON
                  </button>
                  <button
                    onClick={() => downloadData('csv')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    title="Download as CSV"
                  >
                    <span>📥</span>
                    CSV
                  </button>
                  <button
                    onClick={() => downloadData('txt')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    title="Download as TXT"
                  >
                    <span>📥</span>
                    TXT
                  </button>
                </div>
              </div>

              {/* AI Analysis */}
              {result.ai_summary && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h3 className="text-xl font-bold text-gray-900">AI Analysis</h3>
                    {result.ai_category && (
                      <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {result.ai_category}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Summary</p>
                      <p className="text-gray-800 leading-relaxed">{result.ai_summary}</p>
                    </div>
                    {result.ai_key_points && result.ai_key_points.length > 0 && (
      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Key Points</p>
                        <ul className="space-y-2">
                          {result.ai_key_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Page Overview */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>📄</span>
                    Page Overview
                  </h3>
                  <a
                    href={result.fetched_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                  >
                    <span>🔗</span>
                    View Live Page
                    <span>↗</span>
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{result.title || 'Not provided'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{result.description || 'Meta description missing'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Language</p>
                    <p className="text-sm font-semibold text-gray-900">{result.language || 'Unknown'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Word Count</p>
                    <p className="text-lg font-bold text-primary-600">{result.word_count?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Links Found</p>
                    <p className="text-lg font-bold text-primary-600">{result.links?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Images Found</p>
                    <p className="text-lg font-bold text-primary-600">{result.images?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Headings */}
              {result.headings && Object.keys(result.headings).some(key => result.headings[key].length > 0) && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📑</span>
                    Headings Structure
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(result.headings).map(([level, headings]) => {
                      if (headings.length === 0) return null
                      return (
                        <div key={level} className="bg-white p-4 rounded-xl border border-gray-200">
                          <h4 className={`font-bold mb-2 ${level === 'h1' ? 'text-2xl text-primary-600' : level === 'h2' ? 'text-xl text-primary-500' : 'text-lg text-gray-700'}`}>
                            {level.toUpperCase()}
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {headings.map((heading, idx) => (
                              <li key={idx}>{heading}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📝</span>
                  Text Content
                </h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {result.full_text || result.text_excerpt}
                  </p>
                </div>
              </div>

              {/* Links */}
              {result.links && result.links.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🔗</span>
                    Outbound Links ({result.links.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.links.slice(0, 50).map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-white p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-400 min-w-[30px]">{idx + 1}</span>
                          <span className="text-sm text-gray-700 group-hover:text-primary-600 flex-1 truncate">{link}</span>
                          <span className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                        </div>
                      </a>
                    ))}
                    {result.links.length > 50 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {result.links.length - 50} more links
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Images */}
              {result.images && result.images.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🖼️</span>
                    Images ({result.images.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {result.images.slice(0, 20).map((img, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <img
                            src={img}
                            alt={`Image ${idx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Image not available</div>'
                            }}
                          />
                        </div>
                        <a
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-2 text-xs text-gray-600 hover:text-primary-600 truncate"
                        >
                          {img}
        </a>
      </div>
                    ))}
                  </div>
                  {result.images.length > 20 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      ... and {result.images.length - 20} more images
                    </p>
                  )}
                </div>
              )}

              {/* Meta Tags */}
              {result.meta_tags && Object.keys(result.meta_tags).length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🏷️</span>
                    Meta Tags
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(result.meta_tags).slice(0, 20).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{key}</p>
                        <p className="text-sm text-gray-700 break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Tags */}
              {result.social_tags && Object.keys(result.social_tags).length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📱</span>
                    Social Media Tags
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(result.social_tags).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-primary-600 uppercase mb-1">{key}</p>
                        <p className="text-sm text-gray-700 break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 font-semibold mb-2 flex items-center gap-2">
                    <span>⚠️</span>
                    Heads up:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>

        {/* Guidelines */}
        <aside className="bg-gray-50 rounded-3xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚖️</span>
            Legal + Ethical Checklist
          </h2>
          <ul className="space-y-2 text-gray-700">
            {safetyRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default App
