import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-[#f4f2ff] flex items-center justify-center px-4"
      >
        <div
          role="alert"
          className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center"
        >
          <AlertTriangle
            className="w-12 h-12 text-orange-500 mx-auto mb-4"
            aria-hidden="true"
          />

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-600 mb-6">
            This page could not be displayed. Reloading usually fixes it,
            especially if the app was updated while this tab was open.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="brt-button touch-target inline-flex items-center"
            >
              Reload the page
            </button>

            <a
              href="/"
              className="px-6 py-3 rounded-xl border border-border font-semibold text-foreground hover:bg-secondary transition-colors touch-target inline-flex items-center"
            >
              Back to home
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
