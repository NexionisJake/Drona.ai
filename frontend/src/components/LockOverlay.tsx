
import React, { useEffect, useState } from 'react';

interface LockOverlayProps {
    isVisible: boolean;
    linesPasted: number;
    scorePenalty: number; // e.g. -5.0
}

const LockOverlay: React.FC<LockOverlayProps> = ({ isVisible, linesPasted, scorePenalty }) => {
    // Keep in DOM briefly after hiding to allow exit animation
    const [shouldRender, setShouldRender] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            // Trigger enter animation on next frame
            requestAnimationFrame(() => setAnimateIn(true));
        } else {
            setAnimateIn(false);
            // Remove from DOM after exit animation
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
            style={{
                backdropFilter: animateIn ? "blur(4px)" : "blur(0px)",
                backgroundColor: animateIn ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
                transition: "backdrop-filter 300ms ease-in-out, background-color 300ms ease-in-out"
            }}
        >
            <div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center"
                style={{
                    transform: animateIn ? "scale(1)" : "scale(0.9)",
                    opacity: animateIn ? 1 : 0,
                    transition: "transform 300ms ease-out, opacity 300ms ease-out"
                }}
            >
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
