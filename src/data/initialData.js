export const initialCourses = [
  {
    id: "course-python-ai",
    title: "Python for AI",
    platform: "freeCodeCamp",
    category: "Programming",
    progress: 60,
    status: "In Progress",
    deadline: "2026-08-15",
    url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
    favorite: true,
    notes: [],
  },
  {
    id: "course-generative-ai",
    title: "Introduction to Generative AI",
    platform: "Google Cloud",
    category: "Generative AI",
    progress: 100,
    status: "Completed",
    deadline: "2026-07-20",
    url: "https://www.cloudskillsboost.google/paths/118",
    favorite: false,
    notes: [],
  },
];

export const initialGoals = [
  {
    id: "goal-first-course",
    title: "Complete one AI course",
    deadline: "2026-08-30",
    completed: false,
  },
];

export const initialCertifications = [];

export const initialProjects = [];

export const emptyCourseForm = {
  title: "",
  platform: "",
  category: "",
  progress: 0,
  status: "Not Started",
  deadline: "",
  url: "",
  favorite: false,
  notes: [],
};

export const emptyGoalForm = {
  title: "",
  deadline: "",
};

export const emptyCertificationForm = {
  name: "",
  issuer: "",
  dateEarned: "",
  credentialUrl: "",
  skills: "",
};

export const emptyProjectForm = {
  title: "",
  liveUrl: "",
  githubUrl: "",
  description: "",
  techStack: [],
};