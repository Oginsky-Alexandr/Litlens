# Litlens / SageRead

Reading companion: enter a book (title + author), get AI-generated context (historical, cultural, characters, references, quotes, lesson). Frontend: React SPA. Backend: Express API + DeepSeek.

---

## Stack

| Part      | Tech                    |
|-----------|-------------------------|
| Frontend  | React 19, Create React App (PWA), CSS |
| Backend   | Node.js, Express 5, ES modules |
| AI        | DeepSeek API (via OpenAI SDK) |

---

## Run locally

### 1. Backend

```bash
cd sage-read-backend
# Create .env with: DEEPSEEK_API_KEY=your_key
npm install
node server.js
```

Runs on **http://localhost:4000** (or `PORT` from `.env`).

### 2. Frontend

```bash
cd sage-read-app
npm install
npm start
```

Runs on **http://localhost:3000** (or 3001 if 3000 is busy). The app calls the backend at `http://localhost:4000` (see `App.js` if you need another origin).

### 3. Env (backend)

- **DEEPSEEK_API_KEY** — required for `/api/analyze` and `/api/context/*`.
- **PORT** — optional, default `4000`.

---

## Project layout

```
Litlens/
├── sage-read-app/     # React frontend
│   └── src/
│       ├── App.js
│       └── App.css
├── sage-read-backend/ # Express API
│   └── server.js
├── docs/
│   ├── UI-LAYOUT.md   # Frontend layout and scroll rules
│   ├── API.md         # Backend API reference
│   ├── DEPLOY.md      # Hosting (Render, litlense.com, DNS)
│   └── branches/      # Architectural plans per feature branch
│       └── feat-chat.md
├── .cursorrules       # Prefer docs/UI-LAYOUT.md when changing UI
└── README.md
```

---

## Docs

- **[docs/UI-LAYOUT.md](docs/UI-LAYOUT.md)** — DOM structure, layout and scroll rules for the app (header, library panel, journey, chat, confirm section). Use when changing UI/CSS.
- **[docs/API.md](docs/API.md)** — Backend endpoints, request/response shapes, errors.
- **[docs/DEPLOY.md](docs/DEPLOY.md)** — Hosting on Render, domain litlense.com, DNS (ispmanager), env vars, cold start.
- **[docs/branches/](docs/branches/)** — Architectural plans for feature branches. Each branch that merges to master gets a plan document with approved decisions, data models, and endpoint specs.
  - [feat-chat.md](docs/branches/feat-chat.md) — Chat with AI streaming, per-topic threads, save-to-context with concatenation.
