# Technical Documentation Generator

> Upload any codebase — get professional documentation in seconds, powered by a local AI model running entirely on your machine.

---

## What Is This?

Writing documentation is the part every developer dreads. This tool does it for you.

You drop in a code file, a ZIP of your project, or paste a GitHub link. The app reads your code, understands its structure, and generates polished, readable documentation — README files, API references, function docs, class diagrams, and inline code comments — all formatted in clean Markdown, ready to publish.

No API keys. No subscription. No data leaves your computer. The AI runs locally via [Ollama](https://ollama.com/).

---

## What It Generates

| Document Type | What You Get |
|---|---|
| **README** | Project overview, setup instructions, usage guide |
| **API Reference** | Every endpoint documented with request/response examples |
| **Function Docs** | Parameters, return types, and descriptions for every function |
| **Class Docs** | OOP class structure, attributes, and method summaries |
| **UML Diagram** | Visual class diagram rendered with Mermaid.js |
| **Inline Comments** | Your source code returned with meaningful comments added |

Export anything as **PDF** or **DOCX** with one click.

---

## How It Works

```
Your Code  →  AI Analysis  →  Structured Docs  →  PDF / DOCX / Markdown
```

1. You upload a file, ZIP archive, or paste a GitHub repo URL
2. The backend parses the code — extracting functions, classes, API routes, and dependencies
3. A locally hosted LLM (qwen2.5-coder) reads the parsed structure and writes the documentation
4. Documents are stored, viewable in-app, and exportable

Everything runs on your machine. No internet connection required after setup.

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS (custom Ice Cream color palette)
- Vite, React Router, Mermaid.js for diagram rendering

**Backend**
- Python + FastAPI
- SQLAlchemy + SQLite for job and document storage
- httpx for async communication with the Ollama API
- reportlab + python-docx for PDF/DOCX export

**AI**
- [Ollama](https://ollama.com/) running `qwen2.5-coder:7b` locally
- No external AI API — fully offline-capable

---

## Features at a Glance

- Upload single files, ZIP archives, or import directly from GitHub
- Choose which doc types to generate — or generate all at once
- Real-time job status with live polling
- Documentation history per project
- Dark mode
- Mobile responsive layout
- Export to PDF or Word document

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) installed and running

```bash
# Pull the AI model (one-time setup)
ollama pull qwen2.5-coder:7b
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the app is ready.

---

## Project Structure

```
technical-doc-generator/
├── backend/
│   ├── app/
│   │   ├── routers/          # Upload, documentation, export endpoints
│   │   ├── services/         # Ollama integration, code analyzer, doc generator
│   │   ├── models/           # SQLAlchemy database models
│   │   └── utils/            # File handling, security, logging
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (layout, docs, upload, export)
│   │   ├── pages/            # Dashboard, Upload, Documentation, History
│   │   ├── hooks/            # Data fetching and job polling hooks
│   │   └── services/         # Axios API client
│   └── package.json
└── docker-compose.yml
```

---

## Why This Project?

Most documentation tools require cloud access, paid APIs, or work only with specific languages. This one:

- Works **fully offline** after initial model download
- Supports **10+ languages** — Python, JavaScript, TypeScript, Java, Go, Rust, and more
- Keeps **your code private** — nothing is sent to any external server
- Generates **multiple doc formats** from a single upload
- Runs on a **standard developer laptop** — no GPU required

---

## Docker (Optional)

```bash
docker-compose up --build
```

Spins up both the backend and frontend together.

---

## License

MIT
