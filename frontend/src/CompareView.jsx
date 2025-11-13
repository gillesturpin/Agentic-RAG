import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function CompareView({ onBack }) {
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const topRef = useRef(null);

  // Scroll to top on mount - with position absolute this should work
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollTop = 0;
    }
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(`Failed to compare: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderArchitectureCard = (archName, result) => {
    if (!result) return null;

    // Determine badge color based on architecture
    const badgeColors = {
      'Simple RAG': 'badge-green',
      'RAG Agent': 'badge-blue',
      'Advanced RAG Agent': 'badge-purple'
    };

    return (
      <div key={archName} className="compare-card">
        <div className="compare-header">
          <h3>{result.architecture}</h3>
          <span className={`architecture-badge ${badgeColors[result.architecture] || ''}`}>
            {result.tier}
          </span>
        </div>

        <div className="compare-metrics">
          <div className="metric">
            <span className="metric-label">Latence:</span>
            <span className="metric-value">{result.latency?.toFixed(2)}s</span>
          </div>
          <div className="metric">
            <span className="metric-label">Coût:</span>
            <span className="metric-value">€{result.cost_estimate?.toFixed(3)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Confiance:</span>
            <span className="metric-value">{(result.confidence * 100)?.toFixed(0)}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Docs:</span>
            <span className="metric-value">{result.num_documents}</span>
          </div>
        </div>

        {/* Architecture-specific badges */}
        <div className="arch-specific-info">
          {result.used_retrieval !== null && result.used_retrieval !== undefined && (
            <span className={`info-badge ${result.used_retrieval ? 'badge-success' : 'badge-warning'}`}>
              {result.used_retrieval ? '✓ Used Retrieval' : '✗ No Retrieval'}
            </span>
          )}
          {result.num_rewrites !== null && result.num_rewrites !== undefined && (
            <span className="info-badge badge-info">
              {result.num_rewrites} Rewrite{result.num_rewrites !== 1 ? 's' : ''}
            </span>
          )}
          {result.documents_relevant !== null && result.documents_relevant !== undefined && (
            <span className={`info-badge ${result.documents_relevant ? 'badge-success' : 'badge-warning'}`}>
              {result.documents_relevant ? '✓ Docs Relevant' : '⚠ Docs Not Relevant'}
            </span>
          )}
        </div>

        <div className="compare-answer">
          <ReactMarkdown>{result.answer}</ReactMarkdown>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="compare-sources">
            <strong>Sources:</strong>
            <ul>
              {result.sources.map((source, idx) => (
                <li key={idx}>{source}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="compare-view" ref={topRef}>
      <button
        onClick={onBack}
        style={{
          position: 'sticky',
          top: '1rem',
          left: '1rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '2px solid var(--accent-blue)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: 'fit-content',
          marginBottom: '2rem'
        }}
      >
        ← Back to Normal View
      </button>
      <div className="compare-container">
        <header className="compare-title">
          <h1>🔬 RAG Architecture Comparison</h1>
          <p>Compare 3 different RAG architectures side-by-side</p>
        </header>

        <form onSubmit={handleCompare} className="compare-form">
          <div className="input-container">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question to compare all architectures..."
              className="question-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="compare-button"
              disabled={loading || !question.trim()}
            >
              {loading ? '⏳ Comparing...' : '🚀 Compare'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Running all 3 architectures in parallel...</p>
          </div>
        )}

        {results && !loading && (
          <div className="results-container">
            <div className="results-header">
              <h2>Question: <span className="question-text">{results.question}</span></h2>
            </div>

            <div className="compare-grid">
              {renderArchitectureCard('simple_rag', results.results.simple_rag)}
              {renderArchitectureCard('rag_agent', results.results.rag_agent)}
              {renderArchitectureCard('advanced_rag_agent', results.results.advanced_rag_agent)}
            </div>

            {/* Comparison summary */}
            <div className="comparison-summary">
              <h3>⚡ Performance Summary</h3>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Architecture</th>
                    <th>Latency</th>
                    <th>Cost</th>
                    <th>Confidence</th>
                    <th>Answer Length</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Simple RAG</td>
                    <td>{results.results.simple_rag.latency?.toFixed(2)}s</td>
                    <td>€{results.results.simple_rag.cost_estimate?.toFixed(3)}</td>
                    <td>{(results.results.simple_rag.confidence * 100)?.toFixed(0)}%</td>
                    <td>{results.results.simple_rag.answer?.length || 0} chars</td>
                  </tr>
                  <tr>
                    <td>RAG Agent</td>
                    <td>{results.results.rag_agent.latency?.toFixed(2)}s</td>
                    <td>€{results.results.rag_agent.cost_estimate?.toFixed(3)}</td>
                    <td>{(results.results.rag_agent.confidence * 100)?.toFixed(0)}%</td>
                    <td>{results.results.rag_agent.answer?.length || 0} chars</td>
                  </tr>
                  <tr>
                    <td>Advanced RAG Agent</td>
                    <td>{results.results.advanced_rag_agent.latency?.toFixed(2)}s</td>
                    <td>€{results.results.advanced_rag_agent.cost_estimate?.toFixed(3)}</td>
                    <td>{(results.results.advanced_rag_agent.confidence * 100)?.toFixed(0)}%</td>
                    <td>{results.results.advanced_rag_agent.answer?.length || 0} chars</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompareView;
