import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: no route matches", location.pathname);
  }, [location.pathname]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-muted px-4"
    >
      <div className="text-center max-w-md">
        <Compass className="w-12 h-12 text-primary mx-auto mb-4" aria-hidden="true" />

        <h1 className="mb-2 text-4xl font-bold">Page not found</h1>

        <p className="mb-6 text-muted-foreground">
          We couldn't find the page you were looking for. It may have moved, or the
          link may be out of date.
        </p>

        {/*
          A router Link rather than a raw anchor: a full page reload would
          discard the session and scroll state for no reason.
        */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="brt-button touch-target inline-flex items-center">
            Back to home
          </Link>

          <Link
            to="/timetable"
            className="px-6 py-3 rounded-xl border border-border font-semibold text-foreground hover:bg-secondary transition-colors touch-target inline-flex items-center"
          >
            View timetable
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
