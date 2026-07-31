
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  deleteCourseFile,
  downloadStoredFile,
  getCourseFiles,
  saveCourseFiles,
} from "../utils/courseFilesDb";

function statusFromProgress(progress) {
  const numericProgress =
    Number(progress);

  if (numericProgress >= 100) {
    return "Completed";
  }

  if (numericProgress > 0) {
    return "In Progress";
  }

  return "Not Started";
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) / Math.log(1024)
    ),
    units.length - 1
  );

  const value = (
    bytes /
    1024 ** index
  ).toFixed(index === 0 ? 0 : 1);

  return `${value} ${units[index]}`;
}

function formatDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function getFileExtension(
  fileName = ""
) {
  return (
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}

function getFileMimeType(file) {
  if (
    file?.type &&
    file.type !==
      "application/octet-stream"
  ) {
    return file.type;
  }

  const extension =
    getFileExtension(file?.name);

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

  return (
    mimeTypes[extension] ||
    "application/octet-stream"
  );
}

function canPreviewFile(file) {
  const mimeType =
    getFileMimeType(file);

  return (
    mimeType ===
      "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/") ||
    mimeType === "application/json"
  );
}

function createPreviewBlob(file) {
  if (!file?.blob) {
    throw new Error(
      "The uploaded file data is missing."
    );
  }

  const mimeType =
    getFileMimeType(file);

  if (file.blob instanceof Blob) {
    return file.blob.slice(
      0,
      file.blob.size,
      mimeType
    );
  }

  return new Blob([file.blob], {
    type: mimeType,
  });
}


function sanitizeNoteHtml(html = "") {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    html,
    "text/html"
  );

  const allowedTags = new Set([
    "P",
    "DIV",
    "BR",
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "SPAN",
    "IMG",
    "UL",
    "OL",
    "LI",
  ]);

  documentNode.body
    .querySelectorAll("*")
    .forEach((element) => {
      if (!allowedTags.has(element.tagName)) {
        element.replaceWith(
          ...element.childNodes
        );
        return;
      }

      Array.from(element.attributes).forEach(
        (attribute) => {
          const name =
            attribute.name.toLowerCase();

          const isAllowed =
            name === "style" ||
            (element.tagName === "SPAN" &&
              [
                "class",
                "contenteditable",
                "draggable",
                "data-image-id",
              ].includes(name)) ||
            (element.tagName === "IMG" &&
              [
                "src",
                "alt",
                "title",
              ].includes(name));

          if (!isAllowed) {
            element.removeAttribute(
              attribute.name
            );
          }
        }
      );

      if (element.tagName === "IMG") {
        const source =
          element.getAttribute("src") || "";

        if (
          !source.startsWith("data:image/") &&
          !source.startsWith("blob:") &&
          !source.startsWith("https://") &&
          !source.startsWith("http://")
        ) {
          element.remove();
        }
      }
    });

  return documentNode.body.innerHTML;
}


