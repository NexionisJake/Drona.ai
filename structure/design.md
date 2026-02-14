# DESIGN.md - The Anti-Copilot
## Comprehensive Technical Specification for Build India 2026 Hackathon

**Project Name:** The Anti-Copilot  
**Event:** Build India Hackathon 2026 (7-Hour Sprint)  
**Date:** February 15, 2026  
**Theme:** India-First AI (Employability & Skill Building)  
**Version:** 1.0  
**Last Updated:** February 14, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Philosophy](#2-project-philosophy)
3. [Technical Stack](#3-technical-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Design System & UI Specifications](#5-design-system--ui-specifications)
6. [Core Features & Implementation](#6-core-features--implementation)
7. [Component Specifications](#7-component-specifications)
8. [API Specifications](#8-api-specifications)
9. [Data Models & State Management](#9-data-models--state-management)
10. [AI Integration & System Prompts](#10-ai-integration--system-prompts)
11. [Testing Strategy (3-Phase API Management)](#11-testing-strategy-3-phase-api-management)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Performance Requirements](#13-performance-requirements)
14. [Build & Deployment](#14-build--deployment)
15. [7-Hour Implementation Roadmap](#15-7-hour-implementation-roadmap)
16. [Demo Script](#16-demo-script)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Executive Summary

The Anti-Copilot is a Socratic Code Editor designed to combat the "Vibe Coding" crisis where developers paste code without understanding it. Instead of auto-completing code, this environment **locks** when it detects blind copy-pasting and forces the user to answer architectural questions before they can proceed. It gamifies "understanding" over "speed."

**Core Mechanism:**
- User pastes ≥25 lines of code → Editor locks with blur overlay
- Claude AI streams Socratic questions about the code
- User must explain the logic to unlock
- Scoring system rewards manual typing, penalizes pasting

---

## 2. Project Philosophy

### The Problem: "Vibe Coding"
Modern developers often copy entire code blocks from Stack Overflow, ChatGPT, or GitHub without understanding:
- Security implications (SQL injection, XSS)
- Architectural patterns (why this approach?)
- Edge cases (what breaks this code?)
- Performance characteristics

### The Solution: Forced Reflection
By locking the editor and requiring explanation, we force a moment of reflection. The AI doesn't give answers—it asks questions that make the developer think critically about what they just pasted.

### Target Audience
- Junior developers who over-rely on AI assistants
- Bootcamp students building portfolio projects
- Anyone who wants to develop deeper code comprehension

---

## 3. Technical Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite 5
- **Editor Engine:** `@monaco-editor/react` (v4.6+)
- **Styling:** Tailwind CSS 3.4+
- **HTTP Client:** Native `fetch` API with EventSource for SSE

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ASGI Server:** Uvicorn
- **AI Provider:** Anthropic Claude API
- **HTTP:** Server-Sent Events (SSE) for streaming

### Development Environment
- **Node.js:** v20+ (for Vite)
- **Python:** 3.11+
- **Package Managers:** npm (frontend), pip (backend)
- **Browser Target:** Chrome/Edge only (Chromium-based)

### Project Structure (Monorepo)
```
anti-copilot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LockModal.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── WelcomeModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── hooks/
│   │   │   ├── useEditorLock.ts
│   │   │   ├── useScore.ts
│   │   │   ├── useClaudeStream.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   └── analyze.py
│   │   ├── services/
│   │   │   ├── claude_service.py
│   │   │   └── mock_service.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   └── utils/
│   │       └── cache.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   ├── DESIGN.md (this file)
│   └── DEMO_SCRIPT.md
├── .gitignore
└── README.md
```

---

## 4. Architecture Overview

### System Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       │ 1. User pastes code (≥25 lines)
       │
       ▼
┌─────────────────────┐
│  Monaco Editor      │
│  - onDidPaste hook  │
│  - Lock: readOnly   │
└──────┬──────────────┘
       │
       │ 2. POST /analyze_paste
       │    { code_snippet, context }
       │
       ▼
┌─────────────────────┐
│   FastAPI Backend   │
│  - Route Handler    │
└──────┬──────────────┘
       │
       │ 3. Stream Questions
       │    (SSE: data: ...)
       │
       ▼
┌─────────────────────┐
│  Claude 3.5 Sonnet  │
│  - Analyze code     │
│  - Generate Q's     │
└──────┬──────────────┘
       │
       │ 4. Stream tokens back
       │
       ▼
┌─────────────────────┐
│  React Sidebar      │
│  - Display Q's      │
│  - User answers     │
└──────┬──────────────┘
       │
       │ 5. POST /validate_answer
       │
       ▼
┌─────────────────────┐
│  Claude Evaluation  │
│  - Pass/Fail        │
└──────┬──────────────┘
       │
       │ 6. If PASS → Unlock
       │    If FAIL → Next Q
       │
       ▼
┌─────────────────────┐
│  Editor Unlocks     │
│  readOnly: false    │
└─────────────────────┘
```

### State Management Philosophy

**Local State (React):**
- Editor lock status (`isLocked: boolean`)
- Current question (`currentQuestion: string`)
- Chat history (`messages: Message[]`)
- Loading states (`isStreaming: boolean`)

**Persisted State (localStorage):**
- Builder Score (`score: number`)
- Session ID (`sessionId: string`)
- Chat history array (`chatHistory: ChatMessage[]`)
- Statistics (`stats: { totalPastes, successfulUnlocks, avgUnlockTime }`)

**No Backend Database:**
All state is client-side for hackathon speed.

---

## 5. Design System & UI Specifications

### 5.1 Color Palette (GitHub Dark Theme)

```css
/* Base Colors */
--bg-canvas: #0d1117;
--bg-default: #010409;
--bg-inset: #161b22;
--border-default: #30363d;

/* Text Colors */
--text-primary: #e6edf3;
--text-secondary: #7d8590;
--text-muted: #484f58;

/* Accent Colors */
--accent-emphasis: #1f6feb;
--accent-muted: #388bfd26;

/* Success/Error */
--success-emphasis: #3fb950;
--danger-emphasis: #f85149;

/* Score Colors */
--score-positive: #3fb950; /* Green */
--score-negative: #f85149; /* Red */
--score-neutral: #7d8590;  /* Gray */
```

### 5.2 Typography

**Font Stack:**
```css
/* Code Editor */
font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
font-size: 14px;
line-height: 1.6;
font-weight: 400;

/* UI Text */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 5.3 Layout Specifications

#### Desktop Layout (≥1024px)
```
┌────────────────────────────────────────────────┐
│  Navbar: Builder Score: +12.4        [Logo]    │
├────────────────────┬───────────────────────────┤
│                    │                           │
│   Monaco Editor    │     Sidebar (30%)        │
│      (70%)         │                           │
│                    │   ┌─────────────────┐     │
│                    │   │ Chat Messages   │     │
│  [Code here...]    │   │ (Scrollable)    │     │
│                    │   └─────────────────┘     │
│                    │   ┌─────────────────┐     │
│                    │   │ Input + Send    │     │
│                    │   └─────────────────┘     │
└────────────────────┴───────────────────────────┘
```

#### Mobile Layout (<1024px)
```
┌──────────────────────┐
│  Navbar: +12.4       │
├──────────────────────┤
│                      │
│   Monaco Editor      │
│     (100% width)     │
│                      │
└──────────────────────┘
      ↓ (When locked)
┌──────────────────────┐
│  Overlay Sidebar     │
│  (100% viewport)     │
│  ┌────────────────┐  │
│  │ Chat Messages  │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Input Field    │  │
│  └────────────────┘  │
└──────────────────────┘
```

### 5.4 Component Dimensions

**Navbar:**
- Height: `64px`
- Padding: `0 24px`
- Background: `var(--bg-inset)`
- Border-bottom: `1px solid var(--border-default)`

**Editor Pane:**
- Width: `70%` (desktop), `100%` (mobile)
- Height: `calc(100vh - 64px)` (full viewport minus navbar)

**Sidebar:**
- Width: `30%` (desktop), `100%` (mobile overlay)
- Height: `calc(100vh - 64px)`
- Background: `var(--bg-inset)`
- Border-left: `1px solid var(--border-default)`

**Lock Modal:**
- Width: `600px` (max)
- Padding: `32px`
- Background: `rgba(22, 27, 34, 0.95)` (glassmorphism)
- Backdrop filter: `blur(8px)`
- Border-radius: `12px`
- Box-shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`

**Toast Notifications:**
- Position: `fixed bottom-right`
- Width: `320px`
- Padding: `16px`
- Border-radius: `8px`
- Animation: Slide in from right, fade out after 3s

### 5.5 Monaco Editor Settings

```typescript
const editorOptions = {
  fontSize: 14,
  fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
  fontLigatures: true,
  lineNumbers: 'on',
  minimap: { enabled: false },
  wordWrap: 'off',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  theme: 'vs-dark', // GitHub dark theme applied via CSS
  readOnly: false, // Toggles to true when locked
  padding: { top: 16, bottom: 16 },
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: false,
  },
};
```

### 5.6 Animation Specifications

**Lock Blur Effect:**
```css
.editor-locked {
  filter: blur(4px);
  pointer-events: none;
  transition: filter 300ms ease-in-out;
}

.editor-unlocked {
  filter: blur(0);
  transition: filter 300ms ease-in-out;
}
```

**Unlock Success Animation:**
```css
@keyframes unlock-success {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.unlock-checkmark {
  animation: unlock-success 600ms ease-out;
}
```

**Toast Slide-In:**
```css
@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast {
  animation: toast-slide-in 300ms ease-out;
}
```

**Spinner (Claude Thinking):**
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-default);
  border-top-color: var(--accent-emphasis);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
```

---

## 6. Core Features & Implementation

### 6.1 The "Smart Paste" Trap

#### Trigger Conditions
```typescript
editor.onDidPaste((event: monaco.editor.IPasteEvent) => {
  const pastedText = event.range.endLineNumber - event.range.startLineNumber + 1;
  const lineCount = pastedText;
  
  // EXACT threshold: >= 25 lines triggers lock
  if (lineCount >= 25) {
    triggerLock(event.range);
  }
});
```

#### Lock Sequence

**Step 1: Capture Version ID (for undo detection)**
```typescript
const prePasteVersionId = editor.getModel()?.getAlternativeVersionId();
setPrePasteVersion(prePasteVersionId);
```

**Step 2: Extract Pasted Code**
```typescript
const pastedCode = editor.getModel()?.getValueInRange(event.range);
setPastedSnippet(pastedCode);
```

**Step 3: Calculate Penalty**
```typescript
const penalty = lineCount * -0.2;
updateScore(penalty); // Immediate deduction
```

**Step 4: Apply Lock**
```typescript
editor.updateOptions({ readOnly: true });
setIsLocked(true);
setShowLockModal(true);
```

**Step 5: Apply Blur Effect**
```typescript
const editorContainer = document.querySelector('.monaco-editor');
editorContainer?.classList.add('editor-locked');
```

**Step 6: Send to Backend**
```typescript
fetch('/analyze_paste', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code_snippet: pastedCode,
    context_summary: "Python database connection" // Optional context
  })
});
```

### 6.2 The Socratic Quiz

#### Backend Flow (FastAPI)

**Endpoint: POST /analyze_paste**

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from anthropic import Anthropic
import asyncio

app = FastAPI()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    async def generate_questions():
        # System prompt (see Section 10 for full prompt)
        system_prompt = """You are a Senior Software Engineer..."""
        
        # Stream Claude's response
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.7,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"Code pasted:\n\n{request.code_snippet}"
            }]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"
                await asyncio.sleep(0)  # Yield control
    
    return StreamingResponse(
        generate_questions(),
        media_type="text/event-stream"
    )
```

#### Frontend Consumption (React)

```typescript
const streamQuestions = async (code: string) => {
  const eventSource = new EventSource(
    `/analyze_paste?code=${encodeURIComponent(code)}`
  );
  
  let fullQuestion = '';
  
  eventSource.onmessage = (event) => {
    const token = event.data;
    fullQuestion += token;
    setCurrentQuestion(fullQuestion); // Real-time update
  };
  
  eventSource.onerror = () => {
    eventSource.close();
    setIsStreaming(false);
  };
  
  eventSource.addEventListener('close', () => {
    setIsStreaming(false);
  });
};
```

#### Answer Validation

**Endpoint: POST /validate_answer**

```python
@app.post("/validate_answer")
async def validate_answer(request: AnswerRequest):
    evaluation_prompt = f"""
    Question asked: {request.question}
    User's answer: {request.user_answer}
    Original code: {request.code_snippet}
    
    Evaluate if the user demonstrates understanding of:
    1. Core logic/purpose
    2. Security implications (if applicable)
    3. Potential failure modes
    
    Respond with ONLY:
    PASS - if they show genuine understanding
    FAIL - if answer is superficial or incorrect
    """
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        temperature=0.3,  # Lower temp for consistent evaluation
        messages=[{"role": "user", "content": evaluation_prompt}]
    )
    
    result = response.content[0].text.strip()
    
    if "PASS" in result:
        return {
            "status": "pass",
            "feedback": "Good explanation! Editor unlocked.",
            "next_question": None
        }
    else:
        # Determine if another question is needed
        complexity_score = calculate_complexity(request.code_snippet)
        if complexity_score > threshold:
            next_q = generate_followup(request.code_snippet)
            return {
                "status": "fail",
                "feedback": "Not quite. Think about edge cases.",
                "next_question": next_q
            }
        else:
            return {
                "status": "partial_pass",
                "feedback": "Acceptable. Unlocking.",
                "next_question": None
            }
```

#### Complexity Determination (Variable Question Count)

```python
def calculate_complexity(code: str) -> int:
    """
    Returns complexity score to determine question count.
    High score = more questions needed.
    """
    score = 0
    
    # Factor 1: Line count
    lines = code.split('\n')
    if len(lines) > 50:
        score += 2
    
    # Factor 2: Security-sensitive keywords
    security_keywords = [
        'execute', 'cursor', 'query', 'eval', 'exec',
        'auth', 'password', 'token', 'session',
        'subprocess', 'os.system'
    ]
    for keyword in security_keywords:
        if keyword in code.lower():
            score += 3
            break
    
    # Factor 3: Number of functions/classes
    import re
    functions = len(re.findall(r'def \w+', code))
    classes = len(re.findall(r'class \w+', code))
    score += (functions + classes)
    
    # Factor 4: Let Claude decide
    # (This is implicit - Claude will ask follow-ups if needed)
    
    return score

# Question count logic:
# score 0-3: 1 question minimum
# score 4-7: 2 questions
# score 8+: 3 questions
# Claude can always ask more if unsatisfied
```

### 6.3 The "Escape Hatch" (Undo Mastery)

#### Undo Detection Logic

```typescript
const handleContentChange = (event: monaco.editor.IModelContentChangedEvent) => {
  if (!isLocked) return;
  
  const currentVersionId = editor.getModel()?.getAlternativeVersionId();
  
  // Check if version ID reverted to pre-paste state
  if (currentVersionId === prePasteVersionId) {
    // User has undone the paste
    unlockEditor();
    refundPenalty();
    dismissModal();
    abortStream(); // Cancel ongoing Claude stream
  }
};

editor.onDidChangeModelContent(handleContentChange);
```

#### Penalty Refund

```typescript
const refundPenalty = () => {
  const linesUnpasted = calculateLinesPasted(); // From stored state
  const refund = linesUnpasted * 0.2;
  updateScore(refund); // Add back the points
  
  showToast({
    message: `+${refund.toFixed(1)} points refunded`,
    type: 'success'
  });
};
```

#### Stream Abortion

```typescript
const abortStream = () => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
  setIsStreaming(false);
};
```

### 6.4 The Builder Score

#### Score Calculation Rules

**Penalty (Immediate on Paste):**
```typescript
const pasteLines = lineCount;
const penalty = pasteLines * -0.2;
score += penalty;
```

**Reward (Debounced on Typing):**
```typescript
let typingTimer: NodeJS.Timeout;
const TYPING_DEBOUNCE = 500; // milliseconds

editor.onDidChangeModelContent((event) => {
  if (isLocked) return; // No rewards during lock
  
  clearTimeout(typingTimer);
  
  typingTimer = setTimeout(() => {
    // Count new lines added
    const changes = event.changes;
    let newLinesAdded = 0;
    
    changes.forEach(change => {
      const newText = change.text;
      const lines = newText.split('\n');
      
      // Only count lines with actual code (ignore blank lines)
      lines.forEach(line => {
        if (line.trim().length > 0) {
          newLinesAdded += 1;
        }
      });
    });
    
    const reward = newLinesAdded * 0.2;
    if (reward > 0) {
      updateScore(reward);
      showToast({
        message: `+${reward.toFixed(1)}`,
        type: 'success',
        duration: 2000
      });
    }
  }, TYPING_DEBOUNCE);
});
```

#### Score Persistence

```typescript
const updateScore = (delta: number) => {
  const newScore = score + delta;
  setScore(newScore);
  
  // Persist to localStorage
  const storageData = {
    score: newScore,
    sessionId: sessionId,
    timestamp: Date.now(),
    chatHistory: chatHistory,
    stats: {
      totalPastes: stats.totalPastes,
      successfulUnlocks: stats.successfulUnlocks,
      avgUnlockTime: stats.avgUnlockTime
    }
  };
  
  localStorage.setItem('antiCopilotState', JSON.stringify(storageData));
};
```

#### Score Display Component

```tsx
const ScoreDisplay: React.FC = () => {
  const { score } = useScore();
  
  const getColorClass = () => {
    if (score > 0) return 'text-[#3fb950]'; // Green
    if (score < 0) return 'text-[#f85149]'; // Red
    return 'text-[#7d8590]'; // Gray
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#7d8590] text-sm">Builder Score:</span>
      <span className={`text-lg font-semibold ${getColorClass()}`}>
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </span>
    </div>
  );
};
```

---

## 7. Component Specifications

### 7.1 Editor Component

**File:** `/frontend/src/components/Editor.tsx`

**Props:**
```typescript
interface EditorProps {
  isLocked: boolean;
  onPaste: (code: string, lineCount: number) => void;
  onUndo: () => void;
  onTyping: (linesAdded: number) => void;
}
```

**State:**
```typescript
interface EditorState {
  editorInstance: monaco.editor.IStandaloneCodeEditor | null;
  prePasteVersionId: number | undefined;
  currentCode: string;
}
```

**Key Methods:**
```typescript
// Initialize editor
const initializeEditor = (container: HTMLElement) => {
  const editor = monaco.editor.create(container, editorOptions);
  setEditorInstance(editor);
  
  // Attach event listeners
  editor.onDidPaste(handlePaste);
  editor.onDidChangeModelContent(handleContentChange);
  
  return editor;
};

// Handle paste event
const handlePaste = (event: monaco.editor.IPasteEvent) => {
  const range = event.range;
  const lineCount = range.endLineNumber - range.startLineNumber + 1;
  
  if (lineCount >= 25) {
    const versionId = editorInstance?.getModel()?.getAlternativeVersionId();
    setPrePasteVersionId(versionId);
    
    const code = editorInstance?.getModel()?.getValueInRange(range);
    onPaste(code, lineCount);
  }
};

// Handle content changes (for undo detection and typing rewards)
const handleContentChange = (event: monaco.editor.IModelContentChangedEvent) => {
  // Undo detection
  const currentVersionId = editorInstance?.getModel()?.getAlternativeVersionId();
  if (isLocked && currentVersionId === prePasteVersionId) {
    onUndo();
  }
  
  // Typing rewards (only when unlocked)
  if (!isLocked) {
    const linesAdded = countNewCodeLines(event.changes);
    if (linesAdded > 0) {
      onTyping(linesAdded);
    }
  }
};

// Apply lock
useEffect(() => {
  if (editorInstance) {
    editorInstance.updateOptions({ readOnly: isLocked });
  }
}, [isLocked]);
```

**Render:**
```tsx
return (
  <div className={`relative h-full ${isLocked ? 'editor-locked' : ''}`}>
    <div ref={containerRef} className="h-full" />
  </div>
);
```

### 7.2 Sidebar Component

**File:** `/frontend/src/components/Sidebar.tsx`

**Props:**
```typescript
interface SidebarProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendAnswer: (answer: string) => void;
  isLocked: boolean;
}
```

**State:**
```typescript
interface SidebarState {
  inputValue: string;
  isSubmitting: boolean;
}
```

**Key Methods:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputValue.trim() || isSubmitting) return;
  
  setIsSubmitting(true);
  onSendAnswer(inputValue);
  setInputValue('');
};

// Keyboard shortcut: Ctrl+Enter
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter') {
    handleSubmit(e);
  }
};
```

**Render:**
```tsx
return (
  <div className="flex flex-col h-full bg-[#161b22] border-l border-[#30363d]">
    {/* Header */}
    <div className="p-4 border-b border-[#30363d]">
      <h2 className="text-[#e6edf3] font-semibold">AI Mentor</h2>
      <p className="text-[#7d8590] text-sm">
        {isLocked ? 'Explain the code to unlock' : 'Watching your code structure'}
      </p>
    </div>
    
    {/* Message List (Scrollable) */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-[#7d8590]">
          <div className="spinner" />
          <span className="text-sm">Claude is thinking...</span>
        </div>
      )}
    </div>
    
    {/* Input Area */}
    <form onSubmit={handleSubmit} className="p-4 border-t border-[#30363d]">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your explanation... (Ctrl+Enter to submit)"
        className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] resize-none focus:outline-none focus:border-[#1f6feb]"
        rows={3}
        disabled={!isLocked || isSubmitting}
      />
      <button
        type="submit"
        disabled={!isLocked || isSubmitting || !inputValue.trim()}
        className="mt-2 w-full px-4 py-2 bg-[#1f6feb] text-white rounded-lg hover:bg-[#388bfd] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </form>
  </div>
);
```

### 7.3 LockModal Component

**File:** `/frontend/src/components/LockModal.tsx`

**Props:**
```typescript
interface LockModalProps {
  isVisible: boolean;
  pastedCode: string;
  penalty: number;
}
```

**Features:**
- Show first 10 lines of pasted code as preview
- Display exact penalty amount
- No close button (unlock via answer or undo only)

**Render:**
```tsx
if (!isVisible) return null;

const codePreview = pastedCode.split('\n').slice(0, 10).join('\n');

return (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
    <div className="bg-[#161b22]/95 backdrop-blur-lg rounded-xl p-8 max-w-2xl w-full mx-4 border border-[#30363d] shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl">⚠️</div>
        <div>
          <h3 className="text-xl font-bold text-[#e6edf3]">Vibe Coding Detected</h3>
          <p className="text-[#7d8590] text-sm">Explain this logic to proceed</p>
        </div>
      </div>
      
      {/* Penalty Display */}
      <div className="mb-4 p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg">
        <span className="text-[#f85149] font-semibold">
          Penalty: {penalty.toFixed(1)} points
        </span>
      </div>
      
      {/* Code Preview */}
      <div className="mb-4">
        <p className="text-[#7d8590] text-sm mb-2">Pasted code preview:</p>
        <pre className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-sm text-[#e6edf3] overflow-x-auto">
          <code>{codePreview}</code>
          {pastedCode.split('\n').length > 10 && (
            <div className="text-[#7d8590] italic mt-2">
              ... ({pastedCode.split('\n').length - 10} more lines)
            </div>
          )}
        </pre>
      </div>
      
      {/* Instructions */}
      <div className="text-[#7d8590] text-sm">
        <p>💡 <strong>Tip:</strong> Press Ctrl+Z to undo and avoid the penalty.</p>
        <p className="mt-1">Or explain the code in the sidebar to unlock.</p>
      </div>
    </div>
  </div>
);
```

### 7.4 WelcomeModal Component

**File:** `/frontend/src/components/WelcomeModal.tsx`

**Purpose:** First-time user onboarding

**State:**
```typescript
interface WelcomeModalState {
  isVisible: boolean;
}
```

**Render:**
```tsx
const WelcomeModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) {
      setIsVisible(false);
    }
  }, []);
  
  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] rounded-xl p-8 max-w-lg w-full mx-4 border border-[#30363d]">
        <h2 className="text-2xl font-bold text-[#e6edf3] mb-4">
          Welcome to The Anti-Copilot
        </h2>
        <div className="space-y-3 text-[#7d8590]">
          <p>This is not your typical code editor.</p>
          <p>📋 <strong>Paste 25+ lines?</strong> The editor locks.</p>
          <p>🤔 <strong>Want to unlock?</strong> Explain the code to our AI mentor.</p>
          <p>⌨️ <strong>Type manually?</strong> Earn points. Paste? Lose points.</p>
          <p className="text-[#3fb950]">💡 <strong>Pro tip:</strong> Press Ctrl+Z to undo a paste and avoid penalties.</p>
        </div>
        <button
          onClick={handleClose}
          className="mt-6 w-full px-4 py-3 bg-[#1f6feb] text-white rounded-lg hover:bg-[#388bfd] font-semibold"
        >
          Got it! Let's code
        </button>
      </div>
    </div>
  );
};
```

### 7.5 Toast Component

**File:** `/frontend/src/components/Toast.tsx`

**Props:**
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}
```

**Render:**
```tsx
const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const bgColor = {
    success: 'bg-[#3fb950]',
    error: 'bg-[#f85149]',
    info: 'bg-[#1f6feb]'
  }[type];
  
  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg toast`}>
      {message}
    </div>
  );
};
```

**Usage (Toast Manager):**
```typescript
const [toasts, setToasts] = useState<Toast[]>([]);

const showToast = (toast: Omit<Toast, 'id'>) => {
  const id = Date.now();
  setToasts(prev => [...prev, { ...toast, id }]);
};

const removeToast = (id: number) => {
  setToasts(prev => prev.filter(t => t.id !== id));
};

// Render toasts
<div className="fixed bottom-4 right-4 space-y-2 z-50">
  {toasts.map(toast => (
    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
  ))}
</div>
```

### 7.6 ScoreDisplay Component

**File:** `/frontend/src/components/ScoreDisplay.tsx`

**Props:**
```typescript
interface ScoreDisplayProps {
  score: number;
}
```

**Render:**
```tsx
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const getColor = () => {
    if (score > 0) return 'text-[#3fb950]';
    if (score < 0) return 'text-[#f85149]';
    return 'text-[#7d8590]';
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#7d8590] text-sm font-medium">Builder Score:</span>
      <span className={`text-xl font-bold ${getColor()}`}>
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </span>
    </div>
  );
};
```

---

## 8. API Specifications

### 8.1 Base Configuration

**Base URL:** `http://localhost:8000` (development)

**CORS Configuration:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 8.2 Endpoint: POST /analyze_paste

**Purpose:** Initiates Socratic quiz by streaming questions from Claude

**Request Schema:**
```typescript
interface AnalyzePasteRequest {
  code_snippet: string;      // The pasted code
  context_summary?: string;   // Optional: "Python DB connection", etc.
}
```

**Response Format:** Server-Sent Events (SSE)

**SSE Structure:**
```
data: Hold
data:  up
data: .
data:  You
data:  just
data:  pasted
...
data: [DONE]
```

**Implementation:**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from anthropic import Anthropic

class PasteRequest(BaseModel):
    code_snippet: str
    context_summary: str = ""

@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    async def generate_stream():
        client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        system_prompt = get_system_prompt()  # See Section 10
        
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.7,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"Analyze this code:\n\n{request.code_snippet}"
            }]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
```

**Frontend Consumption:**
```typescript
const streamQuestion = async (code: string) => {
  const response = await fetch('http://localhost:8000/analyze_paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code_snippet: code })
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          setIsStreaming(false);
          return;
        }
        setCurrentQuestion(prev => prev + data);
      }
    }
  }
};
```

**Error Handling:**
```python
@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    try:
        async def generate_stream():
            # ... streaming logic
            pass
        
        return StreamingResponse(generate_stream(), ...)
    except Exception as e:
        logger.error(f"Error in analyze_paste: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "AI mentor unavailable, try again"}
        )
