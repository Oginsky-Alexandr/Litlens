# Branch Plan: feat/ui-restore

> Parent initiative: anon-save-sync
> Branch: `feat/ui-restore`
> Base branch: `master`

## Product value
Users do not lose their Library Context and chat history after accidental page reload (F5) or tab close/reopen on the same browser. The app feels reliable instead of disposable.

## Branch goal
Implement local UI state persistence and hydration using `localStorage` for:
- `pinnedBook`
- `chatThreads`
- `status`
- `activeChatThreadId`

This branch is intentionally local-only (same browser/device). Cross-device/account sync is out of scope.

## User stories

| ID | As a | I want | So that |
|---|---|---|---|
| US-1 | reader with confirmed book and saved contexts | to refresh the page (F5) | my pinned book and library contexts are still there |
| US-2 | reader in context/general chat | to refresh page during or after chat | I see the same messages and active thread |
| US-3 | reader who closed the tab by mistake | to open app again in same browser | I continue from the same journey state without re-entering book |
| US-4 | reader who pressed Reset Session | to refresh after reset | app starts clean, with no old state restored |
| US-5 | mobile reader (narrow viewport) | to refresh while Library Drawer was open | drawer is closed by default after reload, but its data is restored |
| US-6 | mobile reader in journey mode | to refresh | ContextPillRow and input area are rendered in the expected place |

## Technical implementation plan

### 1) LocalStorage helpers
Create safe wrappers for storage access (guarded by `try/catch`):
- `saveStateToStorage(key, data)`
- `loadStateFromStorage(key, fallback)`
- `clearStateFromStorage(key)`

Preferred file:
- `sage-read-app/src/utils/storage.js`

### 2) State serialization
In `sage-read-app/src/App.js`, add a persistence `useEffect` to store one snapshot object under a versioned key, e.g. `litlense_ui_state_v1`.

Persist only stable UI state:
- `pinnedBook`
- `chatThreads`
- `status`
- `activeChatThreadId`

Do not persist transient runtime state:
- `contextData`
- `contextLoading`
- `chatStreaming`
- `streamingContent`
- `isLibraryOpen`
- `bookRecognitionLoading`

### 3) State hydration on app mount
On first mount, read persisted snapshot and restore state.

Validation rules:
- unknown or broken payload -> ignore and continue with defaults
- unsupported snapshot version -> ignore
- if `activeChatThreadId` points to a missing thread -> set `null`

ID safety:
- recompute `nextCtxId.current` from restored `pinnedBook.contexts`
- recompute message id counter used in book-recognition flow to avoid collisions

### 4) Reset behavior
Update `resetSession()` to clear both:
- React state
- persisted local storage snapshot key

### 5) Edge cases
- LocalStorage unavailable (privacy mode, quota, blocked storage): app must still work without crashes.
- Corrupted JSON in storage: fallback to clean state.
- Journey state without a valid `pinnedBook`: fallback to safe defaults.

## Files to change
- `sage-read-app/src/App.js`
- `sage-read-app/src/utils/storage.js` (new)

## Acceptance criteria (QA)
1. Reach chat state, reload page -> Library and chat state are preserved.
2. Press `Reset Session`, reload -> app opens in clean initial state.
3. Add a new context after hydration -> no ID conflicts, no runtime errors.
4. Mobile case: open Library Drawer, reload -> drawer is closed by default, data inside is restored.
5. Mobile case (journey): reload -> ContextPillRow remains correctly rendered near input/chat area.

## Out of scope
- Account-based sync
- Supabase integration
- Magic-link login UX
