"use client"

import { useState, useCallback } from "react"
import { Navbar } from "@/components/ide/navbar"
import { ActivityBar } from "@/components/ide/activity-bar"
import { FileExplorer } from "@/components/ide/file-explorer"
import { CodeEditor } from "@/components/ide/code-editor"
import { MentorSidebar } from "@/components/ide/mentor-sidebar"
import { StatusBar } from "@/components/ide/status-bar"
import { LockModal } from "@/components/ide/lock-modal"

type AppState = "idle" | "locked" | "quiz" | "pass"

interface ChatMessage {
  role: "mentor" | "user"
  text: string
}

const PASTE_LINE_COUNT = 46
const PENALTY_PER_LINE = 0.2

const quizQuestions = [
  "I noticed you pasted a UserDatabase class that stores passwords using SHA-256 hashing. Can you explain why SHA-256 alone is considered insufficient for password storage in production? What would you use instead?",
  "Good thinking. Now, this code uses sqlite3.connect() directly. In a web application handling multiple concurrent users, what problem would this approach cause, and how would you solve it?",
]

export default function AntiCopilotIDE() {
  const [appState, setAppState] = useState<AppState>("idle")
  const [score, setScore] = useState(4.2)
  const [activeTab, setActiveTab] = useState("explorer")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)

  const handleTriggerPaste = useCallback(() => {
    const penalty = PASTE_LINE_COUNT * PENALTY_PER_LINE
    setScore((prev) => prev - penalty)
    setAppState("locked")
    setMessages([])
    setQuestionIndex(0)

    setTimeout(() => {
      setAppState("quiz")
      setMessages([
        {
          role: "mentor",
          text: quizQuestions[0],
        },
      ])
    }, 1500)
  }, [])

  const handleUndo = useCallback(() => {
    const penalty = PASTE_LINE_COUNT * PENALTY_PER_LINE
    setScore((prev) => prev + penalty)
    setAppState("idle")
    setMessages([])
    setQuestionIndex(0)
  }, [])

  const handleSendAnswer = useCallback(
    (answer: string) => {
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: "user", text: answer },
      ]

      if (questionIndex < quizQuestions.length - 1) {
        setTimeout(() => {
          setMessages([
            ...newMessages,
            {
              role: "mentor",
              text: quizQuestions[questionIndex + 1],
            },
          ])
          setQuestionIndex((prev) => prev + 1)
        }, 800)
        setMessages(newMessages)
      } else {
        setTimeout(() => {
          const penalty = PASTE_LINE_COUNT * PENALTY_PER_LINE
          setScore((prev) => prev + penalty)
          setAppState("pass")
          setMessages([
            ...newMessages,
            {
              role: "mentor",
              text: "Excellent analysis! You clearly understand the security implications and concurrency concerns. The editor is now unlocked and your score penalty has been refunded.",
            },
          ])
        }, 1000)
        setMessages(newMessages)
      }
    },
    [messages, questionIndex]
  )

  const handleResetDemo = useCallback(() => {
    setAppState("idle")
    setScore(4.2)
    setMessages([])
    setQuestionIndex(0)
  }, [])

  const isLocked = appState === "locked" || appState === "quiz"

  const mentorState =
    appState === "quiz" ? "quiz" : appState === "pass" ? "pass" : "idle"

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar score={score} fileName="main.py - anti-copilot" />

      <div className="flex flex-1 min-h-0">
        <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />
        <FileExplorer />

        {/* Editor area with lock modal overlay */}
        <div className="flex-1 relative min-w-0">
          <CodeEditor isLocked={isLocked} />
          <LockModal
            isVisible={appState === "locked"}
            lineCount={PASTE_LINE_COUNT}
            scorePenalty={PASTE_LINE_COUNT * PENALTY_PER_LINE}
            onUndo={handleUndo}
          />
        </div>

        <MentorSidebar
          state={mentorState}
          messages={messages}
          onSendAnswer={handleSendAnswer}
          onTriggerPaste={handleTriggerPaste}
        />
      </div>

      <StatusBar isLocked={isLocked} />

      {/* Reset button for demo */}
      {appState === "pass" && (
        <button
          onClick={handleResetDemo}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg glass text-xs font-medium text-primary hover:bg-primary/10 transition-all animate-slide-in z-50"
        >
          Reset Demo
        </button>
      )}
    </div>
  )
}
