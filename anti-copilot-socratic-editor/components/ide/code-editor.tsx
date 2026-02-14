"use client"

import { X, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  isLocked: boolean
}

const codeLines = [
  { indent: 0, tokens: [{ text: "import", type: "keyword" }, { text: " sqlite3", type: "module" }] },
  { indent: 0, tokens: [{ text: "import", type: "keyword" }, { text: " hashlib", type: "module" }] },
  { indent: 0, tokens: [{ text: "from", type: "keyword" }, { text: " datetime ", type: "default" }, { text: "import", type: "keyword" }, { text: " datetime", type: "module" }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ text: "class", type: "keyword" }, { text: " UserDatabase", type: "class" }, { text: ":", type: "default" }] },
  { indent: 1, tokens: [{ text: '"""Database handler for user management"""', type: "string" }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ text: "def", type: "keyword" }, { text: " __init__", type: "function" }, { text: "(", type: "default" }, { text: "self", type: "param" }, { text: ", db_path", type: "param" }, { text: "=", type: "default" }, { text: '"users.db"', type: "string" }, { text: "):", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: ".conn = sqlite3.connect(db_path)", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: ".cursor = ", type: "default" }, { text: "self", type: "param" }, { text: ".conn.cursor()", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: "._create_table()", type: "default" }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ text: "def", type: "keyword" }, { text: " _create_table", type: "function" }, { text: "(", type: "default" }, { text: "self", type: "param" }, { text: "):", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: ".cursor.execute(", type: "default" }, { text: '"""', type: "string" }] },
  { indent: 3, tokens: [{ text: "CREATE TABLE IF NOT EXISTS users (", type: "string" }] },
  { indent: 4, tokens: [{ text: "id INTEGER PRIMARY KEY AUTOINCREMENT,", type: "string" }] },
  { indent: 4, tokens: [{ text: "username TEXT UNIQUE NOT NULL,", type: "string" }] },
  { indent: 4, tokens: [{ text: "password_hash TEXT NOT NULL,", type: "string" }] },
  { indent: 4, tokens: [{ text: "email TEXT UNIQUE,", type: "string" }] },
  { indent: 4, tokens: [{ text: "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", type: "string" }] },
  { indent: 3, tokens: [{ text: ")", type: "string" }] },
  { indent: 2, tokens: [{ text: '"""', type: "string" }, { text: ")", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: ".conn.commit()", type: "default" }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ text: "def", type: "keyword" }, { text: " add_user", type: "function" }, { text: "(", type: "default" }, { text: "self", type: "param" }, { text: ", username, password, email=", type: "default" }, { text: "None", type: "keyword" }, { text: "):", type: "default" }] },
  { indent: 2, tokens: [{ text: "password_hash = hashlib.sha256(", type: "default" }] },
  { indent: 3, tokens: [{ text: "password.encode()", type: "default" }] },
  { indent: 2, tokens: [{ text: ").hexdigest()", type: "default" }] },
  { indent: 2, tokens: [{ text: "try", type: "keyword" }, { text: ":", type: "default" }] },
  { indent: 3, tokens: [{ text: "self", type: "param" }, { text: ".cursor.execute(", type: "default" }] },
  { indent: 4, tokens: [{ text: '"INSERT INTO users (username, password_hash, email)"', type: "string" }] },
  { indent: 4, tokens: [{ text: '"VALUES (?, ?, ?)"', type: "string" }, { text: ",", type: "default" }] },
  { indent: 4, tokens: [{ text: "(username, password_hash, email)", type: "default" }] },
  { indent: 3, tokens: [{ text: ")", type: "default" }] },
  { indent: 3, tokens: [{ text: "self", type: "param" }, { text: ".conn.commit()", type: "default" }] },
  { indent: 3, tokens: [{ text: "return", type: "keyword" }, { text: " ", type: "default" }, { text: "True", type: "keyword" }] },
  { indent: 2, tokens: [{ text: "except", type: "keyword" }, { text: " sqlite3.IntegrityError:", type: "default" }] },
  { indent: 3, tokens: [{ text: "return", type: "keyword" }, { text: " ", type: "default" }, { text: "False", type: "keyword" }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ text: "def", type: "keyword" }, { text: " verify_user", type: "function" }, { text: "(", type: "default" }, { text: "self", type: "param" }, { text: ", username, password):", type: "default" }] },
  { indent: 2, tokens: [{ text: "password_hash = hashlib.sha256(password.encode()).hexdigest()", type: "default" }] },
  { indent: 2, tokens: [{ text: "self", type: "param" }, { text: ".cursor.execute(", type: "default" }] },
  { indent: 3, tokens: [{ text: '"SELECT * FROM users WHERE username=? AND password_hash=?"', type: "string" }, { text: ",", type: "default" }] },
  { indent: 3, tokens: [{ text: "(username, password_hash)", type: "default" }] },
  { indent: 2, tokens: [{ text: ")", type: "default" }] },
  { indent: 2, tokens: [{ text: "return", type: "keyword" }, { text: " ", type: "default" }, { text: "self", type: "param" }, { text: ".cursor.fetchone() ", type: "default" }, { text: "is not", type: "keyword" }, { text: " ", type: "default" }, { text: "None", type: "keyword" }] },
]

