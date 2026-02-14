
import React from 'react';

interface NavbarProps {
    score: number;
}

const Navbar: React.FC<NavbarProps> = ({ score }) => {
    const getScoreColor = (score: number) => {
        if (score > 0) return 'text-green-500';
        if (score < 0) return 'text-red-500';
        return 'text-white';
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-50">
            <div className="text-xl font-bold text-white tracking-tight">
                Anti-Copilot
            </div>
            <div className="font-mono text-lg">
                <span className="text-gray-400 mr-2">Builder Score:</span>
                <span className={`font-bold ${getScoreColor(score)}`}>
                    {score.toFixed(1)}
                </span>
            </div>
            <div className="w-24"></div> {/* Spacer for centering if needed, or right side items */}
        </nav>
    );
};

export default Navbar;
