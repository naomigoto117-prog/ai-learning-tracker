import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import CourseForm from "../components/CourseForm";
import { emptyCourseForm } from "../data/initialData";

function statusFromProgress(progress) {
  const numericProgress = Number(progress);

  if (numericProgress >= 100) {
    return "Completed";
  }

  if (numericProgress > 0) {
    return "In Progress";
  }

  return "Not Started";
}

export default function CourseFormPage({
  courses = [],
  onAddCourse,
  onUpdateCourse,
}) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(courseId);

  const existingCourse = courses.find(
    (course) =>
      String(course.id) === String(courseId)
  );

  const [form, setForm] = useState(() =>
    existingCourse
      ? {
          ...emptyCourseForm,
          ...existingCourse,
          notes: Array.isArray(
            existingCourse.notes
          )
            ? existingCourse.notes
            : [],
          favorite: Boolean(
            existingCourse.favorite
          ),
          url: existingCourse.url || "",
        }
      : {
          ...emptyCourseForm,
        }
  );

  const [errors, setErrors] =
    useState({});

  if (isEditing && !existingCourse) {
    return (
      <main className="page-content">
        <section className="empty-state full-width-empty">
          <h1>Course not found</h1>

          <p>
            The course you are trying to
            edit does not exist.
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

  function handleChange(event) {
    const { name, value } = event.target;

    const nextValue =
      name === "progress"
        ? Number(value)
        : value;

    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: nextValue,
      };

      if (name === "progress") {
        nextForm.status =
          statusFromProgress(nextValue);
      }

      return nextForm;
    });

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title =
        "Course title is required.";
    }

    if (!form.platform.trim()) {
      nextErrors.platform =
        "Platform is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category =
        "Category is required.";
    }

    if (
      Number(form.progress) < 0 ||
      Number(form.progress) > 100
    ) {
      nextErrors.progress =
        "Progress must be between 0 and 100.";
    }

    if (!form.deadline) {
      nextErrors.deadline =
        "Target completion date is required.";
    }

    if (
      form.url &&
      !/^https?:\/\//i.test(form.url)
    ) {
      nextErrors.url =
        "Enter a complete link starting with http:// or https://.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors =
      validateForm();

    if (
      Object.keys(nextErrors).length > 0
    ) {
      setErrors(nextErrors);
      return;
    }

    const normalizedCourse = {
      ...form,
      progress: Number(form.progress),
      status: statusFromProgress(
        form.progress
      ),
    };

    if (isEditing) {
      onUpdateCourse(
        normalizedCourse
      );
    } else {
      onAddCourse({
        ...normalizedCourse,
        id: crypto.randomUUID(),
      });
    }

    navigate("/courses");
  }

  return (
    <main className="page-content">
      <section className="page-heading">
        <div>
          <p className="section-label">
            Course management
          </p>

          <h1>
            {isEditing
              ? "Edit Course"
              : "Add Course"}
          </h1>

          <p>
            {isEditing
              ? "Update course information and progress."
              : "Add a new AI course to your learning dashboard."}
          </p>
        </div>
      </section>

      <section className="add-course-page add-course-page-single">
        <div className="add-course-form-wrapper">
          <CourseForm
            form={form}
            errors={errors}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel={
              isEditing
                ? "Save Changes"
                : "Add Course"
            }
          />
        </div>
      </section>
    </main>
  );
}