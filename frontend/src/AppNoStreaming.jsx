import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Send, Brain, Zap, Database, DollarSign,
  Upload, FileText, Trash2, X, Copy, Check, Globe
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState([])

  // Fetch initial documents
  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim() || loading) return

    const userMessage = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    const currentQuestion = question
    setQuestion('')
    setLoading(true)

    try {
      const startTime = Date.now()

      // Use the regular non-streaming endpoint
      const response = await axios.post(`${API_URL}/api/query`, {
        question: currentQuestion,
        session_id: `session-${Date.now()}`,
        agent_type: 'advanced'
      })

      const latency = (Date.now() - startTime) / 1000

      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer,
        metadata: {
          method: 'quality_rag_agent',
          complexity: 'high',
          latency: latency,
          cost: 0.002,
          fromCache: false,
          fallbackUsed: false
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Désolé, une erreur est survenue: ${error.message}`,
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`)
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const getMethodColor = (method) => {
    const colors = {
      'basic_rag': '#2ecc71',
      'advanced_rag': '#f39c12',
      'agent_rag': '#e74c3c'
    }
    return colors[method] || '#95a5a6'
  }

  const getMethodLabel = (method) => {
    const labels = {
      'basic_rag': 'Basic',
      'advanced_rag': 'Advanced',
      'agent_rag': 'Agent'
    }
    return labels[method] || method
  }

  return (
    <div className="app">
      <div className="main-container">
        {/* Sidebar - Documents Only */}
        <aside className="sidebar">
          <h2 className="sidebar-title">
            <FileText size={20} />
            Documents
          </h2>

          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            {documents.length} documents loaded
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-container">
          <div className={`messages ${messages.length === 0 ? 'empty' : ''}`}>
            {messages.length === 0 ? (
              <div className="empty-state">
                <h2 style={{marginBottom: '2rem', fontSize: '2rem', color: 'var(--text-primary)'}}>Adaptive RAG (No Streaming)</h2>
                <form className="centered-input-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={loading}
                    className="input-field"
                    style={{
                      flex: 1,
                      padding: '0.875rem 1.25rem',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      minWidth: '400px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="send-button"
                    style={{
                      padding: '0.875rem 1.5rem',
                      background: 'var(--accent-blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: loading || !question.trim() ? 0.5 : 1
                    }}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.metadata && (
                    <div className="message-metadata">
                      <span
                        className="method-badge"
                        style={{backgroundColor: getMethodColor(msg.metadata.method)}}
                      >
                        {getMethodLabel(msg.metadata.method)}
                      </span>
                      <span className="metadata-item">
                        {msg.metadata.latency.toFixed(2)}s
                      </span>
                      <span className="metadata-item">
                        €{msg.metadata.cost.toFixed(3)}
                      </span>
                      {msg.metadata.fromCache && (
                        <span className="cache-badge">
                          <Database size={12} />
                          Cached
                        </span>
                      )}
                      {msg.metadata.fallbackUsed && (
                        <span className="cache-badge" style={{background: 'var(--accent-orange)'}}>
                          <Globe size={12} />
                          Web Search
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant loading-message">
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <form className="input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="input-field"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
