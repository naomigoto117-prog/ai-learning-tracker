import {
  useEffect,
  useState,
} from "react";
import CertificationCard from "../components/CertificationCard";
import CertificationForm from "../components/CertificationForm";
import { emptyCertificationForm } from "../data/initialData";
import {
  deleteCertificationFile,
  getAllCertificationFiles,
  getCertificationFile,
  saveCertificationFile,
} from "../utils/certificationFilesDb";

export default function CertificationsPage({
  certifications = [],
  onSaveCertification,
  onRequestDeleteCertification,
}) {
  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [
    editingCertification,
    setEditingCertification,
  ] = useState(null);

  const [form, setForm] = useState(
    emptyCertificationForm
  );

  const [errors, setErrors] =
    useState({});

  const [
    selectedCertificateFile,
    setSelectedCertificateFile,
  ] = useState(null);

  const [
    removeExistingFile,
    setRemoveExistingFile,
  ] = useState(false);

  const [
    certificationFiles,
    setCertificationFiles,
  ] = useState({});

  useEffect(() => {
    let isActive = true;

    getAllCertificationFiles()
      .then((files) => {
        if (isActive) {
          setCertificationFiles(files);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [certifications]);

  function openCreateForm() {
    setEditingCertification(null);
    setForm({
      ...emptyCertificationForm,
    });
    setSelectedCertificateFile(null);
    setRemoveExistingFile(false);
    setErrors({});
    setIsFormOpen(true);
  }

  function openEditForm(certification) {
    setEditingCertification(
      certification
    );

    setForm({
      ...emptyCertificationForm,
      ...certification,
      credentialUrl:
        certification.credentialUrl ||
        "",
      skills:
        certification.skills || "",
    });

    setSelectedCertificateFile(null);
    setRemoveExistingFile(false);
    setErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCertification(null);
    setForm({
      ...emptyCertificationForm,
    });
    setSelectedCertificateFile(null);
    setRemoveExistingFile(false);
    setErrors({});
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function handleCertificateFileChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        certificateFile:
          "Upload a PDF, PNG, JPG, JPEG, or WEBP file.",
      }));

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        certificateFile:
          "The certificate file must be 10 MB or smaller.",
      }));

      event.target.value = "";
      return;
    }

    setSelectedCertificateFile(file);
    setRemoveExistingFile(false);

    setErrors((current) => ({
      ...current,
      certificateFile: "",
    }));
  }

  function handleRemoveCertificateFile() {
    setSelectedCertificateFile(null);
    setRemoveExistingFile(true);

    setForm((current) => ({
      ...current,
      certificateFileName: "",
    }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name =
        "Certificate name is required.";
    }

    if (!form.issuer.trim()) {
      nextErrors.issuer =
        "Issuing organization is required.";
    }

    if (!form.dateEarned) {
      nextErrors.dateEarned =
        "Date earned is required.";
    }

    if (
      form.credentialUrl &&
      !/^https?:\/\/.+/i.test(
        form.credentialUrl
      )
    ) {
      nextErrors.credentialUrl =
        "Enter a complete URL starting with http:// or https://.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();

    if (
      Object.keys(nextErrors).length > 0
    ) {
      setErrors(nextErrors);
      return;
    }

    const certificationId =
      editingCertification?.id ||
      crypto.randomUUID();

    const normalizedCertification = {
      ...form,
      id: certificationId,
      certificateFileName:
        selectedCertificateFile?.name ||
        (removeExistingFile
          ? ""
          : form.certificateFileName ||
            certificationFiles[
              String(certificationId)
            ]?.name ||
            ""),
    };

    try {
      if (removeExistingFile) {
        await deleteCertificationFile(
          certificationId
        );
      }

      if (selectedCertificateFile) {
        await saveCertificationFile(
          certificationId,
          selectedCertificateFile
        );
      }

      onSaveCertification(
        normalizedCertification
      );

      const updatedFile =
        await getCertificationFile(
          certificationId
        );

      setCertificationFiles(
        (current) => ({
          ...current,
          [String(certificationId)]:
            updatedFile || undefined,
        })
      );

      closeForm();
    } catch (error) {
      console.error(error);

      setErrors((current) => ({
        ...current,
        certificateFile:
          "The certificate file could not be saved in this browser.",
      }));
    }
  }

  function handleRequestDelete(
    certification
  ) {
    onRequestDeleteCertification(
      certification
    );
  }

  const existingFormFile =
    editingCertification
      ? certificationFiles[
          String(
            editingCertification.id
          )
        ] || null
      : null;

  return (
    <main className="page-content">
      <section className="page-heading">
        <div>
          <p className="section-label">
            Achievements
          </p>

          <h1>Certifications</h1>

          <p>
            Record credentials and the
            skills you gain from each
            learning milestone.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + Add Certification
        </button>
      </section>

      {isFormOpen && (
        <section className="certification-form-panel">
          <div className="section-title-row">
            <div>
              <p className="section-label">
                Certificate details
              </p>

              <h2>
                {editingCertification
                  ? "Edit Certification"
                  : "Add Certification"}
              </h2>
            </div>
          </div>

          <CertificationForm
            form={form}
            errors={errors}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitLabel={
              editingCertification
                ? "Save Changes"
                : "Add Certification"
            }
            certificateFile={
              selectedCertificateFile ||
              (removeExistingFile
                ? null
                : existingFormFile)
            }
            onCertificateFileChange={
              handleCertificateFileChange
            }
            onRemoveCertificateFile={
              handleRemoveCertificateFile
            }
          />
        </section>
      )}

      <section className="certifications-grid">
        {certifications.length === 0 ? (
          <div className="empty-state full-width-empty">
            <div
              className="empty-certification-icon"
              aria-hidden="true"
            >
              ◈
            </div>

            <h2>
              No certifications added yet
            </h2>

            <p>
              Add your first certificate
              to start building your
              achievement record.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={openCreateForm}
            >
              Add Certification
            </button>
          </div>
        ) : (
          certifications.map(
            (certification) => (
              <CertificationCard
                key={certification.id}
                certification={
                  certification
                }
                certificateFile={
                  certificationFiles[
                    String(
                      certification.id
                    )
                  ] || null
                }
                onEdit={openEditForm}
                onRequestDelete={
                  handleRequestDelete
                }
              />
            )
          )
        )}
      </section>
    </main>
  );
}