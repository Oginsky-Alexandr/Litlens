import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "ok" });
});

// Main endpoint
app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "NO_TEXT",
        message: "No text provided",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, an intelligent and welcoming reading companion.

Your task is to determine whether you recognize the book the user mentions.

If you clearly recognize the book:
- Return a JSON object with:
  - recognized: true
  - title: the book title
  - author: the author
  - meta: short context (genre · year · country)
  - language: the language the user is writing in (e.g. "Russian", "English", "French"). Detect this from the user's input text, not from the book's origin.
  - welcomeText: a warm, inviting message (1â€“2 sentences max) that reassures the reader they are beginning a meaningful reading journey.
    Mention the book naturally and briefly allude to 1â€“2 central themes or qualities and its historical or cultural context in a subtle, non-academic way.

If you are not confident which book the user means:
- Return a JSON object with:
  - recognized: false
  - welcomeText: a gentle, reassuring message that invites the reader to continue anyway.

IMPORTANT RULES:
- Respond with valid JSON only.
- Do not include explanations or extra text.
- Do not wrap the JSON in markdown.
- Return title, author, meta, and welcomeText in the same language as the user's input.
`,
        },
        { role: "user", content: text },
      ],
    });

    const raw = completion.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn("LLM returned invalid JSON:", raw);

      return res.json({
        ok: true,
        book: { recognized: false },
        welcome: {
          text: "Iâ€™m not fully sure which book you mean yet, but we can still begin together.",
        },
      });
    }

    res.json({
      ok: true,
      book: parsed.recognized
        ? {
            recognized: true,
            title: parsed.title,
            author: parsed.author,
            meta: parsed.meta,
            language: parsed.language,
          }
        : {
            recognized: false,
          },
      welcome: {
        text: parsed.welcomeText,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Characters context endpoint
app.post("/api/context/characters", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to provide an overview of the main characters in a book in a warm, accessible way.

Write ONE paragraph (4-6 sentences) that:
- Introduces the main characters and their key roles
- Describes their relationships and how they interact
- Explains how these characters relate to the book's central themes
- Uses a conversational, engaging tone (not academic)

Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "characters",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// References context endpoint
app.post("/api/context/references", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to provide information about literary, historical, and cultural references in a book in a warm, accessible way.

Write ONE paragraph (4-6 sentences) that:
- Highlights important references the book makes or belongs to
- Explains literary traditions, movements, or earlier works it connects to
- Describes how these references enrich the reading experience
- Uses a conversational, engaging tone (not academic)

Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "references",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Quotes context endpoint
app.post("/api/context/quotes", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to provide key quotes from a book in a warm, accessible way.

Write a concise selection (2-4 important quotes or paraphrases) with brief commentary. For each quote:
- Present the quote or a close paraphrase
- Add one sentence explaining what it reveals about the book's themes or message
- Use a conversational, engaging tone (not academic)
- Avoid major spoilers beyond early or mid-book themes

Format as a flowing paragraph or short list. Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "quotes",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Lesson context endpoint
app.post("/api/context/lesson", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to explain the central lesson or core takeaway of a book in a warm, accessible way.

Write ONE paragraph (4-6 sentences) that:
- Identifies the book's central lesson or main message
- Explains what readers can learn or take away from it
- Connects the lesson to modern life or personal reflection
- Uses a conversational, engaging tone (not academic)

Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "lesson",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Historical context endpoint
app.post("/api/context/historical", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to provide historical context for a book in a warm, accessible way.

Write ONE paragraph (4-6 sentences) that:
- Describes the historical period when the book was written
- Highlights key socio-political events or movements of that era
- Explains how these historical forces shaped the book's themes or narrative
- Uses a conversational, engaging tone (not academic)

Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "historical",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Cultural context endpoint
app.post("/api/context/cultural", async (req, res) => {
  const { title, author, meta, language } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "MISSING_BOOK_DATA",
        message: "Title and author are required",
      },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `
You are SageRead, a friendly and insightful reading companion.

Your task is to provide cultural context for a book in a warm, accessible way.

Write ONE paragraph (4-6 sentences) that:
- Explores the book's literary legacy and influence
- Discusses its cultural significance and impact
- Connects the work to modern readers and contemporary relevance
- Uses a conversational, engaging tone (not academic)

Do not include a title or heading. Start directly with the content.

IMPORTANT: You MUST write your entire response in ${language || "English"}.
`,
        },
        {
          role: "user",
          content: `Book: "${title}" by ${author}${meta ? `. Context: ${meta}` : ""}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    res.json({
      ok: true,
      context: {
        type: "cultural",
        content,
      },
    });
  } catch (err) {
    console.error("DeepSeek API error:", err);

    res.status(500).json({
      ok: false,
      error: {
        code: "LLM_REQUEST_FAILED",
        message: "LLM request failed",
      },
    });
  }
});

// Chat endpoint — SSE streaming
app.post("/api/chat", async (req, res) => {
  const { title, author, meta, language, contextContent, messages } = req.body;

  if (!title || !author) {
    return res.status(400).json({
      ok: false,
      error: { code: "MISSING_BOOK_DATA", message: "Title and author are required" },
    });
  }

  if (!messages || !messages.length) {
    return res.status(400).json({
      ok: false,
      error: { code: "NO_MESSAGES", message: "Messages array is required" },
    });
  }

  let systemContent = `You are SageRead, a reading companion discussing "${title}" by ${author}.`;
  if (meta) systemContent += `\n${meta}`;
  if (contextContent) {
    systemContent += `\n\nThe following context has been established about this book:\n${contextContent}\n\nContinue the conversation based on this context. Be conversational, insightful, and stay focused on the topic.`;
  }
  systemContent += `\n\nIMPORTANT: Respond in ${language || "English"}.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemContent },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("DeepSeek API stream error:", err);
    res.write(`data: ${JSON.stringify({ error: "LLM stream failed" })}\n\n`);
    res.end();
  }
});

// Chat title generation
app.post("/api/chat/title", async (req, res) => {
  const { content, language } = req.body;

  if (!content) {
    return res.status(400).json({
      ok: false,
      error: { code: "NO_CONTENT", message: "Content is required" },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `Generate a concise title (3-5 words) for the following text.
The title should capture the main topic discussed.
Return ONLY the title text, no quotes, no explanation.
IMPORTANT: Write the title in ${language || "English"}.`,
        },
        { role: "user", content },
      ],
    });

    const generatedTitle = completion.choices[0].message.content.trim();

    res.json({ ok: true, title: generatedTitle });
  } catch (err) {
    console.error("DeepSeek API error:", err);
    res.status(500).json({
      ok: false,
      error: { code: "LLM_REQUEST_FAILED", message: "LLM request failed" },
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
