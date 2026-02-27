<div align="center">
  <h1>⚡ StormCode</h1>
  <p><strong>Paste any GitHub repo → Get AI-powered architecture explanations</strong></p>
  <p>Dependency graphs, flow diagrams, and beginner-friendly breakdowns — no PhD required.</p>

  <br />

  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Gemini-2.0--Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Mermaid-11-ff3670?logo=mermaid" alt="Mermaid" />
</div>

---

## Features

### 🔗 Auto Dependency Graph
Automatically parses imports across **JS/TS/Python/Go** files and generates an interactive Mermaid diagram showing how every module connects.

### 📊 Flow Diagrams
Generates architecture, data flow, and request lifecycle diagrams based on your codebase structure — not boilerplate, but actually tailored to the repo.

### 🧠 Beginner Explanation Mode
AI explains the entire codebase using everyday analogies. Includes:
- **"Explain Like I'm 5"** analogy for the whole project
- **Tech stack breakdown** with what each tool does
- **Step-by-step walkthrough** of how the app works
- **Key files explained** in plain English

---

## Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Gemini API Key** (for AI explanations — graphs work without it)
- **GitHub Token** (optional, increases API rate limit)

### Setup

```bash
# Clone the repo
git clone https://github.com/Namit-07/StormCode.git
cd StormCode

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste any public GitHub repo URL.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | For AI features | Your Google Gemini API key for generating explanations ([get one free](https://aistudio.google.com/apikey)) |
| `GITHUB_TOKEN` | No | GitHub personal access token (raises rate limit from 60 → 5000 req/hr) |

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | Full-stack React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling with custom dark theme |
| **Mermaid.js** | Diagram rendering (dependency graphs, flowcharts) |
| **Google Gemini 2.0 Flash** | AI code explanations |
| **Octokit** | GitHub API client |
| **Zustand** | Lightweight state management |
| **Framer Motion** | Smooth animations & transitions |
| **Lucide React** | Beautiful icon set |

---

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── analyze/        # POST — fetches repo, builds graphs
│   │   └── explain/        # POST — generates AI explanations
│   ├── layout.tsx          # Root layout with fonts & metadata
│   ├── page.tsx            # Main page (landing + results)
│   └── globals.css         # Tailwind + custom styles
├── components/
│   ├── Header.tsx          # Top navigation bar
│   ├── RepoInput.tsx       # URL input with examples & progress
│   ├── RepoHeader.tsx      # Repo metadata display
│   ├── TabView.tsx         # Tab navigation (animated)
│   ├── DependencyGraph.tsx # Dependency graph visualization
│   ├── FlowDiagram.tsx     # Flow diagram visualization
│   ├── ExplanationPanel.tsx# AI explanation display
│   ├── FileTree.tsx        # Interactive file tree
│   ├── MermaidRenderer.tsx # Mermaid diagram renderer
│   └── LoadingState.tsx    # Multi-step loading animation
├── lib/
│   ├── types.ts            # All TypeScript interfaces
│   ├── github.ts           # GitHub API (fetch repo, files, contents)
│   ├── parser.ts           # Import extraction & dependency building
│   ├── analyzer.ts         # Mermaid generation & flow diagrams
│   └── openai.ts           # AI explanation generation
└── store/
    └── useStore.ts         # Zustand global state
```

### How It Works

1. **User pastes a GitHub URL** → parsed into `owner/repo`
2. **GitHub API** fetches repo metadata, file tree, and code contents
3. **Parser** extracts imports from each file (supports JS/TS/Python/Go)
4. **Analyzer** builds a dependency graph and generates Mermaid diagrams
5. **Flow generator** detects app layers and creates architecture/data flow diagrams
6. **Gemini AI** receives the codebase context and generates beginner-friendly explanations
7. **UI** renders everything with interactive tabs, smooth animations, and a dark theme

---

## Supported Languages

| Language | Import Parsing | Dependency Graph |
|----------|:-:|:-:|
| JavaScript / TypeScript | ✅ | ✅ |
| Python | ✅ | ✅ |
| Go | ✅ | ✅ |
| Vue / Svelte | ✅ | ✅ |
| Others | — | Via AI explanation |

---

## License

MIT — see [LICENSE](LICENSE) for details.
