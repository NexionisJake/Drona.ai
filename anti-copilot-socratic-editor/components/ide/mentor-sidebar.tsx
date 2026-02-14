"use client"

import { Brain, Send, AlertTriangle, CheckCircle2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type MentorState = "idle" | "quiz" | "pass"

interface ChatMessage {
  role: "mentor" | "user"
  text: string
}

interface MentorSidebarProps {
  state: MentorState
  messages: ChatMessage[]
  onSendAnswer: (answer: string) => void
  onTriggerPaste: () => void
}

export function MentorSidebar({ state, messages, onSendAnswer, onTriggerPaste }: MentorSidebarProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendAnswer(inputValue.trim())
    setInputValue("")
  }

  return (
    <aside className="w-80 flex flex-col bg-[hsl(220,20%,8.5%)] border-l border-border select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-md",
          state === "idle" && "bg-primary/10",
          state === "quiz" && "bg-amber-500/10",
          state === "pass" && "bg-emerald-500/10"
        )}>
          {state === "idle" && <Brain className="w-4 h-4 text-primary" />}
          {state === "quiz" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          {state === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">
            {state === "idle" && "AI Mentor"}
            {state === "quiz" && "Knowledge Check"}
            {state === "pass" && "Challenge Passed"}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {state === "idle" && "Watching your code structure"}
            {state === "quiz" && "Answer to unlock the editor"}
            {state === "pass" && "You demonstrated understanding"}
          </p>
        </div>
        {state === "quiz" && (
          <span className="ml-auto flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
        )}
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {state === "idle" && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
              <Eye className="w-8 h-8 text-primary/40" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I am watching your code structure.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1.5 leading-relaxed">
                Write code manually to earn points.
                <br />
                Paste {">"} 25 lines to trigger a knowledge check.
              </p>
            </div>
            <button
              onClick={onTriggerPaste}
              className="mt-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/15 hover:border-primary/30 transition-all"
            >
              Simulate Paste Event
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "animate-slide-in",
              msg.role === "mentor" ? "flex gap-2" : "flex justify-end"
            )}
          >
            {msg.role === "mentor" && (
              <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                <Brain className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%]",
                msg.role === "mentor"
                  ? "bg-secondary/60 text-foreground/90 border border-border/50"
                  : "bg-primary/15 text-primary border border-primary/20"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {state === "pass" && (
          <div className="animate-slide-in flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300/90">
              Editor unlocked. Your Builder Score has been restored.
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border">
        <div className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
          state === "quiz"
            ? "border-primary/30 bg-secondary/40 glow-border-cyan"
            : "border-border bg-secondary/20"
        )}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              state === "quiz"
                ? "Explain your understanding..."
                : "Chat with your mentor..."
            }
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
            disabled={state === "pass"}
          />
          <button
            onClick={handleSend}
            disabled={state === "pass" || !inputValue.trim()}
            className={cn(
              "p-1.5 rounded-md transition-all",
              inputValue.trim()
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground/30"
            )}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-muted-foreground/40">
            {state === "quiz" ? "Ctrl+Z to undo paste and unlock" : "Powered by Socratic AI"}
          </span>
        </div>
      </div>
    </aside>
  )
}
