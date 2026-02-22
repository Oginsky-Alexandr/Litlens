# SageRead Backend API

Base URL: `http://localhost:4000` (or your `PORT`).

All JSON endpoints use `Content-Type: application/json`. CORS is enabled.

---

## Health

### GET /api/health

No body.

**Response** `200`:
```json
{ "ok": true, "status": "ok" }
```

---

## Book recognition

### POST /api/analyze

Recognizes the book from user text (e.g. "1984 - George Orwell") and returns title, author, meta, and a welcome message.

**Request body:**
```json
{ "text": "1984 - George Orwell" }
```

**Response** `200` (success):
```json
{
  "ok": true,
  "book": {
    "recognized": true,
    "title": "1984",
    "author": "George Orwell",
    "meta": "Dystopian fiction · 1949 · United Kingdom"
  },
  "welcome": { "text": "..." }
}
```

If the book is not confidently recognized:
```json
{
  "ok": true,
  "book": { "recognized": false },
  "welcome": { "text": "..." }
}
```

**Errors:**
- `400` — missing body or `text`:
  ```json
  { "ok": false, "error": { "code": "NO_TEXT", "message": "No text provided" } }
  ```
- `500` — LLM request failed:
  ```json
  { "ok": false, "error": { "code": "LLM_REQUEST_FAILED", "message": "LLM request failed" } }
  ```

---

## Context (by type)

All context endpoints share the same request shape and error handling. They return a block of text for the given book and context type.

### POST /api/context/:type

**Supported types:** `historical`, `cultural`, `characters`, `references`, `quotes`, `lesson`.

**Request body:**
```json
{
  "title": "1984",
  "author": "George Orwell",
  "meta": "Dystopian fiction · 1949 · United Kingdom"
}
```

- **title**, **author** — required.
- **meta** — optional (genre · year · country or similar).

**Response** `200`:
```json
{
  "ok": true,
  "context": {
    "type": "historical",
    "content": "One or more paragraphs of text..."
  }
}
```

**Errors:**
- `400` — missing `title` or `author`:
  ```json
  { "ok": false, "error": { "code": "MISSING_BOOK_DATA", "message": "Title and author are required" } }
  ```
- `500` — LLM request failed (same shape as `/api/analyze`).

---

## Chat (SSE streaming)

### POST /api/chat

Streaming chat endpoint. Accepts book info, optional context, and message history. Returns an SSE stream of tokens.

**Request body:**
```json
{
  "title": "1984",
  "author": "George Orwell",
  "meta": "Dystopian fiction · 1949",
  "language": "Russian",
  "contextContent": "Optional pinned context text...",
  "messages": [
    { "role": "user", "content": "О чём эта книга?" }
  ]
}
```

- **title**, **author** — required.
- **meta** — optional.
- **language** — response language (default: English).
- **contextContent** — optional. The accumulated text of the pinned context this chat thread is bound to. Omit for general chat.
- **messages** — required, non-empty. Full chat history in OpenAI format (role: `user` | `assistant`).

**Response:** `200` SSE stream (`Content-Type: text/event-stream`)
```
data: {"token":"Образ"}

data: {"token":" Воланда"}

data: {"token":" формировался"}

...

data: [DONE]
```

Each `data:` line contains a JSON object with a `token` field. The final event is `[DONE]`.

**Errors:**
- `400` — missing `title`/`author` or empty `messages`:
  ```json
  { "ok": false, "error": { "code": "MISSING_BOOK_DATA", "message": "Title and author are required" } }
  ```
- Stream error — sent as SSE event before closing:
  ```
  data: {"error":"LLM stream failed"}
  ```

---

## Chat title generation

### POST /api/chat/title

Generates a short title (3-5 words) for a chat message to be saved as a pinned context.

**Request body:**
```json
{
  "content": "Образ Воланда формировался под влиянием ключевых процессов 1930-х годов...",
  "language": "Russian"
}
```

- **content** — required. The AI response text to generate a title for.
- **language** — optional (default: English).

**Response** `200`:
```json
{
  "ok": true,
  "title": "Воланд и 1930-е"
}
```

**Errors:**
- `400` — missing `content`:
  ```json
  { "ok": false, "error": { "code": "NO_CONTENT", "message": "Content is required" } }
  ```
- `500` — LLM request failed (same shape as other endpoints).

---

## Summary

| Method | Path                     | Purpose                     |
|--------|--------------------------|-----------------------------|
| GET    | /api/health              | Health check                 |
| POST   | /api/analyze             | Recognize book from text     |
| POST   | /api/context/historical  | Historical context           |
| POST   | /api/context/cultural    | Cultural context             |
| POST   | /api/context/characters  | Main characters              |
| POST   | /api/context/references  | References                   |
| POST   | /api/context/quotes      | Key quotes                   |
| POST   | /api/context/lesson      | Key lesson                   |
| POST   | /api/chat                | Chat (SSE streaming)         |
| POST   | /api/chat/title          | Generate title for chat save |

Implementation: [sage-read-backend/server.js](../sage-read-backend/server.js).
