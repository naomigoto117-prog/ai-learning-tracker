# AI Learning Dashboard

A modern React application for organizing AI learning in one place. Track courses, manage goals, save notes, document projects and certifications, and generate personalized AI-powered study plans using the Gemini API.

## Overview

The AI Learning Dashboard is designed to help learners organize their learning journey through an intuitive and responsive interface. It combines course management, productivity tools, and AI-generated study planning into a single application.

## Features

### Dashboard

- Learning progress overview
- Quick statistics
- Clickable summary cards
- Responsive layout
- Dark and light themes

### Course Management

- Add, edit, and delete courses
- Automatic status calculation
- Progress tracking
- Course categories
- Course deadlines
- Search courses
- Status filtering
- Favorite courses
- Course notes
- Course source links

### Learning Goals

- Add, edit, complete, and delete goals
- Progress tracking
- Deadline management

### Notes

- Create and manage learning notes
- Associate notes with courses
- Rich note organization

### Projects

- Portfolio project tracking
- Project descriptions
- Technology stack
- Repository links
- Live demo links

### Certifications

- Add, edit, and delete certifications
- Credential information
- Issuer tracking
- Issue dates

### AI Study Planner

- Gemini AI integration
- Personalized study plans
- Course-aware recommendations
- Uses saved course information
- Uses public course links as learning references
- Weekly study scheduling
- Adjustable study pace
- Saved study plans
- Session completion tracking
- Progress tracking
- Study recommendations

### Demo Mode

- One-click Live Demo
- Sample learning profile
- Restores original data after exiting
- Ideal for portfolio demonstrations

### User Experience

- Responsive design
- Dark mode
- Keyboard accessible
- Form validation
- Local storage persistence
- Accessible navigation
- Empty states
- Loading states
- Error handling

---

## Technologies

### Frontend

- React
- Vite
- JavaScript (ES6+)
- React Router DOM
- CSS

### AI

- Google Gemini API

### Deployment

- Vercel

### Development

- ESLint
- localStorage

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Build for production

```bash
npm run build
```

Run ESLint

```bash
npm run lint
```

---

## Application Routes

| Route | Description |
|--------|-------------|
| / | Dashboard |
| /courses | All Courses |
| /courses/add | Add Course |
| /courses/in-progress | In Progress Courses |
| /courses/completed | Completed Courses |
| /courses/:courseId/edit | Edit Course |
| /goals | Learning Goals |
| /notes | Notes |
| /projects | Projects |
| /certifications | Certifications |
| /ai-planner | AI Study Planner |

---

## AI Study Planner

The AI Study Planner uses the Google Gemini API to generate personalized study plans based on:

- Selected courses
- Course progress
- Learning goals
- Weekly study hours
- Learning pace
- Target completion date
- Public course source links

Generated plans can be:

- Saved
- Reopened
- Updated
- Marked as completed
- Tracked through progress indicators

---

## Local Storage

The application stores data locally in the browser, including:

- Courses
- Goals
- Notes
- Projects
- Certifications
- Saved study plans
- User preferences
- Theme
- Demo Mode state

---

## Accessibility

The application includes:

- Keyboard navigation
- Accessible forms
- Focus indicators
- Semantic HTML
- Screen-reader-friendly controls
- Responsive layouts

---

## Project Structure

```text
src/
 ├── components/
 ├── pages/
 ├── data/
 ├── utils/
 ├── assets/
 ├── App.jsx
 └── main.jsx
```

---

## Future Improvements

- User authentication
- Cloud synchronization
- Calendar integration
- Learning analytics
- Achievement badges
- Export study plans
- PDF reports
- Email reminders
- AI learning insights
- Mobile application

---

## License

This project was created for educational and portfolio purposes.