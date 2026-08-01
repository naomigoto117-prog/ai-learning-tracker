const GEMINI_MODEL = "gemini-3.6-flash";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function sendJson(response, status, data) {
  response.status(status);
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(data));
}

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function cleanText(value, maximumLength = 300) {
  return String(value || "")
    .trim()
    .slice(0, maximumLength);
}

function normalizePublicUrl(value) {
  try {
    const parsedUrl = new URL(
      String(value || "").trim()
    );

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.protocol !== "http:"
    ) {
      return "";
    }

    const blockedHostnames = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
    ];

    if (
      blockedHostnames.includes(
        parsedUrl.hostname.toLowerCase()
      )
    ) {
      return "";
    }

    return parsedUrl.href;
  } catch {
    return "";
  }
}

function sanitizeCourses(courses) {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses.slice(0, 20).map((course, index) => {
    const sourceUrl = normalizePublicUrl(
      course?.sourceUrl ||
        course?.courseUrl ||
        course?.url ||
        course?.link
    );

    return {
      id:
        cleanText(course?.id, 100) ||
        `course-${index + 1}`,
      title:
        cleanText(course?.title, 160) ||
        `Course ${index + 1}`,
      category:
        cleanText(course?.category, 100) || "General",
      status:
        cleanText(course?.status, 50) || "Not Started",
      progress: Math.min(
        100,
        Math.max(0, Number(course?.progress || 0))
      ),
      description: cleanText(
        course?.description,
        500
      ),
      sourceUrl,
    };
  });
}

function sanitizeGoals(goals) {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals.slice(0, 20).map((goal, index) => ({
    id:
      cleanText(goal?.id, 100) ||
      `goal-${index + 1}`,
    title:
      cleanText(goal?.title, 160) ||
      `Goal ${index + 1}`,
    completed: Boolean(goal?.completed),
    deadline: cleanText(
      goal?.deadline || goal?.targetDate,
      30
    ),
  }));
}

function calculateWeeksAvailable(targetDate) {
  const now = new Date();
  const deadline = new Date(
    `${targetDate}T23:59:59`
  );

  const difference =
    deadline.getTime() - now.getTime();

  return Math.max(
    1,
    Math.ceil(
      difference / (1000 * 60 * 60 * 24 * 7)
    )
  );
}

function extractGeminiText(data) {
  const parts =
    data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) =>
      typeof part?.text === "string" ? part.text : ""
    )
    .join("")
    .trim();
}

function cleanJsonResponse(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseGeneratedJson(text) {
  return JSON.parse(cleanJsonResponse(text));
}

function urlsMatch(firstUrl, secondUrl) {
  const normalizedFirst = normalizePublicUrl(firstUrl);
  const normalizedSecond = normalizePublicUrl(secondUrl);

  if (!normalizedFirst || !normalizedSecond) {
    return false;
  }

  try {
    const first = new URL(normalizedFirst);
    const second = new URL(normalizedSecond);

    first.hash = "";
    second.hash = "";

    return first.href === second.href;
  } catch {
    return false;
  }
}

function findCourseByTitle(courses, title) {
  const normalizedTitle = cleanText(
    title,
    160
  ).toLowerCase();

  if (!normalizedTitle) {
    return null;
  }

  return (
    courses.find(
      (course) =>
        course.title.toLowerCase() === normalizedTitle
    ) ||
    courses.find(
      (course) =>
        course.title
          .toLowerCase()
          .includes(normalizedTitle) ||
        normalizedTitle.includes(
          course.title.toLowerCase()
        )
    ) ||
    null
  );
}

function findAllowedSourceUrl({
  courses,
  course,
  generatedUrl,
}) {
  if (!course?.sourceUrl) {
    return "";
  }

  if (
    generatedUrl &&
    urlsMatch(generatedUrl, course.sourceUrl)
  ) {
    return course.sourceUrl;
  }

  return course.sourceUrl;
}

function normalizeActivities(activities) {
  if (!Array.isArray(activities)) {
    return [];
  }

  return activities
    .slice(0, 5)
    .map((activity) => cleanText(activity, 350))
    .filter(Boolean);
}

function normalizeSessions({
  sessions,
  courses,
  expectedSessionCount,
  hoursPerWeek,
}) {
  if (!Array.isArray(sessions)) {
    return [];
  }

  const defaultHours =
    Math.round(
      (hoursPerWeek / expectedSessionCount) * 10
    ) / 10;

  return sessions
    .slice(0, expectedSessionCount)
    .map((session, index) => {
      const matchedCourse =
        findCourseByTitle(
          courses,
          session?.courseTitle
        ) || courses[index % courses.length];

      const generatedHours = Number(session?.hours);

      return {
        id: createId("session"),
        day:
          cleanText(session?.day, 30) ||
          DAY_NAMES[index % DAY_NAMES.length],
        hours:
          Number.isFinite(generatedHours) &&
          generatedHours > 0
            ? Math.round(generatedHours * 10) / 10
            : defaultHours,
        title:
          cleanText(session?.title, 180) ||
          `Study ${matchedCourse.title}`,
        courseTitle: matchedCourse.title,
        moduleTitle:
          cleanText(session?.moduleTitle, 220) ||
          "Continue the next available lesson",
        task:
          cleanText(session?.task, 800) ||
          `Continue the next lesson in ${matchedCourse.title} and complete its practice exercises.`,
        activities: normalizeActivities(
          session?.activities
        ),
        sourceUrl: findAllowedSourceUrl({
          courses,
          course: matchedCourse,
          generatedUrl: session?.sourceUrl,
        }),
      };
    });
}

function normalizeRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  return recommendations
    .slice(0, 5)
    .map((recommendation) =>
      cleanText(recommendation, 500)
    )
    .filter(Boolean);
}

