import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { FileNode, WorkspaceState } from '../types/workspace';
import { scanDirectory, readFileContent, buildFileIndex } from '../utils/fileSystem';
import { toast } from 'sonner';
import { get, set } from 'idb-keyval';

interface WorkspaceContextType extends WorkspaceState {
  loadWorkspace: () => Promise<void>;
  restoreWorkspace: (handle: FileSystemDirectoryHandle) => Promise<void>;
  openFile: (node: FileNode) => Promise<void>;
  closeWorkspace: () => void;
  updateFileContent: (path: string, content: string) => void;
  toggleFolder: (path: string) => void;
  refreshWorkspace: () => Promise<void>;
  isLoading: boolean;
  recentWorkspaceHandle: FileSystemDirectoryHandle | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const MAX_CACHED_FILES = 50;

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [workspaceFiles, setWorkspaceFiles] = useState<Map<string, string>>(new Map());
  const [fileIndex, setFileIndex] = useState<Map<string, FileNode>>(new Map());
  const [workspaceHandle, setWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentWorkspaceHandle, setRecentWorkspaceHandle] = useState<FileSystemDirectoryHandle | null>(null);

  // Load recent workspace handle from IndexedDB on mount
  useEffect(() => {
    const loadRecentHandle = async () => {
      try {
        const handle = await get<FileSystemDirectoryHandle>('drona_workspace_handle');
        if (handle) {
          setRecentWorkspaceHandle(handle);
        }
      } catch (error) {
        console.error('Error loading recent workspace:', error);
      }
    };
    loadRecentHandle();
  }, []);

  // Shared function to load workspace from a directory handle
  const loadWorkspaceFromHandle = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    toast.info('Scanning workspace...', {
      description: 'This may take a moment for large projects'
    });

    // Scan directory
    const tree = await scanDirectory(dirHandle);
    const index = buildFileIndex(tree);

    setFileTree(tree);
    setFileIndex(index);
    setWorkspaceHandle(dirHandle);
    setWorkspaceFiles(new Map());
    setActiveFile(null);
    setRecentFiles([]);

    // Save to IndexedDB for persistence
    await set('drona_workspace_handle', dirHandle);
    setRecentWorkspaceHandle(dirHandle);

    toast.success('Workspace loaded', {
      description: `Found ${index.size} files in ${dirHandle.name}`
    });
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      // Check browser support
      if (!('showDirectoryPicker' in window)) {
        toast.error('Browser not supported', {
          description: 'Multi-file workspaces require Chrome/Edge 86+'
        });
        return;
      }

      setIsLoading(true);

      // Show directory picker
      // @ts-ignore - showDirectoryPicker exists but may not be in types
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      await loadWorkspaceFromHandle(dirHandle);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled - no need to show error
        console.log('Directory picker cancelled');
      } else if (error.name === 'NotAllowedError') {
        toast.error('Permission denied', {
          description: 'Please grant permission to access the folder'
        });
      } else {
        console.error('Error loading workspace:', error);
        toast.error('Failed to load workspace', {
          description: error.message || 'Unknown error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadWorkspaceFromHandle]);

  const restoreWorkspace = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      setIsLoading(true);

      // Verify/request permission
      // @ts-ignore - requestPermission exists but may not be in types
      const permission = await handle.requestPermission({ mode: 'read' });

      if (permission !== 'granted') {
        toast.error('Permission denied', {
          description: 'Please grant permission to access the folder'
        });
        return;
      }

      await loadWorkspaceFromHandle(handle);
    } catch (error: any) {
      console.error('Error restoring workspace:', error);
      toast.error('Failed to restore workspace', {
        description: error.message || 'Try opening the folder again'
      });
      // Clear the stored handle if it's invalid
      await set('drona_workspace_handle', null);
      setRecentWorkspaceHandle(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadWorkspaceFromHandle]);

  const openFile = useCallback(async (node: FileNode) => {
    if (node.type !== 'file') {
      return;
    }

    try {
      setIsLoading(true);

      // Check if already cached
      if (!workspaceFiles.has(node.path)) {
        // Read file content
        const content = await readFileContent(node.handle as FileSystemFileHandle);

        // Add to cache
        setWorkspaceFiles(prev => {
          const newCache = new Map(prev);

          // LRU eviction if cache is full
          if (newCache.size >= MAX_CACHED_FILES) {
            const oldestKey = Array.from(newCache.keys())[0];
            newCache.delete(oldestKey);
          }

          newCache.set(node.path, content);
          return newCache;
        });
      }

      // Set as active file
      setActiveFile(node);

      // Update recent files
      setRecentFiles(prev => {
        const filtered = prev.filter(p => p !== node.path);
        return [node.path, ...filtered].slice(0, 10);
      });

      toast.success('File opened', {
        description: node.name
      });
    } catch (error: any) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file', {
        description: error.message || node.name
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceFiles]);

  const closeWorkspace = useCallback(async () => {
    setFileTree([]);
    setActiveFile(null);
    setWorkspaceFiles(new Map());
    setFileIndex(new Map());
    setWorkspaceHandle(null);
    setRecentFiles([]);

    // Clear from IndexedDB
    await set('drona_workspace_handle', null);
    setRecentWorkspaceHandle(null);

    toast.info('Workspace closed');
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setWorkspaceFiles(prev => {
      const newCache = new Map(prev);
      newCache.set(path, content);
      return newCache;
    });
  }, []);

  const toggleFolder = useCallback((path: string) => {
    setFileTree(prevTree => {
      function toggleNode(nodes: FileNode[]): FileNode[] {
        return nodes.map(node => {
          if (node.path === path && node.type === 'folder') {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      }
      return toggleNode(prevTree);
    });
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!workspaceHandle) {
      toast.error('No workspace loaded');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Refreshing workspace...');

      const tree = await scanDirectory(workspaceHandle);
      const index = buildFileIndex(tree);

      setFileTree(tree);
      setFileIndex(index);

      // Clear cache for files that no longer exist
      setWorkspaceFiles(prev => {
        const newCache = new Map(prev);
        for (const path of newCache.keys()) {
          if (!index.has(path)) {
            newCache.delete(path);
          }
        }
        return newCache;
      });

      // Clear active file if it no longer exists
      if (activeFile && !index.has(activeFile.path)) {
        setActiveFile(null);
      }

      toast.success('Workspace refreshed');
    } catch (error: any) {
      console.error('Error refreshing workspace:', error);
      toast.error('Failed to refresh workspace', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceHandle, activeFile]);

  const value: WorkspaceContextType = {
    fileTree,
    activeFile,
    workspaceFiles,
    fileIndex,
    workspaceHandle,
    recentFiles,
    isLoading,
    recentWorkspaceHandle,
    loadWorkspace,
    restoreWorkspace,
    openFile,
    closeWorkspace,
    updateFileContent,
    toggleFolder,
    refreshWorkspace
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
