# LitLense — UI layout and conventions

Use this document when changing the frontend layout or styling. Keep it in sync with [sage-read-app/src/App.js](sage-read-app/src/App.js) and [sage-read-app/src/App.css](sage-read-app/src/App.css).

---

## 1. DOM structure (high level)

```
body
├── header.app-header
│   ├── .app-header-left (logo + "POWERED BY DEEPSEEK")
│   └── .app-header-right
│       └── .prompt-bar (6 context buttons + Chat button, always visible)
└── .app-layout (flex row)
    ├── aside.library-panel (fixed width 280px)
    │   └── .pinned-book (clickable contexts → open chat; shows compact type + topic labels, not full text) / .library-placeholder
    └── .right-container (flex: 1, column)
        └── main.main [ref: mainRef]
            └── .card
                └── .card-content
                    └── [idle | loading | confirmed | Journey | Chat]
```

- **Header**: Left block (280px) aligns with library panel width; right block holds the seven buttons (6 context + Chat) and fills remaining width. Has `flex-shrink: 0` so layout below has stable height. The prompt bar is always visible to outline the workspace structure; buttons become interactive only in journey mode.
- **Body**: `display: flex; flex-direction: column; height: 100vh` so that `#root` and then `.app-layout` can take the remaining space.
- **#root**: Must have `flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden`. Without this, the root div grows with content and the height constraint never reaches the library panel, so no scrollbar and the Reset button becomes unreachable after more content is added.
- **Library panel**: Always 280px (`flex: 0 0 280px`), **`min-height: 0`** (required so the flex item can shrink and overflow), `overflow-y: auto`; shows pinned book and accumulated contexts including the "Reset session" button. Each context renders as a compact, clickable row with a small type label (Historical / Cultural / Characters / References / Quotes / Lesson / Chat), a short topic label (1–3 words) derived from its content, and (optionally) a mini table-of-contents — a list of short section titles (1–3 words) for each saved chunk from chat. Full text never appears in the sidebar; it is visible only in the main area (Journey / Chat). Without `min-height: 0` the panel does not get a scrollbar and the button can be unreachable.
- **Main**: Scrollable (`overflow-y: auto`). Single child is `.card`. In journey mode, `main` gets class `main--journey`.

---

## 2. Mobile vs Desktop

Layout is **mobile-first**: base styles for narrow viewport; desktop uses `@media (min-width: 1024px)` (and optionally `768px` for tablet).

### Breakpoints

- **Mobile**: default, up to ~768px.
- **Desktop**: `min-width: 1024px` — sidebar in flow, prompt-bar in header.

### Mobile layout

- **Header**: Logo + burger only. Burger opens the Library drawer. No context buttons in header.
- **Library**: Shown in a **left drawer** (overlay). Same content as desktop sidebar; drawer opens/closes via state (e.g. `drawerOpen`). Close on overlay click or Escape.
- **Main**: Full width with horizontal padding (e.g. 16px). Card full width or `max-width: 100%`. Scroll rules (section 3) unchanged.
- **Context buttons**: Rendered in the **input zone** — in Chat, below or above the chat input (Claude-like pill row); in Journey without chat, in a fixed bottom bar. Classes: e.g. `.prompt-bar-inline` or `.context-pill-row`. Not duplicated on desktop.

### Mobile DOM (when drawer is used)

- `.app-header`: `.app-header-left` (logo + burger), `.app-header-right` empty or minimal.
- `.app-layout`: On mobile only `.right-container` is visible in flow; library is in an overlay (e.g. `.drawer-overlay` + `.library-drawer`, or the same `.library-panel` positioned fixed and toggled by class).
- Context buttons: a dedicated block (e.g. `.context-pill-row`) only when viewport is mobile and in journey; placed in the input zone (bottom bar or next to chat input).

### Desktop layout (`min-width: 1024px`)

- Unchanged from section 1: header with 280px left block and prompt-bar (7 buttons), sidebar in flow (280px), main with centered card (max-width 676px).

---

## 3. Main content area and journey

- **Default (non-journey)**: `.main` uses `align-items: center` and `justify-content: center` — card is vertically and horizontally centered.
- **Journey mode** (`status === "journey" && pinnedBook`):
  - `main` must have class **`main--journey`**.
  - `.main--journey` uses **`align-items: flex-start`** so content is **top-aligned**, not centered. This prevents the "shifting down" bug where Loading / Confirm section would move down after each context button use.
  - `.main--journey .card` uses **`align-self: flex-start`** so the card sticks to the top.

