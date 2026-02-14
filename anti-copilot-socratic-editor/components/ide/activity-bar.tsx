"use client"

import {
  Files,
  Search,
  GitBranch,
  Bug,
  Blocks,
  Brain,
  User,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const topIcons = [
  { id: "explorer", icon: Files, label: "Explorer" },
  { id: "search", icon: Search, label: "Search" },
  { id: "git", icon: GitBranch, label: "Source Control" },
  { id: "debug", icon: Bug, label: "Debug" },
  { id: "extensions", icon: Blocks, label: "Extensions" },
  { id: "mentor", icon: Brain, label: "AI Mentor" },
]

const bottomIcons = [
  { id: "account", icon: User, label: "Account" },
  { id: "settings", icon: Settings, label: "Settings" },
]

export function ActivityBar({ activeTab, onTabChange }: ActivityBarProps) {
  return (
    <aside className="flex flex-col items-center w-12 bg-[hsl(220,20%,8%)] border-r border-border py-1 select-none">
      <div className="flex flex-col items-center gap-0.5 flex-1">
        {topIcons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-md transition-all",
              activeTab === id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={label}
            title={label}
          >
            {activeTab === id && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />
            )}
            <Icon className={cn("w-5 h-5", id === "mentor" && activeTab === id && "text-primary")} />
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        {bottomIcons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md transition-all",
              activeTab === id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={label}
            title={label}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </aside>
  )
}
