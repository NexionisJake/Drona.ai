
import React from 'react';

interface LockOverlayProps {
    isVisible: boolean;
    linesPasted: number;
    scorePenalty: number; // e.g. -5.0
}

const LockOverlay: React.FC<LockOverlayProps> = ({ isVisible, linesPasted, scorePenalty }) => {
    if (!isVisible) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
            style={{
                // Directly apply styles for robustness
                backdropFilter: "blur(4px)",
                backgroundColor: "rgba(0, 0, 0, 0.5)"
            }}
        >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center transform transition-all scale-100">
                <div className="flex justify-center mb-4">
                    <span className="text-4xl filter drop-shadow-md">⚠️</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">Vibe Coding Detected</h2>

                <p className="text-gray-200 mb-6 font-light">
                    You pasted a large block of code. Explain your logic to proceed.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                        <span className="block text-gray-400 mb-1">Lines Pasted</span>
                        <span className="text-2xl font-mono font-bold text-white">{linesPasted}</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                        <span className="block text-gray-400 mb-1">Score Penalty</span>
                        <span className="text-2xl font-mono font-bold text-red-500">{scorePenalty.toFixed(1)}</span>
                    </div>
                </div>

                <div className="text-sm text-blue-300 animate-pulse font-medium">
                    Answer in the Mentor panel →
                </div>
            </div>
        </div>
    );
};

export default LockOverlay;