function createPrompt({
  courses,
  goals,
  hoursPerWeek,
  targetDate,
  weeksAvailable,
  pace,
  expectedSessionCount,
}) {
  const publicUrls = courses
    .map((course) => course.sourceUrl)
    .filter(Boolean);

  const urlInstructions =
    publicUrls.length > 0
      ? `
PUBLIC COURSE URLS TO ANALYZE
${publicUrls.join("\n")}

Use URL Context to inspect these URLs.

For courses with a public sourceUrl:
- Read the linked page.
- Identify real lesson, section, module, project, exercise, or topic names.
- Base study tasks on information visible on the supplied page.
- Do not claim to have found a specific module unless it appears in the retrieved source.
`
      : `
No usable public course URLs were supplied.

Use only each course title, category, description, progress, and status.
Do not claim to have inspected a webpage.
`;

  return `
You are an expert learning coach creating a reusable weekly study plan.

LEARNER SETTINGS
- Available study time: ${hoursPerWeek} hours per week
- Target completion date: ${targetDate}
- Time available: ${weeksAvailable} weeks
- Preferred pace: ${pace}
- Required session count: exactly ${expectedSessionCount}

SELECTED COURSES
${JSON.stringify(courses, null, 2)}

CURRENT GOALS
${JSON.stringify(goals, null, 2)}

${urlInstructions}

PLANNING RULES
1. Create exactly ${expectedSessionCount} study sessions.
2. The session hours should total approximately ${hoursPerWeek} hours.
3. Prioritize courses with lower progress and courses marked In Progress.
4. Use only course titles from SELECTED COURSES.
5. Use the exact sourceUrl belonging to that course.
6. Never create, guess, shorten, modify, or replace a source URL.
7. If a course has no sourceUrl, use an empty string for sourceUrl.
8. Each session must contain a practical task.
9. Include specific activities such as:
   - Watch or read a lesson
   - Take notes
   - Complete exercises
   - Build a small project
   - Review mistakes
   - Test understanding
10. Give 3 to 5 concise recommendations.
11. Return valid JSON only.
12. Do not return Markdown or code fences.

RETURN EXACTLY THIS JSON STRUCTURE

{
  "title": "Personalized study-plan title",
  "sessions": [
    {
      "day": "Monday",
      "hours": 2,
      "title": "Clear session title",
      "courseTitle": "Exact title from SELECTED COURSES",
      "moduleTitle": "Real source module or suggested study topic",
      "task": "Detailed practical task",
      "activities": [
        "Activity one",
        "Activity two",
        "Activity three"
      ],
      "sourceUrl": "Exact sourceUrl supplied for this course or an empty string"
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

export default async function handler(
  request,
  response
) {
  try {
    if (request.method === "GET") {
      return sendJson(response, 200, {
        message:
          "The Gemini source-based study planner API is available. Send a POST request to generate a plan.",
        model: GEMINI_MODEL,
        urlContextEnabled: true,
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

    const hoursPerWeek = Number(
      body.hoursPerWeek
    );

    const targetDate = cleanText(
      body.targetDate,
      30
    );

    const pace = cleanText(body.pace, 30);

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
      !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ) {
      return sendJson(response, 400, {
        error:
          "A valid target date is required.",
      });
    }

    const targetTimestamp = new Date(
      `${targetDate}T23:59:59`
    ).getTime();

    if (
      Number.isNaN(targetTimestamp) ||
      targetTimestamp < Date.now()
    ) {
      return sendJson(response, 400, {
        error:
          "The target date cannot be in the past.",
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

    if (courses.length === 0) {
      return sendJson(response, 400, {
        error:
          "Select at least one course before generating a plan.",
      });
    }

    const expectedSessionCount = {
      Relaxed: 3,
      Balanced: 4,
      Intensive: 6,
    }[pace];

    const weeksAvailable =
      calculateWeeksAvailable(targetDate);

    const publicCourseUrls = courses
      .map((course) => course.sourceUrl)
      .filter(Boolean)
      .slice(0, 20);

    const prompt = createPrompt({
      courses,
      goals,
      hoursPerWeek,
      targetDate,
      weeksAvailable,
      pace,
      expectedSessionCount,
    });

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${GEMINI_MODEL}:generateContent`;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 45000);

    let geminiResponse;

    try {
      const requestPayload = {
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
          maxOutputTokens: 8192,
          temperature: 0.35,
        },
      };

      if (publicCourseUrls.length > 0) {
        requestPayload.tools = [
          {
            url_context: {},
          },
        ];
      }

      geminiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify(requestPayload),
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawResponse =
      await geminiResponse.text();

    let geminiData;

    try {
      geminiData = rawResponse
        ? JSON.parse(rawResponse)
        : {};
    } catch {
      console.error(
        "Gemini returned non-JSON API data:",
        rawResponse
      );

      return sendJson(response, 502, {
        error:
          "Gemini returned an unreadable API response.",
      });
    }

    if (!geminiResponse.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(geminiData)
      );

      return sendJson(
        response,
        geminiResponse.status,
        {
          error:
            geminiData?.error?.message ||
            "Gemini could not generate the study plan.",
        }
      );
    }

    const generatedText =
      extractGeminiText(geminiData);

    if (!generatedText) {
      console.error(
        "Gemini returned no text:",
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
    } catch (parsingError) {
      console.error(
        "Could not parse Gemini plan:",
        parsingError,
        generatedText
      );

      return sendJson(response, 502, {
        error:
          "Gemini returned an invalid study-plan format. Please generate the plan again.",
      });
    }

    const sessions = normalizeSessions({
      sessions: generatedPlan.sessions,
      courses,
      expectedSessionCount,
      hoursPerWeek,
    });

    if (
      sessions.length !== expectedSessionCount
    ) {
      return sendJson(response, 502, {
        error:
          "Gemini returned an incomplete weekly schedule. Please try again.",
      });
    }

    let recommendations =
      normalizeRecommendations(
        generatedPlan.recommendations
      );

    if (recommendations.length < 3) {
      recommendations = [
        ...recommendations,
        "Review your progress at the end of every study session.",
        "Record difficult topics in your notes and revisit them during the next session.",
        "Complete at least one practical exercise for every major lesson.",
      ].slice(0, 5);
    }

    const plan = {
      id: createId("plan"),
      createdAt: new Date().toISOString(),
      generatedBy: "gemini",
      model: GEMINI_MODEL,
      usedUrlContext:
        publicCourseUrls.length > 0,
      title:
        cleanText(generatedPlan.title, 180) ||
        `${pace} AI Study Plan`,
      targetDate,
      hoursPerWeek,
      pace,
      weeksAvailable,
      sourceCourses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        sourceUrl: course.sourceUrl,
      })),
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

    if (error?.name === "AbortError") {
      return sendJson(response, 504, {
        error:
          "Gemini took too long to inspect the course sources. Try selecting fewer courses.",
      });
    }

    if (error instanceof SyntaxError) {
      return sendJson(response, 400, {
        error:
          "The server received invalid request data.",
      });
    }

    return sendJson(response, 500, {
      error:
        "The server could not generate the study plan.",
    });
  }
}