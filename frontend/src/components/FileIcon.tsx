import { FileCode, FileJson, FileText, File, Folder, FolderOpen } from 'lucide-react';

interface FileIconProps {
  fileName: string;
  type: 'file' | 'folder';
  isExpanded?: boolean;
  className?: string;
}

export function FileIcon({ fileName, type, isExpanded, className = 'w-4 h-4' }: FileIconProps) {
  if (type === 'folder') {
    return isExpanded ? (
      <FolderOpen className={`${className} text-blue-400`} />
    ) : (
      <Folder className={`${className} text-blue-400`} />
    );
  }

  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

  // TypeScript/JavaScript files
  if (['ts', 'tsx'].includes(extension || '')) {
    return <FileCode className={`${className} text-blue-500`} />;
  }

  if (['js', 'jsx', 'mjs', 'cjs'].includes(extension || '')) {
    return <FileCode className={`${className} text-yellow-500`} />;
  }

  // Python files
  if (['py', 'pyw'].includes(extension || '')) {
    return <FileCode className={`${className} text-yellow-600`} />;
  }

  // JSON files
  if (['json', 'jsonc'].includes(extension || '')) {
    return <FileJson className={`${className} text-green-500`} />;
  }

  // Markdown files
  if (['md', 'mdx', 'markdown'].includes(extension || '')) {
    return <FileText className={`${className} text-blue-300`} />;
  }

  // HTML/CSS files
  if (['html', 'htm', 'css', 'scss', 'sass', 'less'].includes(extension || '')) {
    return <FileCode className={`${className} text-orange-500`} />;
  }

  // Config files
  if (['yaml', 'yml', 'toml', 'ini', 'env'].includes(extension || '')) {
    return <FileText className={`${className} text-gray-400`} />;
  }

  // Default file icon
  return <File className={`${className} text-gray-400`} />;
}
