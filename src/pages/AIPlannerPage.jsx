import { useMemo, useState } from "react";

const STORAGE_KEY = "ai-dashboard-study-plans";

function readPlans() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function distributeHours(totalHours, days) {
  const base = Math.floor((totalHours / days.length) * 10) / 10;
  let remaining = Math.round((totalHours - base * days.length) * 10) / 10;

  return days.map((day) => {
    const extra = remaining >= 0.1 ? 0.1 : 0;
    remaining = Math.max(0, Math.round((remaining - extra) * 10) / 10);
    return { day, hours: Math.round((base + extra) * 10) / 10 };
  });
}

function buildStudyPlan({ courses, goals, hoursPerWeek, targetDate, pace, focus }) {
  const activeCourses = courses.filter((course) => course.status !== "Completed");
  const selectedCourses = focus.length
    ? activeCourses.filter((course) =>
        focus.some((topic) =>
          `${course.title} ${course.category}`.toLowerCase().includes(topic.toLowerCase())
        )
      )
    : activeCourses;

  const planCourses = selectedCourses.length ? selectedCourses : activeCourses.length ? activeCourses : courses;
  const daysByPace = {
    Relaxed: ["Monday", "Wednesday", "Saturday"],
    Balanced: ["Monday", "Tuesday", "Thursday", "Saturday"],
    Intensive: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  };
  const days = daysByPace[pace] || daysByPace.Balanced;
  const scheduleHours = distributeHours(Number(hoursPerWeek), days);
  const sessions = scheduleHours.map((entry, index) => {
    const course = planCourses[index % Math.max(planCourses.length, 1)];
    const courseTitle = course?.title || "Core learning session";
    const remaining = course ? Math.max(0, 100 - Number(course.progress || 0)) : 100;

    return {
      ...entry,
      title: courseTitle,
      task:
        remaining > 60
          ? "Study the next core lesson and take structured notes."
          : remaining > 20
            ? "Complete the next module and practice the key concepts."
            : "Finish remaining lessons and complete a review or project task.",
    };
  });

  const today = new Date();
  const deadline = new Date(`${targetDate}T23:59:59`);
  const weeksAvailable = Math.max(1, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24 * 7)));
  const openGoals = goals.filter((goal) => !goal.completed);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    title: `${pace} Study Plan`,
    targetDate,
    hoursPerWeek: Number(hoursPerWeek),
    pace,
    focus,
    weeksAvailable,
    courseCount: planCourses.length,
    sessions,
    recommendations: [
      `Use ${Math.max(1, Math.round(Number(hoursPerWeek) * 0.15))} hour(s) each week for review and recall practice.`,
      openGoals.length
        ? `Prioritize your active goal: ${openGoals[0].title}.`
        : "Create one measurable weekly goal to keep the plan focused.",
      "Update course progress after each study session so future plans stay accurate.",
    ],
  };
}

