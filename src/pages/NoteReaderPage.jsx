import { Link, useParams } from "react-router-dom";

function getNoteHtml(note) {
  return (
    note?.contentHtml ||
    note?.content ||
    note?.text ||
    note?.body ||
    ""
  );
}

function htmlToPlainText(html = "") {
  const temporaryElement =
    document.createElement("div");

  temporaryElement.innerHTML = html;

  return (
    temporaryElement.textContent ||
    temporaryElement.innerText ||
    ""
  ).trim();
}

function getNoteTitle(note, index) {
  if (note?.title?.trim()) {
    return note.title.trim();
  }

  const text = htmlToPlainText(
    getNoteHtml(note)
  );

  return (
    text.slice(0, 60) ||
    `Note ${index + 1}`
  );
}

function getNoteRouteId(note, index) {
  return note?.id
    ? String(note.id)
    : `note-${index}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function sanitizeNoteHtml(html = "") {
  const parser = new DOMParser();

  const documentValue =
    parser.parseFromString(
      html,
      "text/html"
    );

  const blockedElements =
    documentValue.body.querySelectorAll(
      "script, iframe, object, embed, form, input, button, textarea, select, link, meta"
    );

  blockedElements.forEach((element) =>
    element.remove()
  );

  const allElements =
    documentValue.body.querySelectorAll(
      "*"
    );

  allElements.forEach((element) => {
    Array.from(element.attributes).forEach(
      (attribute) => {
        const attributeName =
          attribute.name.toLowerCase();

        const attributeValue =
          attribute.value
            .trim()
            .toLowerCase();

        if (
          attributeName.startsWith("on")
        ) {
          element.removeAttribute(
            attribute.name
          );
        }

        if (
          ["href", "src"].includes(
            attributeName
          ) &&
          attributeValue.startsWith(
            "javascript:"
          )
        ) {
          element.removeAttribute(
            attribute.name
          );
        }
      }
    );

    if (
      element.tagName.toLowerCase() ===
      "a"
    ) {
      element.setAttribute(
        "target",
        "_blank"
      );

      element.setAttribute(
        "rel",
        "noreferrer"
      );
    }
  });

  return documentValue.body.innerHTML;
}

export default function NoteReaderPage({
  courses = [],
}) {
  const { courseId, noteId } =
    useParams();

  const course = courses.find(
    (item) =>
      String(item.id) ===
      String(courseId)
  );

  const notes = Array.isArray(
    course?.notes
  )
    ? course.notes
    : [];

  const noteIndex = notes.findIndex(
    (note, index) =>
      getNoteRouteId(note, index) ===
      String(noteId)
  );

  const note =
    noteIndex >= 0
      ? notes[noteIndex]
      : null;

  if (!course || !note) {
    return (
      <main className="page-content">
        <section className="empty-state full-width-empty">
          <span
            className="note-reader-empty-icon"
            aria-hidden="true"
          >
            📝
          </span>

          <h1>Note not found</h1>

          <p>
            This note may have been removed
            or is no longer available.
          </p>

          <Link
            to="/notes"
            className="primary-link-button"
          >
            Return to Notes
          </Link>
        </section>
      </main>
    );
  }

  const safeContent =
    sanitizeNoteHtml(
      getNoteHtml(note)
    );

  return (
    <main className="note-reader-page">
      <nav
        className="breadcrumb note-reader-breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/notes">
          Notes
        </Link>

        <span aria-hidden="true">
          /
        </span>

        <span>{course.title}</span>

        <span aria-hidden="true">
          /
        </span>

        <span>
          {getNoteTitle(
            note,
            noteIndex
          )}
        </span>
      </nav>

      <article className="note-reader-card">
        <header className="note-reader-header">
          <div className="note-reader-course">
            <span
              className="note-reader-course-icon"
              aria-hidden="true"
            >
              📘
            </span>

            <div>
              <span className="section-label">
                {course.category ||
                  "Course note"}
              </span>

              <Link
                to={`/courses/${course.id}`}
              >
                {course.title}
              </Link>
            </div>
          </div>

          <Link
            to="/notes"
            className="secondary-link-button"
          >
            ← Back to Notes
          </Link>
        </header>

        <div className="note-reader-title-area">
          <h1>
            {getNoteTitle(
              note,
              noteIndex
            )}
          </h1>

          <div className="note-reader-meta">
            <span>
              {formatDate(
                note.updatedAt ||
                  note.createdAt
              )}
            </span>

            {note.updatedAt &&
              note.createdAt &&
              note.updatedAt !==
                note.createdAt && (
                <span>
                  Updated note
                </span>
              )}
          </div>
        </div>

        <div className="note-reader-divider" />

        {safeContent ? (
          <div
            className="note-reader-content formatted-note-content"
            dangerouslySetInnerHTML={{
              __html: safeContent,
            }}
          />
        ) : (
          <div className="note-reader-no-content">
            <span aria-hidden="true">
              📝
            </span>

            <p>
              This note has no written
              content.
            </p>
          </div>
        )}

        <footer className="note-reader-footer">
          <Link
            to={`/courses/${course.id}`}
            className="secondary-link-button"
          >
            View Course
          </Link>

          <Link
            to="/notes"
            className="primary-link-button"
          >
            Browse More Notes
          </Link>
        </footer>
      </article>
    </main>
  );
}