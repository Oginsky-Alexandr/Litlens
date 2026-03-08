# Mobile-first UI

> Branch: `feat/mobile-first`
> Created: 2026-03

## Goal

Switch from desktop-first layout to mobile-first: base styles for narrow viewport, Library in a left drawer on mobile, context buttons next to the chat input (Claude-like), then enhance for tablet and desktop. See [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md) for shared principles.

## Key decisions (approved)

- **Mobile-first CSS**: Base styles target small viewport (~320–768px); tablet/desktop use `@media (min-width: 768px)` and `@media (min-width: 1024px)`.
- **Library on mobile**: Shown in a **left drawer** (overlay). Opened by burger in header; closes on overlay click or Escape. On desktop, library stays as fixed sidebar in layout.
- **Context buttons on mobile**: Not in header. Placed in the **input zone** — below (or above) the chat input when in Chat; in Journey without chat, in a fixed bottom bar. Horizontal row of pill buttons (6 types + Chat), Claude-like. On desktop, only the header prompt-bar (7 buttons) remains.
- **Separate branch**: All work in `feat/mobile-first`; follow this branch plan (per .cursorrules).

---

## Breakpoints

| Name    | Media query           | Usage |
|---------|------------------------|--------|
| Mobile  | default (no query)    | Single column, full-width main, compact header, drawer for Library, context buttons by input. |
| Tablet  | `min-width: 768px`    | Optional intermediate; can match desktop if not needed. |
| Desktop | `min-width: 1024px`  | Sidebar in flow (280px), prompt-bar in header (7 buttons). Optionally `1200px` for 7-column prompt bar. |

---

## Layout: Mobile vs Desktop

### Mobile (default)

- **Header**: Logo + burger (opens Library drawer). No context buttons in header.
- **Library**: Rendered in overlay as a left drawer (same content as desktop sidebar). State: `drawerOpen`; burger toggles, overlay/Escape close.
- **Main**: Full width, horizontal padding (e.g. 16px). Card full width or `max-width: 100%`.
- **Context buttons**: In journey — in a bar near the input (bottom bar when no chat; below/above chat input when in Chat). Pill buttons, min touch target 44px; wrap or horizontal scroll if needed.

### Desktop (`min-width: 1024px`)

- **Header**: Left block 280px (logo + “POWERED BY DEEPSEEK”), right block = prompt-bar with 7 buttons (unchanged).
- **Library**: `<aside class="library-panel">` inside `.app-layout`, always visible, 280px.
- **Main**: Centered, `.card` max-width 676px. Scroll rules unchanged (see [UI-LAYOUT.md](../UI-LAYOUT.md)).
- **Context buttons**: Only in header (no duplicate row by input).

---

## DOM (mobile variant, when drawer is used)

- **Header**: `.app-header` with `.app-header-left` (logo + burger button) and `.app-header-right` (empty or minimal on mobile).
- **Body**: `.app-layout` contains only `.right-container` on mobile (no visible sidebar in flow). Library content is either:
  - Rendered inside a drawer overlay (e.g. `.drawer-overlay` + `.library-drawer`), or
  - Same `<aside class="library-panel">` but wrapped/positioned as fixed overlay and shown only when `drawerOpen`; hidden via class + media so on desktop it stays in flow.
- **Context buttons (mobile)**: New block e.g. `.prompt-bar-inline` or `.context-pill-row` — only rendered when viewport is mobile and `status === "journey"`. Placed above or below chat input in Chat; in a fixed bottom bar in Journey without chat.

---

## Implementation phases

| Phase | Content |
|-------|---------|
| **1. Documentation and breakpoints** | Branch + this doc; update [UI-LAYOUT.md](../UI-LAYOUT.md) with Mobile vs Desktop and mobile DOM. |
| **2. CSS mobile-first** | Base layer in App.css for mobile (single column, no 280px), then `min-width` blocks for tablet/desktop. Keep current header/library in DOM temporarily so narrow viewport doesn’t break. |
| **3. Context buttons by input (Claude-like)** | On mobile: remove 7 buttons from header; add context row (6 + Chat) in input zone (pill buttons). On desktop: keep prompt-bar in header. |
| **4. Library drawer** | On viewport &lt; 768px (or 1024px): hide library from flow, show in left drawer; burger opens/closes. Desktop unchanged. |
| **5. Polish** | Touch targets, context/chat heights on mobile, scroll reset and `main--journey` per UI-LAYOUT. Update UX-IDEOLOGY if needed. |

---

## Files to touch

- **sage-read-app/src/App.js**: Conditional header (mobile: logo + burger; desktop: prompt-bar). Context buttons in input zone on mobile. Library in drawer on mobile; state `drawerOpen`.
- **sage-read-app/src/App.css**: Mobile-first base; classes for drawer, context pill row; `min-width` media queries.
- **docs/UI-LAYOUT.md**: Section “Mobile vs Desktop”, mobile DOM, key classes (drawer, prompt-bar-inline / context-pill-row).

---

## Git strategy

- **Branch**: `feat/mobile-first` from `master`.
- **Merge**: After review and manual checks (mobile layout, drawer, context buttons by input, desktop unchanged).
  - `git checkout master && git merge feat/mobile-first`.

---

*Reference: [docs/UI-LAYOUT.md](../UI-LAYOUT.md), [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md).*
