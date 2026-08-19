import { Component } from 'react'
import BlipIllustration from './landing/BlipIllustration'

// A class component because React has no hook-based equivalent of
// componentDidCatch/getDerivedStateFromError yet. Deliberately styled with
// inline styles and no i18n/context lookups — if App itself (including
// LanguageProvider) is what threw, this fallback still has to render.
// BlipIllustration is safe to pull in alongside that: it's pure SVG with
// no context/data dependencies of its own.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#050505',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <BlipIllustration size={96} />
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--accent-400, #60a5fa)',
              color: '#050505',
              fontWeight: 600,
              fontSize: 14,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
