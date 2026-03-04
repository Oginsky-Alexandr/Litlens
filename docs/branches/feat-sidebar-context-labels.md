# Sidebar context labels and LitLense branding

> Branch: `feat/sidebar-context-labels`
> Created: 2026-03

## Key decisions (approved)

- **Library panel**: Each pinned context is shown as a compact row with a type label (e.g. MAIN CHARACTERS, REFERENCES) and a short topic title (1–3 words). Full context text is not rendered in the sidebar; it is visible only in the main area (Journey / Chat).
- **Topic and section titles**: The frontend calls `POST /api/chat/title` to generate a short title for the context as a whole and for each saved chunk from chat. Titles are clamped to 1–3 words via `clampTitleWords`. No `contextType` or other per-type prompt hack; one universal prompt for all contexts.
- **Sections (mini TOC)**: Contexts may have an optional `sections` array `[{ id, title }]`. Sections are populated when the user saves a chat reply to context; the first chunk (initial context body) does not create a section. Chunks in content are separated by `\n\n---\n\n`; the UI styles `hr` in `.chat-message-content` and `.context-content` for visibility.
- **Branding**: App name is **LitLense** (two capital L’s). Document title is dynamic: current book title + " — LitLense" when a book is set, otherwise "LitLense". Logo and all user-facing "SageRead" strings are replaced with LitLense. Static assets: `index.html` default title and `manifest.json` name/short_name set to LitLense.
- **Copy and UX**: Both confirmation flows use the button label "← Put in Library context" (book confirmation and context-result). Hint "CLICK TO UNLOCK CONTEXTUAL INSIGHTS" is brighter. An upward arrow above "Continue journey" points to the context buttons. "LIBRARY CONTEXT" and section labels in the sidebar use darker text for readability.

---

## State and data model

- **`pinnedBook.contexts`**: Array of `{ id, type, title, content, sections? }`. `title` is the short topic (1–3 words). `sections` is optional: `[{ id, title }]` for saved chunks only.
- **Document title**: `useEffect` in `App.js` sets `document.title` from `pinnedBook?.title`, else `result?.book?.title` (confirmed step), else `"LitLense"`.
- **Backend**: No new endpoints. `POST /api/chat/title` is reused for context and section titles; prompt is universal (topic-focused, 1–3 words, avoid book title unless text is about the book).

---

## Changes by layer

### 1. Frontend — App.js

- **Sidebar**: Render each context as type label + `ctx.title`; if `ctx.sections?.length`, render list `.context-sections` with `.context-section-item` (no full text).
- **confirmContext**: On confirm, create context with provisional title; then async call `/api/chat/title` and update `ctx.title` (and do not add a first section). `sections` are added only when saving from chat via `addSectionToContext`.
- **saveToContext**: On save (context or general chat), call `addSectionToContext` for the new chunk; for new chat context, set `sections: [{ id, title }]`. Content still concatenated with `\n\n---\n\n`.
- **addSectionToContext**: Calls `/api/chat/title` for the chunk text and appends `{ id, title }` to the context’s `sections`.
- **Branding**: Header logo "LitLense"; "POWERED BY DEEPSEEK" under it (via `.app-header-left` column layout). Chat assistant label and error copy use "LitLense". Buttons: "← Put in Library context" on book confirmation and context-result. Journey default: arrow div (↑) above "Continue journey".

### 2. Frontend — App.css

- **Header**: `.app-header-left` — `flex-direction: column`, `align-items: flex-start`, `gap: 2px`. `.app-header strong` — larger font (e.g. 24px).
- **Library panel**: `.library-title` — darker color (e.g. `#6c7a7d`). `.context-section-item` — darker and `font-weight: 500`. `.context-topic-title`, `.context-sections` for compact list.
- **Separators**: `.chat-message-content hr`, `.context-content hr` — visible rule (margin, border-top).
- **Journey**: `.journey-arrow` — size 48px, color, weight. **Confirmation**: `.hint-unlock` — brighter color.

### 3. Static assets

- **`public/index.html`**: `<title>LitLense</title>`, meta description "LitLense — your reading companion".
- **`public/manifest.json`**: `short_name` and `name` set to `"LitLense"`.

### 4. Optional component

- **SageReadBookSetup.jsx**: Visible app name set to "LitLense" for consistency.

### 5. Documentation

- **docs/UI-LAYOUT.md**: Library panel describes compact type + topic label and optional sections (mini TOC); no full text in sidebar. Header describes LitLense and POWERED BY DEEPSEEK layout. Key classes include `context-sections`, `context-section-item`, `journey-arrow`.
- **docs/API.md**: `/api/chat/title` described as used for context and section labels; request body remains `content`, `language` (no `contextType`).

---

## Git strategy

- **Branch**: `feat/sidebar-context-labels` from `master`.
- **Merge**: After review and manual checks (sidebar labels, sections, document title, LitLense branding, buttons, arrow, readability).
  - `git checkout master && git merge feat/sidebar-context-labels`.

---

*Reference: [docs/UI-LAYOUT.md](../UI-LAYOUT.md), [docs/API.md](../API.md), [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md).*
