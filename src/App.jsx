import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialCourses = [
  {
    id: 1,
    title: "Python for AI",
    platform: "freeCodeCamp",
    category: "Programming",
    progress: 60,
    status: "In Progress",
    deadline: "2026-08-15",
  },
  {
    id: 2,
    title: "Introduction to Generative AI",
    platform: "Google Cloud",
    category: "Generative AI",
    progress: 100,
    status: "Completed",
    deadline: "2026-07-20",
  },
];

const initialGoals = [
  {
    id: 1,
    title: "Complete one AI course",
    deadline: "2026-08-30",
  },
];

function App() {
  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem("ai-dashboard-courses");
    return savedCourses ? JSON.parse(savedCourses) : initialCourses;
  });

  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem("ai-dashboard-goals");
    return savedGoals ? JSON.parse(savedGoals) : initialGoals;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ai-dashboard-theme") || "light";
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [courseForm, setCourseForm] = useState({
    title: "",
    platform: "",
    category: "",
    progress: 0,
    status: "Not Started",
    deadline: "",
  });

  const [goalForm, setGoalForm] = useState({
    title: "",
    deadline: "",
  });

  useEffect(() => {
    localStorage.setItem("ai-dashboard-courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("ai-dashboard-goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("ai-dashboard-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.platform.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || course.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const completedCourses = courses.filter(
    (course) => course.status === "Completed"
  ).length;

  const inProgressCourses = courses.filter(
    (course) => course.status === "In Progress"
  ).length;

  const averageProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((total, course) => total + Number(course.progress), 0) /
            courses.length
        )
      : 0;

  function handleCourseChange(event) {
    const { name, value } = event.target;

    setCourseForm((current) => ({
      ...current,
      [name]: name === "progress" ? Number(value) : value,
    }));
  }

  function handleGoalChange(event) {
    const { name, value } = event.target;

    setGoalForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function addCourse(event) {
    event.preventDefault();

    if (
      !courseForm.title.trim() ||
      !courseForm.platform.trim() ||
      !courseForm.category.trim() ||
      !courseForm.deadline
    ) {
      alert("Please complete all course fields.");
      return;
    }

    const newCourse = {
      ...courseForm,
      id: Date.now(),
    };

    setCourses((current) => [newCourse, ...current]);

    setCourseForm({
      title: "",
      platform: "",
      category: "",
      progress: 0,
      status: "Not Started",
      deadline: "",
    });
  }

  function addGoal(event) {
    event.preventDefault();

    if (!goalForm.title.trim() || !goalForm.deadline) {
      alert("Please complete all goal fields.");
      return;
    }

    const newGoal = {
      ...goalForm,
      id: Date.now(),
    };

    setGoals((current) => [newGoal, ...current]);

    setGoalForm({
      title: "",
      deadline: "",
    });
  }

  function deleteCourse(id) {
    setCourses((current) => current.filter((course) => course.id !== id));
  }

  function deleteGoal(id) {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal Learning Hub</p>
          <h1>AI Learning Dashboard</h1>
        </div>

        <button
          className="theme-button"
          type="button"
          onClick={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </header>

      <main>
        <section className="stats-grid" aria-label="Learning statistics">
          <article className="stat-card">
            <span>Total Courses</span>
            <strong>{courses.length}</strong>
          </article>

          <article className="stat-card">
            <span>In Progress</span>
            <strong>{inProgressCourses}</strong>
          </article>

          <article className="stat-card">
            <span>Completed</span>
            <strong>{completedCourses}</strong>
          </article>

          <article className="stat-card">
            <span>Average Progress</span>
            <strong>{averageProgress}%</strong>
          </article>
        </section>

        <section className="content-grid">
          <div className="panel">
            <h2>Add Course</h2>

            <form onSubmit={addCourse} className="form-grid">
              <label>
                Course title
                <input
                  name="title"
                  value={courseForm.title}
                  onChange={handleCourseChange}
                  placeholder="Example: Machine Learning Basics"
                />
              </label>

              <label>
                Platform
                <input
                  name="platform"
                  value={courseForm.platform}
                  onChange={handleCourseChange}
                  placeholder="Example: Coursera"
                />
              </label>

              <label>
                Category
                <input
                  name="category"
                  value={courseForm.category}
                  onChange={handleCourseChange}
                  placeholder="Example: Machine Learning"
                />
              </label>

              <label>
                Progress
                <input
                  type="number"
                  name="progress"
                  min="0"
                  max="100"
                  value={courseForm.progress}
                  onChange={handleCourseChange}
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={courseForm.status}
                  onChange={handleCourseChange}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <label>
                Target completion date
                <input
                  type="date"
                  name="deadline"
                  value={courseForm.deadline}
                  onChange={handleCourseChange}
                />
              </label>

              <button className="primary-button" type="submit">
                Add Course
              </button>
            </form>
          </div>

          <div className="panel">
            <h2>Add Learning Goal</h2>

            <form onSubmit={addGoal} className="form-grid">
              <label>
                Goal title
                <input
                  name="title"
                  value={goalForm.title}
                  onChange={handleGoalChange}
                  placeholder="Example: Study five hours this week"
                />
              </label>

              <label>
                Deadline
                <input
                  type="date"
                  name="deadline"
                  value={goalForm.deadline}
                  onChange={handleGoalChange}
                />
              </label>

              <button className="primary-button" type="submit">
                Add Goal
              </button>
            </form>

            <div className="goal-list">
              {goals.length === 0 ? (
                <p className="empty-state">No learning goals yet.</p>
              ) : (
                goals.map((goal) => (
                  <article className="goal-card" key={goal.id}>
                    <div>
                      <h3>{goal.title}</h3>
                      <p>Deadline: {goal.deadline}</p>
                    </div>

                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="panel course-section">
          <div className="section-header">
            <div>
              <h2>My Courses</h2>
              <p>Track and review your active AI learning courses.</p>
            </div>

            <div className="filters">
              <input
                type="search"
                placeholder="Search courses"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search courses"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter courses by status"
              >
                <option>All</option>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="course-grid">
            {filteredCourses.length === 0 ? (
              <p className="empty-state">No courses match your search.</p>
            ) : (
              filteredCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div className="course-card-header">
                    <div>
                      <span className="category">{course.category}</span>
                      <h3>{course.title}</h3>
                      <p>{course.platform}</p>
                    </div>

                    <span className="status">{course.status}</span>
                  </div>

                  <div className="progress-row">
                    <span>Progress</span>
                    <strong>{course.progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>

                  <p className="deadline">
                    Target date: {course.deadline}
                  </p>

                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => deleteCourse(course.id)}
                  >
                    Delete Course
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;