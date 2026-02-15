import React from 'react';
import { XCircle, AlertTriangle, GitBranch, Zap, ServerOff } from 'lucide-react';

interface StatusBarProps {
    errors?: number;
    warnings?: number;
    line?: number;
    col?: number;
    isMockMode?: boolean;
}

const StatusBarComponent: React.FC<StatusBarProps> = ({
    errors = 0,
    warnings = 0,
    line = 1,
    col = 1,
    isMockMode = false,
}) => {
    return (
        <div className="flex items-center justify-between px-3 h-6 bg-[#18181b] border-t border-white/5 text-zinc-400 text-[11px] font-sans select-none z-50 shrink-0 w-full">
            {/* Left Side */}
            <div className="flex items-center gap-3 h-full">
                <div className="flex items-center gap-1 cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hover:text-white">
                    <GitBranch size={12} />
                    <span>main*</span>
                </div>

                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hover:text-white">
                    <div className="flex items-center gap-1">
                        <XCircle size={12} className={errors > 0 ? "text-red-400" : ""} />
                        <span>{errors}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <AlertTriangle size={12} className={warnings > 0 ? "text-yellow-400" : ""} />
                        <span>{warnings}</span>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 h-full">
                <div className="flex items-center cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hover:text-white">
                    Ln {line}, Col {col}
                </div>
                <div className="flex items-center cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hidden sm:flex hover:text-white">
                    Spaces: 4
                </div>
                <div className="flex items-center cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hidden sm:flex hover:text-white">
                    UTF-8
                </div>
                <div className="flex items-center cursor-pointer hover:bg-white/5 px-2 h-full transition-colors hover:text-white">
                    Python
                </div>

                {/* Drona.ai Status Badge */}
                <div
                    className={`flex items-center gap-1 cursor-pointer px-3 h-full transition-colors font-medium ml-2 text-white
            ${isMockMode ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30' : 'bg-pink-600/20 text-pink-500 hover:bg-pink-600/30'} 
            border-l border-white/5`}
                    title={isMockMode ? "Using local mock data to save API credits" : "Connected to Claude 3.5 Sonnet"}
                >
                    {isMockMode ? <ServerOff size={12} /> : <Zap size={12} fill="currentColor" />}
                    <span className="text-[10px] tracking-wide uppercase font-bold">{isMockMode ? 'MOCK MODE' : 'ONLINE'}</span>
                </div>
            </div>
        </div>
    );
};

// Memoize to prevent re-renders when props haven't changed
export const StatusBar = React.memo(StatusBarComponent);