function planToText(plan) {
  const lines = [
    plan.title,
    `Target date: ${plan.targetDate}`,
    `Study time: ${plan.hoursPerWeek} hours/week`,
    `Pace: ${plan.pace}`,
    "",
    "Weekly schedule",
    ...plan.sessions.flatMap((session) => [
      `${session.day}: ${session.title} (${session.hours} hours)`,
      `- ${session.task}`,
    ]),
    "",
    "Recommendations",
    ...plan.recommendations.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}

export default function AIPlannerPage({ courses, goals }) {
  const topics = useMemo(
    () =>
      [...new Set(courses.flatMap((course) => [course.category, course.title]).filter(Boolean))].slice(0, 10),
    [courses]
  );
  const [form, setForm] = useState({
    hoursPerWeek: 10,
    targetDate: getDefaultDate(),
    pace: "Balanced",
    focus: [],
  });
  const [plan, setPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState(readPlans);
  const [message, setMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  function toggleFocus(topic) {
    setForm((current) => ({
      ...current,
      focus: current.focus.includes(topic)
        ? current.focus.filter((item) => item !== topic)
        : [...current.focus, topic],
    }));
  }

  function generatePlan(event) {
    event.preventDefault();
    const nextPlan = buildStudyPlan({ ...form, courses, goals });
    setPlan(nextPlan);
    setMessage("Your personalized study plan is ready.");
  }

  function savePlan() {
    if (!plan) return;
    const nextPlans = [plan, ...savedPlans.filter((item) => item.id !== plan.id)];
    setSavedPlans(nextPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlans));
    setMessage("Plan saved to this browser.");
  }

  async function copyPlan() {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(planToText(plan));
      setMessage("Plan copied to your clipboard.");
    } catch {
      setMessage("Copy was blocked by the browser. Use Download instead.");
    }
  }

  function downloadPlan() {
    if (!plan) return;
    const blob = new Blob([planToText(plan)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-plan-${plan.targetDate}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Plan downloaded.");
  }

  function deleteSavedPlan(id) {
    const nextPlans = savedPlans.filter((item) => item.id !== id);
    setSavedPlans(nextPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlans));
    if (plan?.id === id) setPlan(null);
  }

  return (
    <main className="page-content ai-planner-page">
      <section className="page-heading">
        <div>
          <p className="section-label">Smart planning</p>
          <h1>AI Study Planner</h1>
          <p>Create a personalized weekly plan from your courses, goals, availability, and target date.</p>
        </div>
        <div className="ai-planner-badge" aria-label="Local personalized planning">
          <span aria-hidden="true">✦</span>
          Personalized planner
        </div>
      </section>

      <section className="ai-planner-layout">
        <form className="ai-planner-form panel-card" onSubmit={generatePlan}>
          <div>
            <p className="section-label">Preferences</p>
            <h2>Build your schedule</h2>
          </div>

          <label>
            Study hours per week
            <input
              type="number"
              name="hoursPerWeek"
              min="2"
              max="60"
              value={form.hoursPerWeek}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Target completion date
            <input
              type="date"
              name="targetDate"
              min={new Date().toISOString().slice(0, 10)}
              value={form.targetDate}
              onChange={updateField}
              required
            />
          </label>

          <fieldset className="planner-fieldset">
            <legend>Learning pace</legend>
            <div className="pace-options">
              {["Relaxed", "Balanced", "Intensive"].map((pace) => (
                <label key={pace} className="pace-option">
                  <input
                    type="radio"
                    name="pace"
                    value={pace}
                    checked={form.pace === pace}
                    onChange={updateField}
                  />
                  <span>{pace}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="planner-fieldset">
            <legend>Focus topics</legend>
            <p className="helper-text">Select topics or leave all unchecked to include every active course.</p>
            <div className="focus-options">
              {topics.length ? (
                topics.map((topic) => (
                  <label key={topic} className="focus-chip">
                    <input
                      type="checkbox"
                      checked={form.focus.includes(topic)}
                      onChange={() => toggleFocus(topic)}
                    />
                    <span>{topic}</span>
                  </label>
                ))
              ) : (
                <p className="helper-text">Add a course to create topic-based plans.</p>
              )}
            </div>
          </fieldset>

          <button type="submit" className="primary-button planner-generate-button">
            ✦ Generate Study Plan
          </button>
        </form>

        <section className="ai-plan-output panel-card" aria-live="polite">
          {!plan ? (
            <div className="planner-empty-state">
              <span aria-hidden="true">✦</span>
              <h2>Your plan will appear here</h2>
              <p>Choose your availability and learning pace, then generate a personalized weekly schedule.</p>
            </div>
          ) : (
            <>
              <div className="ai-plan-heading">
                <div>
                  <p className="section-label">Generated plan</p>
                  <h2>{plan.title}</h2>
                  <p>Designed for {plan.weeksAvailable} week{plan.weeksAvailable === 1 ? "" : "s"} until {plan.targetDate}.</p>
                </div>
                <span className="status status-in-progress">Ready</span>
              </div>

              <div className="planner-stat-grid">
                <div><strong>{plan.hoursPerWeek}</strong><span>Hours/week</span></div>
                <div><strong>{plan.courseCount}</strong><span>Courses included</span></div>
                <div><strong>{plan.weeksAvailable}</strong><span>Weeks available</span></div>
              </div>

              <div className="weekly-plan-list">
                {plan.sessions.map((session) => (
                  <article key={session.day} className="weekly-plan-card">
                    <div className="weekly-plan-day">
                      <strong>{session.day}</strong>
                      <span>{session.hours} hr{session.hours === 1 ? "" : "s"}</span>
                    </div>
                    <div>
                      <h3>{session.title}</h3>
                      <p>{session.task}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="planner-recommendations">
                <h3>Recommendations</h3>
                <ul>
                  {plan.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>

              <div className="form-actions planner-actions">
                <button type="button" className="primary-button" onClick={savePlan}>Save Plan</button>
                <button type="button" className="secondary-button" onClick={copyPlan}>Copy</button>
                <button type="button" className="secondary-button" onClick={downloadPlan}>Download</button>
              </div>
            </>
          )}
          {message && <p className="planner-message" role="status">{message}</p>}
        </section>
      </section>

      <section className="saved-plans-panel panel-card">
        <div className="section-title-row">
          <div>
            <p className="section-label">Plan history</p>
            <h2>Saved plans</h2>
          </div>
          <span className="panel-count">{savedPlans.length}</span>
        </div>

        {savedPlans.length ? (
          <div className="saved-plan-list">
            {savedPlans.map((savedPlan) => (
              <article key={savedPlan.id} className="saved-plan-card">
                <button type="button" className="saved-plan-open" onClick={() => setPlan(savedPlan)}>
                  <span>
                    <strong>{savedPlan.title}</strong>
                    <small>{savedPlan.hoursPerWeek} hours/week · Target {savedPlan.targetDate}</small>
                  </span>
                  <span aria-hidden="true">Open →</span>
                </button>
                <button
                  type="button"
                  className="danger-button compact-button"
                  onClick={() => deleteSavedPlan(savedPlan.id)}
                  aria-label={`Delete ${savedPlan.title}`}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="compact-empty-state">
            <span aria-hidden="true">☆</span>
            <h3>No saved plans yet</h3>
            <p>Generate and save a plan to keep it available in this browser.</p>
          </div>
        )}
      </section>
    </main>
  );
}
