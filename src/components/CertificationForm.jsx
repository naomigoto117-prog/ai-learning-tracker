export default function CertificationForm({
  form,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  certificateFile,
  onCertificateFileChange,
  onRemoveCertificateFile,
}) {
  const selectedFileName =
    certificateFile?.name ||
    form.certificateFileName ||
    "";

  return (
    <form
      className="form-grid"
      onSubmit={onSubmit}
    >
      <label>
        Certificate name
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.name
          )}
          placeholder="Example: AI Fundamentals"
        />

        {errors.name && (
          <span className="error-message">
            {errors.name}
          </span>
        )}
      </label>

      <label>
        Issuing organization
        <input
          type="text"
          name="issuer"
          value={form.issuer}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.issuer
          )}
          placeholder="Example: IBM SkillsBuild"
        />

        {errors.issuer && (
          <span className="error-message">
            {errors.issuer}
          </span>
        )}
      </label>

      <label>
        Date earned
        <input
          type="date"
          name="dateEarned"
          value={form.dateEarned}
          onChange={onChange}
          aria-invalid={Boolean(
            errors.dateEarned
          )}
        />

        {errors.dateEarned && (
          <span className="error-message">
            {errors.dateEarned}
          </span>
        )}
      </label>

      <label>
        Credential URL
        <input
          type="url"
          name="credentialUrl"
          value={
            form.credentialUrl || ""
          }
          onChange={onChange}
          aria-invalid={Boolean(
            errors.credentialUrl
          )}
          placeholder="https://..."
        />

        {errors.credentialUrl && (
          <span className="error-message">
            {errors.credentialUrl}
          </span>
        )}
      </label>

      <label className="form-full-width">
        Skills gained
        <input
          type="text"
          name="skills"
          value={form.skills || ""}
          onChange={onChange}
          placeholder="Python, AI, Machine Learning"
        />

        <span className="helper-text">
          Separate skills with commas.
        </span>
      </label>

      <div className="form-full-width certificate-upload-flat">
  <span className="certificate-upload-label">
    Certificate File
  </span>

  <div className="certificate-upload-row">
    <label className="certificate-upload-button">
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={onCertificateFileChange}
      />

      📄 {selectedFileName
        ? "Replace Certificate"
        : "Upload Certificate"}
    </label>

    {selectedFileName && (
      <>
        <span className="certificate-upload-success">
          ✓
        </span>

        <span
          className="certificate-upload-name"
          title={selectedFileName}
        >
          {selectedFileName}
        </span>

        <button
          type="button"
          className="text-danger-button"
          onClick={onRemoveCertificateFile}
        >
          Remove
        </button>
      </>
    )}
  </div>

  <span className="helper-text">
    PDF, PNG, JPG or WEBP • Max 10 MB
  </span>

  {errors.certificateFile && (
    <span className="error-message">
      {errors.certificateFile}
    </span>
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