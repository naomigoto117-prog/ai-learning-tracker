import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Route,
  Routes,
} from "react-router-dom";

import Header from "./components/Header";
import ConfirmModal from "./components/ConfirmModal";
import GoalForm from "./components/GoalForm";

import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseFormPage from "./pages/CourseFormPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import CertificationsPage from "./pages/CertificationsPage";
import ProjectsPage from "./pages/ProjectsPage";
import AIPlannerPage from "./pages/AIPlannerPage";
import NotesPage from "./pages/NotesPage";
import NoteReaderPage from "./pages/NoteReaderPage";
import NotFoundPage from "./pages/NotFoundPage";

import {
  emptyGoalForm,
  initialCertifications,
  initialCourses,
  initialGoals,
  initialProjects,
} from "./data/initialData";

import "./App.css";


const DEMO_ACTIVE_KEY = "ai-dashboard-demo-active";
const DEMO_BACKUP_KEY = "ai-dashboard-demo-backup";

const DEMO_DATA = {
  courses: [
    {
      id: "demo-course-python",
      title: "Scientific Computing with Python",
      platform: "freeCodeCamp",
      category: "Programming",
      progress: 60,
      status: "In Progress",
      deadline: "2026-09-15",
      url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
      favorite: true,
      description:
        "Build a strong Python foundation through practical scientific-computing projects.",
      notes: [
        {
          id: "demo-note-python-functions",
          title: "Python functions and modules",
          content:
            "Review function parameters, return values, imports, modules, and exception handling before the next practice session.",
          createdAt: "2026-07-29T09:00:00.000Z",
          updatedAt: "2026-07-29T09:00:00.000Z",
        },
      ],
      isDemo: true,
    },
    {
      id: "demo-course-generative-ai",
      title: "Introduction to Generative AI",
      platform: "Google Cloud Skills Boost",
      category: "Artificial Intelligence",
      progress: 35,
      status: "In Progress",
      deadline: "2026-09-30",
      url: "https://www.cloudskillsboost.google/paths/118",
      favorite: false,
      description:
        "Learn core generative-AI concepts, responsible AI principles, and practical applications.",
      notes: [
        {
          id: "demo-note-prompting",
          title: "Prompt design checklist",
          content:
            "Define the role, task, context, constraints, expected format, and evaluation criteria before testing a prompt.",
          createdAt: "2026-07-30T09:00:00.000Z",
          updatedAt: "2026-07-30T09:00:00.000Z",
        },
      ],
      isDemo: true,
    },
    {
      id: "demo-course-accessibility",
      title: "Accessible React Components",
      platform: "Independent Study",
      category: "Frontend Development",
      progress: 100,
      status: "Completed",
      deadline: "2026-08-20",
      url: "https://react.dev/learn",
      favorite: true,
      description:
        "Practice semantic HTML, keyboard navigation, focus management, and accessible React patterns.",
      notes: [],
      isDemo: true,
    },
  ],
  goals: [
    {
      id: "demo-goal-ai-course",
      title: "Complete one AI course",
      deadline: "2026-09-30",
      completed: false,
      isDemo: true,
    },
    {
      id: "demo-goal-project",
      title: "Ship an AI-enhanced portfolio project",
      deadline: "2026-10-15",
      completed: false,
      isDemo: true,
    },
    {
      id: "demo-goal-accessibility",
      title: "Complete an accessibility review",
      deadline: "2026-08-20",
      completed: true,
      isDemo: true,
    },
  ],
  certifications: [
    {
      id: "demo-cert-responsive-web-design",
      title: "Responsive Web Design",
      issuer: "freeCodeCamp",
      dateEarned: "2026-07-20",
      credentialUrl: "https://www.freecodecamp.org/",
      description:
        "Portfolio demonstration credential for responsive layouts, semantic HTML, and accessibility fundamentals.",
      isDemo: true,
    },
    {
      id: "demo-cert-ai-fundamentals",
      title: "AI Fundamentals",
      issuer: "IBM SkillsBuild",
      dateEarned: "2026-07-28",
      credentialUrl: "https://skillsbuild.org/",
      description:
        "Portfolio demonstration credential covering foundational AI concepts and responsible use.",
      isDemo: true,
    },
  ],
  projects: [
    {
      id: "demo-project-ai-dashboard",
      title: "AI Learning Dashboard",
      description:
        "A responsive learning tracker with course progress, goals, notes, portfolio projects, certifications, and Gemini-powered study plans.",
      techStack: ["React", "Vite", "Gemini API", "Vercel"],
      liveUrl: "",
      githubUrl: "",
      isDemo: true,
    },
    {
      id: "demo-project-accessible-components",
      title: "Accessible Components Playground",
      description:
        "A small React application demonstrating keyboard-friendly forms, dialogs, menus, and focus states.",
      techStack: ["React", "CSS", "Accessibility"],
      liveUrl: "",
      githubUrl: "",
      isDemo: true,
    },
  ],
};


