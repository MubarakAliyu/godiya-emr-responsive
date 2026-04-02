import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              marginBottom: '16px',
              color: '#dc2626'
            }}>
              Application Error
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              The application encountered an error and couldn't render properly.
            </p>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#991b1b',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.error?.stack && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontSize: '12px',
                    color: '#7f1d1d',
                    fontWeight: '500'
                  }}>
                    Stack Trace
                  </summary>
                  <pre style={{
                    fontSize: '11px',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#1e40af',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
