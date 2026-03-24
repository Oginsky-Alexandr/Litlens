# Mobile-first UI

> Branch: `feat/mobile-first`
> Created: 2026-03

## Goal

Switch from desktop-first layout to mobile-first: base styles for narrow viewport, Library in a left drawer on mobile, context buttons next to the chat input (Claude-like), then enhance for tablet and desktop. See [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md) for shared principles.

## Key decisions (approved)

- **Mobile-first CSS**: Base styles target small viewport (~320-768px); tablet/desktop use `@media (min-width: 768px)` and `@media (min-width: 1024px)`.
- **Library on mobile**: Shown in a **left drawer** (overlay). Opened by a small Library icon in the header; closes on overlay tap. On desktop, library stays as a fixed sidebar in layout.
- **Context buttons on mobile**: Not in header. Placed in the **input zone** as a `ContextPillRow` (6 types + Chat) near the input: in Journey without an open chat, above the "Continue journey" block; in Chat, directly above the chat input. On desktop, only the header prompt-bar remains (7 buttons).
- **Separate branch**: All work in `feat/mobile-first`; follow this branch plan (per .cursorrules).

---

## Breakpoints

| Name    | Media query            | Usage |
|---------|------------------------|-------|
| Mobile  | default (no query)     | Single column, full-width main, compact header, drawer for Library, context buttons by input. |
| Tablet  | `min-width: 768px`     | Optional intermediate; can match desktop if not needed. |
| Desktop | `min-width: 1024px`    | Sidebar in flow (280px), prompt-bar in header (7 buttons). Optionally `1200px` for 7-column prompt bar. |

---

## Layout: Mobile vs Desktop

### Mobile (default)

- **Header**: Three zones: a small Library icon on the left (`.app-header-left-zone`), centered logo + "POWERED BY DEEPSEEK" (`.app-header-logo`), and a utility area on the right (`.app-header-right`, usually empty on mobile).
- **Library**: Rendered in an overlay as a left drawer (`.library-drawer-overlay` + `.library-drawer`) with the same content as the desktop sidebar. On mobile, `library-panel` is hidden from the main flow.
- **Main**: Full width, horizontal padding (e.g. 16px). Card full width or `max-width: 100%`.
- **Context buttons**: In Journey and Chat, use `ContextPillRow` (pill buttons, minimum touch target 44px), rendered in content near the input, not in the header. This row is absent on desktop.

### Desktop (`min-width: 1024px`)

- **Header**: Left block 280px (logo + "POWERED BY DEEPSEEK"), right block = prompt-bar with 7 buttons (unchanged).
- **Library**: `<aside class="library-panel">` inside `.app-layout`, always visible, 280px.
- **Main**: Centered, `.card` max-width 676px. Scroll rules unchanged (see [UI-LAYOUT.md](../UI-LAYOUT.md)).
- **Context buttons**: Only in header (no duplicate row by input).

---

## DOM (mobile variant, when drawer is used)

- **Header**: `.app-header` with three zones:
  - `.app-header-left-zone` - Library drawer button (books icon),
  - `.app-header-logo` - logo + "POWERED BY DEEPSEEK",
  - `.app-header-right` - empty on mobile; contains `prompt-bar` on desktop.
- **Body**: `.app-layout` contains only `.right-container` in the normal flow; `<aside class="library-panel">` is used as the content source, but on mobile it is rendered in an overlay (`.library-drawer-overlay` + `.library-drawer`) and hidden from the flow layout.
- **Context buttons (mobile)**: `.context-pill-row` renders only in Journey/Chat and only on mobile; in Journey without an active chat it is above the `Continue journey` block, in Chat it is above the chat input. There are no context buttons in the header.

---

## Implementation phases

| Phase | Content |
|-------|---------|
| **1. Documentation and breakpoints** | Branch + this doc; update [UI-LAYOUT.md](../UI-LAYOUT.md) with Mobile vs Desktop and mobile DOM. |
| **2. CSS mobile-first** | Base layer in App.css for mobile (single column, no 280px), then `min-width` blocks for tablet/desktop. Keep current header/library in DOM temporarily so narrow viewport does not break. |
| **3. Context buttons by input (Claude-like)** | On mobile: remove 7 buttons from header; add context row (6 + Chat) in input zone (pill buttons). On desktop: keep prompt-bar in header. |
| **4. Library drawer** | On viewport < 768px (or 1024px): hide library from flow, show in a left drawer; icon opens/closes. Desktop unchanged. |
| **5. Polish** | Touch targets, context/chat heights on mobile, scroll reset and `main--journey` per UI-LAYOUT. Update UX-IDEOLOGY if needed. |

---

## Files to touch

- **sage-read-app/src/App.js**: Conditional header (mobile: three zones with a Library icon; desktop: prompt-bar in the right zone). Context buttons in the input zone on mobile (`ContextPillRow`). Library in a mobile drawer; state `isLibraryOpen`.
- **sage-read-app/src/App.css**: Mobile-first base; classes for drawer (`.library-drawer-overlay`, `.library-drawer`), header zones, context pill row; `min-width` media queries.
- **docs/UI-LAYOUT.md**: Section "Mobile vs Desktop", mobile DOM, key classes (header zones, drawer, `.context-pill-row`).

---

## Desktop: no regressions

Mobile changes must not break the current desktop experience.

- **Isolation**: Mobile-specific changes must either be content-only (no layout/CSS shift), or desktop styles/markup must explicitly reproduce current behavior inside `@media (min-width: 1024px)` (header 280px + prompt-bar, sidebar 280px in flow, centered main, card 676px).
- **Pre-merge check**: At viewport >=1024px, run the scenario: idle -> book input -> confirm -> journey -> select context -> chat. Visuals and behavior must match `master` (no visual or functional differences).

---

## Git strategy

- **Branch**: `feat/mobile-first` from `master`.
- **Merge**: After review and manual checks (mobile layout, drawer, context buttons by input, desktop unchanged).
  - `git checkout master && git merge feat/mobile-first`.

---

*Reference: [docs/UI-LAYOUT.md](../UI-LAYOUT.md), [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md).*
