import { useRef, useState } from "react";

function insertImageAtCursor(editor, imageUrl) {
  editor.focus();

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    editor.insertAdjacentHTML(
      "beforeend",
      `<img src="${imageUrl}" alt="Pasted note" />`
    );

    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const image = document.createElement("img");

  image.src = imageUrl;
  image.alt = "Note attachment";

  range.insertNode(image);
  range.setStartAfter(image);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(
        new Error("Only image files can be inserted.")
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(
        new Error("The image could not be read.")
      );
    };

    reader.readAsDataURL(file);
  });
}

export default function RichTextNoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel,
  saveLabel = "Add Note",
}) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);

  const [editorError, setEditorError] =
    useState("");

  function runCommand(command, value = null) {
    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      value
    );

    onContentChange(
      editorRef.current?.innerHTML || ""
    );
  }

  function handleToolbarMouseDown(event) {
    /*
      Prevents the editor selection from disappearing
      when a formatting button is clicked.
    */
    event.preventDefault();
  }

  function handleEditorInput() {
    onContentChange(
      editorRef.current?.innerHTML || ""
    );
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

    if (!imageItem) {
      return;
    }

    event.preventDefault();
    setEditorError("");

    try {
      const imageFile =
        imageItem.getAsFile();

      const imageUrl =
        await readImageFile(imageFile);

      insertImageAtCursor(
        editorRef.current,
        imageUrl
      );

      handleEditorInput();
    } catch (error) {
      setEditorError(
        error.message ||
          "The pasted image could not be added."
      );
    }
  }

  async function handleImageSelection(event) {
    const selectedFile =
      event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setEditorError("");

    try {
      const imageUrl =
        await readImageFile(selectedFile);

      insertImageAtCursor(
        editorRef.current,
        imageUrl
      );

      handleEditorInput();
    } catch (error) {
      setEditorError(
        error.message ||
          "The image could not be added."
      );
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const currentContent =
      editorRef.current?.innerHTML || "";

    onContentChange(currentContent);

    onSave({
      title: title.trim(),
      contentHtml: currentContent,
    });
  }

  return (
    <form
      className="rich-note-editor"
      onSubmit={handleSubmit}
    >
      <label className="note-title-field">
        <span>Note title</span>

        <input
          type="text"
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Add a title for this note"
          maxLength={100}
          required
        />
      </label>

      <div className="rich-text-editor-shell">
        <div
          className="rich-text-toolbar"
          role="toolbar"
          aria-label="Note formatting"
        >
          <button
            type="button"
            className="format-button"
            title="Bold"
            aria-label="Bold"
            onMouseDown={
              handleToolbarMouseDown
            }
            onClick={() =>
              runCommand("bold")
            }
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            className="format-button"
            title="Italic"
            aria-label="Italic"
            onMouseDown={
              handleToolbarMouseDown
            }
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
            onMouseDown={
              handleToolbarMouseDown
            }
            onClick={() =>
              runCommand("underline")
            }
          >
            <u>U</u>
          </button>

          <label
            className="format-color-control"
            title="Text color"
          >
            <span>A</span>

            <input
              type="color"
              defaultValue="#4a2025"
              aria-label="Text color"
              onInput={(event) =>
                runCommand(
                  "foreColor",
                  event.target.value
                )
              }
            />
          </label>

          <label
            className="format-color-control highlight-control"
            title="Highlight color"
          >
            <span>H</span>

            <input
              type="color"
              defaultValue="#fff29a"
              aria-label="Highlight color"
              onInput={(event) =>
                runCommand(
                  "hiliteColor",
                  event.target.value
                )
              }
            />
          </label>

          <button
            type="button"
            className="format-image-button"
            onMouseDown={
              handleToolbarMouseDown
            }
            onClick={() =>
              imageInputRef.current?.click()
            }
          >
            🖼 Add image
          </button>

          <input
            ref={imageInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={handleImageSelection}
          />
        </div>

        <div
          ref={editorRef}
          className="rich-text-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Write your note here. You can also paste an image..."
          onInput={handleEditorInput}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      </div>

      <p className="rich-editor-helper">
        Select text to format it. Images can be
        pasted directly into the note.
      </p>

      {editorError && (
        <p className="error-message">
          {editorError}
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button"
        >
          {saveLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}