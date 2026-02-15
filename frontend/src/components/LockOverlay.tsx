
import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

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
                backdropFilter: animateIn ? "blur(8px)" : "blur(0px)",
                backgroundColor: animateIn ? "rgba(0, 0, 0, 0.60)" : "rgba(0, 0, 0, 0)",
                transition: "backdrop-filter 300ms ease-in-out, background-color 300ms ease-in-out"
            }}
        >
            <div
                className="bg-[#0d1117]/80 backdrop-blur-xl border border-red-500/30 rounded-xl p-8 max-w-lg w-full text-center animate-glow-pulse"
                style={{
                    transform: animateIn ? "scale(1)" : "scale(0.9)",
                    opacity: animateIn ? 1 : 0,
                    transition: "transform 300ms ease-out, opacity 300ms ease-out"
                }}
            >
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                        <ShieldAlert className="w-8 h-8 text-red-400" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight">Vibe Coding Detected</h2>

                <p className="text-gray-400 mb-6 text-sm font-light leading-relaxed">
                    You pasted a large block of code. Explain your logic to proceed.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                    <div className="bg-black/50 p-4 rounded-lg border border-white/[0.06]">
                        <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">Lines Pasted</span>
                        <span className="text-2xl font-mono font-bold text-white">{linesPasted}</span>
                    </div>
                    <div className="bg-black/50 p-4 rounded-lg border border-red-500/10">
                        <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">Score Penalty</span>
                        <span className="text-2xl font-mono font-bold text-red-400">{scorePenalty.toFixed(1)}</span>
                    </div>
                </div>

                <div className="text-sm text-blue-400/80 animate-pulse font-medium flex items-center justify-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                    Answer in the Mentor panel →
                </div>
            </div>
        </div>
    );
};

export default LockOverlay;
