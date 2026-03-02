# SageRead — UX ideology

High-level direction for navigation, content structure, and layout (desktop and mobile). See [UI-LAYOUT.md](UI-LAYOUT.md) for DOM and scroll rules.

---

## 1. Principles (overview)

```mermaid
flowchart TB
  subgraph principles["UX principles"]
    P1["1. Book = workspace"]
    P2["2. Context = sections, not one scroll"]
    P3["3. Fast nav: section → thread in center"]
    P4["4. Context buttons = secondary (hide in header)"]
  end

  subgraph implications["Implications"]
    I1["Switch between books (library / selector)"]
    I2["Navigate by sections; dropdowns / TOC"]
    I3["Click section → open thread in main area"]
    I4["One '+' or menu in header for 'add context'"]
  end

  P1 --> I1
  P2 --> I2
  P3 --> I3
  P4 --> I4
```

---

## 2. Information architecture

```mermaid
flowchart LR
  subgraph level1["Level 1: Workspace"]
    Books["Books (library)"]
  end

  subgraph level2["Level 2: Inside book"]
    Sections["Sections by type\n(historical, characters, …)"]
  end

  subgraph level3["Level 3: Content"]
    Thread["Thread in center"]
  end

  Books --> Sections
  Sections --> Thread

  subgraph actions["Secondary actions"]
    Add["Add context\n(6 types)"]
  end

  Books -.-> Add
```

---

## 3. Navigation flow (conceptual)

```mermaid
flowchart TB
  User["User"]
  ChooseBook["Choose book"]
  NavSections["Navigate sections\n(dropdown / TOC / screen)"]
  OpenThread["Open thread in center"]
  AddCtx["Add context\n(menu / '+' button)"]

  User --> ChooseBook
  ChooseBook --> NavSections
  NavSections --> OpenThread
  User --> AddCtx

  style OpenThread fill:#e8f5e9
  style AddCtx fill:#fff3e0
```

---

## 3.1. Initial workspace affordances

- On the very first screen (before book recognition), the header already shows the 6 context types and Chat as disabled controls.
- This makes the workspace structure (sections + chat channel) visible from the start, even though context generation and chat become available only after the book is recognized and the journey begins.

## 4. Desktop vs mobile (same ideology)

```mermaid
flowchart TB
  subgraph ideology["Same ideology"]
    A["Book selector"]
    B["Section-based navigation"]
    C["Section → thread in center"]
    D["Context buttons hidden\n(single '+' / menu)"]
  end

  subgraph desktop["Desktop"]
    D1["Library panel or header dropdown"]
    D2["Dropdowns: section type → sections"]
    D3["Main area = thread"]
    D4["Header: one '+' opens menu"]
  end

  subgraph mobile["Mobile"]
    M1["Drawer or tab: Library"]
    M2["Screen: Sections / TOC"]
    M3["Tap section → thread in main"]
    M4["Header: icon → menu / '+'"]
  end

  A --> D1
  A --> M1
  B --> D2
  B --> M2
  C --> D3
  C --> M3
  D --> D4
  D --> M4
```

---

*Reference: product direction (multiple books, sections, fast nav, collapsed context buttons). Mobile approach: [discussion in chat]; implementation: to be described in branch plan or UI-LAYOUT.*
