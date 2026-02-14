"use client"

import { GitBranch, AlertCircle, CheckCircle2, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBarProps {
  isLocked: boolean
}

export function StatusBar({ isLocked }: StatusBarProps) {
  return (
    <footer className="flex items-center h-6 bg-[hsl(220,20%,8%)] border-t border-border px-2 text-[11px] select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 -ml-2 transition-colors",
          isLocked
            ? "bg-amber-500/20 text-amber-400"
            : "bg-primary/10 text-primary"
        )}>
          {isLocked ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          <span className="font-medium">
            {isLocked ? "LOCKED" : "READY"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-auto text-muted-foreground">
        <span>Ln 25, Col 42</span>
        <span>Spaces: 4</span>
        <span>UTF-8</span>
        <span className="text-[#4ec9b0]">Python</span>
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Connected</span>
        </div>
      </div>
    </footer>
  )
}
