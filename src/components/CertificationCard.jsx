import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  downloadCertificationFile,
} from "../utils/certificationFilesDb";

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CertificationCard({
  certification,
  certificateFile,
  onEdit,
  onRequestDelete,
}) {
  const [previewUrl, setPreviewUrl] =
    useState("");

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuRef = useRef(null);

  const isImage =
    certificateFile?.type?.startsWith(
      "image/"
    );

  const isPdf =
    certificateFile?.type ===
    "application/pdf";

  useEffect(() => {
    if (!certificateFile?.blob) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(
        certificateFile.blob
      );

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [certificateFile]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const skills = Array.isArray(
    certification.skills
  )
    ? certification.skills
    : String(
        certification.skills || ""
      )
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  function handleDownload() {
    setIsMenuOpen(false);

    try {
      downloadCertificationFile(
        certificateFile
      );
    } catch (error) {
      window.alert(
        error.message ||
          "The certificate could not be downloaded."
      );
    }
  }

  function handleEdit() {
    setIsMenuOpen(false);
    onEdit(certification);
  }

  function handleDelete() {
    setIsMenuOpen(false);
    onRequestDelete(certification);
  }

  return (
    <article className="certification-card certification-card-clean">
      <div className="certification-card-top">
        <div>
          <p className="section-label">
            Certification
          </p>

          <h2>{certification.name}</h2>
        </div>

        <div
          className="certification-menu"
          ref={menuRef}
        >
          <button
            type="button"
            className="certification-menu-button"
            aria-label="Open certification actions"
            aria-expanded={isMenuOpen}
            onClick={() =>
              setIsMenuOpen(
                (current) => !current
              )
            }
          >
            <span aria-hidden="true">
              ⋮
            </span>
          </button>

          {isMenuOpen && (
            <div
              className="certification-menu-dropdown"
              role="menu"
            >
              {certificateFile && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDownload}
                >
                  Download certificate
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={handleEdit}
              >
                Edit certification
              </button>

              <button
                type="button"
                role="menuitem"
                className="certification-menu-delete"
                onClick={handleDelete}
              >
                Delete certification
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="certificate-preview certificate-preview-fit">
        {previewUrl && isImage ? (
          <button
            type="button"
            className="certificate-image-button"
            onClick={() =>
              window.open(
                previewUrl,
                "_blank",
                "noopener,noreferrer"
              )
            }
            aria-label={`Open ${certification.name} certificate`}
          >
            <img
              src={previewUrl}
              alt={`${certification.name} certificate`}
            />
          </button>
        ) : previewUrl && isPdf ? (
          <iframe
            src={previewUrl}
            title={`${certification.name} certificate`}
          />
        ) : (
          <div className="certificate-preview-placeholder">
            <span aria-hidden="true">
              ◈
            </span>

            <p>
              No certificate file uploaded
            </p>
          </div>
        )}
      </div>

      <div className="certification-details">
        <div className="certification-detail-row">
          <span>Issued by</span>

          <strong>
            {certification.issuer}
          </strong>
        </div>

        <div className="certification-detail-row">
          <span>Earned</span>

          <strong>
            {formatDate(
              certification.dateEarned
            )}
          </strong>
        </div>

        {skills.length > 0 && (
          <div className="certification-skills">
            <p>Skills gained</p>

            <div className="skill-list">
              {skills.map((skill) => (
                <span key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {certification.credentialUrl && (
          <a
            className="certification-credential-link"
            href={
              certification.credentialUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            View credential
          </a>
        )}
      </div>
    </article>
  );
}