export default function GoalForm({
  form,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit} noValidate>
      <label>
        Goal title
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Example: Finish Python fundamentals"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && (
          <span className="error-message">{errors.title}</span>
        )}
      </label>

      <label>
        Deadline
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

      <div className="form-actions">
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>

        {onCancel && (
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
