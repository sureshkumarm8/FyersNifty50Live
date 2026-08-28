import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Shown in the fallback so you know which screen failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Keeps one broken screen from taking down the whole dashboard.
 *
 * The recovery button also clears service worker registrations and caches,
 * because the most common cause of a mount-time crash here is a stale cached
 * module from a previous build being served over the current one.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.label || 'screen'}] crashed:`, error, info.componentStack);
  }

  private hardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {
      // Best effort - reload anyway.
    }
    location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex items-center justify-center h-full p-6 overflow-auto">
        <div className="max-w-xl w-full glass-panel rounded-2xl border border-red-500/40 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white">
                {this.props.label ? `${this.props.label} could not load` : 'Something broke'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The rest of the dashboard is still running. This is almost always a stale cached
                module left over from a previous build.
              </p>
            </div>
          </div>

          <pre className="text-[11px] text-red-300 bg-slate-950/60 border border-slate-800 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
            {error.message}
          </pre>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={this.hardReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
            >
              <Trash2 size={16} />
              Clear cache &amp; reload
            </button>
            <button
              onClick={() => this.setState({ error: null })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-bold transition-colors"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
