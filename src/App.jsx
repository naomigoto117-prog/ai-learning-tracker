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