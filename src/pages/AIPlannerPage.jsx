import { useEffect, useMemo, useState } from "react";
const STUDY_PLAN_STORAGE_KEY = "aiStudyPlan";
const SAVED_PLANS_STORAGE_KEY = "aiStudyPlans";

import "./AIPlannerPage.css";

function readStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
  }
}

function getCourseUrl(course) {
  return (
    course?.url ||
    course?.sourceUrl ||
    course?.courseUrl ||
    course?.link ||
    ""
  );
}

function isCourseCompleted(course) {
  return (
    String(course?.status || "").toLowerCase() === "completed" ||
    Number(course?.progress || 0) >= 100
  );
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
}

export default function AIPlannerPage({ courses = [], goals = [] }) {
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(8);
  const [targetDate, setTargetDate] = useState("");
  const [pace, setPace] = useState("Balanced");
  const [plan, setPlan] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSavedPlansOpen, setIsSavedPlansOpen] = useState(false);

  useEffect(() => {
    const savedPlan = readStorage(STUDY_PLAN_STORAGE_KEY, null);
    const storedPlans = readStorage(SAVED_PLANS_STORAGE_KEY, []);

    if (savedPlan && typeof savedPlan === "object") {
      setPlan(savedPlan);
      setExpandedSessionId(savedPlan.sessions?.[0]?.id || null);
    }

    setSavedPlans(Array.isArray(storedPlans) ? storedPlans : []);
  }, []);

  const activeCourses = useMemo(() => {
    const courseList = Array.isArray(courses) ? courses : [];
    return courseList.filter((course) => !isCourseCompleted(course));
  }, [courses]);

  const selectedCourses = useMemo(() => {
    if (selectedCourseIds.length === 0) return activeCourses;

    return activeCourses.filter((course) =>
      selectedCourseIds.includes(String(course.id))
    );
  }, [activeCourses, selectedCourseIds]);

  const selectedCoursesWithLinks = useMemo(
    () => selectedCourses.filter((course) => Boolean(getCourseUrl(course))),
    [selectedCourses]
  );

  function toggleCourse(courseId) {
    const normalizedId = String(courseId);

    setSelectedCourseIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds.filter((id) => id !== normalizedId)
        : [...currentIds, normalizedId]
    );
  }

  function selectAllCourses() {
    setSelectedCourseIds(activeCourses.map((course) => String(course.id)));
  }

  function toggleSession(sessionId) {
    setExpandedSessionId((currentId) =>
      currentId === sessionId ? null : sessionId
    );
  }

  function persistCurrentPlan(nextPlan) {
    setPlan(nextPlan);
    saveToStorage(STUDY_PLAN_STORAGE_KEY, nextPlan);

    setSavedPlans((currentPlans) => {
      const nextPlans = currentPlans.map((savedPlan) =>
        savedPlan.id === nextPlan.id ? nextPlan : savedPlan
      );
      saveToStorage(SAVED_PLANS_STORAGE_KEY, nextPlans);
      return nextPlans;
    });
  }

  function saveCurrentPlan() {
    if (!plan) return;

    const planToSave = {
      ...plan,
      savedAt: new Date().toISOString(),
      sessions: Array.isArray(plan.sessions)
        ? plan.sessions.map((session) => ({
            ...session,
            completed: Boolean(session.completed),
          }))
        : [],
    };

    setSavedPlans((currentPlans) => {
      const exists = currentPlans.some((savedPlan) => savedPlan.id === planToSave.id);
      const nextPlans = exists
        ? currentPlans.map((savedPlan) =>
            savedPlan.id === planToSave.id ? planToSave : savedPlan
          )
        : [planToSave, ...currentPlans];
      saveToStorage(SAVED_PLANS_STORAGE_KEY, nextPlans);
      return nextPlans;
    });

    setPlan(planToSave);
    saveToStorage(STUDY_PLAN_STORAGE_KEY, planToSave);
    setNotice("Study plan saved. You can open it again from Saved Plans.");
  }

  function openSavedPlan(savedPlan) {
    setPlan(savedPlan);
    setExpandedSessionId(savedPlan.sessions?.[0]?.id || null);
    saveToStorage(STUDY_PLAN_STORAGE_KEY, savedPlan);
    setIsSavedPlansOpen(false);
    setError("");
    setNotice("Saved study plan opened.");
  }

  function deleteSavedPlan(planId) {
    setSavedPlans((currentPlans) => {
      const nextPlans = currentPlans.filter((savedPlan) => savedPlan.id !== planId);
      saveToStorage(SAVED_PLANS_STORAGE_KEY, nextPlans);
      return nextPlans;
    });
  }

  function toggleSessionCompleted(sessionId) {
    if (!plan) return;

    const nextPlan = {
      ...plan,
      sessions: (Array.isArray(plan.sessions) ? plan.sessions : []).map(
        (session, index) => {
          const currentSessionId = session.id ?? `session-${index}`;
          return currentSessionId === sessionId
            ? { ...session, completed: !Boolean(session.completed) }
            : session;
        }
      ),
    };

    persistCurrentPlan(nextPlan);
  }

  async function handleGeneratePlan(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (activeCourses.length === 0) {
      setError("Add at least one active course before generating a plan.");
      return;
    }

    if (!targetDate) {
      setError("Choose a target completion date.");
      return;
    }

    const numericHours = Number(hoursPerWeek);

    if (!Number.isFinite(numericHours) || numericHours < 2 || numericHours > 60) {
      setError("Study hours must be between 2 and 60 hours per week.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses: selectedCourses,
          goals: Array.isArray(goals) ? goals : [],
          hoursPerWeek: numericHours,
          targetDate,
          pace,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "The AI study plan could not be generated.");
      }

      if (!data?.plan) {
        throw new Error("The server did not return a study plan.");
      }

      const generatedPlan = {
        ...data.plan,
        sessions: Array.isArray(data.plan.sessions)
          ? data.plan.sessions.map((session) => ({ ...session, completed: false }))
          : [],
      };

      setPlan(generatedPlan);
      setExpandedSessionId(generatedPlan.sessions?.[0]?.id || null);
      saveToStorage(STUDY_PLAN_STORAGE_KEY, generatedPlan);

      setNotice(
        data.plan.usedUrlContext
          ? "Gemini analyzed the available public course pages."
          : "The plan was created from your saved course information. Add public course links for lesson-specific planning."
      );
    } catch (requestError) {
      console.error("Study-plan request failed:", requestError);
      setError(requestError?.message || "The study plan could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  }

  function clearPlan() {
    setPlan(null);
    setExpandedSessionId(null);
    setError("");
    setNotice("");
    localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
  }

  return (
    <main className="page-content ai-planner-page">
      <section className="planner-hero">
        <div>
          <span className="planner-eyebrow">Gemini learning assistant</span>
          <h1>AI Study Planner</h1>
          <p>
            Generate a personalized schedule using the courses already saved in
            your dashboard. Gemini can inspect public course pages and recommend
            lessons, practice tasks, projects, and review sessions.
          </p>
        </div>

        <span className="planner-model-badge">✦ Powered by Gemini</span>
      </section>

      <section className="saved-plans-toolbar">
        <div>
          <p className="section-label">Plan history</p>
          <h2>Saved Plans</h2>
          <p>Save a generated plan, reopen it later, and keep track of completed sessions.</p>
        </div>

        <button
          type="button"
          className="saved-plans-toggle"
          onClick={() => setIsSavedPlansOpen((current) => !current)}
          aria-expanded={isSavedPlansOpen}
        >
          Saved Plans
          <span className="saved-plans-count">{savedPlans.length}</span>
        </button>
      </section>

      {isSavedPlansOpen && (
        <section className="saved-plans-panel">
          {savedPlans.length === 0 ? (
            <div className="saved-plans-empty">
              <h3>No saved plans yet</h3>
              <p>Generate a study plan and select Save Plan.</p>
            </div>
          ) : (
            <div className="saved-plans-list">
              {savedPlans.map((savedPlan) => {
                const completedCount = Array.isArray(savedPlan.sessions)
                  ? savedPlan.sessions.filter((session) => session.completed).length
                  : 0;
                const totalCount = Array.isArray(savedPlan.sessions)
                  ? savedPlan.sessions.length
                  : 0;

                return (
                  <article className="saved-plan-card" key={savedPlan.id}>
                    <div>
                      <h3>{savedPlan.title || "Saved Study Plan"}</h3>
                      <p>
                        {savedPlan.hoursPerWeek || 0} hours weekly ·{" "}
                        {savedPlan.pace || "Balanced"} pace
                      </p>
                      <span>{completedCount} of {totalCount} sessions completed</span>
                    </div>

                    <div className="saved-plan-actions">
                      <button
                        type="button"
                        className="saved-plan-open"
                        onClick={() => openSavedPlan(savedPlan)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="saved-plan-delete"
                        onClick={() => deleteSavedPlan(savedPlan.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="planner-layout">
        <form className="planner-form-card" onSubmit={handleGeneratePlan}>
          <div className="planner-section-heading">
            <div>
              <span className="section-number">1</span>
              <div>
                <h2>Focus courses</h2>
                <p>Select specific courses or use all active courses.</p>
              </div>
            </div>

            {activeCourses.length > 0 && (
              <div className="course-selection-actions">
                <button type="button" className="flat-button" onClick={selectAllCourses}>
                  Select all
                </button>
          
              </div>
            )}
          </div>

          {activeCourses.length === 0 ? (
            <div className="planner-empty-state">
              <h3>No active courses</h3>
              <p>Add a course before generating an AI study plan.</p>
            </div>
          ) : (
            <div className="focus-course-grid">
              {activeCourses.map((course) => {
                const courseId = String(course.id);
                const isSelected = selectedCourseIds.includes(courseId);
                const courseUrl = getCourseUrl(course);

                return (
                  <label
                    key={courseId}
                    className={`focus-course-card ${isSelected ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourse(courseId)}
                    />
                    <span className="custom-checkbox">{isSelected ? "✓" : ""}</span>
                    <span className="focus-course-content">
                      <strong>{course.title || "Untitled course"}</strong>
                      <span className="focus-course-meta">
                        {course.platform || "Unknown platform"} · {Number(course.progress || 0)}% complete
                      </span>
                      <span className={`source-status ${courseUrl ? "available" : "missing"}`}>
                        {courseUrl ? "Public source available" : "No source link"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <p className="planner-field-help">
            Leave every course unchecked to include all active courses automatically.
          </p>

          <div className="planner-divider" />

          <div className="planner-section-heading">
            <div>
              <span className="section-number">2</span>
              <div>
                <h2>Study preferences</h2>
                <p>Set your weekly availability, target date, and learning pace.</p>
              </div>
            </div>
          </div>

          <div className="planner-form-grid">
            <label className="planner-field">
              <span>Hours per week</span>
              <input
                type="number"
                min="2"
                max="60"
                value={hoursPerWeek}
                onChange={(event) => setHoursPerWeek(event.target.value)}
                required
              />
            </label>

            <label className="planner-field">
              <span>Target date</span>
              <input
                type="date"
                min={getTodayDate()}
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                required
              />
            </label>

            <label className="planner-field planner-field-full">
              <span>Learning pace</span>
              <select value={pace} onChange={(event) => setPace(event.target.value)}>
                <option value="Relaxed">Relaxed — 3 study sessions</option>
                <option value="Balanced">Balanced — 4 study sessions</option>
                <option value="Intensive">Intensive — 6 study sessions</option>
              </select>
            </label>
          </div>

          <div className="planner-summary">
            <span>Courses: <strong>{selectedCourses.length}</strong></span>
            <span>Public sources: <strong>{selectedCoursesWithLinks.length}</strong></span>
          </div>

          {error && (
            <div className="planner-message error-message">
              <strong>Unable to generate plan</strong>
              <span>{error}</span>
            </div>
          )}

          {notice && <div className="planner-message success-message">{notice}</div>}

          <button
            type="submit"
            className="generate-plan-button"
            disabled={isGenerating || activeCourses.length === 0}
          >
            {isGenerating
              ? "Gemini is analyzing your courses..."
              : plan
                ? "Regenerate Study Plan"
                : "Generate Study Plan"}
          </button>

          {isGenerating && (
            <div className="generation-progress">
              <span>Reviewing course progress</span>
              <span>Reading public course pages</span>
              <span>Identifying lessons and projects</span>
              <span>Balancing your weekly schedule</span>
            </div>
          )}
        </form>

        <section className="study-plan-panel">
          {!plan ? (
            <div className="planner-placeholder">
              <span className="placeholder-icon">✦</span>
              <h2>Your personalized plan will appear here</h2>
              <p>
                Choose your courses and study preferences, then generate a
                source-based schedule.
              </p>
            </div>
          ) : (
            <div className="generated-plan">
              <header className="generated-plan-header">
                <div>
                  <span className="ai-generated-badge">AI generated</span>
                  <h2>{plan.title || "Personalized Study Plan"}</h2>
                  <p>
                    {plan.hoursPerWeek ?? hoursPerWeek} hours weekly · {plan.pace || pace} pace
                    {plan.weeksAvailable ? ` · ${plan.weeksAvailable} ${plan.weeksAvailable === 1 ? "week" : "weeks"}` : ""}
                  </p>
                  {plan.targetDate && <small>Target: {formatDate(plan.targetDate)}</small>}
                </div>

                <div className="generated-plan-actions">
  <button
    type="button"
    className="save-plan-button"
    onClick={saveCurrentPlan}
  >
    Save Plan
  </button>

  <button
    type="button"
    className="clear-plan-button"
    onClick={clearPlan}
  >
    Clear plan
  </button>
</div>
              </header>

              {Array.isArray(plan.aiInsights) && plan.aiInsights.length > 0 && (
                <section className="recommendations-card">
                  <h3>AI insights</h3>
                  <ul>
                    {plan.aiInsights.map((insight, index) => <li key={index}>{insight}</li>)}
                  </ul>
                </section>
              )}

              {Array.isArray(plan.sourceCourses) && plan.sourceCourses.length > 0 && (
                <section className="plan-source-summary">
                  <h3>Courses included</h3>
                  <div className="source-course-list">
                    {plan.sourceCourses.map((course, index) => (
                      <div key={course.id ?? index} className="source-course-item">
                        <span>{course.title || "Untitled course"}</span>
                        {course.sourceUrl ? (
                          <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer">
                            Open course ↗
                          </a>
                        ) : (
                          <small>Priority: {course.priorityScore ?? "N/A"}</small>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="plan-progress-summary">
                <strong>
                  {(Array.isArray(plan.sessions) ? plan.sessions : []).filter(
                    (session) => session.completed
                  ).length}{" "}
                  of{" "}
                  {(Array.isArray(plan.sessions) ? plan.sessions : []).length}{" "}
                  sessions completed
                </strong>
                <div className="plan-progress-track">
                  <span
                    style={{
                      width: `${
                        Array.isArray(plan.sessions) && plan.sessions.length > 0
                          ? Math.round(
                              (plan.sessions.filter((session) => session.completed).length /
                                plan.sessions.length) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="session-list">
                {(Array.isArray(plan.sessions) ? plan.sessions : []).map((session, index) => {
                  const sessionId = session.id ?? `session-${index}`;
                  const isExpanded = expandedSessionId === sessionId;

                  return (
                    <article
                      key={sessionId}
                      className={`study-session-card ${session.completed ? "completed" : ""}`}
                    >
                      <button
                        type="button"
                        className={`session-complete-button ${
                          session.completed ? "completed" : ""
                        }`}
                        onClick={() => toggleSessionCompleted(sessionId)}
                        aria-pressed={Boolean(session.completed)}
                      >
                        {session.completed ? "✓" : ""}
                      </button>

                      <span className="session-number">{index + 1}</span>

                      <div className="session-content">
                        <button
                          type="button"
                          className="session-toggle"
                          onClick={() => toggleSession(sessionId)}
                          aria-expanded={isExpanded}
                        >
                          <span className="session-top-row">
                            <span>
                              <span className="session-day">{session.day || `Session ${index + 1}`}</span>
                              <h3>{session.title || "Study session"}</h3>
                            </span>
                            <span className="session-duration">
                              {session.hours ?? 1} {Number(session.hours ?? 1) === 1 ? "hour" : "hours"} · {isExpanded ? "Hide" : "View"}
                            </span>
                          </span>
                        </button>

                        <p className="session-course">{session.courseTitle || "General study"}</p>
                        <p className="session-module">
                          {session.moduleTitle || "Continue the next available lesson"}
                        </p>

                        {isExpanded && (
                          <div className="session-expanded-content">
                            <p className="session-task">{session.task || "Complete the assigned lesson and review your notes."}</p>

                            {Array.isArray(session.activities) && session.activities.length > 0 && (
                              <ul className="session-activities">
                                {session.activities.map((activity, activityIndex) => (
                                  <li key={activityIndex}>{activity}</li>
                                ))}
                              </ul>
                            )}

                            {session.practiceProject && (
                              <div className="session-extra-box">
                                <strong>Practice project</strong>
                                <p>{session.practiceProject}</p>
                              </div>
                            )}

                            {session.quizPrompt && (
                              <div className="session-extra-box">
                                <strong>Knowledge check</strong>
                                <p>{session.quizPrompt}</p>
                              </div>
                            )}

                            {session.reason && (
                              <div className="session-extra-box">
                                <strong>Why Gemini selected this</strong>
                                <p>{session.reason}</p>
                              </div>
                            )}

                            {session.sourceUrl && (
                              <a
                                className="lesson-source-link"
                                href={session.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open lesson source ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {Array.isArray(plan.recommendations) && plan.recommendations.length > 0 && (
                <section className="recommendations-card">
                  <h3>Gemini recommendations</h3>
                  <ul>
                    {plan.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}