# LitLense — UI layout and conventions

Use this document when changing the frontend layout or styling. Keep it in sync with [sage-read-app/src/App.js](sage-read-app/src/App.js) and [sage-read-app/src/App.css](sage-read-app/src/App.css).

---

## 1. DOM structure (high level)

Desktop и mobile используют одну и ту же структуру DOM, но с разными классами/медиа‑правилами.

```text
body
├── header.app-header
│   ├── .app-header-left-zone   (Library icon button; hidden on desktop)
│   ├── .app-header-logo        (logo + "POWERED BY DEEPSEEK")
│   └── .app-header-right       (prompt-bar on desktop, empty on mobile)
└── .app-layout (flex row)
    ├── aside.library-panel     (sidebar in flow only on desktop)
    │   └── .pinned-book (clickable contexts → open chat; shows compact type + topic labels, not full text) / .library-placeholder
    └── .right-container (flex: 1, column)
        └── main.main [ref: mainRef]
            └── .card
                └── .card-content
                    └── [idle | loading | confirmed | Journey | Chat]
```

- **Header**: На мобиле иконка Library расположена в `.app-header-left-zone`, логотип по центру, правая зона пустая. На десктопе левая зона скрыта, `.app-header-logo` занимает 280px слева, а `.app-header-right` содержит prompt‑bar (7 кнопок) и занимает оставшуюся ширину. Header имеет `flex-shrink: 0` чтобы ниже лэйаут был стабильным по высоте.
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

- **Header**: Library‑иконка слева (`.app-header-left-zone`), по центру — логотип `LitLense` + «POWERED BY DEEPSEEK» (`.app-header-logo`), справа — пустая зона (`.app-header-right`). Prompt‑bar в header на мобиле не показывается.
- **Library**: Shown in a **left drawer** (overlay). Контейнеры: `.library-drawer-overlay` (затемнение) + `.library-drawer` (панель). Внутри рендерится тот же `LibraryPanelContent`, что и desktop sidebar; drawer открывается и закрывается через `isLibraryOpen`, закрытие по тапу на overlay и по выбору сохранённого контекста.
- **Main**: Full width with horizontal padding (e.g. 16px). Card full width or `max-width: 100%`. Scroll rules (section 3) unchanged. Чатовый input‑bar (`.chat-input-bar`) фиксируется внизу viewport’а; у `.main` есть дополнительный `padding-bottom`, чтобы контент не прятался под ним.
- **Context buttons**: Rendered в **input zone** и только на мобиле: `ContextPillRow` / `.context-pill-row` — Claude‑подобная строка пилюль (Historical, Cultural… + Chat). В Journey без открытого чата — над блоком `Continue journey`, в Chat — над чат‑инпутом. Не дублируется в header и отсутствует на десктопе.

### Mobile DOM (when drawer is used)

- `.app-header`: `.app-header-left-zone` (Library icon button), `.app-header-logo` (logo + powered‑by), `.app-header-right` (empty on mobile).
- `.app-layout`: On mobile only `.right-container` is visible in flow; library is in an overlay (`.library-drawer-overlay` + `.library-drawer`). `<aside class="library-panel">` остаётся источником данных и снова используется как sidebar на десктопе.
- Context buttons: блок `.context-pill-row` рендерится только на мобиле, когда выбран pinned book и статус Journey/Chat; расположен в контенте карты рядом с чат‑инпутом, а не в header.

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
| `app-header`, `app-header-left-zone`, `app-header-logo`, `app-header-right` | Header zones (mobile: icon + centered logo; desktop: logo 280px + prompt‑bar справа). |
| `prompt-bar`, `prompt-button`, `prompt-button--active` | 7 buttons in header (desktop); active state for Chat. Context buttons and Chat are only interactive in journey mode. |
| `library-panel`, `pinned-book`, `pinned-context` | Left sidebar (desktop) и контент для Library drawer; contexts are clickable (open chat) and show type + short topic label. |
| `main`, `main--journey` | Main scroll area; journey = top-aligned. |
| `card`, `card-content` | White card; content area. |
| `context-result`, `context-header`, `context-scrollable`, `context-footer` | Confirm section: label, scrollable text, fixed Confirm button. |
| `chat-container`, `chat-messages`, `chat-input-bar` | Chat view: messages list, input bar (fixed to bottom on mobile). |
| `chat-message--user`, `chat-message--assistant`, `chat-message--streaming` | Chat message variants. |
| `chat-save-button`, `chat-saved-label` | Save to context button and saved state on AI messages. |
| `library-drawer`, `library-drawer-overlay` (mobile) | Left drawer for Library on mobile; overlay behind it. |
| `context-pill-row` (mobile) | Row of context + Chat buttons рядом с чат‑инпутом; mobile only. |

---

*Last updated: feat/mobile-first — mobile-first layout, Library drawer (header icon + left overlay), fixed bottom chat input on mobile, context buttons by input (branch plan in docs/branches/feat-mobile-first.md).*
