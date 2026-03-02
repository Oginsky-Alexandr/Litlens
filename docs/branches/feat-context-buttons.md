# Context buttons: always visible

> Branch: `feat/context-buttons`
> Created: 2026-03-02

## Key decisions (approved)

- **Context panel in the header** (`app-header-right` + `.prompt-bar`) is **always visible** in all app states (including the very first screen before the book is entered).
- **6 context buttons + Chat**:
  - On the first screen / before recognition / on the confirmation screen — **visible but disabled**.
  - In **journey** mode when a `pinnedBook` exists — context buttons are enabled (with `contextLoading` taken into account), Chat is enabled.
- **Backend stays unchanged**; only frontend and documentation are modified.
- **Ideology**: immediately exposes the workspace structure (6 context types + Chat) as per [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md), even before the book is recognized.

---

## State-by-state behavior

- **`idle` (first screen)**:
  - Card with “Which book are you reading?” + input field and `Start Analysis` button.
  - In the header: logo on the left, `.prompt-bar` with 6 contexts and Chat on the right — **all disabled**.
- **`loading` (analysis in progress)**:
  - Main card shows “Preparing your reading journey...”.
  - `.prompt-bar` remains visible; all 7 buttons are still disabled.
- **`confirmed` (book confirmation screen)**:
  - `Confirmation` card with book details and `Confirm & Continue →` button.
  - `.prompt-bar` is still visible; all 7 buttons disabled.
- **`journey` (after Confirm & Continue)**:
  - `main` in `main--journey` mode, showing Journey or Chat.
  - 6 context buttons:
    - enabled when `status === "journey"` and `pinnedBook` exists and `!contextLoading`;
    - disabled while `contextLoading` is true.
  - Chat button:
    - enabled when `status === "journey"` and `pinnedBook` exists;
    - visually active (`prompt-button--active`) when `activeChatThreadId === "general"`.

---

## Changes by layer

### 1. Frontend (`sage-read-app/src/App.js`, `sage-read-app/src/App.css`)

- **Header rendering**:
  - Keep `app-header-right` always rendered; no condition on `status === "journey" && pinnedBook`.
  - Render `.prompt-bar` **in all states**, keeping the current DOM structure from [docs/UI-LAYOUT.md](../UI-LAYOUT.md) (no new containers or scroll areas).
- **`disabled` logic for buttons**:
  - For 6 context buttons:
    - use:
      - `disabled={status !== "journey" || !pinnedBook || contextLoading}`.
  - For Chat:
    - use:
      - `disabled={status !== "journey" || !pinnedBook}`.
  - Do not change `onClick` handlers; blocking is controlled only via `disabled`.
- **CSS**:
  - If needed, slightly tweak `.prompt-bar` / `.prompt-button` styles for a clear disabled state (opacity, cursor), without changing layout or scroll containers.

### 2. Documentation

- **`docs/UI-LAYOUT.md`**:
  - Update the DOM structure description:
    - `app-header-right` / `.prompt-bar` are visible from the very first screen, not only in journey mode.
  - Clarify that:
    - **visibility** of buttons does not mean **interactivity**: they become active only when `status === "journey"` and a `pinnedBook` exists.
- **`docs/UX-IDEOLOGY.md`**:
  - Add a short clarification that immediately after opening SageRead, the user sees:
    - the workspace structure via 6 context types;
    - a separate Chat button as a secondary but always-present channel.

---

## Git strategy

- **Branch**: `feat/context-buttons` from `master`.
- **Phases within the branch**:
  1. **Phase 1: Frontend logic**  
     - Update `app-header-right` rendering in `App.js`.  
     - Introduce/refine `disabled` conditions for all 7 buttons.  
     - Ensure layout and scroll behavior match [docs/UI-LAYOUT.md](../UI-LAYOUT.md).
  2. **Phase 2: Documentation**  
     - Update `docs/UI-LAYOUT.md` and `docs/UX-IDEOLOGY.md` to reflect the new behavior.  
     - Check wording consistency with existing plans (`feat-chat`).
  3. **Phase 3 (optional): Polish and regression testing**  
     - Walk through the main scenarios (idle → loading → confirmed → journey → chat).  
     - Verify there are no extra scrollbars or layout shifts.
- **Merge**: after review and manual scenario testing  
  - `git checkout master && git merge feat-context-buttons`.

# Контекстные кнопки: всегда видимы

> Branch: `feat/context-buttons`
> Created: 2026-03-02

## Ключевые решения (утверждены)

