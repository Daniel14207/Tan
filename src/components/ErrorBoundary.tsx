import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console with rich metadata for debugging
    console.group('%c🚨 SOURSPARK RUNTIME EXCEPTION 🚨', 'background: #fee2e2; color: #991b1b; font-size: 14px; font-weight: bold; padding: 4px; border-radius: 4px;');
    console.error('An unhandled exception occurred in the React component tree.');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('React component stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Clear potentially corrupted local storage keys if they caused crashes, but keep authentication
    console.log('Resetting application state from ErrorBoundary...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Attempt to refresh the page to clear any memory leak or corrupted React state
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear active view and reload
    localStorage.removeItem('sourspark_active_bets');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Elegant, high-contrast Slate & Emerald styled screen mirroring the Sourspark aesthetic
      return (
        <div className="mx-auto min-h-screen max-w-md bg-slate-900 text-white flex flex-col justify-between p-6 font-sans">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-6 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              Une anomalie est survenue
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-6">
              L'application a rencontré une erreur inattendue. Nos diagnostics ont capturé cet incident afin de stabiliser votre session.
            </p>

            {/* Error Detail accordion box */}
            <div className="w-full bg-slate-950/65 border border-slate-850 rounded-2xl p-4 text-left mb-8 max-h-[220px] overflow-y-auto scrollbar-none">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Détails techniques :
              </span>
              <p className="font-mono text-[10px] text-rose-400 font-bold break-all">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.errorInfo && (
                <pre className="font-mono text-[8px] text-slate-500 mt-2 whitespace-pre-wrap overflow-x-auto leading-normal">
                  {this.state.errorInfo.componentStack.slice(0, 400)}...
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
              >
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
                <span>Actualiser la page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700/60"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Retourner à l'accueil</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-600 text-center py-2">
            Predictions Sourspark · Diagnostiqué et sécurisé contre les écrans blancs
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