```

### 8.3 Endpoint: POST /validate_answer

**Purpose:** Evaluates user's answer and determines unlock status

**Request Schema:**
```typescript
interface ValidateAnswerRequest {
  question: string;
  user_answer: string;
  code_snippet: string;
}
```

**Response Schema:**
```typescript
interface ValidateAnswerResponse {
  status: 'pass' | 'fail' | 'partial_pass';
  feedback: string;
  next_question: string | null;
}
```

**Implementation:**
```python
from pydantic import BaseModel

class AnswerRequest(BaseModel):
    question: str
    user_answer: str
    code_snippet: str

class AnswerResponse(BaseModel):
    status: str
    feedback: str
    next_question: str | None

@app.post("/validate_answer", response_model=AnswerResponse)
async def validate_answer(request: AnswerRequest):
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    evaluation_prompt = f"""
You are evaluating a developer's understanding of code they pasted.

Question asked: {request.question}
Their answer: {request.user_answer}
Original code: {request.code_snippet}

Evaluate if they demonstrate understanding of:
1. The core logic/purpose
2. Security implications (if applicable)
3. Potential failure modes or edge cases

Respond with EXACTLY ONE of:
PASS - Shows genuine understanding, mentions key concepts
FAIL - Superficial or incorrect understanding
PARTIAL_PASS - Acceptable but not comprehensive

Then provide brief feedback (1 sentence).
"""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=150,
        temperature=0.3,
        messages=[{"role": "user", "content": evaluation_prompt}]
    )
    
    result_text = response.content[0].text.strip()
    
    # Parse result
    if "PASS" in result_text and "FAIL" not in result_text:
        return AnswerResponse(
            status="pass",
            feedback="Great explanation! Editor unlocked.",
            next_question=None
        )
    elif "PARTIAL_PASS" in result_text:
        return AnswerResponse(
            status="partial_pass",
            feedback="Acceptable understanding. Unlocking.",
            next_question=None
        )
    else:
        # Check if we need another question
        complexity = calculate_complexity(request.code_snippet)
        
        if complexity > 7:  # High complexity
            # Generate follow-up question
            next_q = await generate_followup(request.code_snippet, request.question)
            return AnswerResponse(
                status="fail",
                feedback="Not quite. Consider the security implications.",
                next_question=next_q
            )
        else:
            # Give them a pass anyway (low complexity)
            return AnswerResponse(
                status="partial_pass",
                feedback="Could be better, but acceptable. Unlocking.",
                next_question=None
            )