- **Панель контекстов в хедере** (`app-header-right` + `.prompt-bar`) **всегда видна** во всех состояниях приложения (включая самый первый экран до ввода книги).
- **6 контекстных кнопок + Chat**:
  - На первом экране / до распознавания / на экране подтверждения — **видны, но недоступны (disabled)**.
  - В режиме **journey** при наличии `pinnedBook` — контекстные кнопки активны (с учётом `contextLoading`), Chat активен.
- **Бэкенд не меняем**; изменения только во фронтенде и документации.
- **Идеология**: сразу обозначаем структуру воркспейса (6 типов контекста + Chat) согласно [docs/UX-IDEOLOGY.md](../UX-IDEOLOGY.md), даже до распознавания книги.

---

## Поведение по состояниям

- **`idle` (первый экран)**:
  - Карточка с вопросом «Which book are you reading?» + поле ввода и кнопка `Start Analysis`.
  - В хедере: слева логотип, справа `.prompt-bar` с 6 контекстами и Chat — **все disabled**.
- **`loading` (идёт анализ)**:
  - Основная карточка показывает текст «Preparing your reading journey...».
  - `.prompt-bar` остаётся видимой; все 7 кнопок всё ещё disabled.
- **`confirmed` (экран подтверждения книги)**:
  - Карточка `Confirmation` с данными книги и кнопкой `Confirm & Continue →`.
  - `.prompt-bar` по‑прежнему видна; все 7 кнопок disabled.
- **`journey` (после Confirm & Continue)**:
  - `main` в режиме `main--journey`, показывается Journey или Chat.
  - 6 контекстных кнопок:
    - enabled, когда `status === "journey"` и есть `pinnedBook`, и `!contextLoading`;
    - disabled во время `contextLoading`.
  - Кнопка Chat:
    - enabled, когда `status === "journey"` и есть `pinnedBook`;
    - активное состояние (`prompt-button--active`) при `activeChatThreadId === "general"`.

---

## Изменения по слоям

### 1. Frontend (`sage-read-app/src/App.js`, `sage-read-app/src/App.css`)

- **Рендер хедера**:
  - Убрать жёсткую привязку `app-header-right` к `status === "journey" && pinnedBook`.
  - Делать рендер `.prompt-bar` **всегда**, сохраняя текущую структуру DOM из [docs/UI-LAYOUT.md](../UI-LAYOUT.md) (без новых контейнеров и скроллов).
- **Логика `disabled` для кнопок**:
  - Для 6 контекстных кнопок:
    - заменить `disabled={contextLoading}` на условие:
      - `disabled={status !== "journey" || !pinnedBook || contextLoading}`.
  - Для Chat:
    - ввести `disabled={status !== "journey" || !pinnedBook}`.
  - Обработчики `onClick` не меняем; блокировка достигается только через `disabled`.
- **CSS**:
  - При необходимости слегка скорректировать стили `.prompt-bar` / `.prompt-button` для корректного disabled‑состояния (opacity, cursor), не трогая layout и скролл‑контейнеры.

### 2. Документация

- **`docs/UI-LAYOUT.md`**:
  - Обновить описание DOM-структуры:
    - `app-header-right` / `.prompt-bar` — видимы уже на первом экране, а не только в journey.
  - Уточнить, что:
    - **видимость** кнопок не означает **интерактивность**: они становятся активны только в `status === "journey"` при наличии `pinnedBook`.
- **`docs/UX-IDEOLOGY.md`**:
  - Добавить короткое пояснение, что сразу после открытия SageRead пользователь видит:
    - структуру воркспейса через 6 типов контекста;
    - отдельную кнопку Chat как вторичный, но всегда обозначенный канал.

---

## Git-стратегия

- **Ветка**: `feat/context-buttons` от `master`.
- **Фазы внутри ветки**:
  1. **Phase 1: Frontend‑логика**  
     - Изменить рендеринг `app-header-right` в `App.js`.  
     - Ввести/уточнить условия `disabled` для всех 7 кнопок.  
     - Убедиться, что layout и scroll‑поведение соответствуют [docs/UI-LAYOUT.md](../UI-LAYOUT.md).
  2. **Phase 2: Документация**  
     - Обновить `docs/UI-LAYOUT.md` и `docs/UX-IDEOLOGY.md` под новое поведение.  
     - Проверить формулировки на согласованность с существующими планами (`feat/chat`).
  3. **Phase 3 (опционально): Полиш и регресс‑тест**  
     - Пройтись по основным сценариям (idle → loading → confirmed → journey → chat).  
     - Проверить отсутствие лишних скроллов и сдвигов контента.
- **Слияние**: после прохождения ревью и ручного прогона сценариев  
  - `git checkout master && git merge feat/context-buttons`.

