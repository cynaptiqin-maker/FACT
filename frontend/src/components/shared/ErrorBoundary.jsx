import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ErrorBoundary — catches React render errors before they become white screens.
 *
 * Usage:
 *   <ErrorBoundary module="Billing">
 *     <BillingDashboard />
 *   </ErrorBoundary>
 *
 * Or wrap the entire app in App.jsx with <ErrorBoundary module="Application">
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Report to monitoring (non-blocking)
    this._reportError(error, errorInfo);
  }

  _reportError(error, errorInfo) {
    try {
      const report = {
        module: this.props.module || 'Unknown',
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Send to backend error reporting endpoint (fire-and-forget)
      fetch('/api/admin/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      }).catch(() => {}); // never throw from error boundary

      // Also log to console for dev
      if (import.meta.env.DEV) {
        console.error('[ErrorBoundary]', report);
      }
    } catch {
      // Reporting must never crash
    }
  }

  _handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: s.retryCount + 1,
    }));
  };

  _handleHome = () => {
    window.location.href = '/';
  };

  _toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { module = 'This section', fallback } = this.props;
    const { error, errorInfo, showDetails, retryCount } = this.state;
    const isDevMode = import.meta.env.DEV;

    // Custom fallback UI provided by parent
    if (fallback) {
      return fallback({ error, retry: this._handleRetry });
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-5 border-b border-red-200 flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-800">
                {module} encountered an error
              </h2>
              <p className="text-sm text-red-600 mt-0.5">
                {error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              {retryCount === 0
                ? 'This might be a temporary issue. Try reloading this section.'
                : retryCount < 3
                ? `Retry attempt ${retryCount} — the issue may require a full page reload.`
                : 'This error persists. Please contact support if it continues.'}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this._handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this._handleHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>

            {/* Developer details */}
            {isDevMode && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={this._toggleDetails}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-mono text-gray-600 transition-colors"
                >
                  <span>Stack trace (dev only)</span>
                  {showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showDetails && (
                  <pre className="px-4 py-3 text-xs text-red-700 bg-red-50 overflow-auto max-h-48 font-mono whitespace-pre-wrap">
                    {error?.stack}
                    {'\n\nComponent Stack:'}
                    {errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// ─── Page-level Error Boundary (full screen) ──────────────────────────────────

export class PageErrorBoundary extends ErrorBoundary {
  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-gray-500">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this._handleRetry}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ─── Inline (widget-level) Error Boundary ─────────────────────────────────────

export class InlineErrorBoundary extends ErrorBoundary {
  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{this.props.module || 'Widget'} failed to load</span>
        <button
          onClick={this._handleRetry}
          className="ml-auto text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
