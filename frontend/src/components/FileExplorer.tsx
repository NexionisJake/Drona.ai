import React from 'react';
import { ChevronRight, ChevronDown, FolderOpen, RefreshCw, X } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { FileNode } from '../types/workspace';
import { FileIcon } from './FileIcon';

const FileExplorer: React.FC = () => {
    const {
        fileTree,
        activeFile,
        workspaceHandle,
        loadWorkspace,
        openFile,
        closeWorkspace,
        toggleFolder,
        refreshWorkspace,
        isLoading
    } = useWorkspace();

    const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
        const isActive = activeFile?.path === node.path;
        const paddingLeft = `${depth * 16 + 16}px`;

        if (node.type === 'folder') {
            return (
                <div key={node.path}>
                    <div
                        className="flex items-center py-[5px] text-gray-400 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150"
                        style={{ paddingLeft }}
                        onClick={() => toggleFolder(node.path)}
                    >
                        {node.isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 mr-1 text-gray-500 flex-shrink-0" />
                        )}
                        <FileIcon
                            fileName={node.name}
                            type="folder"
                            isExpanded={node.isExpanded}
                            className="w-4 h-4 mr-2 flex-shrink-0"
                        />
                        <span className="truncate">{node.name}</span>
                    </div>
                    {node.isExpanded && node.children && (
                        <div>
                            {node.children.map(child => renderNode(child, depth + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                key={node.path}
                className={`flex items-center py-[5px] cursor-pointer transition-colors duration-150 ${
                    isActive
                        ? 'bg-white/[0.05] text-gray-200 border-l-2 border-blue-500'
                        : 'text-gray-500 hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
                style={{ paddingLeft }}
                onClick={() => openFile(node)}
            >
                <FileIcon
                    fileName={node.name}
                    type="file"
                    className="w-4 h-4 mr-2 flex-shrink-0"
                />
                <span className="truncate">{node.name}</span>
            </div>
        );
    };

    return (
        <div className="h-full bg-[#0a0e14] border-r border-white/[0.06] flex flex-col text-sm select-none pt-14">
            {/* Explorer Header */}
            <div className="flex items-center justify-between px-4 h-9 text-gray-500 font-medium text-[11px] tracking-widest uppercase border-b border-white/[0.04]">
                <span>Explorer</span>
                {workspaceHandle && (
                    <div className="flex items-center gap-1">
                        <button
                            className="h-6 w-6 p-0 hover:bg-white/[0.1] rounded transition-colors flex items-center justify-center"
                            onClick={refreshWorkspace}
                            title="Refresh workspace"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                        <button
                            className="h-6 w-6 p-0 hover:bg-white/[0.1] rounded transition-colors flex items-center justify-center"
                            onClick={closeWorkspace}
                            title="Close workspace"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Workspace Content */}
            {workspaceHandle ? (
                <>
                    {/* Project Title */}
                    <div className="flex items-center px-3 py-1.5 text-gray-300 font-semibold text-xs border-b border-white/[0.04]">
                        <FolderOpen className="w-4 h-4 mr-2 text-blue-400/80" />
                        <span className="truncate">{workspaceHandle.name}</span>
                    </div>

                    {/* File Tree */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-gray-500 text-xs">
                                Loading...
                            </div>
                        ) : fileTree.length > 0 ? (
                            <div className="py-1">
                                {fileTree.map(node => renderNode(node, 0))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8 text-gray-500 text-xs">
                                No files found
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Empty State */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-600 mb-4" />
                        <p className="text-gray-500 text-xs mb-4">
                            No workspace loaded
                        </p>
                        <button
                            onClick={loadWorkspace}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Open Folder'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FileExplorer;
