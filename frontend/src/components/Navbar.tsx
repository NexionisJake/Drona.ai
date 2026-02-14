import React from 'react';
import { Activity } from 'lucide-react';

interface NavbarProps {
    score: number;
}

const Navbar: React.FC<NavbarProps> = ({ score }) => {
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between px-6 z-50">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
                    Anti-Copilot
                </h1>
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#161b22] border border-[#30363d] rounded-full shadow-inner transition-all hover:border-gray-600">
                <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Builder Score</span>
                <span className={`text-sm font-mono font-bold ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                    {score.toFixed(1)}
                </span>
            </div>
        </nav>
    );
};

export default Navbar;
