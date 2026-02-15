// Type definitions for workspace management

export interface FileNode {
  id: string;              // Full path (unique ID)
  name: string;            // File/folder name
  path: string;            // Full path from workspace root
  type: 'file' | 'folder';
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: FileNode[];   // For folders
  isExpanded?: boolean;    // UI state for folders
  size?: number;           // File size in bytes
  extension?: string;      // e.g., ".tsx", ".py"
  lastModified?: Date;     // Last modification time
}

export interface WorkspaceState {
  fileTree: FileNode[];                          // Root-level nodes
  activeFile: FileNode | null;                   // Currently open file
  workspaceFiles: Map<string, string>;           // path -> file content cache
  fileIndex: Map<string, FileNode>;              // path -> FileNode lookup
  workspaceHandle: FileSystemDirectoryHandle | null; // Root directory handle
  recentFiles: string[];                         // Recently opened file paths
}

export interface WorkspaceContext {
  activeFile: { path: string; content: string };
  relatedFiles: Array<{
    path: string;
    content: string;
    relation: 'import' | 'sibling' | 'dependency'
  }>;
  fileTree: string[];  // All file paths in workspace
}
