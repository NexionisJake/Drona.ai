import type { FileNode, WorkspaceContext } from '../types/workspace';

const MAX_CONTEXT_SIZE = 10 * 1024; // 10KB
const MAX_RELATED_FILES = 5;

/**
 * Parse import statements from file content
 */
function parseImports(content: string, filePath: string): string[] {
  const imports: string[] = [];
  const fileDir = filePath.split('/').slice(0, -1).join('/');

  // TypeScript/JavaScript imports
  const jsImportRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = jsImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Only process relative imports
    if (importPath.startsWith('.')) {
      const resolved = resolveImportPath(importPath, fileDir);
      if (resolved) imports.push(resolved);
    }
  }

  // Python imports
  const pyImportRegex = /from\s+([.\w]+)\s+import|import\s+([.\w]+)/g;
  while ((match = pyImportRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    // Only process relative imports (starting with .)
    if (importPath && importPath.startsWith('.')) {
      const resolved = resolveImportPath(importPath.replace(/\./g, '/'), fileDir);
      if (resolved) imports.push(resolved);
    }
  }

  return [...new Set(imports)]; // Remove duplicates
}

/**
 * Resolve relative import path to absolute path
 */
function resolveImportPath(importPath: string, baseDir: string): string | null {
  // Remove leading ./
  let path = importPath.replace(/^\.\//, '');

  // Handle ../ for parent directories
  const parts = baseDir.split('/');
  while (path.startsWith('../')) {
    parts.pop();
    path = path.slice(3);
  }

  const resolvedDir = parts.join('/');
  const fullPath = resolvedDir ? `${resolvedDir}/${path}` : path;

  // Try common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.py', '/index.ts', '/index.tsx', '/index.js'];
  for (const ext of extensions) {
    const candidate = fullPath + ext;
    // We'll validate this exists when we actually try to load it
    return candidate;
  }

  return fullPath;
}

/**
 * Find related files (imports and siblings)
 */
function findRelatedFiles(
  activeFile: FileNode,
  activeContent: string,
  workspaceFiles: Map<string, string>,
  fileIndex: Map<string, FileNode>
): Array<{ path: string; content: string; relation: 'import' | 'sibling' | 'dependency' }> {
  const related: Array<{ path: string; content: string; relation: 'import' | 'sibling' | 'dependency' }> = [];

  // Parse imports from active file
  const imports = parseImports(activeContent, activeFile.path);

  // Add imported files
  for (const importPath of imports) {
    if (related.length >= MAX_RELATED_FILES) break;

    // Try to find the file in the index
    let foundNode: FileNode | undefined;
    for (const [path, node] of fileIndex.entries()) {
      if (path.includes(importPath) || importPath.includes(path)) {
        foundNode = node;
        break;
      }
    }

    if (foundNode && workspaceFiles.has(foundNode.path)) {
      const content = workspaceFiles.get(foundNode.path)!;
      related.push({
        path: foundNode.path,
        content: truncateContent(content, 2000),
        relation: 'import'
      });
    }
  }

  // Add sibling files (same directory)
  if (related.length < MAX_RELATED_FILES) {
    const activeDir = activeFile.path.split('/').slice(0, -1).join('/');

    for (const [path, node] of fileIndex.entries()) {
      if (related.length >= MAX_RELATED_FILES) break;

      if (node.type === 'file' && path !== activeFile.path) {
        const nodeDir = path.split('/').slice(0, -1).join('/');
        if (nodeDir === activeDir && workspaceFiles.has(path)) {
          const content = workspaceFiles.get(path)!;
          related.push({
            path: path,
            content: truncateContent(content, 1000),
            relation: 'sibling'
          });
        }
      }
    }
  }

  return related;
}

/**
 * Truncate content to max length
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '\n\n... (truncated)';
}

/**
 * Get file tree as list of paths (limited to first 50)
 */
function getFileTreePaths(fileTree: FileNode[], maxFiles: number = 50): string[] {
  const paths: string[] = [];

  function traverse(node: FileNode) {
    if (paths.length >= maxFiles) return;

    if (node.type === 'file') {
      paths.push(node.path);
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
        if (paths.length >= maxFiles) break;
      }
    }
  }

  for (const node of fileTree) {
    traverse(node);
    if (paths.length >= maxFiles) break;
  }

  return paths;
}

/**
 * Build workspace context for AI
 */
export function buildWorkspaceContext(
  activeFile: FileNode | null,
  workspaceFiles: Map<string, string>,
  fileIndex: Map<string, FileNode>,
  fileTree: FileNode[]
): WorkspaceContext | null {
  if (!activeFile || !workspaceFiles.has(activeFile.path)) {
    return null;
  }

  const activeContent = workspaceFiles.get(activeFile.path)!;

  // Find related files
  const relatedFiles = findRelatedFiles(activeFile, activeContent, workspaceFiles, fileIndex);

  // Get file tree paths
  const fileTreePaths = getFileTreePaths(fileTree);

  // Build context
  const context: WorkspaceContext = {
    activeFile: {
      path: activeFile.path,
      content: activeContent
    },
    relatedFiles: relatedFiles,
    fileTree: fileTreePaths
  };

  // Check total size and truncate if needed
  let totalSize = activeContent.length;
  for (const file of relatedFiles) {
    totalSize += file.content.length;
  }

  if (totalSize > MAX_CONTEXT_SIZE) {
    // Truncate related files to fit within limit
    const budget = MAX_CONTEXT_SIZE - activeContent.length;
    const perFileLimit = Math.floor(budget / relatedFiles.length);

    context.relatedFiles = relatedFiles.map(file => ({
      ...file,
      content: truncateContent(file.content, perFileLimit)
    }));
  }

  return context;
}
