import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-wide crash guard (plan.md §2 — every surface must degrade gracefully).
 * A render throw would otherwise leave a blank white page and no way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the detail in the console for the founder; the UI stays calm.
    console.error("[RELO] Unhandled UI error:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="nf">
        <main className="nf-main">
          <span className="nf-eyebrow">
            <AlertTriangle size={13} aria-hidden /> Something broke
          </span>
          <h1 className="nf-h1">
            This screen hit an <em>error.</em>
          </h1>
          <p className="nf-sub">
            Your automations keep running in the background — this is only the page that failed to
            render. Try again, and if it keeps happening, reload the app.
          </p>
          <div className="nf-actions">
            <button type="button" className="nf-btn nf-btn--primary" onClick={this.reset}>
              <RefreshCw size={15} aria-hidden /> Try again
            </button>
            <button
              type="button"
              className="nf-btn"
              onClick={() => window.location.assign("/dashboard")}
            >
              Back to dashboard
            </button>
          </div>
          <pre className="nf-trace">{error.message}</pre>
        </main>
      </div>
    );
  }
}
