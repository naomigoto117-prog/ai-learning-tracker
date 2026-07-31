const GEMINI_MODEL = "gemini-3.6-flash";

function sendJson(response, status, data) {
  response.status(status);
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(data));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateWeeksAvailable(targetDate) {
  const today = new Date();
  const deadline = new Date(`${targetDate}T23:59:59`);

  const difference = deadline.getTime() - today.getTime();

  return Math.max(
    1,
    Math.ceil(difference / (1000 * 60 * 60 * 24 * 7))
  );
}

function sanitizeCourses(courses) {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses.slice(0, 30).map((course) => ({
    title: String(course?.title || "Untitled course").slice(0, 150),
    category: String(course?.category || "General").slice(0, 100),
    status: String(course?.status || "Not Started").slice(0, 50),
    progress: Math.min(
      100,
      Math.max(0, Number(course?.progress || 0))
    ),
    description: String(course?.description || "").slice(0, 300),
  }));
}

function sanitizeGoals(goals) {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals.slice(0, 20).map((goal) => ({
    title: String(goal?.title || "Untitled goal").slice(0, 150),
    completed: Boolean(goal?.completed),
    deadline: String(
      goal?.deadline || goal?.targetDate || ""
    ).slice(0, 30),
  }));
}

function selectRelevantCourses(courses, focus) {
  const activeCourses = courses.filter(
    (course) => course.status.toLowerCase() !== "completed"
  );

  if (!focus.length) {
    return activeCourses.length ? activeCourses : courses;
  }

  const selected = activeCourses.filter((course) =>
    focus.some((topic) => {
      const searchable =
        `${course.title} ${course.category}`.toLowerCase();

      return searchable.includes(topic.toLowerCase());
    })
  );

  return selected.length
    ? selected
    : activeCourses.length
      ? activeCourses
      : courses;
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function parseGeneratedJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function normalizeSessions(sessions, expectedCount) {
  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions.slice(0, expectedCount).map((session) => ({
    day: String(session?.day || "Study day").slice(0, 30),
    hours: Math.max(
      0.5,
      Math.round(Number(session?.hours || 1) * 10) / 10
    ),
    title: String(
      session?.title || "Learning session"
    ).slice(0, 150),
    task: String(
      session?.task ||
        "Continue the next lesson and practice the main concepts."
    ).slice(0, 500),
  }));
}

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  return recommendations
    .slice(0, 5)
    .map((item) => String(item).slice(0, 400))
    .filter(Boolean);
}

