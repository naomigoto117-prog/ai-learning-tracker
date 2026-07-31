import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import GoalCard from "../components/GoalCard";

export default function HomePage({
  courses,
  goals,
  certifications,
  onToggleGoal,
  onEditGoal,
  onRequestDeleteGoal,
  onRequestDeleteCourse,
  onToggleFavorite,
}) {
  const completedCourses = courses.filter(
    (course) => course.status === "Completed"
  ).length;

  const stats = [
    {
      label: "Total Courses",
      value: courses.length,
      to: "/courses",
      className: "summary-card-courses",
    },
    {
      label: "Completed",
      value: completedCourses,
      to: "/courses/completed",
      className: "summary-card-completed",
    },
    {
      label: "Certifications",
      value: certifications.length,
      to: "/certifications",
      className: "summary-card-certifications",
    },
  ];

  return (
    <main className="page-content">
      <section className="hero-section">
        <p className="eyebrow">Personal Learning Hub</p>
        <h1>Welcome to your AI learning journey</h1>
        <p>
          Organize your goals, monitor your progress, and keep your
          certifications together in one focused workspace.
        </p>
      </section>

      <section className="summary-grid" aria-label="Learning summary">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className={`summary-card ${stat.className}`}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <span className="summary-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </section>

      <section className="home-section goals-section">
        <div className="section-title-row">
          <div>
            <p className="section-label">Learning planner</p>
            <h2>Goals</h2>
            <p>Plan, complete, and review your learning targets.</p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => onEditGoal(null)}
          >
            + Add Goal
          </button>
        </div>

        <div className="goal-board">
          {goals.length === 0 ? (
            <div className="empty-state full-width-empty">
              <h3>No goals yet</h3>
              <p>Create a goal to plan your next learning milestone.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => onEditGoal(null)}
              >
                Add Goal
              </button>
            </div>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onToggle={onToggleGoal}
                onEdit={onEditGoal}
                onRequestDelete={onRequestDeleteGoal}
              />
            ))
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="section-title-row">
          <div>
            <p className="section-label">Course library</p>
            <h2>My Courses</h2>
            <p>Continue your current AI learning activities.</p>
          </div>

          <Link to="/courses" className="secondary-link-button">
            View All Courses →
          </Link>
        </div>

        <div className="course-grid home-course-grid">
          {courses.length === 0 ? (
            <div className="empty-state full-width-empty">
              <h3>No courses yet</h3>
              <p>Add your first course to begin tracking progress.</p>
              <Link to="/courses/add" className="primary-link-button">
                Add Course
              </Link>
            </div>
          ) : (
            [...courses]
              .sort(
                (a, b) =>
                  Number(Boolean(b.favorite)) -
                  Number(Boolean(a.favorite))
              )
              .slice(0, 4)
              .map((course) => (
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