const tokenColors: Record<string, string> = {
  keyword: "text-[#c586c0]",
  module: "text-[#4ec9b0]",
  class: "text-[#4ec9b0]",
  function: "text-[#dcdcaa]",
  string: "text-[#ce9178]",
  param: "text-[#9cdcfe]",
  default: "text-[#d4d4d4]",
}

export function CodeEditor({ isLocked }: CodeEditorProps) {
  return (
    <div className="h-full flex flex-col bg-[hsl(220,18%,10%)] min-w-0">
      {/* Tab bar */}
      <div className="flex items-center h-9 bg-[hsl(220,20%,8%)] border-b border-border">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(220,18%,10%)] border-r border-border text-xs">
          <Circle className="w-2 h-2 fill-[#4ec9b0] text-[#4ec9b0]" />
          <span className="text-foreground/90">main.py</span>
          <button className="ml-1 p-0.5 rounded hover:bg-secondary/60 transition-colors" aria-label="Close tab">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/30 cursor-pointer transition-colors">
          <Circle className="w-2 h-2 fill-muted-foreground/50 text-muted-foreground/50" />
          <span>database.py</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center h-6 px-4 bg-[hsl(220,18%,10%)] border-b border-border/50 text-[11px] text-muted-foreground">
        <span>anti-copilot</span>
        <span className="mx-1 text-muted-foreground/40">{">"}</span>
        <span>src</span>
        <span className="mx-1 text-muted-foreground/40">{">"}</span>
        <span className="text-foreground/80">main.py</span>
      </div>

      {/* Code area */}
      <div className={cn("flex-1 overflow-auto relative", isLocked && "pointer-events-none")}>
        {/* Line numbers + code */}
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex flex-col items-end pt-2 pb-20 pr-4 pl-4 text-xs font-mono text-muted-foreground/40 select-none shrink-0 bg-[hsl(220,18%,10%)]">
            {codeLines.map((_, i) => (
              <div key={i} className="leading-6 h-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 pt-2 pb-20 overflow-x-auto">
            {codeLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "leading-6 h-6 font-mono text-[13px] whitespace-pre pr-8",
                  i === 24 && "bg-[hsl(220,18%,12%)]"
                )}
              >
                {"  ".repeat(line.indent)}
                {line.tokens.map((token, j) => (
                  <span key={j} className={tokenColors[token.type] || tokenColors.default}>
                    {token.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Minimap fake */}
        <div className="absolute right-0 top-0 bottom-0 w-14 bg-[hsl(220,18%,10%)] border-l border-border/30">
          <div className="mt-2 mx-1.5 space-y-0.5">
            {[72,45,88,33,60,50,78,40,65,55,82,38,70,48,85,42,62,52,76,35,68,58,80,44,74,46,66,54,84,36].map((w, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full"
                style={{
                  width: `${w}%`,
                  backgroundColor: `hsl(220, 15%, ${18 + (i % 5) * 1.6}%)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Blur overlay when locked */}
        {isLocked && (
          <div className="absolute inset-0 backdrop-blur-sm bg-background/30 transition-all animate-fade-in" />
        )}
      </div>

      {/* Status highlights bar */}
      <div className="flex items-center h-[3px] bg-[hsl(220,20%,8%)]">
        <div className="h-full w-full bg-primary/10" />
      </div>
    </div>
  )
}
