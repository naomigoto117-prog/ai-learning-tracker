import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Header({ theme, onToggleTheme }) {
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsCoursesOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsCoursesOpen(false);
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
    setIsMobileOpen(false);
  }

  return (
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
        onClick={() => setIsMobileOpen((current) => !current)}
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
            isActive ? "nav-link nav-link-active" : "nav-link"
          }
          onClick={closeNavigation}
        >
          Home
        </NavLink>

        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="nav-link dropdown-toggle"
            aria-expanded={isCoursesOpen}
            aria-haspopup="true"
            onClick={() => setIsCoursesOpen((current) => !current)}
          >
            Courses
            <span className="dropdown-chevron" aria-hidden="true">
              ▾
            </span>
          </button>

          {isCoursesOpen && (
            <div className="dropdown-menu">
              <NavLink to="/courses" onClick={closeNavigation}>
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
  to="/notes"
  className={({ isActive }) =>
    isActive
      ? "nav-link nav-link-active"
      : "nav-link"
  }
  onClick={closeNavigation}
>
  Notes
</NavLink>

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

<NavLink
  to="/projects"
  className={({ isActive }) =>
    isActive
      ? "nav-link nav-link-active"
      : "nav-link"
  }
  onClick={closeNavigation}
>
  Projects
</NavLink>

        <NavLink
          to="/certifications"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link-active" : "nav-link"
          }
          onClick={closeNavigation}
        >
          Certifications
        </NavLink>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>
    </header>
  );
}
