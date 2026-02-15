import type { FileNode } from '../types/workspace';

// Directories to exclude from scanning
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '__pycache__',
  'venv',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.cache',
  '.vscode',
  '.idea'
]);

// Text file extensions whitelist
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.pyw', '.ipynb',
  '.java', '.kt', '.scala',
  '.c', '.cpp', '.h', '.hpp', '.cc', '.cxx',
  '.cs', '.fs', '.go', '.rs', '.swift',
  '.rb', '.php', '.lua', '.pl', '.sh', '.bash',
  '.html', '.htm', '.xml', '.svg', '.css', '.scss', '.sass', '.less',
  '.sql', '.graphql', '.proto',
  '.env', '.gitignore', '.dockerignore',
  'Dockerfile', 'Makefile', 'Rakefile'
]);

// Binary file extensions blacklist
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.avi', '.mov', '.wav',
  '.ttf', '.woff', '.woff2', '.eot',
  '.pyc', '.class', '.o', '.a'
]);

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Recursively scan a directory and build a file tree
 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentPath: string = '',
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) {
    console.warn(`Max depth reached at ${parentPath}`);
    return [];
  }

  const nodes: FileNode[] = [];

  try {
    // @ts-ignore - FileSystemDirectoryHandle.values() exists but may not be in types
    for await (const entry of dirHandle.values()) {
      // Skip excluded directories
      if (entry.kind === 'directory' && EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }

      const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        const children = await scanDirectory(
          entry as FileSystemDirectoryHandle,
          path,
          maxDepth,
          currentDepth + 1
        );

        nodes.push({
          id: path,
          name: entry.name,
          path: path,
          type: 'folder',
          handle: entry as FileSystemDirectoryHandle,
          children: children,
          isExpanded: false
        });
      } else {
        const extension = getExtension(entry.name);

        nodes.push({
          id: path,
          name: entry.name,
          path: path,
          type: 'file',
          handle: entry as FileSystemFileHandle,
          extension: extension
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${parentPath}:`, error);
  }

  // Sort: folders first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Read file content from a FileSystemFileHandle
 */
export async function readFileContent(
  fileHandle: FileSystemFileHandle
): Promise<string> {
  const file = await fileHandle.getFile();

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
  }

  // Check if file is binary
  if (!isTextFile(file.name)) {
    throw new Error(`Cannot read binary file: ${file.name}`);
  }

  const text = await file.text();
  return text;
}

/**
 * Build a flat index of all files in the tree for O(1) lookup
 */
export function buildFileIndex(fileTree: FileNode[]): Map<string, FileNode> {
  const index = new Map<string, FileNode>();

  function indexNode(node: FileNode) {
    index.set(node.path, node);
    if (node.children) {
      node.children.forEach(indexNode);
    }
  }

  fileTree.forEach(indexNode);
  return index;
}

/**
 * Check if a file is a text file based on extension
 */
export function isTextFile(fileName: string): boolean {
  const extension = getExtension(fileName);

  // Check blacklist first
  if (BINARY_EXTENSIONS.has(extension)) {
    return false;
  }

  // Check whitelist
  if (TEXT_EXTENSIONS.has(extension)) {
    return true;
  }

  // Files without extension or unknown extensions - assume text
  return !extension || extension.length < 6;
}

/**
 * Get file extension including the dot
 */
function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Detect programming language from file name/extension
 */
export function detectLanguage(fileName: string): string {
  const extension = getExtension(fileName);

  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell'
  };

  return languageMap[extension] || 'plaintext';
}

/**
 * Get all file paths from a file tree (flattened)
 */
export function getAllFilePaths(fileTree: FileNode[]): string[] {
  const paths: string[] = [];

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      paths.push(node.path);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  fileTree.forEach(traverse);
  return paths;
}
