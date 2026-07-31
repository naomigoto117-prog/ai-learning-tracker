const GEMINI_MODEL = "gemini-2.5-flash";

const ALLOWED_PACES = [
  "Relaxed",
  "Balanced",
  "Intensive",
];

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function calculateWeeksAvailable(targetDate) {
  const today = new Date();
  const deadline = new Date(`${targetDate}T23:59:59`);

  return Math.max(
    1,
    Math.ceil(
      (deadline - today) /
        (1000 * 60 * 60 * 24 * 7)
    )
  );
}

function sanitizeCourses(courses) {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses.slice(0, 30).map((course) => ({
    title: String(course?.title || "Untitled course").slice(
      0,
      150
    ),
    category: String(course?.category || "General").slice(
      0,
      100
    ),
    status: String(course?.status || "Not Started").slice(
      0,
      50
    ),
    progress: Math.min(
      100,
      Math.max(0, Number(course?.progress || 0))
    ),
    description: String(
      course?.description || ""
    ).slice(0, 300),
  }));
}

function sanitizeGoals(goals) {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals.slice(0, 20).map((goal) => ({
    title: String(goal?.title || "Untitled goal").slice(
      0,
      150
    ),
    completed: Boolean(goal?.completed),
    deadline: String(
      goal?.deadline || goal?.targetDate || ""
    ).slice(0, 30),
  }));
}

function selectRelevantCourses(courses, focus) {
  const activeCourses = courses.filter(
    (course) =>
      course.status.toLowerCase() !== "completed"
  );

  if (!focus.length) {
    return activeCourses.length
      ? activeCourses
      : courses;
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

function normalizeSession(session) {
  return {
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
        "Continue the next lesson and practice the concepts."
    ).slice(0, 500),
  };
}

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  return recommendations
    .slice(0, 6)
    .map((item) => String(item).slice(0, 400))
    .filter(Boolean);
}