const TEXT_COLOR_OPTIONS = [
  { name: "Red", value: "#d96c75" },
  { name: "Blue", value: "#6f9fd8" },
  { name: "Green", value: "#6fae7b" },
  { name: "Yellow", value: "#c59a00" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#1f1f1f" },
  { name: "Purple", value: "#9a78c2" },
];

const HIGHLIGHT_COLOR_OPTIONS = [
  { name: "Red", value: "#ffd6da" },
  { name: "Blue", value: "#dcebff" },
  { name: "Green", value: "#ddf3e2" },
  { name: "Yellow", value: "#fff2a8" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#2b2b2b" },
  { name: "Purple", value: "#e9ddf7" },
];

function RichTextNoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
}) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [editorMessage, setEditorMessage] =
    useState("");
  const [activeColorPalette, setActiveColorPalette] =
    useState(null);
  const [selectedImageId, setSelectedImageId] =
    useState(null);
  const draggedImageRef = useRef(null);

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== content
    ) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  function rememberSelection() {
    const selection = window.getSelection();

    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(
        selection.anchorNode
      )
    ) {
      savedRangeRef.current =
        selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();

    if (
      !selection ||
      !savedRangeRef.current
    ) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(
      savedRangeRef.current
    );
  }

  function syncContent() {
    onContentChange(
      editorRef.current?.innerHTML || ""
    );
  }

  function runCommand(command, value = null) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(
      command,
      false,
      value
    );
    rememberSelection();
    syncContent();
    setActiveColorPalette(null);
  }

  function getSelectedImageWrapper() {
    if (
      !selectedImageId ||
      !editorRef.current
    ) {
      return null;
    }

    return editorRef.current.querySelector(
      `[data-image-id="${selectedImageId}"]`
    );
  }

  function selectImageWrapper(wrapper) {
    editorRef.current
      ?.querySelectorAll(
        ".resizable-note-image-selected"
      )
      .forEach((element) =>
        element.classList.remove(
          "resizable-note-image-selected"
        )
      );

    if (!wrapper) {
      setSelectedImageId(null);
      return;
    }

    wrapper.classList.add(
      "resizable-note-image-selected"
    );

    setSelectedImageId(
      wrapper.dataset.imageId
    );
  }

  function applyImageLayout(layout) {
    const wrapper =
      getSelectedImageWrapper();

    if (!wrapper) {
      return;
    }

    wrapper.classList.remove(
      "note-image-wrap-left",
      "note-image-wrap-right",
      "note-image-center",
      "note-image-full-width"
    );

    wrapper.style.float = "";
    wrapper.style.margin = "";
    wrapper.style.display = "";

    if (layout === "left") {
      wrapper.classList.add(
        "note-image-wrap-left"
      );
    } else if (layout === "right") {
      wrapper.classList.add(
        "note-image-wrap-right"
      );
    } else if (layout === "full") {
      wrapper.classList.add(
        "note-image-full-width"
      );
    } else {
      wrapper.classList.add(
        "note-image-center"
      );
    }

    syncContent();
  }

  function removeSelectedImage() {
    const wrapper =
      getSelectedImageWrapper();

    if (!wrapper) {
      return;
    }

    wrapper.remove();
    setSelectedImageId(null);
    syncContent();
  }

  function handleEditorClick(event) {
    const wrapper =
      event.target.closest(
        ".resizable-note-image"
      );

    if (
      wrapper &&
      editorRef.current?.contains(wrapper)
    ) {
      selectImageWrapper(wrapper);
      return;
    }

    selectImageWrapper(null);
  }

  function handleImageDragStart(event) {
    const wrapper =
      event.target.closest(
        ".resizable-note-image"
      );

    if (!wrapper) {
      return;
    }

    draggedImageRef.current = wrapper;
    selectImageWrapper(wrapper);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      wrapper.dataset.imageId || ""
    );
  }

  function handleImageDragOver(event) {
    if (!draggedImageRef.current) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";
  }

  function handleImageDrop(event) {
    const dragged =
      draggedImageRef.current;

    if (
      !dragged ||
      !editorRef.current
    ) {
      return;
    }

    event.preventDefault();

    const targetWrapper =
      event.target.closest(
        ".resizable-note-image"
      );

    if (
      targetWrapper &&
      targetWrapper !== dragged
    ) {
      const targetRect =
        targetWrapper.getBoundingClientRect();

      const insertAfter =
        event.clientY >
        targetRect.top +
          targetRect.height / 2;

      targetWrapper.parentNode.insertBefore(
        dragged,
        insertAfter
          ? targetWrapper.nextSibling
          : targetWrapper
      );
    } else {
      const range =
        document.caretRangeFromPoint?.(
          event.clientX,
          event.clientY
        );

      if (
        range &&
        editorRef.current.contains(
          range.startContainer
        )
      ) {
        range.insertNode(dragged);
      } else {
        editorRef.current.appendChild(
          dragged
        );
      }
    }

    draggedImageRef.current = null;
    syncContent();
  }

  function handleImageDragEnd() {
    draggedImageRef.current = null;
    syncContent();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file?.type?.startsWith("image/")) {
        reject(
          new Error(
            "Please select an image file."
          )
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(
          new Error(
            "Images must be 5 MB or smaller."
          )
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () =>
        resolve(reader.result);
      reader.onerror = () =>
        reject(
          new Error(
            "The image could not be read."
          )
        );

      reader.readAsDataURL(file);
    });
  }

  function insertImage(source) {
    editorRef.current?.focus();
    restoreSelection();

    const selection = window.getSelection();

    const imageWrapper =
      document.createElement("span");

    const imageId =
      crypto.randomUUID();

    imageWrapper.className =
      "resizable-note-image note-image-center";

    imageWrapper.dataset.imageId =
      imageId;

    imageWrapper.draggable = true;

    imageWrapper.setAttribute(
      "contenteditable",
      "false"
    );

    imageWrapper.style.display =
      "inline-block";
    imageWrapper.style.width = "420px";
    imageWrapper.style.maxWidth = "100%";
    imageWrapper.style.height = "auto";
    imageWrapper.style.resize = "both";
    imageWrapper.style.overflow = "hidden";
    imageWrapper.style.verticalAlign = "top";

    const image =
      document.createElement("img");

    image.src = source;
    image.alt = "Note image";
    image.draggable = false;

    image.style.display = "block";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "contain";

    imageWrapper.appendChild(image);

    const spacer =
      document.createTextNode("\u00A0");

    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);

      range.deleteContents();
      range.insertNode(spacer);
      range.insertNode(imageWrapper);
      range.setStartAfter(spacer);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current?.appendChild(
        imageWrapper
      );
      editorRef.current?.appendChild(
        spacer
      );
    }

    rememberSelection();
    syncContent();
  }

  async function handleImageFile(file) {
    setEditorMessage("");

    try {
      const source = await readImage(file);
      insertImage(source);
    } catch (error) {
      setEditorMessage(
        error.message ||
          "The image could not be added."
      );
    }
  }

  async function handlePaste(event) {
    const clipboardItems = Array.from(
      event.clipboardData?.items || []
    );

    const imageItem = clipboardItems.find(
      (item) =>
        item.kind === "file" &&
        item.type.startsWith("image/")
    );

    if (imageItem) {
      event.preventDefault();

      await handleImageFile(
        imageItem.getAsFile()
      );

      return;
    }

    const plainText =
      event.clipboardData?.getData(
        "text/plain"
      );

    if (!plainText) {
      return;
    }

    event.preventDefault();

    editorRef.current?.focus();
    restoreSelection();

    const normalizedText = plainText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n");

    const blocks = normalizedText
      .split(/\n\n+/)
      .map((block) => block.trim())
      .filter(Boolean);

    const html = blocks
      .map(
        (block) =>
          `<p>${block
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>")}</p>`
      )
      .join("");

    document.execCommand(
      "insertHTML",
      false,
      html
    );

    rememberSelection();
    syncContent();
  }

  return (
    <form
      className="note-composer rich-note-composer"
      onSubmit={onSubmit}
    >
      <label htmlFor="course-note-title">
        Add title
      </label>

      <input
        id="course-note-title"
        type="text"
        value={title}
        onChange={(event) =>
          onTitleChange(event.target.value)
        }
        placeholder="Enter a title for this note"
        maxLength="100"
      />

      <label htmlFor="course-note-editor">
        Add a note
      </label>

      <div className="rich-text-editor-shell">
        <div
          className="rich-text-toolbar"
          role="toolbar"
          aria-label="Note formatting options"
        >
          <button
            type="button"
            className="format-button"
            title="Bold"
            aria-label="Bold"
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() => runCommand("bold")}
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            className="format-button"
            title="Italic"
            aria-label="Italic"
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() =>
              runCommand("italic")
            }
          >
            <em>I</em>
          </button>

          <button
            type="button"
            className="format-button"
            title="Underline"
            aria-label="Underline"
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() =>
              runCommand("underline")
            }
          >
            <u>U</u>
          </button>

          <div className="format-palette-wrapper">
            <button
              type="button"
              className="format-button format-palette-trigger"
              title="Text color"
              aria-label="Choose text color"
              aria-expanded={activeColorPalette === "text"}
              onMouseDown={(event) => {
                event.preventDefault();
                rememberSelection();
              }}
              onClick={() =>
                setActiveColorPalette((current) =>
                  current === "text" ? null : "text"
                )
              }
            >
              <span className="text-color-icon">A</span>
            </button>

            {activeColorPalette === "text" && (
              <div className="format-color-palette" role="menu" aria-label="Text colors">
                {TEXT_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className="format-color-swatch"
                    title={color.name}
                    aria-label={`${color.name} text`}
                    style={{ backgroundColor: color.value }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      rememberSelection();
                    }}
                    onClick={() => runCommand("foreColor", color.value)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="format-palette-wrapper">
            <button
              type="button"
              className="format-button format-palette-trigger"
              title="Highlight color"
              aria-label="Choose highlight color"
              aria-expanded={activeColorPalette === "highlight"}
              onMouseDown={(event) => {
                event.preventDefault();
                rememberSelection();
              }}
              onClick={() =>
                setActiveColorPalette((current) =>
                  current === "highlight" ? null : "highlight"
                )
              }
            >
              <span className="highlight-color-icon">H</span>
            </button>

            {activeColorPalette === "highlight" && (
              <div className="format-color-palette" role="menu" aria-label="Highlight colors">
                {HIGHLIGHT_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className="format-color-swatch"
                    title={color.name}
                    aria-label={`${color.name} highlight`}
                    style={{ backgroundColor: color.value }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      rememberSelection();
                    }}
                    onClick={() => runCommand("hiliteColor", color.value)}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="format-image-button"
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() =>
              imageInputRef.current?.click()
            }
          >
            <span aria-hidden="true">＋</span>
            Image
          </button>

          <input
            ref={imageInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file =
                event.target.files?.[0];

              if (file) {
                handleImageFile(file);
              }

              event.target.value = "";
            }}
          />
        </div>

        {selectedImageId && (
          <div
            className="image-layout-toolbar"
            role="toolbar"
            aria-label="Image layout options"
          >
            <span className="image-layout-label">
              Image
            </span>

            <button
              type="button"
              onClick={() =>
                applyImageLayout("left")
              }
            >
              Wrap left
            </button>

            <button
              type="button"
              onClick={() =>
                applyImageLayout("center")
              }
            >
              Center
            </button>

            <button
              type="button"
              onClick={() =>
                applyImageLayout("right")
              }
            >
              Wrap right
            </button>

            <button
              type="button"
              onClick={() =>
                applyImageLayout("full")
              }
            >
              Full width
            </button>

            <button
              type="button"
              className="image-remove-button"
              onClick={removeSelectedImage}
            >
              Remove
            </button>
          </div>
        )}

        <div
          id="course-note-editor"
          ref={editorRef}
          className="rich-text-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Write a key takeaway, task, reminder, or detailed course note..."
          onInput={syncContent}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onClick={handleEditorClick}
          onPaste={handlePaste}
          onDragStart={handleImageDragStart}
          onDragOver={handleImageDragOver}
          onDrop={handleImageDrop}
          onDragEnd={handleImageDragEnd}
        />
      </div>

      <p className="rich-editor-helper">
        Select an image to choose its layout.
        Drag an image to move it, use Wrap left
        or Wrap right to place text beside it,
        and drag its bottom-right corner to
        resize it.
      </p>

      {editorMessage && (
        <p className="file-message">
          {editorMessage}
        </p>
      )}

      <div className="note-composer-footer note-composer-footer-end">
        <button
          type="submit"
          className="primary-button"
          disabled={
            !title.trim() ||
            (!content
              .replace(/<[^>]*>/g, "")
              .replace(/&nbsp;/g, " ")
              .trim() &&
              !content.includes("<img"))
          }
        >
          Add Note
        </button>
      </div>
    </form>
  );
}

export default function CourseDetailsPage({
  courses = [],
  onUpdateCourse,
}) {
  const { courseId } = useParams();

  const course = Array.isArray(courses)
    ? courses.find(
        (item) =>
          String(item.id) ===
          String(courseId)
      )
    : null;

  const [noteTitle, setNoteTitle] =
    useState("");

  const [noteContent, setNoteContent] =
    useState("");

  const [files, setFiles] =
    useState([]);

  const [fileMessage, setFileMessage] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    activeFileMenu,
    setActiveFileMenu,
  ] = useState(null);

  const [
    previewFile,
    setPreviewFile,
  ] = useState(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!courseId) {
      return undefined;
    }

    let isActive = true;

    getCourseFiles(courseId)
      .then((storedFiles) => {
        if (isActive) {
          setFiles(storedFiles);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isActive) {
          setFileMessage(
            "Files could not be loaded in this browser."
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  const notes = useMemo(
    () =>
      Array.isArray(course?.notes)
        ? course.notes
        : [],
    [course]
  );

  if (!course) {
    return (
      <main className="page-content">
        <section className="empty-state full-width-empty">
          <h1>Course not found</h1>

          <p>
            This course may have been
            removed.
          </p>

          <Link
            to="/courses"
            className="primary-link-button"
          >
            Return to Courses
          </Link>
        </section>
      </main>
    );
  }

  function patchCourse(changes) {
    if (
      typeof onUpdateCourse !==
      "function"
    ) {
      console.error(
        "onUpdateCourse is not available."
      );

      return;
    }

    onUpdateCourse({
      ...course,
      ...changes,
    });
  }

  function handleProgressChange(
    event
  ) {
    const progress = Number(
      event.target.value
    );

    patchCourse({
      progress,
      status:
        statusFromProgress(progress),
    });
  }

  function addNote(event) {
    event.preventDefault();

    const title = noteTitle.trim();
    const contentHtml =
      sanitizeNoteHtml(noteContent);

    const plainText = contentHtml
      .replace(/<img[^>]*>/gi, " image ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (
      !title ||
      (!plainText &&
        !contentHtml.includes("<img"))
    ) {
      return;
    }

    const createdAt =
      new Date().toISOString();

    const newNote = {
      id: crypto.randomUUID(),
      title,
      contentHtml,
      content: plainText,
      createdAt,
      updatedAt: createdAt,
    };

    patchCourse({
      notes: [newNote, ...notes],
    });

    setNoteTitle("");
    setNoteContent("");
  }

  function deleteNote(noteId) {
    patchCourse({
      notes: notes.filter(
        (note) =>
          note.id !== noteId
      ),
    });
  }

  async function handleFilesSelected(
    event
  ) {
    const input = event.target;

    const selectedFiles =
      Array.from(
        input.files || []
      );

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    const oversizedFile =
      selectedFiles.find(
        (file) =>
          file.size > maxSize
      );

    if (oversizedFile) {
      setFileMessage(
        `${oversizedFile.name} is larger than the 10 MB limit.`
      );

      input.value = "";
      return;
    }

    setIsUploading(true);
    setFileMessage("");

    try {
      await saveCourseFiles(
        course.id,
        selectedFiles
      );

      const updatedFiles =
        await getCourseFiles(
          course.id
        );

      setFiles(updatedFiles);

      setFileMessage(
        `${selectedFiles.length} ${
          selectedFiles.length === 1
            ? "file"
            : "files"
        } uploaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setFileMessage(
        "The selected files could not be saved."
      );
    } finally {
      setIsUploading(false);
      input.value = "";
    }
  }

  function handleViewFile(file) {
    try {
      setFileMessage("");
      setActiveFileMenu(null);

      if (!canPreviewFile(file)) {
        setFileMessage(
          "This file type cannot be previewed. Download the file instead."
        );

        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      const previewBlob =
        createPreviewBlob(file);

      const newPreviewUrl =
        URL.createObjectURL(
          previewBlob
        );

      setPreviewFile(file);
      setPreviewUrl(
        newPreviewUrl
      );
    } catch (error) {
      console.error(error);

      setFileMessage(
        "The file could not be previewed. Try downloading it instead."
      );
    }
  }

  function closeFilePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl("");
    setPreviewFile(null);
  }

  function handleDownloadFile(file) {
    try {
      downloadStoredFile(file);

      setActiveFileMenu(null);
      setFileMessage("");
    } catch (error) {
      console.error(error);

      setFileMessage(
        "The file could not be downloaded."
      );
    }
  }

  async function removeFile(fileId) {
    try {
      await deleteCourseFile(
        fileId
      );

      setFiles(
        (currentFiles) =>
          currentFiles.filter(
            (file) =>
              file.id !== fileId
          )
      );

      if (
        previewFile?.id === fileId
      ) {
        closeFilePreview();
      }

      setActiveFileMenu(null);

      setFileMessage(
        "File deleted successfully."
      );
    } catch (error) {
      console.error(error);

      setFileMessage(
        "The file could not be deleted."
      );
    }
  }

  const statusClass = String(
    course.status ||
      "Not Started"
  )
    .toLowerCase()
    .replaceAll(" ", "-");

  const previewMimeType =
    previewFile
      ? getFileMimeType(
          previewFile
        )
      : "";

  return (
    <main className="page-content course-details-page">
      <style>{`
        .course-progress-panel {
          display: grid;
          gap: 20px;
        }

        .course-progress-panel .progress-heading-row {
          margin-bottom: 0;
        }

        .course-progress-panel .progress-slider-label {
          display: block;
          margin: 0;
        }

        .course-progress-panel .progress-slider-label input[type="range"] {
          width: 100%;
          height: 12px;
          margin: 0;
          padding: 0;
          appearance: none;
          -webkit-appearance: none;
          background: linear-gradient(
            to right,
            var(--primary) 0,
            var(--primary) var(--course-progress),
            var(--surface-muted) var(--course-progress),
            var(--surface-muted) 100%
          );
          border: 0;
          border-radius: 999px;
          box-shadow: none;
          cursor: pointer;
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]::-webkit-slider-runnable-track {
          height: 12px;
          background: transparent;
          border: 0;
          border-radius: 999px;
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]::-webkit-slider-thumb {
          width: 22px;
          height: 22px;
          margin-top: -5px;
          appearance: none;
          -webkit-appearance: none;
          background: var(--primary);
          border: 3px solid var(--surface);
          border-radius: 50%;
          box-shadow: 0 2px 8px color-mix(
            in srgb,
            var(--primary) 35%,
            transparent
          );
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]::-moz-range-track {
          height: 12px;
          background: var(--surface-muted);
          border: 0;
          border-radius: 999px;
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]::-moz-range-progress {
          height: 12px;
          background: var(--primary);
          border-radius: 999px;
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--primary);
          border: 3px solid var(--surface);
          border-radius: 50%;
          box-shadow: 0 2px 8px color-mix(
            in srgb,
            var(--primary) 35%,
            transparent
          );
        }

        .course-progress-panel
          .progress-slider-label
          input[type="range"]:focus-visible {
          outline: 3px solid var(--focus);
          outline-offset: 4px;
        }

        .course-progress-panel .course-hero-actions {
          margin-top: 4px;
        }

        .rich-note-composer {
          display: grid;
          gap: 12px;
        }

        .rich-note-composer > label {
          color: var(--heading, var(--text));
          font-weight: 700;
        }

        .rich-note-composer > input {
          width: 100%;
          padding: 12px 14px;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 11px;
          font: inherit;
          outline: none;
        }

        .rich-note-composer > input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
        }

        .rich-text-editor-shell {
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 13px;
        }

        .rich-text-editor-shell:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
        }

        .rich-text-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          padding: 9px;
          background: var(--surface-soft);
          border-bottom: 1px solid var(--border);
        }

        .format-button,
        .format-image-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          font: inherit;
          cursor: pointer;
        }

        .format-button:hover,
        .format-image-button:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .format-button strong,
        .format-button em,
        .format-button u {
          color: inherit;
          font-size: 1rem;
          line-height: 1;
        }

        .format-image-button {
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .format-palette-wrapper {
          position: relative;
        }

        .format-palette-trigger {
          padding: 0;
        }

        .text-color-icon,
        .highlight-color-icon {
          position: relative;
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          font-weight: 900;
          line-height: 1;
        }

        .text-color-icon::after {
          position: absolute;
          right: 2px;
          bottom: 1px;
          left: 2px;
          height: 3px;
          background: var(--primary);
          border-radius: 999px;
          content: "";
        }

        .highlight-color-icon {
          background: #fff2a8;
          border-radius: 4px;
        }

        .format-color-palette {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: repeat(4, 28px);
          gap: 7px;
          padding: 9px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 11px;
          box-shadow: var(--shadow);
        }

        .format-color-swatch {
          width: 28px;
          min-width: 28px;
          height: 28px;
          padding: 0;
          border: 1px solid var(--input-border);
          border-radius: 7px;
          box-shadow: inset 0 0 0 1px rgb(255 255 255 / 35%);
        }

        .format-color-swatch:hover,
        .format-color-swatch:focus-visible {
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .rich-text-editor {
          width: 100%;
          min-height: 280px;
          height: 360px;
          max-height: 820px;
          padding: 20px;
          overflow: auto;
          resize: vertical;
          color: var(--text);
          background: var(--surface);
          font: inherit;
          font-size: 1rem;
          line-height: 1.75;
          overflow-wrap: anywhere;
          white-space: normal;
          outline: none;
        }

        .rich-text-editor:empty::before {
          color: var(--text-muted);
          content: attr(data-placeholder);
          pointer-events: none;
        }

        .rich-text-editor p,
        .formatted-note-content p {
          margin: 0 0 1em;
        }

        .rich-text-editor p:last-child,
        .formatted-note-content p:last-child {
          margin-bottom: 0;
        }

        .rich-text-editor div,
        .formatted-note-content div {
          margin-bottom: 0.85em;
        }

        .rich-text-editor ul,
        .rich-text-editor ol,
        .formatted-note-content ul,
        .formatted-note-content ol {
          margin: 0 0 1em;
          padding-left: 1.6rem;
        }

        .rich-text-editor li,
        .formatted-note-content li {
          margin-bottom: 0.45em;
        }

        .rich-text-editor br + br,
        .formatted-note-content br + br {
          line-height: 2;
        }

        .rich-editor-helper {
          margin: -4px 0 0;
          color: var(--text-muted);
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .saved-note-display h3 {
          margin: 0 0 10px;
          color: var(--heading, var(--text));
          font-size: 1rem;
        }

        .formatted-note-content {
          color: var(--text);
          overflow-wrap: anywhere;
          line-height: 1.7;
        }

        .formatted-note-content p,
        .formatted-note-content div {
          margin: 0 0 10px;
        }

        .rich-text-editor img,
        .formatted-note-content img {
          display: block;
          width: auto;
          max-width: 100%;
          max-height: 500px;
          margin: 12px 0;
          object-fit: contain;
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .rich-text-editor .resizable-note-image,
        .formatted-note-content .resizable-note-image {
          position: relative;
          display: block;
          width: min(420px, 100%);
          max-width: 100%;
          min-width: 140px;
          min-height: 100px;
          margin: 20px auto;
          overflow: hidden;
          resize: both;
          vertical-align: top;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-soft);
        }

        .rich-text-editor
          .resizable-note-image:hover,
        .rich-text-editor
          .resizable-note-image:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(
            in srgb,
            var(--primary) 14%,
            transparent
          );
        }

        .rich-text-editor
          .resizable-note-image::after {
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 14px;
          height: 14px;
          color: var(--primary);
          content: "↘";
          font-size: 12px;
          font-weight: 900;
          line-height: 14px;
          pointer-events: none;
        }

        .rich-text-editor
          .resizable-note-image img,
        .formatted-note-content
          .resizable-note-image img {
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          margin: 0;
          object-fit: contain;
          border: 0;
          border-radius: inherit;
        }

        .rich-text-editor
          .resizable-note-image {
          cursor: move;
        }

        .rich-text-editor
          .resizable-note-image-selected {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(
            in srgb,
            var(--primary) 18%,
            transparent
          );
        }

        .note-image-wrap-left {
          float: left;
          display: block;
          margin: 6px 20px 14px 0 !important;
        }

        .note-image-wrap-right {
          float: right;
          display: block;
          margin: 6px 0 14px 20px !important;
        }

        .note-image-center {
          float: none;
          display: block;
          margin: 20px auto !important;
        }

        .note-image-full-width {
          float: none;
          display: block;
          width: 100% !important;
          margin: 20px 0 !important;
        }

        .rich-text-editor::after,
        .formatted-note-content::after {
          display: block;
          clear: both;
          content: "";
        }

        .image-layout-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          padding: 8px 10px;
          background: var(--surface-soft);
          border-bottom: 1px solid var(--border);
        }

        .image-layout-label {
          margin-right: 2px;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .image-layout-toolbar button {
          min-height: 32px;
          padding: 6px 10px;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .image-layout-toolbar button:hover {
          color: var(--primary);
          border-color: var(--primary);
        }

        .image-layout-toolbar
          .image-remove-button {
          color: var(--danger-text);
        }

        @media (max-width: 600px) {
          .format-image-button {
            flex: 1;
          }

          .rich-text-editor {
            min-height: 240px;
            height: 320px;
            max-height: 680px;
            padding: 16px;
          }

          .rich-text-editor
            .resizable-note-image,
          .formatted-note-content
            .resizable-note-image {
            width: 100%;
            min-width: 0;
            margin: 16px 0;
          }

          .note-image-wrap-left,
          .note-image-wrap-right {
            float: none;
            width: 100% !important;
            margin: 16px 0 !important;
          }

          .image-layout-toolbar {
            align-items: stretch;
          }

          .image-layout-toolbar button {
            flex: 1 1 calc(50% - 7px);
          }
        }
      `}</style>
      <nav
        className="breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/courses">
          Courses
        </Link>

        <span aria-hidden="true">
          /
        </span>

        <span>
          {course.title}
        </span>
      </nav>

      <section className="course-details-hero">
        <div className="course-details-heading">
          <div>
            <div className="course-meta-row">
              <span className="category">
                {course.category}
              </span>

              <span
                className={`status status-${statusClass}`}
              >
                {course.status}
              </span>
            </div>

            <h1>
              {course.title}
            </h1>

            <p>
              {course.platform}
            </p>
          </div>

          <button
            type="button"
            className={`favorite-button ${
              course.favorite
                ? "favorite-button-active"
                : ""
            }`}
            onClick={() =>
              patchCourse({
                favorite:
                  !course.favorite,
              })
            }
            aria-pressed={Boolean(
              course.favorite
            )}
          >
            <span aria-hidden="true">
              {course.favorite
                ? "★"
                : "☆"}
            </span>

            {course.favorite
              ? "Favorited"
              : "Add to favorites"}
          </button>
        </div>

        <div className="course-progress-panel">
          <div className="progress-heading-row">
            <div>
              <span>
                Course progress
              </span>

              <strong>
                {course.progress}%
              </strong>
            </div>

            <span>
              Target:{" "}
              {course.deadline ||
                "No date set"}
            </span>
          </div>

          <label className="progress-slider-label">
            <span className="sr-only">
              Update course progress
            </span>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                course.progress
              }
              style={{
                "--course-progress": `${course.progress}%`,
              }}
              onChange={
                handleProgressChange
              }
            />
          </label>

          <div className="course-hero-actions">
            {course.url ? (
              <a
                className="primary-link-button"
                href={course.url}
                target="_blank"
                rel="noreferrer"
              >
                Continue Learning ↗
              </a>
            ) : (
              <Link
                className="primary-link-button"
                to={`/courses/${course.id}/edit`}
              >
                Add Course Link
              </Link>
            )}

            <Link
              className="secondary-link-button"
              to={`/courses/${course.id}/edit`}
            >
              Edit Course
            </Link>
          </div>
        </div>
      </section>

      <div className="course-details-grid">
        <section className="details-panel notes-panel">
          <div className="details-panel-heading">
            <div>
              <p className="section-label">
                Personal workspace
              </p>

              <h2>
                Course Notes
              </h2>

              <p>
                Keep reminders and
                learning highlights for
                this course.
              </p>
            </div>

            <span className="panel-count">
              {notes.length}
            </span>
          </div>

          <RichTextNoteEditor
            key={`${course.id}-${notes.length}`}
            title={noteTitle}
            content={noteContent}
            onTitleChange={setNoteTitle}
            onContentChange={setNoteContent}
            onSubmit={addNote}
          />

          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="compact-empty-state">
                <span aria-hidden="true">
                  ✎
                </span>

                <h3>
                  No notes yet
                </h3>

                <p>
                  Add your first note
                  for this course.
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <article
                  className="note-card"
                  key={note.id}
                >
                  <div className="saved-note-display">
                    <h3>
                      {note.title ||
                        "Untitled note"}
                    </h3>

                    <div
                      className="formatted-note-content"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeNoteHtml(
                          note.contentHtml ||
                            note.content ||
                            ""
                        ),
                      }}
                    />
                  </div>

                  <div>
                    <time
                      dateTime={
                        note.createdAt
                      }
                    >
                      {formatDate(
                        note.createdAt
                      )}
                    </time>

                    <button
                      type="button"
                      className="text-danger-button"
                      onClick={() =>
                        deleteNote(
                          note.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="details-panel attachments-panel">
          <div className="details-panel-heading">
            <div>
              <p className="section-label">
                Course resources
              </p>

              <h2>
                Attachments
              </h2>

              <p>
                Store files related
                only to this course.
              </p>
            </div>

            <span className="panel-count">
              {files.length}
            </span>
          </div>

          <div className="upload-area">
            <span
              className="upload-icon"
              aria-hidden="true"
            >
              ↑
            </span>

            <h3>
              Upload course files
            </h3>

            <p>
              PDF, DOCX, PPTX,
              images, or TXT.
              Maximum 10 MB each.
            </p>

            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.webp,.gif,.svg"
              onChange={
                handleFilesSelected
              }
            />

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                isUploading
              }
            >
              {isUploading
                ? "Uploading..."
                : "Choose Files"}
            </button>
          </div>

          {fileMessage && (
            <p className="file-message">
              {fileMessage}
            </p>
          )}

          <div className="attachment-list">
            {files.length === 0 ? (
              <div className="compact-empty-state">
                <span aria-hidden="true">
                  ▱
                </span>

                <h3>
                  No attachments
                </h3>

                <p>
                  Uploaded files will
                  appear here.
                </p>
              </div>
            ) : (
              files.map((file) => (
                <article
                  className="attachment-card"
                  key={file.id}
                >
                  <button
                    type="button"
                    className="attachment-preview-area"
                    onClick={() =>
                      handleViewFile(
                        file
                      )
                    }
                    aria-label={`View ${file.name}`}
                  >
                    <div
                      className="file-type-icon"
                      aria-hidden="true"
                    >
                      {getFileExtension(
                        file.name
                      )
                        .slice(0, 4)
                        .toUpperCase() ||
                        "FILE"}
                    </div>

                    <div className="attachment-copy">
                      <strong
                        title={
                          file.name
                        }
                      >
                        {file.name}
                      </strong>

                      <span>
                        {formatBytes(
                          file.size
                        )}{" "}
                        ·{" "}
                        {formatDate(
                          file.uploadedAt
                        )}
                      </span>
                    </div>
                  </button>

                  <div className="attachment-controls">
                    <button
                      type="button"
                      className="view-file-button"
                      onClick={() =>
                        handleViewFile(
                          file
                        )
                      }
                    >
                      View
                    </button>

                    <div className="file-menu-container">
                      <button
                        type="button"
                        className="file-menu-button"
                        aria-label={`More options for ${file.name}`}
                        aria-expanded={
                          activeFileMenu ===
                          file.id
                        }
                        onClick={() =>
                          setActiveFileMenu(
                            (
                              currentMenu
                            ) =>
                              currentMenu ===
                              file.id
                                ? null
                                : file.id
                          )
                        }
                      >
                        ⋮
                      </button>

                      {activeFileMenu ===
                        file.id && (
                        <div className="file-dropdown-menu">
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadFile(
                                file
                              )
                            }
                          >
                            <span aria-hidden="true">
                              ↓
                            </span>

                            Download
                          </button>

                          <button
                            type="button"
                            className="file-delete-option"
                            onClick={() =>
                              removeFile(
                                file.id
                              )
                            }
                          >
                            <span aria-hidden="true">
                              ⌫
                            </span>

                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {previewFile &&
        previewUrl && (
          <div
            className="file-preview-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-preview-title"
            onClick={
              closeFilePreview
            }
          >
            <div
              className="file-preview-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <header className="file-preview-header">
                <div className="file-preview-heading">
                  <p>
                    File preview
                  </p>

                  <h2 id="file-preview-title">
                    {
                      previewFile.name
                    }
                  </h2>
                </div>

                <div className="file-preview-header-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(
                        previewFile
                      )
                    }
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    className="file-preview-close"
                    onClick={
                      closeFilePreview
                    }
                    aria-label="Close file preview"
                  >
                    ×
                  </button>
                </div>
              </header>

              <div className="file-preview-content">
                {previewMimeType ===
                "application/pdf" ? (
                  <iframe
                    src={
                      previewUrl
                    }
                    title={
                      previewFile.name
                    }
                    className="file-preview-frame"
                  />
                ) : previewMimeType.startsWith(
                    "image/"
                  ) ? (
                  <img
                    src={
                      previewUrl
                    }
                    alt={
                      previewFile.name
                    }
                    className="file-preview-image"
                  />
                ) : previewMimeType.startsWith(
                    "text/"
                  ) ||
                  previewMimeType ===
                    "application/json" ? (
                  <iframe
                    src={
                      previewUrl
                    }
                    title={
                      previewFile.name
                    }
                    className="file-preview-frame"
                  />
                ) : (
                  <div className="unsupported-preview">
                    <h3>
                      Preview unavailable
                    </h3>

                    <p>
                      This file type
                      cannot be displayed
                      directly in the
                      browser.
                    </p>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        handleDownloadFile(
                          previewFile
                        )
                      }
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