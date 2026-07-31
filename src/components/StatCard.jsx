const icons = {
  courses: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h3V5.5Z" />
    </svg>
  ),

  progress: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  ),

  completed: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  ),

  average: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
};

export default function StatCard({
  label,
  value,
  type = "courses",
  onClick,
}) {
  return (
    <button
      type="button"
      className={`quick-action-card quick-action-card--${type}`}
      onClick={onClick}
      aria-label={`${label}: ${value}`}
    >
      <span className="quick-action-icon">{icons[type]}</span>

      <span className="quick-action-content">
        <strong className="quick-action-value">{value}</strong>
        <span className="quick-action-label">{label}</span>
      </span>

      <span className="quick-action-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}