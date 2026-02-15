import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface TerminalPanelProps {
    stdout: string;
    stderr: string;
    isRunning: boolean;
    onClose: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ stdout, stderr, isRunning, onClose }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-white/[0.08] flex flex-col z-10 h-[280px] animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OUTPUT</span>
                    {isRunning && (
                        <div className="flex items-center gap-2 text-xs text-blue-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="animate-pulse">Running...</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1 hover:bg-white/[0.05] rounded"
                    aria-label="Close terminal"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
                {isRunning ? (
                    <div className="flex items-center gap-3 text-cyan-400">
                        <div className="flex gap-1">
                            <span className="animate-pulse delay-0">&gt;</span>
                            <span className="animate-pulse delay-75">&gt;</span>
                            <span className="animate-pulse delay-150">&gt;</span>
                        </div>
                        <span className="animate-pulse">Executing Drona.ai runtime...</span>
                    </div>
                ) : (
                    <>
                        {/* Standard Output */}
                        {stdout && (
                            <div className="text-gray-300 whitespace-pre-wrap break-words mb-4">
                                {stdout}
                            </div>
                        )}

                        {/* Standard Error */}
                        {stderr && (
                            <div className="text-red-400 whitespace-pre-wrap break-words">
                                {stderr}
                            </div>
                        )}

                        {/* Empty State */}
                        {!stdout && !stderr && (
                            <div className="text-gray-600 italic">
                                No output yet. Click "Run Code" to execute your program.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TerminalPanel;
