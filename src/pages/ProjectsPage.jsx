import { useState } from "react";
import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";
import {
  emptyProjectForm,
} from "../data/initialData";

export default function ProjectsPage({
  projects = [],
  onSaveProject,
  onRequestDeleteProject,
}) {
  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [
    editingProject,
    setEditingProject,
  ] = useState(null);

  const [form, setForm] = useState({
    ...emptyProjectForm,
    techStack: [
      ...(emptyProjectForm.techStack ||
        []),
    ],
  });

  const [errors, setErrors] =
    useState({});

  function createEmptyForm() {
    return {
      ...emptyProjectForm,
      techStack: [
        ...(emptyProjectForm.techStack ||
          []),
      ],
    };
  }

  function openCreateForm() {
    setEditingProject(null);
    setForm(createEmptyForm());
    setErrors({});
    setIsFormOpen(true);
  }

  function openEditForm(project) {
    const normalizedTechStack =
      Array.isArray(project.techStack)
        ? project.techStack
        : String(
            project.techStack || ""
          )
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean);

    setEditingProject(project);

    setForm({
      ...emptyProjectForm,
      ...project,
      techStack: normalizedTechStack,
    });

    setErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProject(null);
    setForm(createEmptyForm());
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

  function handleAddTech(technology) {
    const cleanTechnology =
      technology.trim();

    if (!cleanTechnology) {
      return;
    }

    setForm((current) => {
      const currentTechStack =
        Array.isArray(
          current.techStack
        )
          ? current.techStack
          : [];

      const alreadyExists =
        currentTechStack.some(
          (item) =>
            item.toLowerCase() ===
            cleanTechnology.toLowerCase()
        );

      if (alreadyExists) {
        return current;
      }

      return {
        ...current,
        techStack: [
          ...currentTechStack,
          cleanTechnology,
        ],
      };
    });

    setErrors((current) => ({
      ...current,
      techStack: "",
    }));
  }

  function handleRemoveTech(
    technology
  ) {
    setForm((current) => ({
      ...current,
      techStack: Array.isArray(
        current.techStack
      )
        ? current.techStack.filter(
            (item) =>
              item !== technology
          )
        : [],
    }));
  }

  function isCompleteUrl(value) {
    return /^https?:\/\/.+/i.test(
      value
    );
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title =
        "Project title is required.";
    }

    if (!form.description.trim()) {
      nextErrors.description =
        "Project description is required.";
    }

    if (
      form.liveUrl.trim() &&
      !isCompleteUrl(
        form.liveUrl.trim()
      )
    ) {
      nextErrors.liveUrl =
        "Enter a complete URL starting with http:// or https://.";
    }

    if (
      form.githubUrl.trim() &&
      !isCompleteUrl(
        form.githubUrl.trim()
      )
    ) {
      nextErrors.githubUrl =
        "Enter a complete URL starting with http:// or https://.";
    }

    if (
      !Array.isArray(
        form.techStack
      ) ||
      form.techStack.length === 0
    ) {
      nextErrors.techStack =
        "Add at least one technology.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors =
      validateForm();

    if (
      Object.keys(nextErrors).length >
      0
    ) {
      setErrors(nextErrors);
      return;
    }

    const projectToSave = {
      ...form,
      id:
        editingProject?.id ||
        crypto.randomUUID(),
      title: form.title.trim(),
      liveUrl:
        form.liveUrl.trim(),
      githubUrl:
        form.githubUrl.trim(),
      description:
        form.description.trim(),
      techStack: form.techStack,
    };

    onSaveProject(projectToSave);
    closeForm();
  }

  return (
    <main className="page-content">
      <section className="page-heading">
        <div>
          <p className="section-label">
            Portfolio
          </p>

          <h1>Projects</h1>

          <p>
            Showcase the projects you
            have built, the technologies
            you used, and the links to
            your live application and
            source code.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + Add Project
        </button>
      </section>

      {isFormOpen && (
        <section className="project-form-panel">
          <div className="section-title-row">
            <div>
              <p className="section-label">
                Project details
              </p>

              <h2>
                {editingProject
                  ? "Edit Project"
                  : "Add Project"}
              </h2>
            </div>
          </div>

          <ProjectForm
            form={form}
            errors={errors}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            onAddTech={
              handleAddTech
            }
            onRemoveTech={
              handleRemoveTech
            }
            submitLabel={
              editingProject
                ? "Save Changes"
                : "Add Project"
            }
          />
        </section>
      )}

      <section className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state full-width-empty">
            <div
              className="empty-project-icon"
              aria-hidden="true"
            >
              &lt;/&gt;
            </div>

            <h2>
              No projects added yet
            </h2>

            <p>
              Add your first project to
              start building your
              portfolio.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={openCreateForm}
            >
              Add Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditForm}
              onRequestDelete={
                onRequestDeleteProject
              }
            />
          ))
        )}
      </section>
    </main>
  );
}