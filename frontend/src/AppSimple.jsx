import { useState } from 'react'
import './App.css'

function App() {
  const [test, setTest] = useState('App is working!')

  return (
    <div style={{ padding: '20px', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
      <h1>Debug Test</h1>
      <p>{test}</p>
      <button onClick={() => setTest('Button clicked!')}>Test Button</button>
    </div>
  )
}

export default App