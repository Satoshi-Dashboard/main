import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#12121A', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 8, padding: 16, margin: 8 }}>
          <div style={{ color: '#FF4757', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 6 }}>
            {this.props.label || 'Component Error'}
          </div>
          <div style={{ color: '#8B8A88', fontSize: 10, fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
            {this.state.error?.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
