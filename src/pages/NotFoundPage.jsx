import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-content">
      <section className="not-found-panel">
        <span className="not-found-code">404</span>
        <h1>Page not found</h1>
        <p>
          The page you requested does not exist or may have been moved.
        </p>
        <Link to="/" className="primary-link-button">
          Return Home
        </Link>
      </section>
    </main>
  );
}