function buildPrompt({
  hoursPerWeek,
  targetDate,
  pace,
  focus,
  weeksAvailable,
  relevantCourses,
  goals,
  expectedSessionCount,
}) {
  return `
You are an expert study-planning coach.

Create a personalized reusable weekly study plan.

LEARNER DETAILS
Study hours per week: ${hoursPerWeek}
Target date: ${targetDate}
Weeks available: ${weeksAvailable}
Learning pace: ${pace}
Focus topics: ${
    focus.length ? focus.join(", ") : "All active courses"
  }

COURSES
${JSON.stringify(relevantCourses, null, 2)}

GOALS
${JSON.stringify(goals, null, 2)}

INSTRUCTIONS
- Create exactly ${expectedSessionCount} study sessions.
- The combined study time should be approximately ${hoursPerWeek} hours.
- Prioritize incomplete courses and courses with lower progress.
- Only use course titles supplied above.
- Every task must be practical and specific.
- Include 3 to 5 concise recommendations.
- Return valid JSON only.
- Do not include markdown or code fences.

Use exactly this JSON structure:

{
  "title": "Name of the study plan",
  "sessions": [
    {
      "day": "Monday",
      "hours": 2,
      "title": "Exact supplied course title",
      "task": "Specific task for this session"
    }
  ],
  "recommendations": [
    "Recommendation one",
    "Recommendation two",
    "Recommendation three"
  ]
}
`.trim();
}

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      return sendJson(response, 200, {
        message:
          "The Gemini study-plan API is available. Send a POST request to generate a plan.",
        model: GEMINI_MODEL,
      });
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");

      return sendJson(response, 405, {
        error: "Method not allowed.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return sendJson(response, 500, {
        error:
          "GEMINI_API_KEY is not configured in Vercel.",
      });
    }

    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body || {};

    const hoursPerWeek = Number(body.hoursPerWeek);
    const targetDate = String(body.targetDate || "");
    const pace = String(body.pace || "");

    const focus = Array.isArray(body.focus)
      ? body.focus
          .map((item) => String(item).slice(0, 100))
          .filter(Boolean)
          .slice(0, 10)
      : [];

    const allowedPaces = [
      "Relaxed",
      "Balanced",
      "Intensive",
    ];

    if (
      !Number.isFinite(hoursPerWeek) ||
      hoursPerWeek < 2 ||
      hoursPerWeek > 60
    ) {
      return sendJson(response, 400, {
        error:
          "Study hours must be between 2 and 60.",
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
      Number.isNaN(
        new Date(`${targetDate}T23:59:59`).getTime()
      )
    ) {
      return sendJson(response, 400, {
        error: "A valid target date is required.",
      });
    }

    if (!allowedPaces.includes(pace)) {
      return sendJson(response, 400, {
        error:
          "Learning pace must be Relaxed, Balanced, or Intensive.",
      });
    }

    const courses = sanitizeCourses(body.courses);
    const goals = sanitizeGoals(body.goals);

    if (!courses.length) {
      return sendJson(response, 400, {
        error:
          "Add at least one course before generating an AI plan.",
      });
    }

    const relevantCourses = selectRelevantCourses(
      courses,
      focus
    );

    const weeksAvailable =
      calculateWeeksAvailable(targetDate);

    const expectedSessionCount = {
      Relaxed: 3,
      Balanced: 4,
      Intensive: 6,
    }[pace];

    const prompt = buildPrompt({
      hoursPerWeek,
      targetDate,
      pace,
      focus,
      weeksAvailable,
      relevantCourses,
      goals,
      expectedSessionCount,
    });

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${GEMINI_MODEL}:generateContent?key=` +
      encodeURIComponent(apiKey);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 25000);

    let geminiResponse;

    try {
      geminiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawResponse = await geminiResponse.text();

    let geminiData = {};

    try {
      geminiData = rawResponse
        ? JSON.parse(rawResponse)
        : {};
    } catch {
      console.error(
        "Gemini returned non-JSON data:",
        rawResponse
      );

      return sendJson(response, 502, {
        error:
          "Gemini returned an unreadable server response.",
      });
    }

    if (!geminiResponse.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(geminiData)
      );

      return sendJson(response, geminiResponse.status, {
        error:
          geminiData?.error?.message ||
          "Gemini could not generate the study plan.",
      });
    }

    const generatedText =
      extractGeminiText(geminiData);

    if (!generatedText) {
      console.error(
        "Gemini returned no generated text:",
        JSON.stringify(geminiData)
      );

      return sendJson(response, 502, {
        error:
          "Gemini returned an empty study plan.",
      });
    }

    let generatedPlan;

    try {
      generatedPlan =
        parseGeneratedJson(generatedText);
    } catch (error) {
      console.error(
        "Gemini JSON parsing error:",
        error,
        generatedText
      );

      return sendJson(response, 502, {
        error:
          "Gemini returned an invalid study-plan format.",
      });
    }

    const sessions = normalizeSessions(
      generatedPlan.sessions,
      expectedSessionCount
    );

    const recommendations =
      normalizeRecommendations(
        generatedPlan.recommendations
      );

    if (sessions.length !== expectedSessionCount) {
      return sendJson(response, 502, {
        error:
          "Gemini returned an incomplete weekly schedule.",
      });
    }

    if (recommendations.length < 3) {
      return sendJson(response, 502, {
        error:
          "Gemini returned too few recommendations.",
      });
    }

    const plan = {
      id: createId(),
      createdAt: new Date().toISOString(),
      generatedBy: "gemini",
      title: String(
        generatedPlan.title ||
          `${pace} AI Study Plan`
      ).slice(0, 150),
      targetDate,
      hoursPerWeek,
      pace,
      focus,
      weeksAvailable,
      courseCount: relevantCourses.length,
      sessions,
      recommendations,
    };

    return sendJson(response, 200, {
      plan,
    });
  } catch (error) {
    console.error(
      "Unhandled study planner error:",
      error
    );

    const message =
      error?.name === "AbortError"
        ? "Gemini took too long to respond. Please try again."
        : error instanceof SyntaxError
          ? "The request contained invalid JSON."
          : "The server could not generate the study plan.";

    return sendJson(response, 500, {
      error: message,
      details:
        process.env.NODE_ENV === "development"
          ? String(error?.message || error)
          : undefined,
    });
  }
}