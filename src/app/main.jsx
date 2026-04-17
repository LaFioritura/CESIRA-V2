import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/styles/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown rendering error' }
  }
  componentDidCatch(error) {
    console.error('CESIRA UI crash intercepted:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0c12', color: '#edf1f7', padding: 24, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
          <div style={{ maxWidth: 680, background: '#10141c', border: '1px solid #283245', borderRadius: 22, padding: 24 }}>
            <p style={{ color: '#95a1b4', textTransform: 'uppercase', letterSpacing: '.18em', fontSize: 12 }}>CESIRA recovery shell</p>
            <h1>Interface failure contained.</h1>
            <p>The audio engine is isolated and the interface can be safely reloaded. Error: {this.state.message}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: 12, background: '#7c5cff', color: '#fff', border: 0, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 }}>Reload interface</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
