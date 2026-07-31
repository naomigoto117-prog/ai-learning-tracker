import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseForm from "../components/CourseForm";
import { emptyCourseForm } from "../data/initialData";

export default function AddCoursePage({ onAddCourse }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyCourseForm);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "progress" ? Number(value) : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Course title is required.";
    }

    if (!form.platform.trim()) {
      nextErrors.platform = "Platform is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (form.progress < 0 || form.progress > 100) {
      nextErrors.progress =
        "Progress must be between 0 and 100.";
    }

    if (!form.deadline) {
      nextErrors.deadline =
        "Target completion date is required.";
    }

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAddCourse({
      ...form,
      id: crypto.randomUUID(),
    });

    navigate("/courses");
  }

  return (
    <main className="page-content">
      <section className="page-heading">
        <div>
          <p className="section-label">
            Course management
          </p>

          <h1>Add Course</h1>

          <p>
            Add a new AI course to your learning dashboard.
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
          />
        </div>
      </section>
    </main>
  );
}