Do not remove `main--journey` or re-center the main content in journey mode; it will bring back cumulative layout shift.

- **Chat mode** (`status === "journey" && pinnedBook && activeChatThreadId`):
  - Chat replaces Journey content inside `.card-content`.
  - Uses the same `main--journey` layout (top-aligned).
  - Entry points: click pinned context in sidebar (context chat), or Chat button in header (general chat).
  - Clicking a context button in header closes chat and returns to Journey view.

---

## 4. Scroll behavior

- **Scroll container**: The only scrollable area for the main content is **`main.main`** (ref `mainRef`).
- **Reset on context change**: Whenever `contextData` changes (new context loaded or cleared after Confirm), `mainRef.current.scrollTop` must be set to `0` (in a `useEffect`). Use a double `requestAnimationFrame` so the reset runs after layout/paint.
- **Context result block**: Inside Journey, when showing context:
  - `.context-result` has three parts: `.context-header`, `.context-scrollable`, `.context-footer` (Confirm button).
  - Only **`.context-scrollable`** scrolls (long text). It must have `flex: 1`, `overflow-y: auto`, `min-height: 0`, and a ref that resets its `scrollTop` to `0` when `contextData` changes so each new context loads from the top.

---

## 5. Context result block (confirm section)

- **`.context-result`** must have a **fixed height** for inner flex to work: use both `height` and `max-height` (e.g. `min(70vh, calc(100vh - 250px))`). Include **`min-height: 0`** so it can shrink in flex layouts.
- **`.context-scrollable`** is the only scrollable part; header and footer are `flex-shrink: 0`. Do not make the whole card scroll without keeping the Confirm button in a fixed footer.
- **Card width**: `.card` uses `max-width: 676px` (about 30% wider than the original 520px) so the confirm section can show more content.

---

## 6. Known pitfalls (do not)

- **Do not** vertically center the main content in journey mode (`align-items: center` on `main` when `main--journey` is applied). It causes the Loading / Confirm block to shift down repeatedly.
- **Do not** rely only on `max-height` for `.context-result` without an explicit `height` in the same value; the inner flex child (`.context-scrollable`) needs a definite parent height for scrolling to work.
- **Do not** forget to reset scroll (both `main` and `.context-scrollable`) when `contextData` changes; otherwise the view stays scrolled and the section appears to "move down".
- **Do not** remove the `main--journey` class from `main` when in journey; keep it in sync with `status === "journey" && pinnedBook`.
- **Do not** show Chat and Journey simultaneously; `activeChatThreadId` controls which one renders.

---

## 7. Key CSS classes (quick reference)

| Class | Purpose |
|-------|---------|
| `app-header`, `app-header-left`, `app-header-right` | Header; left 280px, right flex. |
| `prompt-bar`, `prompt-button`, `prompt-button--active` | 7 buttons in header (always visible); active state for Chat. Context buttons and Chat are only interactive in journey mode. |
| `library-panel`, `pinned-book`, `pinned-context` | Left sidebar; contexts are clickable (open chat) and show type + short topic label. |
| `main`, `main--journey` | Main scroll area; journey = top-aligned. |
| `card`, `card-content` | White card; content area. |
| `context-result`, `context-header`, `context-scrollable`, `context-footer` | Confirm section: label, scrollable text, fixed Confirm button. |
| `chat-container`, `chat-messages`, `chat-input-bar` | Chat view: messages list, sticky input bar. |
| `chat-message--user`, `chat-message--assistant`, `chat-message--streaming` | Chat message variants. |
| `chat-save-button`, `chat-saved-label` | Save to context button and saved state on AI messages. |
| `library-drawer`, `drawer-overlay` (mobile) | Left drawer for Library on mobile; overlay behind it. |
| `context-pill-row` / `prompt-bar-inline` (mobile) | Row of context + Chat buttons next to chat input or in bottom bar; mobile only. |

---

*Last updated: feat/mobile-first — mobile-first layout, Library drawer, context buttons by input (branch plan in docs/branches/feat-mobile-first.md).*
