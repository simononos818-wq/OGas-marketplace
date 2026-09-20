'use client';

import { Component, ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any, info: any) {
    console.error('OGas crash caught:', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-4" style={{ background: '#f4f6f8' }}>
          <div className="text-4xl">😔</div>
          <p className="font-extrabold text-lg" style={{ color: '#16305e' }}>Something went wrong</p>
          <p className="text-sm" style={{ color: '#8a8f98' }}>Don't worry — your order is safe. Tap below to continue.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: '#12a5b0' }}
          >
            Back to OGas
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
