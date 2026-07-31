import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";

export default function CoursesPage({
  courses,
  onRequestDeleteCourse,
  onToggleFavorite,
  initialFilter = "All",
  pageTitle = "All Courses",
}) {
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.platform.toLowerCase().includes(normalizedSearch) ||
        course.category.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        initialFilter === "All" || course.status === initialFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
  }, [courses, search, initialFilter]);

  const emptyMessage =
    initialFilter === "Completed"
      ? "No completed courses yet. Keep learning and update your progress when you finish a course."
      : initialFilter === "In Progress"
        ? "No courses are currently in progress. Add a course or update an existing course."
        : "No courses have been added yet.";

  return (
    <main className="page-content">
      <section className="page-heading">
        <div>
          <p className="section-label">Course library</p>
          <h1>{pageTitle}</h1>
          <p>Search, edit, and manage your AI learning courses.</p>
        </div>

        <Link to="/courses/add" className="primary-link-button">
          + Add Course
        </Link>
      </section>

      <section className="courses-page-panel">
        <div className="course-toolbar">
          <label className="search-field">
            <span className="sr-only">Search courses</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search courses..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <span className="result-count">
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state full-width-empty">
              <h3>No courses found</h3>
              <p>{emptyMessage}</p>
              <Link to="/courses/add" className="primary-link-button">
                Add Course
              </Link>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onRequestDelete={onRequestDeleteCourse}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