function readStorage(key, fallback) {
  try {
    const savedValue =
      localStorage.getItem(key);

    return savedValue
      ? JSON.parse(savedValue)
      : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [courses, setCourses] =
    useState(() =>
      readStorage(
        "ai-dashboard-courses",
        initialCourses
      )
    );

  const [goals, setGoals] =
    useState(() =>
      readStorage(
        "ai-dashboard-goals",
        initialGoals
      )
    );

  const [
    certifications,
    setCertifications,
  ] = useState(() =>
    readStorage(
      "ai-dashboard-certifications",
      initialCertifications
    )
  );

  const [projects, setProjects] =
    useState(() =>
      readStorage(
        "ai-dashboard-projects",
        initialProjects
      )
    );

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          "ai-dashboard-theme"
        ) || "light"
    );

  const [isDemoMode, setIsDemoMode] = useState(
    () => localStorage.getItem(DEMO_ACTIVE_KEY) === "true"
  );


  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    goalEditorOpen,
    setGoalEditorOpen,
  ] = useState(false);

  const [
    editingGoal,
    setEditingGoal,
  ] = useState(null);

  const [goalForm, setGoalForm] =
    useState(emptyGoalForm);

  const [
    goalErrors,
    setGoalErrors,
  ] = useState({});

  useEffect(() => {
    localStorage.setItem(
      "ai-dashboard-courses",
      JSON.stringify(courses)
    );
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(
      "ai-dashboard-goals",
      JSON.stringify(goals)
    );
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(
      "ai-dashboard-certifications",
      JSON.stringify(certifications)
    );
  }, [certifications]);

  useEffect(() => {
    localStorage.setItem(
      "ai-dashboard-projects",
      JSON.stringify(projects)
    );
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(
      "ai-dashboard-theme",
      theme
    );

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);


  function enterDemoMode() {
    if (isDemoMode) {
      return;
    }

    const backup = {
      courses,
      goals,
      certifications,
      projects,
    };

    localStorage.setItem(
      DEMO_BACKUP_KEY,
      JSON.stringify(backup)
    );

    setCourses(DEMO_DATA.courses);
    setGoals(DEMO_DATA.goals);
    setCertifications(DEMO_DATA.certifications);
    setProjects(DEMO_DATA.projects);

    localStorage.setItem(DEMO_ACTIVE_KEY, "true");
    setIsDemoMode(true);
  }

  function exitDemoMode() {
    try {
      const storedBackup = localStorage.getItem(
        DEMO_BACKUP_KEY
      );

      const backup = storedBackup
        ? JSON.parse(storedBackup)
        : null;

      setCourses(
        Array.isArray(backup?.courses)
          ? backup.courses
          : initialCourses
      );

      setGoals(
        Array.isArray(backup?.goals)
          ? backup.goals
          : initialGoals
      );

      setCertifications(
        Array.isArray(backup?.certifications)
          ? backup.certifications
          : initialCertifications
      );

      setProjects(
        Array.isArray(backup?.projects)
          ? backup.projects
          : initialProjects
      );
    } catch (error) {
      console.error(
        "Unable to restore data after Demo Mode:",
        error
      );

      setCourses(initialCourses);
      setGoals(initialGoals);
      setCertifications(initialCertifications);
      setProjects(initialProjects);
    } finally {
      localStorage.removeItem(DEMO_BACKUP_KEY);
      localStorage.removeItem(DEMO_ACTIVE_KEY);
      setIsDemoMode(false);
    }
  }

  function addCourse(course) {
    setCourses((current) => [
      course,
      ...current,
    ]);
  }

  function updateCourse(updatedCourse) {
    setCourses((current) =>
      current.map((course) =>
        course.id === updatedCourse.id
          ? updatedCourse
          : course
      )
    );
  }

  function toggleFavorite(course) {
    updateCourse({
      ...course,
      favorite: !course.favorite,
    });
  }

  function toggleGoal(id) {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              completed:
                !goal.completed,
            }
          : goal
      )
    );
  }

  function openGoalEditor(goal) {
    setEditingGoal(goal);

    setGoalForm(
      goal
        ? {
            title: goal.title,
            deadline: goal.deadline,
          }
        : {
            ...emptyGoalForm,
          }
    );

    setGoalErrors({});
    setGoalEditorOpen(true);
  }

  function closeGoalEditor() {
    setGoalEditorOpen(false);
    setEditingGoal(null);
    setGoalForm({
      ...emptyGoalForm,
    });
    setGoalErrors({});
  }

  function handleGoalChange(event) {
    const { name, value } =
      event.target;

    setGoalForm((current) => ({
      ...current,
      [name]: value,
    }));

    setGoalErrors((current) => ({
      ...current,
      [name]: "",
    }));
  }

  function saveGoal(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!goalForm.title.trim()) {
      nextErrors.title =
        "Goal title is required.";
    }

    if (!goalForm.deadline) {
      nextErrors.deadline =
        "Deadline is required.";
    }

    if (
      Object.keys(nextErrors).length >
      0
    ) {
      setGoalErrors(nextErrors);
      return;
    }

    if (editingGoal) {
      setGoals((current) =>
        current.map((goal) =>
          goal.id === editingGoal.id
            ? {
                ...goal,
                ...goalForm,
              }
            : goal
        )
      );
    } else {
      setGoals((current) => [
        {
          ...goalForm,
          id: crypto.randomUUID(),
          completed: false,
        },
        ...current,
      ]);
    }

    closeGoalEditor();
  }

  function saveCertification(
    certification
  ) {
    setCertifications((current) => {
      const exists = current.some(
        (item) =>
          item.id ===
          certification.id
      );

      if (exists) {
        return current.map((item) =>
          item.id ===
          certification.id
            ? certification
            : item
        );
      }

      return [
        certification,
        ...current,
      ];
    });
  }

  function saveProject(project) {
    setProjects((current) => {
      const exists = current.some(
        (item) =>
          item.id === project.id
      );

      if (exists) {
        return current.map((item) =>
          item.id === project.id
            ? project
            : item
        );
      }

      return [project, ...current];
    });
  }

  const closeDeleteModal =
    useCallback(() => {
      setDeleteTarget(null);
    }, []);

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (
      deleteTarget.type === "course"
    ) {
      setCourses((current) =>
        current.filter(
          (course) =>
            course.id !==
            deleteTarget.item.id
        )
      );
    }

    if (
      deleteTarget.type === "goal"
    ) {
      setGoals((current) =>
        current.filter(
          (goal) =>
            goal.id !==
            deleteTarget.item.id
        )
      );
    }

    if (
      deleteTarget.type ===
      "certification"
    ) {
      setCertifications((current) =>
        current.filter(
          (certification) =>
            certification.id !==
            deleteTarget.item.id
        )
      );
    }

    if (
      deleteTarget.type === "project"
    ) {
      setProjects((current) =>
        current.filter(
          (project) =>
            project.id !==
            deleteTarget.item.id
        )
      );
    }

    closeDeleteModal();
  }

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) =>
            current === "light"
              ? "dark"
              : "light"
          )
        }
        isDemoMode={isDemoMode}
        onEnterDemo={enterDemoMode}
        onExitDemo={exitDemoMode}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              courses={courses}
              goals={goals}
              certifications={
                certifications
              }
              onToggleGoal={toggleGoal}
              onEditGoal={
                openGoalEditor
              }
              onRequestDeleteGoal={(
                goal
              ) =>
                setDeleteTarget({
                  type: "goal",
                  item: goal,
                })
              }
              onRequestDeleteCourse={(
                course
              ) =>
                setDeleteTarget({
                  type: "course",
                  item: course,
                })
              }
              onToggleFavorite={
                toggleFavorite
              }
            />
          }
        />

        <Route
          path="/courses"
          element={
            <CoursesPage
              courses={courses}
              onRequestDeleteCourse={(
                course
              ) =>
                setDeleteTarget({
                  type: "course",
                  item: course,
                })
              }
              onToggleFavorite={
                toggleFavorite
              }
              initialFilter="All"
              pageTitle="All Courses"
            />
          }
        />

        <Route
          path="/courses/in-progress"
          element={
            <CoursesPage
              courses={courses}
              onRequestDeleteCourse={(
                course
              ) =>
                setDeleteTarget({
                  type: "course",
                  item: course,
                })
              }
              onToggleFavorite={
                toggleFavorite
              }
              initialFilter="In Progress"
              pageTitle="Courses In Progress"
            />
          }
        />

        <Route
          path="/courses/completed"
          element={
            <CoursesPage
              courses={courses}
              onRequestDeleteCourse={(
                course
              ) =>
                setDeleteTarget({
                  type: "course",
                  item: course,
                })
              }
              onToggleFavorite={
                toggleFavorite
              }
              initialFilter="Completed"
              pageTitle="Completed Courses"
            />
          }
        />

        <Route
          path="/courses/add"
          element={
            <CourseFormPage
              courses={courses}
              onAddCourse={addCourse}
              onUpdateCourse={
                updateCourse
              }
            />
          }
        />

        <Route
          path="/courses/:courseId"
          element={
            <CourseDetailsPage
              courses={courses}
              onUpdateCourse={
                updateCourse
              }
            />
          }
        />

        <Route
          path="/courses/:courseId/edit"
          element={
            <CourseFormPage
              courses={courses}
              onAddCourse={addCourse}
              onUpdateCourse={
                updateCourse
              }
            />
          }
        />

        <Route
          path="/certifications"
          element={
            <CertificationsPage
              certifications={
                certifications
              }
              onSaveCertification={
                saveCertification
              }
              onRequestDeleteCertification={(
                certification
              ) =>
                setDeleteTarget({
                  type: "certification",
                  item: certification,
                })
              }
            />
          }
        />

        <Route
          path="/ai-planner"
          element={
            <AIPlannerPage
              courses={courses}
              goals={goals}
            />
          }
        />

        <Route
          path="/projects"
          element={
            <ProjectsPage
              projects={projects}
              onSaveProject={
                saveProject
              }
              onRequestDeleteProject={(
                project
              ) =>
                setDeleteTarget({
                  type: "project",
                  item: project,
                })
              }
            />
          }
        />

        <Route
          path="/notes"
          element={
            <NotesPage
              courses={courses}
            />
          }
        />

        <Route
          path="/notes/:courseId/:noteId"
          element={
            <NoteReaderPage
              courses={courses}
            />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>

      {goalEditorOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeGoalEditor();
            }
          }}
        >
          <section
            className="editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-editor-title"
          >
            <p className="section-label">
              Learning goal
            </p>

            <h2 id="goal-editor-title">
              {editingGoal
                ? "Edit Goal"
                : "Add Goal"}
            </h2>

            <GoalForm
              form={goalForm}
              errors={goalErrors}
              onChange={
                handleGoalChange
              }
              onSubmit={saveGoal}
              onCancel={
                closeGoalEditor
              }
              submitLabel={
                editingGoal
                  ? "Save Changes"
                  : "Add Goal"
              }
            />
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete ${
          deleteTarget?.type ||
          "item"
        }?`}
        message={
          deleteTarget
            ? `This will permanently remove "${
                deleteTarget.item
                  .title ||
                deleteTarget.item.name
              }".`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

export default App;