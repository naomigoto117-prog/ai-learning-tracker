export default function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isLight ? "☀" : "☾"}
      </span>
      <span>{isLight ? "Light" : "Dark"}</span>
    </button>
  );
}