```

**HTTP Status Codes:**
- `200 OK` - Successful evaluation
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - API failure

### 8.4 Error Response Format

**Standard Error:**
```json
{
  "error": "AI mentor unavailable, try again",
  "code": "CLAUDE_API_ERROR",
  "timestamp": 1707926400
}
```

### 8.5 Rate Limiting & Retry Logic

**Backend (FastAPI):**
```python
from fastapi import HTTPException
import time

# Simple in-memory rate limiter
request_cache = {}

@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    # Rate limit: max 1 request per 2 seconds per session
    session_id = request.context_summary  # Or use IP/session token
    now = time.time()
    
    if session_id in request_cache:
        if now - request_cache[session_id] < 2:
            raise HTTPException(
                status_code=429,
                detail="Please wait before analyzing more code"
            )
    
    request_cache[session_id] = now
    
    # ... proceed with analysis
```

**Frontend Retry:**
```typescript
const analyzeWithRetry = async (code: string, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      await streamQuestion(code);
      return; // Success
    } catch (error) {
      if (i === retries) {
        // Final retry failed
        showToast({
          message: 'AI mentor unavailable, try again',
          type: 'error'
        });
        
        // Fallback: Unlock after 3 failures
        if (failureCount >= 2) {
          unlockEditor();
          showToast({
            message: 'Editor unlocked (API unavailable)',
            type: 'info'
          });
        }
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};
```

---

## 9. Data Models & State Management

### 9.1 TypeScript Interfaces

**File:** `/frontend/src/types/index.ts`

```typescript
// Chat Message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Quiz State
export interface QuizState {
  isActive: boolean;
  currentQuestion: string;
  questionCount: number;
  startTime: number | null;
  pastedCode: string;
  pastedLineCount: number;
}

// Score Statistics
export interface ScoreStats {
  totalPastes: number;
  successfulUnlocks: number;
  failedAttempts: number;
  avgUnlockTime: number; // milliseconds
}

// Local Storage Schema
export interface StorageSchema {
  score: number;
  sessionId: string;
  timestamp: number;
  chatHistory: ChatMessage[];
  stats: ScoreStats;
}

// Toast Notification
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

// API Request/Response Types
export interface AnalyzePasteRequest {
  code_snippet: string;
  context_summary?: string;
}

export interface ValidateAnswerRequest {
  question: string;
  user_answer: string;
  code_snippet: string;
}

export interface ValidateAnswerResponse {
  status: 'pass' | 'fail' | 'partial_pass';
  feedback: string;
  next_question: string | null;
}
```

### 9.2 Python Schemas

**File:** `/backend/app/models/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List

class PasteRequest(BaseModel):
    code_snippet: str = Field(..., min_length=1)
    context_summary: Optional[str] = ""

class AnswerRequest(BaseModel):
    question: str = Field(..., min_length=1)
    user_answer: str = Field(..., min_length=1)
    code_snippet: str = Field(..., min_length=1)

class AnswerResponse(BaseModel):
    status: str = Field(..., pattern="^(pass|fail|partial_pass)$")
    feedback: str
    next_question: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    code: str
    timestamp: int
```

### 9.3 localStorage Schema

**Key:** `antiCopilotState`

**Structure:**
```json
{
  "score": 12.4,
  "sessionId": "session_1707926400123",
  "timestamp": 1707926400000,
  "chatHistory": [
    {
      "id": "msg_1",
      "role": "assistant",
      "content": "What happens if the database connection fails?",
      "timestamp": 1707926400000
    },
    {
      "id": "msg_2",
      "role": "user",
      "content": "It would throw an exception and leave connections open.",
      "timestamp": 1707926410000
    }
  ],
  "stats": {
    "totalPastes": 5,
    "successfulUnlocks": 3,
    "failedAttempts": 2,
    "avgUnlockTime": 45000
  }
}
```

**Persistence Logic:**
```typescript
const STORAGE_KEY = 'antiCopilotState';

export const saveState = (state: StorageSchema) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const loadState = (): StorageSchema | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
```

### 9.4 React Context (Global State)

**File:** `/frontend/src/context/AppContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  score: number;
  updateScore: (delta: number) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  chatHistory: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  stats: ScoreStats;
  updateStats: (updates: Partial<ScoreStats>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ScoreStats>({
    totalPastes: 0,
    successfulUnlocks: 0,
    failedAttempts: 0,
    avgUnlockTime: 0
  });
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setScore(saved.score);
      setChatHistory(saved.chatHistory);
      setStats(saved.stats);
    }
  }, []);
  
  // Save to localStorage on changes
  useEffect(() => {
    saveState({
      score,
      sessionId: `session_${Date.now()}`,
      timestamp: Date.now(),
      chatHistory,
      stats
    });
  }, [score, chatHistory, stats]);
  
  const updateScore = (delta: number) => {
    setScore(prev => prev + delta);
  };
  
  const addMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };
  
  const updateStats = (updates: Partial<ScoreStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <AppContext.Provider value={{
      score,
      updateScore,
      isLocked,
      setIsLocked,
      chatHistory,
      addMessage,
      stats,
      updateStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

---

## 10. AI Integration & System Prompts

### 10.1 Claude API Configuration

**Model:** `claude-3-5-sonnet-20241022`  
**Temperature:** `0.7`  
**Max Tokens:** `2000`  
**Streaming:** `true`

**Note:** For testing, use `claude-3-5-haiku-20241022` (see Section 11)

### 10.2 Complete System Prompt (Verbatim)

**File:** `/backend/app/prompts/system_prompt.py`

```python
SYSTEM_PROMPT = """You are a Senior Software Engineer conducting a code review for a junior developer who just pasted code without reading it carefully.

Your role is to be a Socratic mentor, NOT a code generator or explainer. You ask probing questions that force the developer to think critically about what they pasted.

CRITICAL RULES:
1. NEVER output code blocks, examples, or solutions
2. ONLY ask questions that reveal gaps in understanding
3. Focus your questions in this priority order:
   - Security vulnerabilities (SQL injection, auth bypass, XSS, etc.)
   - Architecture and design patterns (why this approach?)
   - Edge cases and error handling (what breaks this?)
   - Code efficiency and optimization (performance issues)

4. Ask 1-3 questions depending on code complexity:
   - Simple code (< 30 lines, no security risk): 1 question
   - Medium code (30-50 lines OR has auth/DB): 2 questions
   - Complex code (50+ lines OR multiple security concerns): 3 questions

5. Keep questions concise (1-2 sentences max)
6. Be direct but not condescending
7. Use real-world scenarios: "What happens if..." or "How would this behave when..."

QUESTION TEMPLATES:
Security: "This connects to a database. What happens if someone passes 'admin OR 1=1' as the username?"
Architecture: "Why use a global variable here instead of dependency injection?"
Edge Cases: "What happens if the API returns a 429 rate limit error?"
Performance: "This loops through 10,000 items. What's the time complexity?"

After you ask a question, STOP. Wait for the user to answer. Do not provide hints or explanations unless they give a completely wrong answer.

If the user demonstrates understanding by mentioning:
- The specific vulnerability/issue
- A concrete example or scenario
- A proposed fix or mitigation
Then respond: "Good explanation! You clearly understand the implications."

If the user gives a vague or incorrect answer, ask a follow-up question to guide them, but still NO code or direct answers.
"""
```

### 10.3 Answer Evaluation Logic

**Evaluation Prompt Template:**
```python
EVALUATION_PROMPT_TEMPLATE = """
You are evaluating a developer's understanding of code they pasted.

Question asked: {question}
Their answer: {user_answer}
Original code: {code_snippet}

Evaluate if they demonstrate understanding by checking for:
1. Do they mention the SPECIFIC issue/concept from the question?
2. Do they provide a CONCRETE example or scenario?
3. Do they show awareness of the CONSEQUENCES or implications?

Respond with EXACTLY ONE word first:
- PASS if they show genuine understanding (mentions key concepts, provides examples)
- PARTIAL_PASS if understanding is acceptable but not comprehensive
- FAIL if the answer is vague, incorrect, or shows no real comprehension

Then on a new line, provide 1 sentence of feedback.

Example responses:
PASS
You clearly understand the SQL injection risk and how parameterized queries prevent it.

FAIL
Your answer is too vague. Think about what specific attack vector this code is vulnerable to.

PARTIAL_PASS
You identified the issue but didn't explain how it could be exploited.
"""
```

### 10.4 Follow-Up Question Generation

**When to Generate:**
- User failed evaluation AND complexity score > 7

**Prompt:**
```python
FOLLOWUP_PROMPT_TEMPLATE = """
The developer failed to adequately explain this code issue:

Original question: {previous_question}
Their answer: {user_answer}
Code: {code_snippet}

Generate ONE follow-up question that:
1. Probes deeper into the same issue
2. Asks about a SPECIFIC scenario or edge case
3. Does NOT provide hints or reveal the answer

Keep it to 1-2 sentences maximum.
"""
```

### 10.5 Complexity Calculation

```python
import re

def calculate_complexity(code: str) -> int:
    """
    Returns complexity score (0-15) to determine question count.
    
    Factors:
    - Line count: +2 if > 50 lines
    - Security keywords: +3 if any found
    - Functions/classes: +1 per definition
    - Nested logic: +1 per level > 2
    """
    score = 0
    
    # Factor 1: Line count
    lines = [l for l in code.split('\n') if l.strip()]
    if len(lines) > 50:
        score += 2
    
    # Factor 2: Security-sensitive keywords
    security_keywords = [
        'execute', 'cursor', 'query', 'eval', 'exec',
        'auth', 'password', 'token', 'session', 'jwt',
        'subprocess', 'os.system', 'shell', 'cookie',
        'innerHTML', 'dangerouslySetInnerHTML'
    ]
    code_lower = code.lower()
    if any(keyword in code_lower for keyword in security_keywords):
        score += 3
    
    # Factor 3: Number of functions/classes
    functions = len(re.findall(r'\bdef\s+\w+', code))
    classes = len(re.findall(r'\bclass\s+\w+', code))
    score += (functions + classes)
    
    # Factor 4: Nested logic depth
    max_indent = max([len(line) - len(line.lstrip()) 
                      for line in code.split('\n') if line.strip()], default=0)
    if max_indent > 8:  # More than 2 levels of nesting
        score += 1
    
    return min(score, 15)  # Cap at 15

# Question count mapping:
# 0-3: 1 question minimum
# 4-7: 2 questions
# 8+: 3 questions
```

---

## 11. Testing Strategy (3-Phase API Management)

**CRITICAL FOR HACKATHON SUCCESS:** Avoid burning API credits during development!

### 11.1 Phase 1: The "Dummy" Stream (Hours 0-4)

**Purpose:** Test frontend UI/UX without calling Claude API

**Implementation:**

**File:** `/backend/app/services/mock_service.py`

```python
import asyncio
from typing import AsyncGenerator

class MockClaudeService:
    """Simulates Claude streaming without API calls."""
    
    MOCK_RESPONSES = [
        "Hold up. You just pasted a database connection block but didn't include a teardown method. What happens to the connection pool if this fails?",
        "This authentication function uses session storage. What happens if an attacker steals the session cookie?",
        "You're executing raw SQL here. Walk me through what happens if someone passes 'admin OR 1=1' as the username.",
        "This function makes 5 API calls in a loop. What's the time complexity and how would you optimize it?",
    ]
    
    async def stream_question(self, code_snippet: str) -> AsyncGenerator[str, None]:
        """Yields tokens one by one to simulate streaming."""
        # Select response based on code hash for consistency
        import hashlib
        code_hash = int(hashlib.md5(code_snippet.encode()).hexdigest(), 16)
        response = self.MOCK_RESPONSES[code_hash % len(self.MOCK_RESPONSES)]
        
        # Split into words/tokens
        tokens = response.split(" ")
        
        for token in tokens:
            yield token + " "
            await asyncio.sleep(0.05)  # Simulate network delay
    
    async def evaluate_answer(self, question: str, answer: str, code: str) -> dict:
        """Mock evaluation - always passes after 2 attempts."""
        await asyncio.sleep(0.5)  # Simulate thinking
        
        # Simple mock logic: pass if answer is > 20 chars
        if len(answer.strip()) > 20:
            return {
                "status": "pass",
                "feedback": "Good explanation! (Mock response)",
                "next_question": None
            }
        else:
            return {
                "status": "fail",
                "feedback": "Try to be more specific. (Mock response)",
                "next_question": "Can you give a concrete example?"
            }
```

**FastAPI Route Toggle:**

**File:** `/backend/app/main.py`

```python
import os
from app.services.mock_service import MockClaudeService
from app.services.claude_service import ClaudeService

# Environment flag to toggle mock mode
USE_MOCK = os.getenv("USE_MOCK_AI", "true").lower() == "true"

# Initialize appropriate service
ai_service = MockClaudeService() if USE_MOCK else ClaudeService()

@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    async def generate_stream():
        async for token in ai_service.stream_question(request.code_snippet):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")
```

**Environment Variable:**
```bash
# .env file
USE_MOCK_AI=true   # Set to false when ready for real API
```

**Usage:** Run first 4 hours with `USE_MOCK_AI=true` to perfect UI/UX.

### 11.2 Phase 2: The Caching Layer (Hours 4-6)

**Purpose:** Avoid repeated API calls for the same code snippet

**Implementation:**

**File:** `/backend/app/utils/cache.py`

```python
from functools import lru_cache
import hashlib
from typing import Optional

class ResponseCache:
    """Simple in-memory cache for Claude responses."""
    
    def __init__(self):
        self._cache: dict[str, str] = {}
    
    def get_cache_key(self, code: str) -> str:
        """Generate deterministic key from code."""
        return hashlib.sha256(code.encode()).hexdigest()
    
    def get(self, code: str) -> Optional[str]:
        """Retrieve cached response."""
        key = self.get_cache_key(code)
        return self._cache.get(key)
    
    def set(self, code: str, response: str):
        """Store response in cache."""
        key = self.get_cache_key(code)
        self._cache[key] = response
    
    def clear(self):
        """Clear all cached responses."""
        self._cache.clear()

# Global cache instance
response_cache = ResponseCache()
```

**Updated Service:**

```python
from app.utils.cache import response_cache

class ClaudeService:
    async def stream_question(self, code_snippet: str):
        # Check cache first
        cached_response = response_cache.get(code_snippet)
        
        if cached_response:
            # Serve from cache (simulate streaming)
            for token in cached_response.split(" "):
                yield token + " "
                await asyncio.sleep(0.05)
            return
        
        # Not cached - call real API
        full_response = ""
        with client.messages.stream(...) as stream:
            for text in stream.text_stream:
                full_response += text
                yield text
        
        # Cache the complete response
        response_cache.set(code_snippet, full_response)
```

**Usage:** Once you enable real API calls, cache saves credits on repeated tests.

### 11.3 Phase 3: The "Haiku" Swap (Hours 6-7)

**Purpose:** Use cheaper model for integration testing

**Implementation:**

```python
import os

# Environment variable controls which model to use
MODEL_NAME = os.getenv("CLAUDE_MODEL", "claude-3-5-haiku-20241022")

class ClaudeService:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = MODEL_NAME
    
    async def stream_question(self, code_snippet: str):
        with self.client.messages.stream(
            model=self.model,  # Haiku during testing, Sonnet for demo
            max_tokens=2000,
            temperature=0.7,
            # ... rest of config
        ) as stream:
            # ... streaming logic
            pass
```

**Environment Variables:**

```bash
# During integration testing (Hours 6-6.5)
CLAUDE_MODEL=claude-3-5-haiku-20241022
USE_MOCK_AI=false

# Before final demo (Last 30 minutes)
CLAUDE_MODEL=claude-3-5-sonnet-20241022
USE_MOCK_AI=false
```

### 11.4 Cost Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Typical Question Cost |
|-------|----------------------|------------------------|----------------------|
| Haiku | $0.80 | $4.00 | ~$0.002 |
| Sonnet | $3.00 | $15.00 | ~$0.008 |
| Opus | $15.00 | $75.00 | ~$0.040 |

**Testing Budget:**
- Phase 1 (Mock): $0
- Phase 2 (Cached Haiku): ~$0.10 for 50 tests
- Phase 3 (Sonnet final): ~$0.25 for 30 tests
- **Total:** < $0.50 for entire hackathon

### 11.5 Testing Checklist

**Hour 0-4 (Mock Mode):**
- [ ] Paste 25+ lines → Modal appears
- [ ] Blur effect applies correctly
- [ ] Score decreases by correct amount
- [ ] Question streams word-by-word in sidebar
- [ ] Submit answer → Response appears
- [ ] Ctrl+Z → Editor unlocks + score refund
- [ ] Multiple rapid pastes blocked
- [ ] Toast notifications appear/disappear

**Hour 4-6 (Cached Haiku):**
- [ ] Real API call works
- [ ] Streaming displays correctly
- [ ] Cache serves repeat pastes instantly
- [ ] Answer validation works
- [ ] PASS unlocks editor
- [ ] FAIL asks follow-up question
- [ ] Error handling triggers fallback

**Hour 6-7 (Final Sonnet):**
- [ ] Switch to Sonnet model
- [ ] Questions are higher quality
- [ ] Demo script works perfectly
- [ ] All features functional

---

## 12. Error Handling & Edge Cases

### 12.1 Paste Detection Edge Cases

**Boundary Case: Exactly 25 Lines**
```typescript
// Trigger condition: >= 25 (not > 25)
if (lineCount >= 25) {
  triggerLock();
}
```

**Multiple Rapid Pastes:**
```typescript
const handlePaste = (event) => {
  if (isLocked) {
    event.preventDefault();
    showToast({
      message: 'Cannot paste while editor is locked',
      type: 'error'
    });
    return;
  }
  
  // ... normal paste handling
};
```

**Paste During Active Quiz:**
```typescript
// Block all paste events when quiz is active
editor.onDidPaste((event) => {
  if (quizState.isActive) {
    // Prevent the paste from being applied
    const model = editor.getModel();
    if (model) {
      model.pushEditOperations(
        [],
        [{ range: event.range, text: '' }],
        () => []
      );
    }
    
    showToast({
      message: 'Finish the current quiz before pasting more code',
      type: 'error'
    });
  }
});
```

### 12.2 Network Failures

**Timeout Handling:**
```typescript
const TIMEOUT_MS = 30000; // 30 seconds

const streamWithTimeout = async (code: string) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
  });
  
  const streamPromise = streamQuestion(code);
  
  try {
    await Promise.race([streamPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Request timeout') {
      showToast({
        message: 'AI mentor is taking too long. Try again.',
        type: 'error'
      });
    }
  }
};
```

**Retry Logic (Max 2 Retries):**
```typescript
let failureCount = 0;
const MAX_RETRIES = 2;

const analyzeWithRetry = async (code: string) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await streamQuestion(code);
      failureCount = 0; // Reset on success
      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        failureCount++;
        
        // Fallback after 3 total failures
        if (failureCount >= 3) {
          unlockEditor();
          showToast({
            message: 'AI mentor unavailable. Editor unlocked.',
            type: 'info'
          });
        } else {
          showToast({
            message: 'AI mentor unavailable, try again',
            type: 'error'
          });
        }
      } else {
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};
```

### 12.3 Browser Close During Quiz

**Restore Quiz State:**
```typescript
useEffect(() => {
  // On app load, check for incomplete quiz
  const savedState = loadState();
  
  if (savedState && savedState.quizState?.isActive) {
    // Quiz was in progress when browser closed
    const { pastedCode, currentQuestion, startTime } = savedState.quizState;
    
    // Restore state
    setIsLocked(true);
    setCurrentQuestion(currentQuestion);
    setPastedSnippet(pastedCode);
    
    showToast({
      message: 'Restored incomplete quiz',
      type: 'info'
    });
  }
}, []);
```

**Save Quiz State to localStorage:**
```typescript
useEffect(() => {
  if (isLocked) {
    const quizState = {
      isActive: true,
      currentQuestion,
      pastedCode: pastedSnippet,
      startTime: quizStartTime
    };
    
    saveState({
      ...currentState,
      quizState
    });
  }
}, [isLocked, currentQuestion, pastedSnippet]);
```

### 12.4 API Failures

**Graceful Degradation:**
```python
@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    try:
        # Attempt Claude API call
        async def generate_stream():
            # ... streaming logic
            pass
        
        return StreamingResponse(generate_stream(), ...)
        
    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {str(e)}")
        
        # Return graceful error response
        return JSONResponse(
            status_code=500,
            content={
                "error": "AI mentor unavailable, try again",
                "code": "CLAUDE_API_ERROR",
                "timestamp": int(time.time())
            }
        )
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Something went wrong. Please try again.",
                "code": "INTERNAL_ERROR",
                "timestamp": int(time.time())
            }
        )
```

### 12.5 LocalStorage Quota Exceeded

**Error Handling:**
```typescript
const saveState = (state: StorageSchema) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear old chat history and retry
      const trimmedState = {
        ...state,
        chatHistory: state.chatHistory.slice(-10) // Keep last 10 messages
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedState));
      } catch {
        // If still fails, clear everything except score
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          score: state.score,
          sessionId: state.sessionId,
          timestamp: state.timestamp,
          chatHistory: [],
          stats: state.stats
        }));
      }
    }
  }
};
```

### 12.6 Invalid Code Input

**Backend Validation:**
```python
@app.post("/analyze_paste")
async def analyze_paste(request: PasteRequest):
    # Validate code snippet
    if len(request.code_snippet.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Code snippet too short (minimum 10 characters)"
        )
    
    if len(request.code_snippet) > 10000:
        raise HTTPException(
            status_code=400,
            detail="Code snippet too long (maximum 10,000 characters)"
        )
    
    # ... proceed with analysis
```

---

## 13. Performance Requirements

### 13.1 Target Metrics

**Critical Path (Paste → Lock → Question):**
- Paste detection: < 10ms
- Lock application: < 50ms
- Blur effect: < 300ms (animation duration)
- API request initiation: < 100ms
- **Claude first token:** < 2 seconds
- **Full question stream:** < 5 seconds

**Editor Interactions:**
- Typing responsiveness: < 100ms
- Undo operation: < 50ms
- Unlock animation: < 600ms

**UI Animations:**
- Modal fade-in: 300ms
- Toast slide-in: 300ms
- Score update: Instant

### 13.2 Optimization Strategies

**Debouncing:**
```typescript
// Typing rewards debounced to avoid excessive renders
const TYPING_DEBOUNCE = 500; // ms

// Toast notifications auto-dismiss
const TOAST_DURATION = 3000; // ms
```

**React Performance:**
```typescript
// Memoize expensive components
const Editor = React.memo(EditorComponent);
const Sidebar = React.memo(SidebarComponent);

// Use useMemo for heavy calculations
const complexity = useMemo(() => {
  return calculateComplexity(pastedCode);
}, [pastedCode]);

// useCallback for event handlers
const handlePaste = useCallback((code: string) => {
  // ... paste logic
}, [dependencies]);
```

**Monaco Editor:**
```typescript
// Disable minimap for performance
minimap: { enabled: false }

// Limit syntax highlighting complexity
maxTokenizationLineLength: 500
```

**Backend Streaming:**
```python
# Yield tokens immediately, don't buffer
async for token in stream.text_stream:
    yield f"data: {token}\n\n"
    await asyncio.sleep(0)  # Yield control to event loop
```

### 13.3 Performance Monitoring

**Console Logging (Dev Only):**
```typescript
const logPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  if (duration > 100) {
    console.warn(`⚠️ ${operation} took ${duration}ms (threshold: 100ms)`);
  } else {
    console.log(`✓ ${operation}: ${duration}ms`);
  }
};

// Usage
const start = Date.now();
await streamQuestion(code);
logPerformance('Stream question', start);
```

---

## 14. Build & Deployment

### 14.1 Environment Variables

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000
```

**Backend (.env):**
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=INFO
USE_MOCK_AI=false
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 14.2 Installation & Setup

**Prerequisites:**
- Node.js 20+
- Python 3.11+
- Chrome/Edge browser

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 14.3 Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output: dist/ folder
```

**Backend (for deployment):**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 14.4 Testing Commands

**Frontend (Jest):**
```bash
cd frontend
npm test
```

**Example Test:**
```typescript
// __tests__/useEditorLock.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEditorLock } from '../hooks/useEditorLock';

describe('useEditorLock', () => {
  it('locks editor when paste threshold met', () => {
    const { result } = renderHook(() => useEditorLock());
    
    act(() => {
      result.current.handlePaste('code...', 30);
    });
    
    expect(result.current.isLocked).toBe(true);
  });
  
  it('refunds penalty on undo', () => {
    const { result } = renderHook(() => useEditorLock());
    
    act(() => {
      result.current.handlePaste('code...', 25);
      result.current.handleUndo();
    });
    
    expect(result.current.isLocked).toBe(false);
    expect(result.current.penalty).toBe(0);
  });
});
```

**Backend (pytest):**
```bash
cd backend
pytest
```

**Example Test:**
```python
# tests/test_analyze.py
import pytest
from app.services.mock_service import MockClaudeService

@pytest.mark.asyncio
async def test_mock_stream():
    service = MockClaudeService()
    tokens = []
    
    async for token in service.stream_question("test code"):
        tokens.append(token)
    
    assert len(tokens) > 0
    assert isinstance(tokens[0], str)

@pytest.mark.asyncio
async def test_evaluation():
    service = MockClaudeService()
    result = await service.evaluate_answer(
        question="What happens if this fails?",
        answer="It would throw an exception and crash",
        code="test code"
    )
    
    assert result["status"] in ["pass", "fail", "partial_pass"]
    assert "feedback" in result
```

### 14.5 README.md Structure

```markdown
# The Anti-Copilot

A Socratic Code Editor that fights "Vibe Coding" by locking your editor when you paste code and forcing you to explain it.

## Quick Start

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

Open http://localhost:5173

## How It Works

1. Paste ≥25 lines of code → Editor locks
2. Claude AI asks you questions about the code
3. Explain the logic to unlock
4. Score: +0.2 per typed line, -0.2 per pasted line

## Features

- 🔒 Auto-lock on large pastes
- 🤖 AI-powered Socratic questioning
- 📊 Real-time score tracking
- ⏮️ Undo to escape (Ctrl+Z)
- 💾 Persistent state across sessions

## Tech Stack

- Frontend: React + TypeScript + Vite + Monaco Editor
- Backend: FastAPI + Python
- AI: Anthropic Claude 3.5 Sonnet

## License

MIT
```

---

## 15. 7-Hour Implementation Roadmap

### Hour 0-1: Setup & Hello World

**Tasks:**
- [ ] Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependencies: `npm install @monaco-editor/react tailwindcss`
- [ ] Setup Tailwind CSS config
- [ ] Initialize FastAPI: `pip install fastapi uvicorn anthropic`
- [ ] Create basic project structure (folders)
- [ ] Get Monaco Editor rendering on screen
- [ ] Test API connection: Simple `/health` endpoint

**Success Criteria:** Monaco editor visible, backend returns "pong" on /health

### Hour 1-2: The "Trap" Mechanism

**Tasks:**
- [ ] Implement `onDidPaste` listener in Monaco
- [ ] Count pasted lines (threshold: ≥25)
- [ ] Toggle `readOnly: true` on lock
- [ ] Apply blur CSS effect
- [ ] Create LockModal component (basic version)
- [ ] Calculate and display penalty

**Success Criteria:** Paste 25+ lines → Modal appears, editor blurs

### Hour 2-3: The "Undo" Logic

**Tasks:**
- [ ] Capture `getAlternativeVersionId()` before paste
- [ ] Implement `onDidChangeModelContent` listener
- [ ] Detect version rollback (undo)
- [ ] Unlock editor on undo
- [ ] Refund penalty points
- [ ] Dismiss modal

**Success Criteria:** Ctrl+Z after paste → Unlocks, refunds points

### Hour 3-4: Backend Integration (Mock Mode)

**Tasks:**
- [ ] Create `MockClaudeService` class
- [ ] Implement `/analyze_paste` endpoint with mock streaming
- [ ] Test SSE in browser (EventSource)
- [ ] Create Sidebar component
- [ ] Display streaming text token-by-token
- [ ] Add loading spinner

**Success Criteria:** Paste → Mock question streams in sidebar

### Hour 4-5: The Chat UI

**Tasks:**
- [ ] Build chat message components
- [ ] Implement answer input form
- [ ] Create `/validate_answer` endpoint (mock)
- [ ] Handle PASS/FAIL states
- [ ] Unlock on PASS
- [ ] Display next question on FAIL
- [ ] Add toast notifications

**Success Criteria:** Submit answer → Evaluation → Unlock or next question

### Hour 5-6: Scoring & Real API

**Tasks:**
- [ ] Implement typing reward logic (+0.2 per line)
- [ ] Add debouncing (500ms)
- [ ] Create ScoreDisplay component
- [ ] Switch to real Claude API (use Haiku model)
- [ ] Implement caching layer
- [ ] Test error handling & retries
- [ ] Add WelcomeModal

**Success Criteria:** Real Claude responses, score updates correctly

### Hour 6-7: Polish & Demo Prep

**Tasks:**
- [ ] Switch to Sonnet model
- [ ] Write complete system prompt
- [ ] Create demo script (DEMO_SCRIPT.md)
- [ ] Test complete flow 3 times
- [ ] Fix any visual bugs
- [ ] Add keyboard shortcuts (Ctrl+Enter, Esc)
- [ ] Record backup video of working demo
- [ ] Rehearse pitch (2 min)

**Success Criteria:** Flawless demo run, video backup ready

---

## 16. Demo Script

**File:** `/docs/DEMO_SCRIPT.md`

```markdown
# Anti-Copilot Demo Script

## Setup Before Judges Arrive

1. Open http://localhost:5173 in Chrome
2. Dismiss welcome modal
3. Clear editor (should be empty)
4. Have this code snippet ready in a text file:

```python
import sqlite3

def login_user(username, password):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)
    
    user = cursor.fetchone()
    
    if user:
        return True
    return False
```

## The Pitch (30 seconds)

"This is the Anti-Copilot. We've all copied code from Stack Overflow without understanding it. This editor forces you to stop and think. Watch what happens when I paste this database login function..."

## The Demo (60 seconds)

**Step 1: The Paste**
- Paste the code snippet
- **Narrator:** "Boom. Editor locked. Score drops by 5 points."
- Point to blurred editor and modal

**Step 2: The Question**
- **Narrator:** "Claude asks: 'What happens if someone passes `admin' OR '1'='1` as the username?'"
- Point to streaming question in sidebar

**Step 3: Wrong Answer (Optional - if time)**
- Type: "It would fail"
- Submit
- **Narrator:** "Not good enough. Claude wants specifics."

**Step 4: Right Answer**
- Type: "SQL injection. The OR statement makes the query always true, bypassing authentication."
- Submit
- **Narrator:** "There we go. Unlocked."

**Step 5: The Reveal**
- Editor unlocks with animation
- Score updates
- **Narrator:** "Now I actually understand what I pasted. That's the Anti-Copilot."

## Backup: If API Fails

- **Narrator:** "Oops, Claude is busy. But here's the magic..."
- Press Ctrl+Z
- **Narrator:** "Undo to escape. Points refunded. The goal isn't to trap you—it's to make you think."

## Q&A Prep

**Q: What if I'm in a hurry?**
A: Press Ctrl+Z. Or type manually and earn points instead.

**Q: How do you prevent gaming the system?**
A: Claude's evaluation looks for specific concepts, not keywords. Vague answers fail.

**Q: What's the tech stack?**
A: React + Monaco for frontend, FastAPI + Claude 3.5 Sonnet for backend. 7 hours start to finish.

**Q: Why build this?**
A: Junior developers are becoming dependent on AI without learning fundamentals. This forces comprehension.
```

---

## 17. Future Enhancements

**Post-Hackathon Features (Not in 7-hour scope):**

1. **Multi-Language Support**
   - Currently Python-focused
   - Add JS, Java, Go syntax detection
   - Language-specific security checks

2. **Difficulty Levels**
   - Beginner: 1 question, lenient evaluation
   - Advanced: 3+ questions, strict standards
   - Expert: No unlock until perfect explanation

3. **Learning Paths**
   - Track topics user struggles with (e.g., SQL injection)
   - Recommend tutorials/resources
   - Gamified achievement system

4. **Team Mode**
   - Multiple users in same editor
   - Peer review before unlock
   - Leaderboard

5. **IDE Integration**
   - VS Code extension
   - JetBrains plugin
   - Git hooks for pre-commit checks

6. **Analytics Dashboard**
   - Track most common vulnerabilities pasted
   - Average time to understand specific patterns
   - Generate security reports

7. **Custom Rules**
   - Org-specific code standards
   - Custom question templates
   - Whitelist/blacklist patterns

8. **Offline Mode**
   - Local LLM (e.g., Code Llama)
   - No API dependency
   - Privacy-focused

---

## Appendix A: Dependencies

**Frontend (package.json):**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.3",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.2",
    "jest": "^29.7.0"
  }
}
```

**Backend (requirements.txt):**
```
fastapi==0.111.0
uvicorn[standard]==0.30.0
anthropic==0.31.0
pydantic==2.7.0
python-dotenv==1.0.1
pytest==8.2.0
pytest-asyncio==0.23.0
```

---

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo paste (unlock & refund) |
| Ctrl+Enter | Submit answer in quiz |
| Esc | Focus back on editor (does not close modal) |

---

## Appendix C: GitHub Dark Theme Color Reference

```css
/* Full color palette for reference */
:root {
  /* Canvas */
  --color-canvas-default: #0d1117;
  --color-canvas-overlay: #161b22;
  --color-canvas-inset: #010409;
  --color-canvas-subtle: #161b22;

  /* Text */
  --color-fg-default: #e6edf3;
  --color-fg-muted: #7d8590;
  --color-fg-subtle: #6e7681;
  --color-fg-on-emphasis: #ffffff;

  /* Border */
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-border-subtle: rgba(240,246,252,0.1);

  /* Accent */
  --color-accent-fg: #2f81f7;
  --color-accent-emphasis: #1f6feb;
  --color-accent-muted: rgba(56,139,253,0.4);
  --color-accent-subtle: rgba(56,139,253,0.15);

  /* Success */
  --color-success-fg: #3fb950;
  --color-success-emphasis: #238636;
  --color-success-muted: rgba(46,160,67,0.4);
  --color-success-subtle: rgba(46,160,67,0.15);

  /* Danger */
  --color-danger-fg: #f85149;
  --color-danger-emphasis: #da3633;
  --color-danger-muted: rgba(248,81,73,0.4);
  --color-danger-subtle: rgba(248,81,73,0.15);
}
```

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 14, 2026 | Initial comprehensive specification |

---

**End of DESIGN.md**

*This document represents the complete technical specification for The Anti-Copilot hackathon project. All implementation details, edge cases, and testing strategies have been explicitly defined to enable zero-ambiguity development during the 7-hour Build India 2026 sprint.*