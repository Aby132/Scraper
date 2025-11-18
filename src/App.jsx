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
        ['AI Sentiment', result.ai_sentiment || ''],
        ['AI Insights', result.ai_insights || ''],
        ['', ''],
        ['AI Key Points', ''],
        ...(result.ai_key_points || []).map(point => ['', point]),
        ['', ''],
        ['AI Topics', ''],
        ...(result.ai_topics || []).map(topic => ['', topic]),
        ['', ''],
        ['AI Keywords', ''],
        ['', (result.ai_keywords || []).join(', ')],
        ['', ''],
        ['Tables Count', result.tables?.length || 0],
        ['Forms Count', result.forms?.length || 0],
        ['Videos Count', result.videos?.length || 0],
        ['Lists Count', result.lists?.length || 0],
        ['Quotes Count', result.quotes?.length || 0],
        ['Code Blocks Count', result.code_blocks?.length || 0],
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
      if (result.ai_sentiment) {
        text += `AI Sentiment: ${result.ai_sentiment}\n`
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
        if (result.ai_topics && result.ai_topics.length > 0) {
          text += `AI TOPICS:\n${'='.repeat(50)}\n`
          result.ai_topics.forEach((topic, i) => {
            text += `${i + 1}. ${topic}\n`
          })
          text += '\n'
        }
        if (result.ai_keywords && result.ai_keywords.length > 0) {
          text += `AI KEYWORDS:\n${'='.repeat(50)}\n${result.ai_keywords.join(', ')}\n\n`
        }
        if (result.ai_insights) {
          text += `AI INSIGHTS:\n${'='.repeat(50)}\n${result.ai_insights}\n\n`
        }
      }
      text += `Tables Found: ${result.tables?.length || 0}\n`
      text += `Forms Found: ${result.forms?.length || 0}\n`
      text += `Videos Found: ${result.videos?.length || 0}\n`
      text += `Lists Found: ${result.lists?.length || 0}\n`
      text += `Quotes Found: ${result.quotes?.length || 0}\n`
      text += `Code Blocks Found: ${result.code_blocks?.length || 0}\n\n`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Modern Header */}
          <header className="text-center space-y-6 animate-fade-in pt-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm border border-purple-200/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Safety-first scraping</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Scrape
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Extract comprehensive data from public websites with{' '}
                <span className="font-semibold text-gray-700">AI-powered analysis</span> and built-in safety guardrails
              </p>
            </div>
          </header>

          {/* Main Input Card */}
          <main className="relative">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 lg:p-12 hover-lift">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="url" className="block text-sm font-bold text-gray-800 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Website URL
                    </span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
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
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={disabled}
                      className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3 min-w-[160px] text-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {status === 'loading' ? (
                        <>
                          <svg className="animate-spin h-6 w-6 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="relative z-10">Scraping...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="relative z-10">Scrape Now</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{legalNotice}</p>
                </div>
              </form>

              {/* Error Alert */}
              {error && (
                <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl animate-slide-up shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-red-800 font-semibold mb-1">Request Blocked</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {result && (
                <section className="mt-10 space-y-8 animate-slide-up">
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-gray-100">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        Scraping Results
                      </h2>
                      <p className="text-gray-500 text-sm">Comprehensive data extracted and analyzed</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => downloadData('json')}
                        className="group px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 rounded-xl font-semibold transition-all duration-200 text-sm flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-105"
                        title="Download as JSON"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        JSON
                      </button>
                      <button
                        onClick={() => downloadData('csv')}
                        className="group px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 rounded-xl font-semibold transition-all duration-200 text-sm flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-105"
                        title="Download as CSV"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => downloadData('txt')}
                        className="group px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 rounded-xl font-semibold transition-all duration-200 text-sm flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-105"
                        title="Download as TXT"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        TXT
                      </button>
                    </div>
                  </div>

                  {/* Enhanced AI Analysis */}
                  {result.ai_summary && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-purple-200/50 shadow-xl animate-slide-up">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl"></div>
                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">AI-Powered Analysis</h3>
                          </div>
                          {result.ai_category && (
                            <span className="ml-auto px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold shadow-sm">
                              {result.ai_category}
                            </span>
                          )}
                          {result.ai_sentiment && (
                            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                              result.ai_sentiment.toLowerCase().includes('positive') ? 'bg-green-100 text-green-700' :
                              result.ai_sentiment.toLowerCase().includes('negative') ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {result.ai_sentiment}
                            </span>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Summary</p>
                              <p className="text-gray-800 leading-relaxed text-base">{result.ai_summary}</p>
                            </div>
                            {result.ai_key_points && result.ai_key_points.length > 0 && (
                              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Key Points</p>
                                <ul className="space-y-2.5">
                                  {result.ai_key_points.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                                      <span className="mt-1.5 flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span>
                                      <span className="flex-1">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {result.ai_topics && result.ai_topics.length > 0 && (
                              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Main Topics</p>
                                <div className="flex flex-wrap gap-2">
                                  {result.ai_topics.map((topic, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold shadow-sm">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {result.ai_keywords && result.ai_keywords.length > 0 && (
                              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                  {result.ai_keywords.slice(0, 15).map((keyword, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {result.ai_entities && result.ai_entities.length > 0 && (
                              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Entities</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {result.ai_entities.slice(0, 8).map((entity, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                      <span className="font-semibold text-gray-900">{entity.name}</span>
                                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{entity.type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {result.ai_structured_data && (
                          <div className="mt-6 bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-lg">
                            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Structured Data</p>
                            <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto">
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {JSON.stringify(result.ai_structured_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {result.ai_insights && (
                          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-2xl border-2 border-yellow-200 shadow-lg">
                            <p className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Insights
                            </p>
                            <p className="text-yellow-900 leading-relaxed">{result.ai_insights}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Page Overview Stats */}
                  <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl hover-lift">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          Page Overview
                        </h3>
                        <a
                          href={result.fetched_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Live Page
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {[
                        { label: 'Title', value: result.title || 'Not provided', icon: '📄' },
                        { label: 'Description', value: result.description || 'N/A', icon: '📝' },
                        { label: 'Language', value: result.language || 'Unknown', icon: '🌐' },
                        { label: 'Word Count', value: result.word_count?.toLocaleString() || 0, icon: '📊', highlight: true },
                        { label: 'Links', value: result.links?.length || 0, icon: '🔗', highlight: true },
                        { label: 'Images', value: result.images?.length || 0, icon: '🖼️', highlight: true },
                        { label: 'Tables', value: result.tables?.length || 0, icon: '📊', highlight: true },
                        { label: 'Forms', value: result.forms?.length || 0, icon: '📝', highlight: true },
                        { label: 'Videos', value: result.videos?.length || 0, icon: '🎥', highlight: true },
                        { label: 'Lists', value: result.lists?.length || 0, icon: '📋', highlight: true },
                        { label: 'Paragraphs', value: result.paragraphs?.length || 0, icon: '📄', highlight: true },
                        { label: 'Quotes', value: result.quotes?.length || 0, icon: '💬', highlight: true },
                      ].map((stat, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                          stat.highlight 
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                            : 'bg-gray-50 border-gray-200 shadow-sm'
                        }`}>
                          <div className="text-2xl mb-2">{stat.icon}</div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{stat.label}</p>
                          <p className={`text-lg font-bold truncate ${
                            stat.highlight ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Headings Structure */}
                  {result.headings && Object.keys(result.headings).some(key => result.headings[key].length > 0) && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        Headings Structure
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(result.headings).map(([level, headings]) => {
                          if (headings.length === 0) return null
                          return (
                            <div key={level} className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 shadow-sm">
                              <h4 className={`font-bold mb-3 ${
                                level === 'h1' ? 'text-3xl text-purple-600' : 
                                level === 'h2' ? 'text-2xl text-blue-600' : 
                                'text-xl text-gray-700'
                              }`}>
                                {level.toUpperCase()}
                              </h4>
                              <ul className="space-y-2">
                                {headings.map((heading, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-gray-700 bg-white p-2 rounded-lg">
                                    <span className="text-purple-500 mt-1">▸</span>
                                    <span>{heading}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      Text Content
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 max-h-96 overflow-y-auto custom-scrollbar">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {result.full_text || result.text_excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Links Section */}
                  {result.links && result.links.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        Outbound Links ({result.links.length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {result.links.slice(0, 50).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="group block bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 min-w-[30px] bg-white px-2 py-1 rounded">{idx + 1}</span>
                              <span className="text-sm text-gray-700 group-hover:text-blue-600 flex-1 truncate font-medium">{link}</span>
                              <svg className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                        {result.links.length > 50 && (
                          <p className="text-sm text-gray-500 text-center py-4 font-semibold">
                            ... and {result.links.length - 50} more links
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Images Gallery */}
                  {result.images && result.images.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Images ({result.images.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {result.images.slice(0, 20).map((img, idx) => (
                          <div key={idx} className="group bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                              <img
                                src={img}
                                alt={`Image ${idx + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">Image unavailable</div>'
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                            <a
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-3 text-xs text-gray-600 hover:text-blue-600 truncate font-medium transition-colors"
                            >
                              {img}
                            </a>
                          </div>
                        ))}
                      </div>
                      {result.images.length > 20 && (
                        <p className="text-sm text-gray-500 text-center py-4 font-semibold">
                          ... and {result.images.length - 20} more images
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tables */}
                  {result.tables && result.tables.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Tables ({result.tables.length})
                      </h3>
                      <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
                        {result.tables.slice(0, 5).map((table, idx) => (
                          <div key={idx} className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                {table.headers && table.headers.length > 0 && (
                                  <thead>
                                    <tr className="bg-gradient-to-r from-purple-100 to-blue-100">
                                      {table.headers.map((header, hIdx) => (
                                        <th key={hIdx} className="px-4 py-3 text-left font-bold text-gray-700">
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                )}
                                <tbody>
                                  {table.rows.slice(0, 10).map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-4 py-3 text-gray-700">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forms */}
                  {result.forms && result.forms.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        Forms ({result.forms.length})
                      </h3>
                      <div className="space-y-4">
                        {result.forms.slice(0, 5).map((form, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-2xl border-2 border-gray-200 shadow-sm">
                            <div className="mb-3 flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-500 uppercase">Method:</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                                {form.method}
                              </span>
                              {form.action && (
                                <span className="text-xs text-gray-600 font-medium">Action: {form.action}</span>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {form.inputs.slice(0, 10).map((input, iIdx) => (
                                <div key={iIdx} className="bg-white p-3 rounded-lg border border-gray-200 text-xs">
                                  <span className="font-bold text-purple-600">{input.type}</span>
                                  {input.name && <span className="ml-2 text-gray-600">name: {input.name}</span>}
                                  {input.label && <span className="ml-2 text-gray-500">label: {input.label}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {result.videos && result.videos.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Videos ({result.videos.length})
                      </h3>
                      <div className="space-y-3">
                        {result.videos.slice(0, 10).map((video, idx) => (
                          <a
                            key={idx}
                            href={video}
                            target="_blank"
                            rel="noreferrer"
                            className="group block bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:from-red-50 hover:to-pink-50 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-700 group-hover:text-red-600 flex-1 truncate font-medium">{video}</span>
                              <svg className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lists */}
                  {result.lists && result.lists.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        Lists ({result.lists.length})
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {result.lists.slice(0, 10).map((list, idx) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-2xl border-2 border-gray-200 shadow-sm">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                              {list.type === 'ul' ? 'Unordered List' : 'Ordered List'}
                            </p>
                            <ul className={`${list.type === 'ul' ? 'list-disc' : 'list-decimal'} list-inside space-y-2 text-sm text-gray-700 bg-white p-4 rounded-xl`}>
                              {list.items.map((item, iIdx) => (
                                <li key={iIdx} className="leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quotes */}
                  {result.quotes && result.quotes.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        Quotes ({result.quotes.length})
                      </h3>
                      <div className="space-y-4">
                        {result.quotes.slice(0, 10).map((quote, idx) => (
                          <blockquote key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border-l-4 border-blue-500 italic text-gray-700 shadow-sm">
                            <svg className="w-6 h-6 text-blue-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                            </svg>
                            "{quote}"
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Blocks */}
                  {result.code_blocks && result.code_blocks.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        Code Blocks ({result.code_blocks.length})
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {result.code_blocks.slice(0, 5).map((code, idx) => (
                          <div key={idx} className="bg-gray-900 text-gray-100 p-5 rounded-2xl overflow-x-auto border-2 border-gray-800 shadow-lg">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              <code>{code}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg">
                      <p className="text-yellow-800 font-bold mb-3 flex items-center gap-2 text-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Heads up:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx} className="font-medium">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>

          {/* Guidelines Sidebar */}
          <aside className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-gray-100 p-8 shadow-xl hover-lift">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Legal + Ethical Checklist
            </h2>
            <ul className="space-y-3 text-gray-700">
              {safetyRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="flex-1">{rule}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