function extractGeminiText(data) {
  const parts =
    data?.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

function parseGeminiJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function buildPrompt({
  hoursPerWeek,
  targetDate,
  pace,
  focus,
  weeksAvailable,
  relevantCourses,
  goals,
}) {
  return `
You are an expert learning coach.

Create a realistic and highly personalized WEEKLY study plan
for a learner using the information below.

LEARNER PREFERENCES
- Study hours available per week: ${hoursPerWeek}
- Target completion date: ${targetDate}
- Weeks available: ${weeksAvailable}
- Learning pace: ${pace}
- Selected focus topics: ${
    focus.length ? focus.join(", ") : "All active courses"
  }

COURSES
${JSON.stringify(relevantCourses, null, 2)}

GOALS
${JSON.stringify(goals, null, 2)}

REQUIREMENTS
1. Create one reusable weekly schedule.
2. The total session hours must be approximately ${hoursPerWeek} hours.
3. Use exactly these day-count rules:
   - Relaxed: 3 study days
   - Balanced: 4 study days
   - Intensive: 6 study days
4. Prioritize incomplete courses and courses with lower progress.
5. Give every session a specific, practical task.
6. Tasks should mention lessons, exercises, projects, review,
   quizzes, practice, recall, or portfolio work when appropriate.
7. Do not invent course titles that are not present in the supplied courses.
8. Return 3 to 5 concise recommendations.
9. Return JSON only.
`.trim();
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(
      {
        error:
          "GEMINI_API_KEY is not configured in Vercel.",
      },
      500
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "The request body must contain valid JSON.",
      },
      400
    );
  }

  const hoursPerWeek = Number(body?.hoursPerWeek);
  const targetDate = String(body?.targetDate || "");
  const pace = String(body?.pace || "");
  const focus = Array.isArray(body?.focus)
    ? body.focus
        .map((item) => String(item).slice(0, 100))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  if (
    !Number.isFinite(hoursPerWeek) ||
    hoursPerWeek < 2 ||
    hoursPerWeek > 60
  ) {
    return jsonResponse(
      {
        error:
          "Study hours must be a number between 2 and 60.",
      },
      400
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
    Number.isNaN(
      new Date(`${targetDate}T23:59:59`).getTime()
    )
  ) {
    return jsonResponse(
      {
        error: "A valid target date is required.",
      },
      400
    );
  }

  if (!ALLOWED_PACES.includes(pace)) {
    return jsonResponse(
      {
        error:
          "Learning pace must be Relaxed, Balanced, or Intensive.",
      },
      400
    );
  }

  const courses = sanitizeCourses(body?.courses);
  const goals = sanitizeGoals(body?.goals);

  if (!courses.length) {
    return jsonResponse(
      {
        error:
          "Add at least one course before generating an AI plan.",
      },
      400
    );
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
  });

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent?key=` +
    encodeURIComponent(process.env.GEMINI_API_KEY);

  let geminiResponse;

  try {
    geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
              },
              sessions: {
                type: "ARRAY",
                minItems: expectedSessionCount,
                maxItems: expectedSessionCount,
                items: {
                  type: "OBJECT",
                  properties: {
                    day: {
                      type: "STRING",
                    },
                    hours: {
                      type: "NUMBER",
                    },
                    title: {
                      type: "STRING",
                    },
                    task: {
                      type: "STRING",
                    },
                  },
                  required: [
                    "day",
                    "hours",
                    "title",
                    "task",
                  ],
                },
              },
              recommendations: {
                type: "ARRAY",
                minItems: 3,
                maxItems: 5,
                items: {
                  type: "STRING",
                },
              },
            },
            required: [
              "title",
              "sessions",
              "recommendations",
            ],
          },
        },
      }),
    });
  } catch (error) {
    console.error("Could not contact Gemini:", error);

    return jsonResponse(
      {
        error:
          "The server could not connect to the Gemini API.",
      },
      502
    );
  }

  const geminiData = await geminiResponse
    .json()
    .catch(() => ({}));

  if (!geminiResponse.ok) {
    console.error(
      "Gemini API error:",
      JSON.stringify(geminiData)
    );

    const geminiMessage =
      geminiData?.error?.message ||
      "Gemini could not generate the study plan.";

    return jsonResponse(
      {
        error: geminiMessage,
      },
      geminiResponse.status >= 400 &&
        geminiResponse.status < 600
        ? geminiResponse.status
        : 502
    );
  }

  const generatedText = extractGeminiText(geminiData);

  if (!generatedText) {
    console.error(
      "Gemini returned no text:",
      JSON.stringify(geminiData)
    );

    return jsonResponse(
      {
        error: "Gemini returned an empty response.",
      },
      502
    );
  }

  let generatedPlan;

  try {
    generatedPlan = parseGeminiJson(generatedText);
  } catch (error) {
    console.error(
      "Unable to parse Gemini JSON:",
      generatedText,
      error
    );

    return jsonResponse(
      {
        error:
          "Gemini returned an unreadable study plan.",
      },
      502
    );
  }

  const sessions = Array.isArray(
    generatedPlan?.sessions
  )
    ? generatedPlan.sessions
        .slice(0, expectedSessionCount)
        .map(normalizeSession)
    : [];

  const recommendations = normalizeRecommendations(
    generatedPlan?.recommendations
  );

  if (
    sessions.length !== expectedSessionCount ||
    recommendations.length < 3
  ) {
    return jsonResponse(
      {
        error:
          "Gemini returned an incomplete study plan.",
      },
      502
    );
  }

  const plan = {
    id: createId(),
    createdAt: new Date().toISOString(),
    generatedBy: "gemini",
    title: String(
      generatedPlan?.title || `${pace} AI Study Plan`
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

  return jsonResponse({
    plan,
  });
}

export function GET() {
  return jsonResponse({
    message:
      "The Gemini study-plan API is available. Send a POST request to generate a plan.",
  });
}