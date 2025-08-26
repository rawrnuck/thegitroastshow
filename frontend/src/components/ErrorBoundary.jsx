import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark text-accent-light">
          <div className="text-center space-y-6 p-8">
            <div className="text-4xl font-mono text-primary-teal text-glow-strong">
              SYSTEM ERROR
            </div>
            <div className="text-lg font-mono text-accent-light">
              Something went wrong in the roast protocol
            </div>
            <div className="text-sm font-mono text-primary-dark">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="
                px-6 py-3 bg-transparent border-2 border-primary-teal
                text-primary-teal font-mono font-bold rounded-lg
                hover:bg-primary-teal hover:text-bg-dark
                transition-all duration-300 terminal-button
              "
            >
              RESTART SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
