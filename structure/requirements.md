# 📋 Anti-Copilot — Requirements Document

> **Project**: The Anti-Copilot (Socratic Code Editor)
> **Event**: Build India Hackathon 2026 (7-Hour Sprint)
> **Theme**: India-First AI — Employability & Skill Building
> **Date**: February 15, 2026
> **Document Version**: 1.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Scope & Constraints](#2-scope--constraints)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Frontend Requirements](#5-frontend-requirements)
6. [Backend Requirements](#6-backend-requirements)
7. [Core Feature: Smart Paste Detection](#7-core-feature-smart-paste-detection)
8. [Core Feature: Socratic Quiz Engine](#8-core-feature-socratic-quiz-engine)
9. [Core Feature: Undo Escape Hatch](#9-core-feature-undo-escape-hatch)
10. [Core Feature: Builder Score](#10-core-feature-builder-score)
11. [UI/UX Specifications](#11-uiux-specifications)
12. [API Contract](#12-api-contract)
13. [Mock / Fallback System](#13-mock--fallback-system)
14. [Security & Configuration](#14-security--configuration)
15. [Error Handling & Resilience](#15-error-handling--resilience)
16. [Testing & Quality](#16-testing--quality)
17. [Deployment & Demo](#17-deployment--demo)
18. [Demo Script & Golden Path](#18-demo-script--golden-path)
19. [Non-Requirements (Explicitly Out of Scope)](#19-non-requirements-explicitly-out-of-scope)

---

## 1. Project Overview

### 1.1 Problem Statement

The **"Vibe Coding" crisis** — developers increasingly paste AI-generated code into their projects without understanding the logic, security implications, or architectural patterns. This builds fragile codebases and erodes fundamental engineering skills.

### 1.2 Solution

The **Anti-Copilot** is a Socratic Code Editor that:

- **Detects** when a developer blindly pastes large blocks of code.
- **Locks** the editor and forces the developer to answer architectural questions about the pasted code.
- **Gamifies** understanding over speed via a real-time "Builder Score."
- **Rewards** manual typing and penalizes copy-pasting.

### 1.3 Core Philosophy

> Instead of auto-completing code, this environment **locks** when it detects blind copy-pasting and forces the user to **answer architectural questions** before they can proceed. It gamifies **"understanding"** over **"speed."**

---

## 2. Scope & Constraints

### 2.1 Target

| Attribute       | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| Target Audience | Live hackathon demo for judges                                   |
| Optimization    | Demo stability over production robustness                        |
| Post-Hackathon  | Architecture remains clean enough for future open-source release |

### 2.2 Hard Constraints

| Constraint              | Detail                                                                         |
| ----------------------- | ------------------------------------------------------------------------------ |
| Language Support         | **Python only** (hardcoded). No language selector.                             |
| File Support             | **Single file** (`main.py`). No file explorer, no tabs, no multi-file.         |
| Database                 | **None**. All state in React state. No `localStorage` for persistence.         |
| Authentication           | **None**. No login, no signup. Hardcoded user session.                         |
| Deployment               | **Localhost only** (`127.0.0.1`). No cloud deployment.                         |
| Browser                  | **Chromium only** (Chrome/Brave). No Safari/Firefox testing.                   |
| Responsive Design        | **Desktop only**. No mobile or tablet breakpoints.                             |
| Unit Tests               | **Skipped** for hackathon.                                                     |
| Linting/CI/CD            | **Skipped** for hackathon.                                                     |

---

## 3. Technology Stack

### 3.1 Frontend

| Component       | Technology                        | Version / Notes                                 |
| --------------- | --------------------------------- | ----------------------------------------------- |
| Framework       | React                             | v19 (latest stable)                             |
| Language        | TypeScript                        | Relaxed mode (`strict: false`)                  |
| Bundler         | Vite                              | Latest (`npm create vite@latest`)               |
| Styling         | Tailwind CSS                      | v4.1 (zero-config, no `tailwind.config.js`)     |
| Editor          | `@monaco-editor/react`            | Latest stable                                   |
| Toast           | `react-hot-toast`                 | < 5kb, zero CSS imports                         |
| Markdown        | `react-markdown`                  | For rendering Claude's responses in sidebar     |
| Runtime         | Node.js                           | 20+ (required for Tailwind v4 compatibility)    |

### 3.2 Backend

| Component       | Technology                        | Version / Notes                                 |
| --------------- | --------------------------------- | ----------------------------------------------- |
| Framework       | FastAPI                           | Latest stable                                   |
| Language        | Python                            | 3.11 or 3.12                                    |
| AI Engine       | Anthropic Claude                  | `claude-3-5-sonnet-20241022` (production demo)  |
| AI (Testing)    | Anthropic Claude                  | `claude-3-5-haiku` (local dev, saves credits)   |
| Env Management  | `python-dotenv`                   | For `.env` file loading                         |
| ASGI Server     | Uvicorn                           | Default FastAPI runner                           |

### 3.3 Communication

| Aspect          | Choice                            | Rationale                                        |
| --------------- | --------------------------------- | ------------------------------------------------ |
| Protocol        | HTTP Streaming (SSE)              | No WebSocket complexity                          |
| Data Format     | JSON (requests), SSE (streaming)  | Standard, simple                                 |

---

## 4. Project Structure

```
anti-copilot/
├── frontend/                  # React + Vite + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.tsx          # Monaco editor wrapper
│   │   │   ├── LockOverlay.tsx         # Blur + glassmorphism modal
│   │   │   ├── MentorSidebar.tsx       # Right-pane chat UI
│   │   │   ├── Navbar.tsx              # Top bar with Builder Score
│   │   │   └── QuizChat.tsx            # Quiz Q&A interface
│   │   ├── hooks/
│   │   │   ├── usePasteDetection.ts    # Monaco paste event hook
│   │   │   ├── useBuilderScore.ts      # Score state management
│   │   │   └── useUndoEscape.ts        # Ctrl+Z escape hatch hook
│   │   ├── services/
│   │   │   └── api.ts                  # FastAPI HTTP/SSE client
│   │   ├── App.tsx                     # Root layout (split pane)
│   │   ├── App.css                     # Global styles
│   │   ├── main.tsx                    # React entry point
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                   # Python + FastAPI
│   ├── main.py                         # FastAPI app, CORS, routes
│   ├── services/
│   │   ├── claude_service.py           # Anthropic SDK integration
│   │   └── mock_service.py             # Fallback mock responses
│   ├── models/
│   │   └── schemas.py                  # Pydantic request/response models
│   ├── .env                            # ANTHROPIC_API_KEY (gitignored)
│   ├── .env.example                    # Template without secrets
│   └── requirements.txt               # Python dependencies
│
└── README.md
```

---

## 5. Frontend Requirements

### 5.1 Initialization

- Scaffold via `npm create vite@latest ./` inside `frontend/` (React + TypeScript template).
- Install Tailwind CSS v4.1 (zero-config mode — no `tailwind.config.js`).
- TypeScript configured with `strict: false` in `tsconfig.json`.

### 5.2 Monaco Editor (`CodeEditor.tsx`)

| Property              | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| Theme                 | `vs-dark`                                                          |
| Language              | `python`                                                           |
| Tab Title             | `main.py` (hardcoded, non-editable)                                |
| Read-Only Default     | `false`                                                            |
| Read-Only When Locked | `true`                                                             |
| Minimap               | Disabled (`minimap: { enabled: false }`)                           |
| Font Size             | `14px`                                                             |
| Word Wrap             | `on`                                                               |

#### 5.2.1 Default Editor Content (Pre-loaded)

The editor **MUST** start with exactly these 15 lines:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Anti-Copilot API Running"}
```

> [!IMPORTANT]
> The demo starts "green and functional." Judges must see working code from the first second.

### 5.3 Layout

| Pane         | Width  | Content                     |
| ------------ | ------ | --------------------------- |
| Left Pane    | 70%    | Monaco Code Editor          |
| Right Pane   | 30%    | Mentor Sidebar              |
| Top Bar      | 100%   | Navbar with Builder Score   |

- Split should be a hard CSS split (`flex` or `grid`). No drag-to-resize.

### 5.4 Key npm Packages

```json
{
  "@monaco-editor/react": "latest",
  "react-hot-toast": "latest",
  "react-markdown": "latest"
}
```

---

## 6. Backend Requirements

### 6.1 Initialization

- Python virtual environment (`python -m venv venv`).
- Install dependencies via `pip install -r requirements.txt`.

### 6.2 Core Configuration

| Property         | Value                                      |
| ---------------- | ------------------------------------------ |
| Host             | `0.0.0.0`                                  |
| Port             | `8000`                                     |
| CORS Origins     | `["http://localhost:5173"]`                |
| Reload           | `--reload` during development              |

### 6.3 `requirements.txt`

```
fastapi
uvicorn[standard]
anthropic
python-dotenv
pydantic
sse-starlette
```

### 6.4 `.env` File

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 6.5 `.env.example`

```env
ANTHROPIC_API_KEY=your-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

---

## 7. Core Feature: Smart Paste Detection

### 7.1 Trigger

| Attribute          | Specification                                               |
| ------------------ | ----------------------------------------------------------- |
| Event              | `editor.onDidPaste` (Monaco Editor API)                     |
| Threshold          | `>= 25 lines` (25 or more lines triggers the lock)         |
| Line Counting      | `text.split('\n').length` — all lines including blanks      |
| Paste Type         | External clipboard paste only. Internal cut-paste ignored.  |
| Multiple Pastes    | Each paste event is **independent**. No accumulation.       |

### 7.2 Lock Sequence (When Threshold Met)

```
1. Store pre-paste Monaco `alternativeVersionId` (for Undo Escape Hatch)
2. Set editor to `readOnly: true`
3. Display CSS blur overlay (`backdrop-filter: blur(4px)`) over editor
4. Show "Knowledge Check" glassmorphism modal (centered)
5. Deduct score: -0.2 × number_of_pasted_lines
6. Send pasted code + full editor content to backend `/analyze_paste`
7. Stream Q1 into the Mentor Sidebar
```

### 7.3 While Locked

- **No typing** allowed (editor is `readOnly: true`).
- **No pasting** allowed (inherently blocked by `readOnly`).
- **Only escape routes**: Answer quiz correctly OR Ctrl+Z Undo.

---

## 8. Core Feature: Socratic Quiz Engine

### 8.1 AI Persona

Claude acts as a **Senior Engineer** conducting a code review.

> [!IMPORTANT]
> **System Prompt Rule**: Claude is **strictly forbidden** from outputting code blocks in its questions. It must ask conceptual, architectural questions only.

### 8.2 Quiz Flow

```mermaid
flowchart TD
    A[Paste Detected >= 25 lines] --> B[Editor Locked]
    B --> C[Send code to /analyze_paste]
    C --> D[Stream Question 1 to sidebar]
    D --> E[User types answer to Q1]
    E --> F[Send Q1 + Answer to /validate_answer]
    F --> G[Stream Question 2 to sidebar]
    G --> H[User types answer to Q2]
    H --> I[Send Q1+A1 + Q2+A2 to /validate_answer]
    I --> J{Claude evaluates COMBINED understanding}
    J -->|Pass| K[✅ Editor Unlocks — Penalty stays]
    J -->|Fail| L[❌ Editor stays LOCKED — Must Ctrl+Z]
```

### 8.3 Quiz Rules

| Rule                       | Detail                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| Total Questions             | Exactly **2**, delivered sequentially                                     |
| Q1 Delivery                 | Streamed immediately after paste detection                                |
| Q2 Delivery                 | Streamed after user submits their Q1 answer                               |
| Evaluation Timing           | Combined evaluation of **both answers together** after Q2 is answered     |
| Pass Condition              | Claude determines user shows comprehension of the pasted code             |
| Pass Result                 | Editor unlocks. Paste penalty (`-0.2 × lines`) **stays** (no refund).    |
| Fail Result                 | Editor stays **permanently locked**. Only escape is Ctrl+Z (Undo).       |
| Max Questions               | Strictly 2. No additional follow-ups.                                     |
| Question Language           | English only                                                              |

### 8.4 Context Sent to Claude

| Data                    | Included? | Notes                                            |
| ----------------------- | --------- | ------------------------------------------------ |
| Pasted code snippet     | ✅ Yes    | The exact `>= 25` line pasted block              |
| Full `main.py` content  | ✅ Yes    | So Claude understands surrounding variables       |
| Previous Q&A            | ✅ Yes    | When sending Q2, include Q1 + user's A1           |

### 8.5 Proactive Mentor Mode (Zero-Cost Help)
The IDE features a dual-trigger Mentor Mode to assist developers without affecting their Builder Score.

**Trigger A: Automatic Error Detection**
- **Mechanism:** Hook into `monaco.editor.onDidChangeMarkers`.
- **Logic:** Filter for `MarkerSeverity.Error`. If an error persists for > 2000ms (debounced), extract the error message and the offending line of code.
- **Action:** Send silently to `/analyze_error`. Claude streams a proactive hint into the sidebar (e.g., "I notice a connection timeout error. Have you considered your connection pool limits?").

**Trigger B: Manual Highlight Query (Ctrl+M)**
- **Mechanism:** User highlights code and presses `Ctrl+M`.
- **Logic:** Capture `editor.getModel().getValueInRange(editor.getSelection())`. Focus the sidebar `<textarea>`.
- **Action:** User types their question. Payload sent to `/mentor_chat` containing the highlighted snippet, full file context, and user query.

**Mentor Mode Rules & Score Economy:**
- **Cost:** 0 points. Asking for help or receiving error hints does not penalize the Builder Score.
- **Strict Output Constraints:** The AI must output ONLY step-by-step logic, architectural trade-offs, and official documentation links. It is STRICTLY FORBIDDEN from outputting valid Python syntax. All structural examples must be in language-agnostic pseudo-code.

---

## 9. Core Feature: Undo Escape Hatch

### 9.1 Mechanism

| Attribute                  | Specification                                                    |
| -------------------------- | ---------------------------------------------------------------- |
| Tracking                   | Store `editor.getModel().getAlternativeVersionId()` **before** paste |
| Listener                   | `editor.onDidChangeModelContent`                                 |
| Trigger                    | User presses **Ctrl+Z** (Undo)                                  |
| Detection                  | Current `alternativeVersionId` reverts to pre-paste stored value |

### 9.2 Undo Sequence

```
1. Detect versionId matches pre-paste versionId
2. Set editor to `readOnly: false`
3. Remove blur overlay
4. Dismiss quiz modal
5. Abort any in-flight SSE stream from backend
6. REFUND the paste penalty (+0.2 × lines restored to score)
```

> [!IMPORTANT]
> Undo is the **complete reversal**. The user gets their score back because they chose to remove the pasted code rather than keep it.

### 9.3 Edge Case: Partial Undo

- If the user presses Ctrl+Z but the `alternativeVersionId` does **not** match the pre-paste value (partial undo), the editor stays locked. Only a **full revert** to pre-paste state unlocks.

---

## 10. Core Feature: Builder Score

### 10.1 Scoring Rules

| Action                     | Score Change        | Trigger                                                          |
| -------------------------- | ------------------- | ---------------------------------------------------------------- |
| Manual Typing              | **+0.2 points**     | Monaco `onChange` event when total character count increases      |
| Pasting (>= 25 lines)     | **-0.2 × N lines**  | `onDidPaste` event when line count >= 25                         |
| Undo (Escape Hatch)        | **+0.2 × N lines**  | Full undo reverting to pre-paste `alternativeVersionId`          |
| Quiz Pass                  | **No refund**        | Penalty stays; user keeps code but the shortcut cost stands      |

### 10.2 Display Rules

| Property          | Specification                                                 |
| ----------------- | ------------------------------------------------------------- |
| Position          | Top-center Navbar                                             |
| Format            | One decimal place (e.g., `3.4`, `-2.6`)                       |
| Positive Color    | **Green** text                                                |
| Negative Color    | **Red** text                                                  |
| Zero Color        | Default/neutral text color                                    |

### 10.3 State Management

| Property          | Specification                                            |
| ----------------- | -------------------------------------------------------- |
| Storage           | **React state only** (`useState`)                        |
| Persistence       | **None**. Browser refresh resets to `0`.                 |
| Initial Value     | `0`                                                      |
| Minimum           | No floor (can go infinitely negative)                    |
| Maximum           | No ceiling (can go infinitely positive)                  |

### 10.4 Typing Debounce

| Property          | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| Debounce Interval | **500ms**                                                |
| Trigger           | `onChange` event where character count **increases**      |
| Rationale         | Prevents React re-render lag during continuous typing     |

---

## 11. UI/UX Specifications

### 11.1 Overall Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar]        Builder Score: 3.4        [Anti-Copilot]│
├────────────────────────────────┬────────────────────────┤
│                                │                        │
│                                │    Mentor Sidebar      │
│      Monaco Code Editor        │                        │
│         (main.py)              │  "I am watching your   │
│                                │   code structure."     │
│         Width: 70%             │                        │
│                                │     Width: 30%         │
│                                │                        │
├────────────────────────────────┴────────────────────────┤
```

### 11.2 Navbar (`Navbar.tsx`)

| Element           | Position      | Details                                   |
| ----------------- | ------------- | ----------------------------------------- |
| App Title         | Left          | "Anti-Copilot" or logo                    |
| Builder Score     | Center        | Dynamic score with color coding           |
| Status Indicator  | Right         | Optional: connection status               |

### 11.3 Mentor Sidebar (`MentorSidebar.tsx`)

#### State A — Idle (No Active Quiz)

```
┌──────────────────────┐
│   🧠 Mentor          │
│                      │
│  "I am watching your │
│   code structure."   │
│                      │
└──────────────────────┘
```

#### State B — Active Quiz

```
┌──────────────────────┐
│   🧠 Mentor          │
│                      │
│  Q: "Explain what    │
│  happens to the      │
│  connection pool..." │
│                      │
│  ┌────────────────┐  │
│  │ Your answer... │  │
│  │                │  │
│  └────────────────┘  │
│  [Submit Answer]     │
│                      │
│  Status: Question    │
│  1 of 2              │
└──────────────────────┘
```

- **Markdown Rendering**: Claude's questions rendered via `react-markdown`.
- **Input**: Multi-line `<textarea>`.
  - **Enter** = Submit answer.
  - **Shift+Enter** = New line within answer.
- **Chat History**: Resets entirely with each new lock trigger.
- **Streaming**: Text appended token-by-token as SSE events arrive. No blinking cursor animation.

### 11.4 Lock Overlay (`LockOverlay.tsx`)

#### Visual Specification

| Property              | Value                                                    |
| --------------------- | -------------------------------------------------------- |
| Overlay               | Full editor pane coverage                                |
| Blur                  | `backdrop-filter: blur(4px)`                             |
| Background            | Semi-transparent dark (`rgba(0, 0, 0, 0.5)`)            |
| Modal Style           | Glassmorphism card (frosted glass)                       |
| Position              | Centered over the blurred editor                         |
| Close Button          | **None**. No X button. No clicking outside to dismiss.   |

#### Modal Content

```
┌─────────────────────────────────────┐
│                                     │
│   ⚠️  Vibe Coding Detected          │
│                                     │
│   Explain this logic to proceed.    │
│                                     │
│   Lines pasted: 42                  │
│   Score penalty: -8.4               │
│                                     │
│   Answer in the Mentor panel →      │
│                                     │
└─────────────────────────────────────┘
```

#### Escape Routes (Only Two)

1. **Answer the quiz** — Pass both questions → editor unlocks, penalty stays.
2. **Ctrl+Z (Undo)** — Remove pasted code → editor unlocks, penalty refunded.

### 11.5 Toast Notifications

| Library            | `react-hot-toast`                                        |
| ------------------ | -------------------------------------------------------- |
| Placement          | Top-right                                                |
| Usage              | API timeout, errors, quiz pass/fail feedback             |
| Root Component     | `<Toaster />` placed in `App.tsx`                        |

---

## 12. API Contract

### 12.1 `POST /analyze_paste` — Streaming (SSE)

Analyzes pasted code and streams the first question.

#### Request

```json
{
  "code_snippet": "string (the pasted block, >= 25 lines)",
  "context_summary": "string (full main.py content)"
}
```

#### Response

- **Content-Type**: `text/event-stream`
- **Behavior**: Streams Claude's first question token-by-token via SSE.
- **Format**: Each SSE event contains a text chunk of the question.

```
data: Hold up.
data:  You just
data:  pasted a database
data:  connection block...
data: [DONE]
```

#### Claude System Prompt (Backend)

```
You are a Senior Software Engineer conducting a code review.
You are part of the "Anti-Copilot" system that detects when developers paste code without understanding it.

RULES:
1. You MUST NOT output any code blocks (no ```, no inline code with backticks).
2. Ask ONE conceptual question about the pasted code.
3. Focus on: security implications, performance concerns, error handling gaps, or architectural decisions.
4. Keep the question concise (2-3 sentences max).
5. Address the developer directly ("you", "your code").
6. Be firm but educational, like a mentoring senior engineer.
```

---

### 12.2 `POST /validate_answer` — JSON

Validates the user's answer(s) and either returns the next question or a pass/fail verdict.

#### Request (After Q1)

```json
{
  "question": "string (Q1 text)",
  "user_answer": "string (user's answer to Q1)",
  "code_snippet": "string (the pasted block)",
  "question_number": 1
}
```

#### Response (After Q1 — Streams Q2)

```json
{
  "status": "next_question",
  "feedback": "string (brief acknowledgment)",
  "next_question": "string (Q2 text, streamed via SSE)"
}
```

> [!NOTE]
> When `question_number` is 1, the backend does NOT evaluate correctness. It acknowledges the answer and immediately generates Q2.

#### Request (After Q2)

```json
{
  "question_1": "string",
  "answer_1": "string",
  "question_2": "string",
  "answer_2": "string",
  "code_snippet": "string (the pasted block)",
  "question_number": 2
}
```

#### Response (After Q2 — Final Verdict)

```json
{
  "status": "pass | fail",
  "feedback": "string (Claude's evaluation of combined understanding)"
}
```

| `status` Value | Frontend Action                                            |
| -------------- | ---------------------------------------------------------- |
| `"pass"`       | Unlock editor, remove overlay, show success toast          |
| `"fail"`       | Keep editor locked, show failure toast, user must Ctrl+Z   |
| `"next_question"` | Stream Q2 into sidebar                                 |

---

### 12.3 `POST /mock_stream` — Streaming (SSE) — Fallback

Identical interface to `/analyze_paste` but returns **hardcoded questions** without calling Claude.

#### Mock Question 1 (Streamed)

> "Hold up. You just pasted a database connection block but didn't include a teardown method. What happens to the connection pool if this fails?"

#### Mock Question 2 (Streamed)

> "Okay, assuming you add a teardown, explain the time complexity of the nested loop on line 14 of that snippet."

#### Mock Validation

The mock `/validate_answer` always returns `"pass"` after Q2 to ensure a flawless demo.

---

## 13. Mock / Fallback System

### 13.1 Purpose

Safety net for the live demo if venue Wi-Fi drops or Claude API is unreachable.

### 13.2 Architecture

| Endpoint              | Real Mode                  | Mock Mode                          |
| --------------------- | -------------------------- | ---------------------------------- |
| `/analyze_paste`      | Calls Claude API           | Returns hardcoded Q1 via SSE       |
| `/validate_answer`    | Calls Claude to evaluate   | Returns hardcoded Q2, then `pass`  |

### 13.3 Switching Mechanism

- Frontend API service (`api.ts`) should have a configurable `BASE_URL` or endpoint toggle.
- Switch mock mode by changing a single constant (no restart required ideally, or at most a frontend hot-reload).

---

## 14. Security & Configuration

### 14.1 API Key Management

| Requirement                  | Implementation                                       |
| ---------------------------- | ---------------------------------------------------- |
| Storage                      | Backend `.env` file only                             |
| Loading                      | `python-dotenv` (`load_dotenv()` at app startup)     |
| Frontend Exposure             | **Never**. Frontend has zero knowledge of the key.   |
| Version Control               | `.env` in `.gitignore`. Provide `.env.example`.      |

### 14.2 CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 14.3 Content Safety

- **None**. No content filtering on code sent to Claude. Hackathon optimization — remove all overhead.

---

## 15. Error Handling & Resilience

### 15.1 Claude API Timeout

| Condition                        | Action                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| API response takes **> 10 seconds** | Show toast: `"Network Timeout - Bypassing verification"`   |
|                                  | Auto-unlock the editor                                        |
|                                  | Paste penalty **stays** (no refund on timeout)                |

> [!CAUTION]
> **Never let an API failure kill the demo.** The 10-second timeout auto-unlock is a hard requirement.

### 15.2 Backend Error Responses

- Standard FastAPI `HTTPException` with JSON bodies.
- Format: `{ "detail": "Error message" }`
- Common errors:
  - `400`: Invalid request body
  - `500`: Claude API failure
  - `503`: Claude API unreachable

### 15.3 Frontend Error Handling

- All API calls wrapped in try/catch.
- On any unhandled error: show toast notification, do **not** crash the UI.
- Console errors are acceptable (demo-grade).

---

## 16. Testing & Quality

### 16.1 Automated Testing

**Skipped entirely** for the hackathon sprint.

### 16.2 Linting & Formatting

**Skipped**. Rely on default VS Code auto-formatting.

### 16.3 CI/CD

**Skipped**. Project runs locally only.

### 16.4 Manual Verification

All verification is manual during the **Hour 7 Demo Rehearsal**:

- [ ] Paste >= 25 lines → Editor locks ✅
- [ ] Paste < 25 lines → No lock ✅
- [ ] Blur overlay appears correctly ✅
- [ ] Quiz Q1 streams into sidebar ✅
- [ ] User answers Q1 → Q2 streams ✅
- [ ] User answers Q2 → Pass → Editor unlocks ✅
- [ ] User answers Q2 → Fail → Editor stays locked ✅
- [ ] Ctrl+Z undoes paste → Editor unlocks, score refunded ✅
- [ ] Score increments on typing (+0.2) ✅
- [ ] Score decrements on paste (-0.2 × lines) ✅
- [ ] API timeout (> 10s) → Auto-unlock with toast ✅
- [ ] Mock endpoint works as fallback ✅

---

## 17. Deployment & Demo

### 17.1 Local Development

#### Backend

```bash
cd backend/
python -m venv venv
source venv/bin/activate          # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend/
npm install
npm run dev                       # Starts on http://localhost:5173
```

### 17.2 Demo Environment

| Component   | URL                                      |
| ----------- | ---------------------------------------- |
| Frontend    | `http://localhost:5173`                   |
| Backend     | `http://localhost:8000`                   |
| API Docs    | `http://localhost:8000/docs` (Swagger)    |

---

## 18. Demo Script & Golden Path

### 18.1 Pre-Demo Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] `.env` has valid `ANTHROPIC_API_KEY`
- [ ] Browser open to `http://localhost:5173`
- [ ] `database.py` paste snippet ready in clipboard
- [ ] Score shows `0` (fresh state)

### 18.2 Golden Path (2-Minute Demo)

```
1. SHOW: Editor with pre-loaded FastAPI boilerplate. Score = 0.
2. TYPE: A few lines manually. Score goes GREEN (+0.2 per line).
3. PASTE: The database.py snippet (40+ lines). 
4. WATCH: Editor BLURS. Modal appears: "⚠️ Vibe Coding Detected."
5. SEE: Score drops RED (-0.2 × 40 = -8.0).
6. ANSWER Q1: In the sidebar, respond to Claude's security question.
7. ANSWER Q2: Respond to Claude's complexity question.
8. RESULT A (Pass): Editor unlocks. User keeps code but penalty stays.
   — OR —
8. RESULT B (Fail): Editor stays locked. User must Ctrl+Z.
9. UNDO: Press Ctrl+Z. Editor unlocks. Score refunded.
10. FINALE: Show the score recovery. Emphasize learning over copying.
```

### 18.3 Fallback Path (If Wi-Fi Fails)

1. Switch frontend API calls to `/mock_stream` endpoint.
2. Mock returns hardcoded questions with guaranteed `pass` result.
3. Demo proceeds identically — judges see no difference.

---

## 19. Non-Requirements (Explicitly Out of Scope)

> [!WARNING]
> These items are **explicitly excluded** from the hackathon build. Do NOT implement them.

| Feature                        | Reason                                           |
| ------------------------------ | ------------------------------------------------ |
| Multi-file support             | Hardcoded to single `main.py`                    |
| File explorer / file tabs      | No file navigation UI                            |
| Real database                  | React state only, no persistence                 |
| Login / Signup / Auth           | Hardcoded user session                           |
| Multi-language support          | Python only                                      |
| Mobile / tablet responsive      | Desktop only                                     |
| WebSocket communication         | HTTP/SSE only                                    |
| Unit tests                      | Skipped for sprint                               |
| Linting / CI / CD              | Skipped for sprint                               |
| Cloud deployment                | Localhost only                                    |
| Safari / Firefox support        | Chromium only                                     |
| Content safety filtering        | No overhead                                      |
| Rate limiting                   | Not needed for single-user demo                  |
| Score persistence (localStorage)| React state — refresh resets for next judge       |
| Drag-to-resize split panes     | Fixed 70/30 CSS split                            |

---

> **Document Status**: ✅ Final — All specifications confirmed via 3 rounds of Q&A with the project owner.
>
> **Next Step**: This `requirements.md` feeds directly into `design.md` (system architecture) and the implementation sprint.
