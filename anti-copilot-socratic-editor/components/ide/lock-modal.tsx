"use client"

import { ShieldAlert, Undo2, ArrowRight, Lock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LockModalProps {
  isVisible: boolean
  lineCount: number
  scorePenalty: number
  onUndo: () => void
}

export function LockModal({ isVisible, lineCount, scorePenalty, onUndo }: LockModalProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Glassmorphism modal */}
      <div className="glass-strong rounded-xl w-[440px] p-6 animate-slide-in shadow-2xl shadow-black/50">
        {/* Top glow line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Vibe Coding Detected
              <span className="flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explain this logic to proceed.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex flex-col items-center p-2.5 rounded-lg bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Lines Pasted</span>
            <span className="text-lg font-mono font-bold text-amber-400">{lineCount}</span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-lg bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Penalty</span>
            <span className="text-lg font-mono font-bold text-red-400">{scorePenalty.toFixed(1)}</span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-lg bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Status</span>
            <div className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">LOCKED</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-5">
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p>
                The AI Mentor will ask you questions about the pasted code.
                Demonstrate understanding to unlock the editor.
              </p>
              <p className="mt-1.5 text-primary/70">
                Your score penalty will be refunded if you answer correctly.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/60 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo Paste
            <kbd className="text-[9px] text-muted-foreground/50 bg-secondary/80 px-1 rounded border border-border/50 ml-1">
              {"Ctrl+Z"}
            </kbd>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/25 text-xs font-medium text-primary hover:bg-primary/20 hover:border-primary/35 transition-all glow-border-cyan">
            Answer Questions
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </div>
  )
}
