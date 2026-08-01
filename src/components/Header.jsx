import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Header({
  theme,
  onToggleTheme,
  isDemoMode = false,
  onEnterDemo,
  onExitDemo,
}) {
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const coursesDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        coursesDropdownRef.current &&
        !coursesDropdownRef.current.contains(event.target)
      ) {
        setIsCoursesOpen(false);
      }

      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target)
      ) {
        setIsMoreOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsCoursesOpen(false);
        setIsMoreOpen(false);
        setIsMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeNavigation() {
    setIsCoursesOpen(false);
    setIsMoreOpen(false);
    setIsMobileOpen(false);
  }

  function handleDemoAction() {
    closeNavigation();

    if (isDemoMode) {
      onExitDemo?.();
      return;
    }

    onEnterDemo?.();
  }

  return (
    <>
      {isDemoMode && (
        <div className="demo-mode-notice" role="status">
          <span className="demo-mode-notice-dot" aria-hidden="true" />
          <strong>Demo Mode</strong>
          <span>
            Explore freely—your original local data will be restored when you exit.
          </span>
        </div>
      )}

      <header className="site-header">
        <NavLink
          to="/"
          className="brand"
          aria-label="AI Learning Dashboard home"
          onClick={closeNavigation}
        >
          <span className="brand-icon" aria-hidden="true">
            AI
          </span>

          <span className="brand-copy">
            <strong>AI Learning</strong>
            <small>Dashboard</small>
          </span>
        </NavLink>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileOpen}
          onClick={() =>
            setIsMobileOpen((current) => !current)
          }
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`main-navigation ${
            isMobileOpen ? "main-navigation-open" : ""
          }`}
          aria-label="Main navigation"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "nav-link nav-link-active"
                : "nav-link"
            }
            onClick={closeNavigation}
          >
            Home
          </NavLink>

          <div
            className="nav-dropdown"
            ref={coursesDropdownRef}
          >
            <button
              type="button"
              className="nav-link dropdown-toggle"
              aria-expanded={isCoursesOpen}
              aria-haspopup="true"
              onClick={() => {
                setIsCoursesOpen((current) => !current);
                setIsMoreOpen(false);
              }}
            >
              Courses
              <span
                className="dropdown-chevron"
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {isCoursesOpen && (
              <div className="dropdown-menu">
                <NavLink
                  to="/courses"
                  onClick={closeNavigation}
                >
                  All Courses
                </NavLink>

                <NavLink
                  to="/courses/in-progress"
                  onClick={closeNavigation}
                >
                  In Progress
                </NavLink>

                <NavLink
                  to="/courses/completed"
                  onClick={closeNavigation}
                >
                  Completed
                </NavLink>

                <NavLink
                  to="/courses/add"
                  className="dropdown-add-link"
                  onClick={closeNavigation}
                >
                  + Add Course
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/ai-planner"
            className={({ isActive }) =>
              isActive
                ? "nav-link nav-link-active"
                : "nav-link"
            }
            onClick={closeNavigation}
          >
            AI Planner
          </NavLink>

          <div
            className="nav-dropdown"
            ref={moreDropdownRef}
          >
            <button
              type="button"
              className="nav-link dropdown-toggle"
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
              onClick={() => {
                setIsMoreOpen((current) => !current);
                setIsCoursesOpen(false);
              }}
            >
              More
              <span
                className="dropdown-chevron"
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {isMoreOpen && (
              <div className="dropdown-menu dropdown-menu-right">
                <NavLink
                  to="/notes"
                  onClick={closeNavigation}
                >
                  Notes
                </NavLink>

                <NavLink
                  to="/projects"
                  onClick={closeNavigation}
                >
                  Projects
                </NavLink>

                <NavLink
                  to="/certifications"
                  onClick={closeNavigation}
                >
                  Certifications
                </NavLink>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`header-demo-button ${
              isDemoMode ? "header-demo-button-active" : ""
            }`}
            onClick={handleDemoAction}
          >
            <span aria-hidden="true">
              {isDemoMode ? "×" : "▶"}
            </span>
            {isDemoMode ? "Exit Demo" : "Try Demo"}
          </button>

          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
          />
        </nav>
      </header>
    </>
  );
}