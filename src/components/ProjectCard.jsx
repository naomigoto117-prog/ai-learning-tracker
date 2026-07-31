import {
    useEffect,
    useRef,
    useState,
  } from "react";
  
  export default function ProjectCard({
    project,
    onEdit,
    onRequestDelete,
  }) {
    const [isMenuOpen, setIsMenuOpen] =
      useState(false);
  
    const menuRef = useRef(null);
  
    useEffect(() => {
      function handleOutsideClick(event) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target)
        ) {
          setIsMenuOpen(false);
        }
      }
  
      function handleEscape(event) {
        if (event.key === "Escape") {
          setIsMenuOpen(false);
        }
      }
  
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
  
      document.addEventListener(
        "keydown",
        handleEscape
      );
  
      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutsideClick
        );
  
        document.removeEventListener(
          "keydown",
          handleEscape
        );
      };
    }, []);
  
    const technologies = Array.isArray(
      project.techStack
    )
      ? project.techStack
      : String(project.techStack || "")
          .split(",")
          .map((technology) =>
            technology.trim()
          )
          .filter(Boolean);
  
    function handleEdit() {
      setIsMenuOpen(false);
      onEdit(project);
    }
  
    function handleDelete() {
      setIsMenuOpen(false);
      onRequestDelete(project);
    }
  
    return (
      <article className="project-card">
        <div className="project-card-header">
          <div className="project-card-heading">
            <p className="section-label">
              Project
            </p>
  
            <h2>{project.title}</h2>
          </div>
  
          <div
            className="project-menu"
            ref={menuRef}
          >
            <button
              type="button"
              className="project-menu-button"
              aria-label="Open project actions"
              aria-expanded={isMenuOpen}
              onClick={() =>
                setIsMenuOpen(
                  (current) => !current
                )
              }
            >
              <span aria-hidden="true">
                ⋮
              </span>
            </button>
  
            {isMenuOpen && (
              <div
                className="project-menu-dropdown"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleEdit}
                >
                  Edit project
                </button>
  
                <button
                  type="button"
                  role="menuitem"
                  className="project-menu-delete"
                  onClick={handleDelete}
                >
                  Delete project
                </button>
              </div>
            )}
          </div>
        </div>
  
        <p className="project-description">
          {project.description}
        </p>
  
        {technologies.length > 0 && (
          <div className="project-tech-section">
            <p>Tech stack</p>
  
            <div className="project-tech-list">
              {technologies.map(
                (technology) => (
                  <span key={technology}>
                    {technology}
                  </span>
                )
              )}
            </div>
          </div>
        )}
  
        <div className="project-link-actions">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-link-button"
            >
              View Live Project
              <span aria-hidden="true">↗</span>
            </a>
          )}
  
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="secondary-link-button"
            >
              View GitHub
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </article>
    );
  }