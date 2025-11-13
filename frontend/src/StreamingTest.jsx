import React, { useState } from 'react';

function StreamingTest() {
  const [question, setQuestion] = useState('');
  const [streamedResponse, setStreamedResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);

  const handleStream = () => {
    if (!question.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamedResponse('');

    // Create EventSource for SSE
    const eventSource = new EventSource(
      `http://localhost:8000/api/query/stream`,
      {
        withCredentials: false
      }
    );

    // First, send the POST request to initiate streaming
    fetch('http://localhost:8000/api/query/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        session_id: sessionId,
        agent_type: 'advanced'
      })
    }).then(response => {
      if (!response.ok) {
        throw new Error('Stream request failed');
      }
      // Create a reader for the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'token') {
                    setStreamedResponse(prev => prev + data.content);
                  } else if (data.type === 'complete') {
                    setIsStreaming(false);
                    console.log('Streaming complete');
                  } else if (data.type === 'error') {
                    console.error('Stream error:', data.error);
                    setIsStreaming(false);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          setIsStreaming(false);
        }
      };

      readStream();
    }).catch(error => {
      console.error('Stream error:', error);
      setIsStreaming(false);
      setStreamedResponse('Error: Failed to stream response');
    });
  };

  const handleStreamWithFetch = async () => {
    if (!question.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamedResponse('');

    try {
      const response = await fetch('http://localhost:8000/api/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          session_id: sessionId,
          agent_type: 'advanced'
        })
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        // Keep the incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'token') {
                setStreamedResponse(prev => prev + data.content);
              } else if (data.type === 'complete') {
                console.log('Streaming complete');
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                setStreamedResponse(prev => prev + '\n\nError: ' + data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setStreamedResponse('Error: ' + error.message);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🚀 Streaming Test</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleStreamWithFetch()}
          placeholder="Ask a question to test streaming..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none'
          }}
          disabled={isStreaming}
        />
      </div>

      <button
        onClick={handleStreamWithFetch}
        disabled={isStreaming || !question.trim()}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isStreaming ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isStreaming ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isStreaming ? 'Streaming...' : 'Start Streaming'}
      </button>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '200px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>Response:</h3>
        <div style={{
          whiteSpace: 'pre-wrap',
          color: '#212529',
          lineHeight: '1.6'
        }}>
          {streamedResponse || (
            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
              Response will appear here...
            </span>
          )}
          {isStreaming && <span className="cursor-blink">▊</span>}
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <strong>Session ID:</strong> {sessionId}
      </div>

      <style>{`
        .cursor-blink {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default StreamingTest;