export default function CourseForm({
  form,
  errors,
  onChange,
  onSubmit,
  submitLabel = "Save Course",
}) {
  return (
    <form onSubmit={onSubmit} className="form-grid" noValidate>
      <label>
        Course title
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Example: Machine Learning Basics"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && (
          <span className="error-message">{errors.title}</span>
        )}
      </label>

      <label>
        Platform
        <input
          name="platform"
          value={form.platform}
          onChange={onChange}
          placeholder="Example: Coursera"
          aria-invalid={Boolean(errors.platform)}
        />
        {errors.platform && (
          <span className="error-message">{errors.platform}</span>
        )}
      </label>


      <label className="form-full-width">
        Course link
        <input
          type="url"
          name="url"
          value={form.url || ""}
          onChange={onChange}
          placeholder="https://www.example.com/course"
          aria-invalid={Boolean(errors.url)}
        />
        <span className="helper-text">
          Used by the Continue Learning button.
        </span>
        {errors.url && (
          <span className="error-message">{errors.url}</span>
        )}
      </label>

      <label>
        Category
        <input
          name="category"
          value={form.category}
          onChange={onChange}
          placeholder="Example: Machine Learning"
          aria-invalid={Boolean(errors.category)}
        />
        {errors.category && (
          <span className="error-message">{errors.category}</span>
        )}
      </label>

      <label>
        Progress
        <input
          type="number"
          name="progress"
          min="0"
          max="100"
          value={form.progress}
          onChange={onChange}
          aria-invalid={Boolean(errors.progress)}
        />
        {errors.progress && (
          <span className="error-message">{errors.progress}</span>
        )}
      </label>

      <label>
        Status
        <select
          name="status"
          value={form.status}
          onChange={onChange}
          disabled
          aria-describedby="status-help"
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <span id="status-help" className="helper-text">
          Status is calculated automatically from progress.
        </span>
      </label>

      <label>
        Target completion date
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={onChange}
          aria-invalid={Boolean(errors.deadline)}
        />
        {errors.deadline && (
          <span className="error-message">{errors.deadline}</span>
        )}
      </label>

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
