import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  downloadStoredFile,
  getCourseFiles,
} from "../utils/courseFilesDb";

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
  if (!html) {
    return "";
  }

  const temporaryElement = document.createElement("div");
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

  const plainText = htmlToPlainText(getNoteHtml(note));

  if (plainText) {
    return plainText.slice(0, 60);
  }

  return `Note ${index + 1}`;
}


function getNoteRouteId(note, index) {
  return note?.id ? String(note.id) : `note-${index}`;
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
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function getFileMimeType(file) {
  if (
    file?.type &&
    file.type !== "application/octet-stream"
  ) {
    return file.type;
  }

  const extension = getFileExtension(file?.name);

  const mimeTypes = {
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

function canPreviewFile(file) {
  const mimeType = getFileMimeType(file);

  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/") ||
    mimeType === "application/json"
  );
}

function createPreviewBlob(file) {
  if (!file?.blob) {
    throw new Error("The uploaded file data is missing.");
  }

  const mimeType = getFileMimeType(file);

  if (file.blob instanceof Blob) {
    return file.blob.slice(0, file.blob.size, mimeType);
  }

  return new Blob([file.blob], {
    type: mimeType,
  });
}

function CourseNotesCard({
  course,
  files,
  onViewFile,
  onDownloadFile,
}) {
  const [isCourseOpen, setIsCourseOpen] = useState(false);

  const notes = Array.isArray(course.notes) ? course.notes : [];

  return (
    <article className="notes-course-card">
      <button
        type="button"
        className="notes-course-header"
        onClick={() => setIsCourseOpen((open) => !open)}
        aria-expanded={isCourseOpen}
      >
        <div className="notes-course-heading">
          <span className="notes-course-icon" aria-hidden="true">
            📘
          </span>

          <div>
            <h2>{course.title}</h2>

            <p>
              {course.category || "Uncategorized"}
              {course.status ? ` • ${course.status}` : ""}
            </p>
          </div>
        </div>

        <div className="notes-course-summary">
          <span>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>

          <span>
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>

          <span
            className={`notes-course-chevron ${
              isCourseOpen ? "notes-course-chevron-open" : ""
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>

      {isCourseOpen && (
        <div className="notes-course-content">
          <section className="notes-library-section">
            <div className="notes-library-heading">
              <div>
                <span className="section-label">Course notes</span>
                <h3>Notes</h3>
              </div>

              <span className="panel-count">{notes.length}</span>
            </div>

            {notes.length === 0 ? (
              <div className="notes-empty-message">
                <span>📝</span>
                <p>This course does not have any notes yet.</p>
              </div>
            ) : (
              <div className="course-note-list">
                {notes.map((note, index) => {
                  const noteId = getNoteRouteId(note, index);

                  return (
                    <article
                      className="library-note-item library-note-row"
                      key={noteId}
                    >
                      <div className="library-note-info">
                        <strong>{getNoteTitle(note, index)}</strong>
                        <small>
                          {formatDate(
                            note.updatedAt || note.createdAt
                          )}
                        </small>
                      </div>

                      <Link
                        className="open-note-button"
                        to={`/notes/${course.id}/${noteId}`}
                        aria-label={`Open ${getNoteTitle(note, index)}`}
                      >
                        Open Note
                        <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="notes-library-section">
            <div className="notes-library-heading">
              <div>
                <span className="section-label">Uploaded resources</span>
                <h3>Files</h3>
              </div>

              <span className="panel-count">{files.length}</span>
            </div>

            {files.length === 0 ? (
              <div className="notes-empty-message">
                <span>📎</span>
                <p>This course does not have any uploaded files yet.</p>
              </div>
            ) : (
              <div className="notes-file-list">
                {files.map((file) => (
                  <div className="notes-file-item" key={file.id}>
                    <div className="notes-file-icon">
                      {getFileExtension(file.name)
                        .slice(0, 4)
                        .toUpperCase() || "FILE"}
                    </div>

                    <button
                      type="button"
                      className="notes-file-preview-button"
                      onClick={() => onViewFile(file)}
                      aria-label={`View ${file.name}`}
                    >
                      <div className="notes-file-copy">
                        <strong title={file.name}>{file.name}</strong>

                        <small>
                          {formatFileSize(file.size)}
                          {file.uploadedAt
                            ? ` • ${formatDate(file.uploadedAt)}`
                            : ""}
                        </small>
                      </div>
                    </button>

                    <div className="notes-file-actions">
                      <button
                        type="button"
                        className="secondary-button compact-button"
                        onClick={() => onViewFile(file)}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="secondary-button compact-button"
                        onClick={() => onDownloadFile(file)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  );
}

export default function NotesPage({ courses = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFiles, setCourseFiles] = useState({});
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [fileError, setFileError] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadAllCourseFiles() {
      setIsLoadingFiles(true);
      setFileError("");

      try {
        const fileEntries = await Promise.all(
          courses.map(async (course) => {
            try {
              const files = await getCourseFiles(course.id);
              return [String(course.id), files];
            } catch {
              return [String(course.id), []];
            }
          })
        );

        if (!isCancelled) {
          setCourseFiles(Object.fromEntries(fileEntries));
        }
      } catch {
        if (!isCancelled) {
          setFileError("Some uploaded files could not be loaded.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFiles(false);
        }
      }
    }

    loadAllCourseFiles();

    return () => {
      isCancelled = true;
    };
  }, [courses]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const coursesWithNotesOrFiles = useMemo(
    () =>
      courses.filter((course) => {
        const notes = Array.isArray(course.notes) ? course.notes : [];
        const files = courseFiles[String(course.id)] || [];

        return notes.length > 0 || files.length > 0;
      }),
    [courses, courseFiles]
  );

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return coursesWithNotesOrFiles;
    }

    return coursesWithNotesOrFiles.filter((course) => {
      const notes = Array.isArray(course.notes) ? course.notes : [];
      const files = courseFiles[String(course.id)] || [];

      const courseMatches = [
        course.title,
        course.category,
        course.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const noteMatches = notes.some((note, index) => {
        const title = getNoteTitle(note, index).toLowerCase();
        const content = htmlToPlainText(getNoteHtml(note)).toLowerCase();

        return title.includes(query) || content.includes(query);
      });

      const fileMatches = files.some((file) =>
        String(file.name || "").toLowerCase().includes(query)
      );

      return courseMatches || noteMatches || fileMatches;
    });
  }, [searchTerm, coursesWithNotesOrFiles, courseFiles]);

  function handleViewFile(file) {
    try {
      setPreviewMessage("");

      if (!canPreviewFile(file)) {
        setPreviewMessage(
          "This file type cannot be previewed. Download the file instead."
        );
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const previewBlob = createPreviewBlob(file);
      const newPreviewUrl = URL.createObjectURL(previewBlob);

      setPreviewFile(file);
      setPreviewUrl(newPreviewUrl);
    } catch (error) {
      console.error(error);
      setPreviewMessage(
        "The file could not be previewed. Try downloading it instead."
      );
    }
  }

  function closeFilePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setPreviewFile(null);
  }

  function handleDownloadFile(file) {
    try {
      downloadStoredFile(file);
      setPreviewMessage("");
    } catch (error) {
      window.alert(
        error.message || "The file could not be downloaded."
      );
    }
  }

  const totalNotes = courses.reduce(
    (total, course) =>
      total +
      (Array.isArray(course.notes) ? course.notes.length : 0),
    0
  );

  const totalFiles = Object.values(courseFiles).reduce(
    (total, files) =>
      total + (Array.isArray(files) ? files.length : 0),
    0
  );

  const previewMimeType = previewFile
    ? getFileMimeType(previewFile)
    : "";

  return (
    <main className="notes-page">
      <section className="page-heading notes-page-heading">
        <div>
          <span className="eyebrow">Learning library</span>
          <h1>Notes</h1>
          <p>
            View notes and uploaded files from all your courses in one
            organized place.
          </p>
        </div>

        <div className="notes-summary">
          <div>
            <strong>{totalNotes}</strong>
            <span>Notes</span>
          </div>

          <div>
            <strong>{totalFiles}</strong>
            <span>Files</span>
          </div>
        </div>
      </section>

      <section className="notes-library-panel">
        <div className="notes-library-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search notes and files</span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search courses, notes, or files..."
            />
          </label>

          <span className="result-count">
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        {fileError && <p className="notes-file-error">{fileError}</p>}
        {previewMessage && (
          <p className="notes-file-error">{previewMessage}</p>
        )}

        {isLoadingFiles ? (
          <div className="empty-state">Loading your notes and files...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <span className="notes-empty-icon">📝</span>

            <h2>
              {searchTerm
                ? "No matching notes found"
                : "Your notes library is empty"}
            </h2>

            <p>
              {searchTerm
                ? "Try searching with a different course, note, or file name."
                : "Notes and uploaded files added inside your courses will appear here."}
            </p>
          </div>
        ) : (
          <div className="notes-course-grid">
            {filteredCourses.map((course) => (
              <CourseNotesCard
                key={course.id}
                course={course}
                files={courseFiles[String(course.id)] || []}
                onViewFile={handleViewFile}
                onDownloadFile={handleDownloadFile}
              />
            ))}
          </div>
        )}
      </section>

      {previewFile && previewUrl && (
        <div
          className="file-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-file-preview-title"
          onClick={closeFilePreview}
        >
          <div
            className="file-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="file-preview-header">
              <div className="file-preview-heading">
                <p>File preview</p>
                <h2 id="notes-file-preview-title">
                  {previewFile.name}
                </h2>
              </div>

              <div className="file-preview-header-actions">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewFile)}
                >
                  Download
                </button>

                <button
                  type="button"
                  className="file-preview-close"
                  onClick={closeFilePreview}
                  aria-label="Close file preview"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="file-preview-content">
              {previewMimeType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title={previewFile.name}
                  className="file-preview-frame"
                />
              ) : previewMimeType.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  className="file-preview-image"
                />
              ) : previewMimeType.startsWith("text/") ||
                previewMimeType === "application/json" ? (
                <iframe
                  src={previewUrl}
                  title={previewFile.name}
                  className="file-preview-frame"
                />
              ) : (
                <div className="unsupported-preview">
                  <h3>Preview unavailable</h3>
                  <p>
                    This file type cannot be displayed directly in the
                    browser.
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleDownloadFile(previewFile)}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}