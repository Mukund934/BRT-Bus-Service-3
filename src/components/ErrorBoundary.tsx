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

    /*
      Read at failure time rather than tracked: this renders once, and
      `navigator.onLine` only claims there is a network interface, so it is
      used to soften the wording and never to assert a diagnosis.
    */
    const offline =
      typeof navigator !== "undefined" && navigator.onLine === false;

    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-background flex items-center justify-center px-4"
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
            {offline ? "This page needs a connection" : "Something went wrong"}
          </h1>

          {/*
            Offline is a distinct failure now that the app has a service
            worker. A page opened before is served from the cache; one that
            has not been is simply absent, and telling somebody with no signal
            to reload is advice that cannot work.
          */}
          <p className="text-gray-600 mb-6">
            {offline
              ? "You appear to be offline, and this page has not been opened on this device before. Pages you have already visited still work."
              : "This page could not be displayed. Reloading usually fixes it, especially if the app was updated while this tab was open."}
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
