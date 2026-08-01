# Prompts Used During Development

## Planning Prompt

Help me plan a responsive React AI Learning Dashboard that helps users organize courses, track learning progress, manage goals, document projects and certifications, save notes, and generate personalized study plans using AI.

The application should include:

- Course progress tracking
- Course status filters
- Course search
- Learning goals
- Notes linked to courses
- Project and certification tracking
- AI-generated study plans
- Saved study plans
- Session completion tracking
- localStorage persistence
- Responsive design
- Dark mode
- Accessible keyboard navigation
- Clear validation and error states
- Production-ready deployment structure

The design should be clean, readable, consistent, and suitable for a portfolio project.

## Implementation Prompt

Create the React structure and logic for an AI Learning Dashboard using reusable components, accessible forms, form validation, localStorage persistence, search, filters, responsive styling, dark mode, and React Router.

The application should support:

- Adding, editing, viewing, and deleting courses
- Automatic course status based on progress
- Tracking learning goals
- Managing projects and certifications
- Saving and reading course notes
- Generating personalized AI study plans from saved courses
- Using public course links as study-plan sources
- Saving generated study plans
- Marking study sessions as completed
- Loading a site-wide demo mode with sample data
- Restoring the user’s original data after exiting demo mode
- Clear loading, success, empty, and error states

Keep the application modular, readable, and easy to maintain.

## AI Integration Prompt

Create a serverless API endpoint that uses the Gemini API to generate a personalized study plan.

The API should:

- Use the courses already saved in the dashboard
- Consider course progress, goals, weekly study hours, target date, and learning pace
- Inspect valid public course URLs when available
- Recommend relevant lessons, modules, exercises, projects, and review activities
- Return structured JSON only
- Validate and sanitize incoming data
- Handle invalid responses, missing API keys, timeouts, and unavailable models
- Never invent or modify course source URLs
- Fail safely with a clear error message

## Testing Prompt

Review the application for:

- Form-validation issues
- localStorage persistence problems
- Demo Mode backup and restore behavior
- AI API errors and invalid JSON responses
- Missing or broken source links
- Accessibility issues
- Keyboard navigation
- Focus visibility
- Screen-reader labels
- Mobile responsiveness
- Dark-mode consistency
- Empty states
- Loading and error states
- ESLint errors
- Production build errors

Suggest corrections without changing the main design, content, or intended functionality.

## Refinement Prompt

Review the AI-generated code and improve it manually where necessary.

Focus on:

- Removing duplicated state and unused code
- Fixing mismatched JSX and CSS class names
- Improving component structure
- Preserving existing functionality
- Improving error handling
- Making buttons and cards visually consistent
- Ensuring responsive layouts do not break
- Making dark mode match the rest of the application
- Keeping AI-generated study plans persistent
- Making saved plans and completion tracking reliable

Do not redesign the application unless required to fix a functional or accessibility issue.