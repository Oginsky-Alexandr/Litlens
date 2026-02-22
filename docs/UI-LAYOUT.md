# SageRead — UI layout and conventions

Use this document when changing the frontend layout or styling. Keep it in sync with [sage-read-app/src/App.js](sage-read-app/src/App.js) and [sage-read-app/src/App.css](sage-read-app/src/App.css).

---

## 1. DOM structure (high level)

```
body
├── header.app-header
│   ├── .app-header-left (logo + "POWERED BY DEEPSEEK")
│   └── .app-header-right (only when journey)
│       └── .prompt-bar (6 context buttons + Chat button)
└── .app-layout (flex row)
    ├── aside.library-panel (fixed width 280px)
    │   └── .pinned-book (clickable contexts → open chat) / .library-placeholder
    └── .right-container (flex: 1, column)
        └── main.main [ref: mainRef]
            └── .card
                └── .card-content
                    └── [idle | loading | confirmed | Journey | Chat]
```

- **Header**: Left block (280px) aligns with library panel width; right block holds the seven buttons (6 context + Chat) and fills remaining width. Has `flex-shrink: 0` so layout below has stable height.
- **Body**: `display: flex; flex-direction: column; height: 100vh` so that `#root` and then `.app-layout` can take the remaining space.
- **#root**: Must have `flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden`. Without this, the root div grows with content and the height constraint never reaches the library panel, so no scrollbar and the Reset button becomes unreachable after more content is added.
- **Library panel**: Always 280px (`flex: 0 0 280px`), **`min-height: 0`** (required so the flex item can shrink and overflow), `overflow-y: auto`; shows pinned book and accumulated contexts including the "Reset session" button. Without `min-height: 0` the panel does not get a scrollbar and the button can be unreachable.
- **Main**: Scrollable (`overflow-y: auto`). Single child is `.card`. In journey mode, `main` gets class `main--journey`.

---

## 2. Main content area and journey

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

## 3. Scroll behavior

- **Scroll container**: The only scrollable area for the main content is **`main.main`** (ref `mainRef`).
- **Reset on context change**: Whenever `contextData` changes (new context loaded or cleared after Confirm), `mainRef.current.scrollTop` must be set to `0` (in a `useEffect`). Use a double `requestAnimationFrame` so the reset runs after layout/paint.
- **Context result block**: Inside Journey, when showing context:
  - `.context-result` has three parts: `.context-header`, `.context-scrollable`, `.context-footer` (Confirm button).
  - Only **`.context-scrollable`** scrolls (long text). It must have `flex: 1`, `overflow-y: auto`, `min-height: 0`, and a ref that resets its `scrollTop` to `0` when `contextData` changes so each new context loads from the top.

---

## 4. Context result block (confirm section)

- **`.context-result`** must have a **fixed height** for inner flex to work: use both `height` and `max-height` (e.g. `min(70vh, calc(100vh - 250px))`). Include **`min-height: 0`** so it can shrink in flex layouts.
- **`.context-scrollable`** is the only scrollable part; header and footer are `flex-shrink: 0`. Do not make the whole card scroll without keeping the Confirm button in a fixed footer.
- **Card width**: `.card` uses `max-width: 676px` (about 30% wider than the original 520px) so the confirm section can show more content.

---

## 5. Known pitfalls (do not)

- **Do not** vertically center the main content in journey mode (`align-items: center` on `main` when `main--journey` is applied). It causes the Loading / Confirm block to shift down repeatedly.
- **Do not** rely only on `max-height` for `.context-result` without an explicit `height` in the same value; the inner flex child (`.context-scrollable`) needs a definite parent height for scrolling to work.
- **Do not** forget to reset scroll (both `main` and `.context-scrollable`) when `contextData` changes; otherwise the view stays scrolled and the section appears to "move down".
- **Do not** remove the `main--journey` class from `main` when in journey; keep it in sync with `status === "journey" && pinnedBook`.
- **Do not** show Chat and Journey simultaneously; `activeChatThreadId` controls which one renders.

---

## 6. Key CSS classes (quick reference)

| Class | Purpose |
|-------|---------|
| `app-header`, `app-header-left`, `app-header-right` | Header; left 280px, right flex. |
| `prompt-bar`, `prompt-button`, `prompt-button--active` | 7 buttons in header (journey only); active state for Chat. |
| `library-panel`, `pinned-book`, `pinned-context` | Left sidebar; contexts are clickable (open chat). |
| `main`, `main--journey` | Main scroll area; journey = top-aligned. |
| `card`, `card-content` | White card; content area. |
| `context-result`, `context-header`, `context-scrollable`, `context-footer` | Confirm section: label, scrollable text, fixed Confirm button. |
| `chat-container`, `chat-messages`, `chat-input-bar` | Chat view: messages list, sticky input bar. |
| `chat-message--user`, `chat-message--assistant`, `chat-message--streaming` | Chat message variants. |
| `chat-save-button`, `chat-saved-label` | Save to context button and saved state on AI messages. |

---

*Last updated: feat/chat — added Chat UI, per-topic threads, save-to-context with concatenation.*
