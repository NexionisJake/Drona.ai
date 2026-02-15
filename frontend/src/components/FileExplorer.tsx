import React from 'react';
import { FolderOpen, FileCode, FileJson, Settings, ChevronRight, ChevronDown } from 'lucide-react';

const FileExplorer: React.FC = () => {
    return (
        <div className="h-full bg-[#0a0e14] border-r border-white/[0.06] flex flex-col text-sm select-none pt-14">
            {/* Explorer Header */}
            <div className="flex items-center px-4 h-9 text-gray-500 font-medium text-[11px] tracking-widest uppercase border-b border-white/[0.04]">
                Explorer
            </div>

            {/* Project Title */}
            <div className="flex items-center px-3 py-1.5 text-gray-300 font-semibold text-xs hover:bg-white/[0.03] cursor-pointer transition-colors duration-150">
                <ChevronDown className="w-3.5 h-3.5 mr-1 text-gray-500" />
                ANTI-COPILOT
            </div>

            {/* File Tree */}
            <div className="flex flex-col mt-0.5">
                {/* Expanded Workspace Folder */}
                <div className="flex items-center px-4 py-[5px] text-gray-400 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150">
                    <ChevronDown className="w-3.5 h-3.5 mr-1 text-gray-500" />
                    <FolderOpen className="w-4 h-4 mr-2 text-blue-400/80" />
                    <span>workspace</span>
                </div>

                {/* Files in Workspace */}
                <div className="flex flex-col">
                    <div className="flex items-center pl-10 pr-2 py-[5px] bg-white/[0.05] text-gray-200 border-l-2 border-blue-500 cursor-pointer">
                        <FileCode className="w-4 h-4 mr-2 text-yellow-400/90" />
                        <span>main.py</span>
                    </div>
                    <div className="flex items-center pl-10 pr-2 py-[5px] text-gray-500 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150">
                        <FileJson className="w-4 h-4 mr-2 text-yellow-200/70" />
                        <span>config.json</span>
                    </div>
                    <div className="flex items-center pl-10 pr-2 py-[5px] text-gray-500 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150">
                        <FileCode className="w-4 h-4 mr-2 text-blue-300/70" />
                        <span>utils.py</span>
                    </div>
                </div>

                {/* Other Folders (Collapsed) */}
                <div className="flex items-center px-4 py-[5px] text-gray-500 hover:bg-white/[0.03] cursor-pointer mt-0.5 transition-colors duration-150">
                    <ChevronRight className="w-3.5 h-3.5 mr-1 text-gray-600" />
                    <FolderOpen className="w-4 h-4 mr-2 text-gray-600" />
                    <span>tests</span>
                </div>
                <div className="flex items-center px-4 py-[5px] text-gray-500 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150">
                    <ChevronRight className="w-3.5 h-3.5 mr-1 text-gray-600" />
                    <FolderOpen className="w-4 h-4 mr-2 text-gray-600" />
                    <span>env</span>
                </div>
            </div>

            {/* Bottom Settings (VS Code style) */}
            <div className="mt-auto px-4 py-3 border-t border-white/[0.04]">
                <div className="flex items-center text-gray-600 hover:text-gray-400 cursor-pointer transition-colors duration-150">
                    <Settings className="w-4 h-4 mr-2" />
                    <span className="text-xs">Settings</span>
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;
