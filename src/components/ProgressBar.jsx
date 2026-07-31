export default function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <>
      <div className="progress-row">
        <span>Progress</span>
        <strong>{safeValue}%</strong>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-label="Course progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeValue}
      >
        <div
          className="progress-fill"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </>
  );
}
