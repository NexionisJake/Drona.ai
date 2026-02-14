"use client"

import {
  Shield,
  ChevronDown,
  Play,
  Bug,
  Terminal,
  LayoutGrid,
  Settings,
  Search,
} from "lucide-react"

interface NavbarProps {
  score: number
  fileName: string
}

export function Navbar({ score, fileName }: NavbarProps) {
  const scoreColor =
    score >= 0 ? "text-emerald-400" : "text-red-400"
  const scoreGlow =
    score >= 0
      ? "drop-shadow-[0_0_6px_hsl(142,72%,45%,0.5)]"
      : "drop-shadow-[0_0_6px_hsl(0,72%,55%,0.5)]"

  return (
    <header className="flex items-center h-9 bg-[hsl(220,20%,8%)] border-b border-border px-2 select-none">
      {/* Left: Menu items */}
      <nav className="flex items-center gap-0.5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm hover:bg-secondary/60 cursor-pointer transition-colors">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary glow-cyan tracking-wide">
            ANTI-COPILOT
          </span>
        </div>
        {["File", "Edit", "View", "Run", "Help"].map((item) => (
          <button
            key={item}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-sm transition-colors"
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Center: Command palette / file indicator */}
      <div className="flex-1 flex items-center justify-center">
        <button className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/50 border border-border hover:border-primary/30 transition-all max-w-xs w-full justify-center group">
          <Search className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
            {fileName}
          </span>
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground/60 bg-secondary/80 px-1 rounded border border-border/50">
            {"Ctrl+P"}
          </kbd>
        </button>
      </div>

      {/* Right: Score & actions */}
      <div className="flex items-center gap-1">
        {/* Builder Score */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 border border-border mr-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Builder Score
          </span>
          <span
            className={`text-sm font-mono font-bold tabular-nums ${scoreColor} ${scoreGlow} transition-all`}
          >
            {score >= 0 ? "+" : ""}
            {score.toFixed(1)}
          </span>
        </div>

        <button className="p-1.5 hover:bg-secondary/60 rounded-sm transition-colors" aria-label="Run code">
          <Play className="w-3.5 h-3.5 text-emerald-400" />
        </button>
        <button className="p-1.5 hover:bg-secondary/60 rounded-sm transition-colors" aria-label="Debug">
          <Bug className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button className="p-1.5 hover:bg-secondary/60 rounded-sm transition-colors" aria-label="Terminal">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button className="p-1.5 hover:bg-secondary/60 rounded-sm transition-colors" aria-label="Layout">
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button className="p-1.5 hover:bg-secondary/60 rounded-sm transition-colors" aria-label="Settings">
          <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </header>
  )
}
