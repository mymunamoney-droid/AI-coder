# AI Dev Squad

Multi-agent AI coding platform with an automatic 4-agent chain:
1. Gemini planner via Google Gemini API (`gemini-3.5-flash`)
2. Groq Qwen (`qwen/qwen-32b`) coder
3. OpenRouter Nemotron (`nvidia/nemotron-3-super-120b-a12b:free`) reviewer
4. OpenRouter Owl (`owl/owl-alpha`) fixer

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000

## Features
- Automatic backend agent orchestration
- JSON memory (`server/memory/memory.json`)
- Multi-file parser (FILE: path format)
- Real-time logs and status via Socket.IO
- Project generation under `projects/generated-projects`
- Download generated project as zip
- Prompt history persistence
- Modern dark glassmorphism interface


