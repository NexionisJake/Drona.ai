"use client"

import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  active?: boolean
  language?: string
}

const fileTree: FileNode[] = [
  {
    name: "anti-copilot",
    type: "folder",
    children: [
      {
        name: "src",
        type: "folder",
        children: [
          { name: "main.py", type: "file", active: true, language: "python" },
          { name: "database.py", type: "file", language: "python" },
          { name: "utils.py", type: "file", language: "python" },
        ],
      },
      {
        name: "tests",
        type: "folder",
        children: [
          { name: "test_main.py", type: "file", language: "python" },
        ],
      },
      { name: "requirements.txt", type: "file" },
      { name: "README.md", type: "file" },
    ],
  },
]

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(true)

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full gap-1 px-1 py-0.5 text-xs hover:bg-secondary/60 rounded-sm transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          )}
          <span className="text-foreground/90 truncate">{node.name}</span>
        </button>
        {isOpen && node.children?.map((child) => (
          <FileTreeNode key={child.name} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <button
      className={cn(
        "flex items-center w-full gap-1 px-1 py-0.5 text-xs rounded-sm transition-colors",
        node.active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileCode className={cn("w-3.5 h-3.5 shrink-0", node.active ? "text-primary" : "text-muted-foreground/70")} />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

export function FileExplorer() {
  return (
    <div className="w-56 bg-[hsl(220,20%,8.5%)] border-r border-border flex flex-col select-none">
      <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        Explorer
      </div>
      <div className="flex-1 overflow-auto px-1 py-1">
        {fileTree.map((node) => (
          <FileTreeNode key={node.name} node={node} />
        ))}
      </div>
    </div>
  )
}
