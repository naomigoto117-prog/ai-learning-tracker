import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";

export default function CourseCard({
  course,
  onRequestDelete,
  onToggleFavorite,
}) {
  const statusClass = course.status.toLowerCase().replaceAll(" ", "-");

  const closeMenu = (event) => {
    const menu = event.currentTarget.closest("details");
    if (menu) menu.removeAttribute("open");
  };

  return (
    <article className="course-card">
      <div className="course-card-top-actions">
        <button
          type="button"
          className={`favorite-icon-button ${
            course.favorite ? "favorite-icon-button-active" : ""
          }`}
          onClick={() => onToggleFavorite(course)}
          aria-label={
            course.favorite
              ? `Remove ${course.title} from favorites`
              : `Add ${course.title} to favorites`
          }
          aria-pressed={Boolean(course.favorite)}
          title={course.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          {course.favorite ? "★" : "☆"}
        </button>

        <details className="course-card-menu">
          <summary
            className="course-card-menu-button"
            aria-label={`More options for ${course.title}`}
            title="More options"
          >
            <span aria-hidden="true">•••</span>
          </summary>

          <div className="course-card-menu-popover">
            <Link
              to={`/courses/${course.id}/edit`}
              className="course-card-menu-item"
              onClick={closeMenu}
            >
              <span aria-hidden="true">✎</span>
              Edit course
            </Link>

            <button
              className="course-card-menu-item course-card-menu-item-danger"
              type="button"
              onClick={(event) => {
                closeMenu(event);
                onRequestDelete(course);
              }}
            >
              <span aria-hidden="true">⌫</span>
              Delete course
            </button>
          </div>
        </details>
      </div>

      <Link
        to={`/courses/${course.id}`}
        className="course-card-main-link"
        aria-label={`Open ${course.title}`}
      >
        <div className="course-card-header">
          <div>
            <span className="category">{course.category}</span>
            <h3>{course.title}</h3>
            <p>{course.platform}</p>
          </div>

          <span className={`status status-${statusClass}`}>
            {course.status}
          </span>
        </div>

        <ProgressBar value={course.progress} />
        <p className="deadline">Target date: {course.deadline || "Not set"}</p>
        <span className="open-course-hint">Open course details →</span>
      </Link>

      {course.url && (
        <div className="course-card-footer">
          <a
            href={course.url}
            target="_blank"
            rel="noreferrer"
            className="secondary-link-button compact-button course-continue-button"
          >
            Continue learning ↗
          </a>
        </div>
      )}
    </article>
  );
}
