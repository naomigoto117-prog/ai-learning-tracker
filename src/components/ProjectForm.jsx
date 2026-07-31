import { useState } from "react";

export default function ProjectForm({
  form,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  onAddTech,
  onRemoveTech,
}) {
  const [techInput, setTechInput] =
    useState("");

  function handleAddTech() {
    const value = techInput.trim();

    if (!value) {
      return;
    }

    onAddTech(value);
    setTechInput("");
  }

  function handleTechKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTech();
    }
  }

  return (
    <form
      className="form-grid project-form"
      onSubmit={onSubmit}
    >
      <label>
        Project title

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.title
          )}
          placeholder="Example: AI Learning Dashboard"
        />

        {errors.title && (
          <span className="error-message">
            {errors.title}
          </span>
        )}
      </label>

      <label>
        Live URL

        <input
          type="url"
          name="liveUrl"
          value={form.liveUrl}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.liveUrl
          )}
          placeholder="https://your-project.vercel.app"
        />

        {errors.liveUrl && (
          <span className="error-message">
            {errors.liveUrl}
          </span>
        )}
      </label>

      <label className="form-full-width">
        GitHub repository

        <input
          type="url"
          name="githubUrl"
          value={form.githubUrl}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.githubUrl
          )}
          placeholder="https://github.com/username/project"
        />

        {errors.githubUrl && (
          <span className="error-message">
            {errors.githubUrl}
          </span>
        )}
      </label>

      <label className="form-full-width">
        Description

        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.description
          )}
          placeholder="Describe the project, its purpose, and its main features."
          rows="6"
        />

        {errors.description && (
          <span className="error-message">
            {errors.description}
          </span>
        )}
      </label>

      <div className="form-full-width tech-stack-field">
        <span className="tech-stack-label">
          Tech stack used
        </span>

        <div className="tech-stack-input-row">
          <input
            type="text"
            value={techInput}
            onChange={(event) =>
              setTechInput(
                event.target.value
              )
            }
            onKeyDown={
              handleTechKeyDown
            }
            placeholder="Example: React"
          />

          <button
            type="button"
            className="secondary-button"
            onClick={handleAddTech}
          >
            Add
          </button>
        </div>

        <span className="helper-text">
          Type a technology, then press Add
          or Enter.
        </span>

        {form.techStack.length > 0 && (
          <div className="tech-stack-bubbles">
            {form.techStack.map(
              (technology) => (
                <span
                  key={technology}
                  className="tech-stack-bubble"
                >
                  {technology}

                  <button
                    type="button"
                    aria-label={`Remove ${technology}`}
                    onClick={() =>
                      onRemoveTech(
                        technology
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>
        )}
      </div>

      <div className="form-actions form-full-width">
        <button
          type="submit"
          className="primary-button"
        >
          {submitLabel}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}