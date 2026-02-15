import React from 'react';
import { Activity } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import { TextRotate } from './ui/text-rotate';
import GradientText from './ui/GradientText';
import { Button as MovingBorderButton } from "./ui/moving-border";

interface NavbarProps {
    score: number;
}

const Navbar: React.FC<NavbarProps> = ({ score }) => {
    const [wordIndex, setWordIndex] = React.useState(0);

    const words = [
        { text: "CREATE", className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        { text: "BUILD", className: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
        { text: "THINK", className: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
        { text: "SOLVE", className: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 bg-[#09090b]/95 border-b border-white/[0.06] flex items-center justify-between px-5 z-50 backdrop-blur-xl">
            {/* Left — Punchline */}
            <div className="flex items-center">
                <LayoutGroup>
                    <motion.div className="flex items-center whitespace-pre" layout>
                        <motion.span
                            className="text-base font-extrabold text-gray-300 tracking-tight"
                            layout
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        >
                            DON'T GENERATE,{" "}
                        </motion.span>
                        <TextRotate
                            texts={words.map(w => w.text)}
                            mainClassName={`text-base font-bold px-2 py-0.5 rounded-md border min-w-[70px] text-center transition-all duration-300 ${words[wordIndex].className}`}
                            staggerFrom="last"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-120%" }}
                            staggerDuration={0.025}
                            splitLevelClassName="overflow-hidden"
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            rotationInterval={3000}
                            onNext={setWordIndex}
                        />
                    </motion.div>
                </LayoutGroup>
            </div>

            {/* Center — DRONA.AI logo + GradientText title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Activity className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <GradientText
                    colors={["#5227FF", "#FF9FFC", "#B19EEF", "#5227FF"]}
                    animationSpeed={8}
                    showBorder={false}
                    className="text-xl font-extrabold tracking-tight"
                >
                    DRONA.AI
                </GradientText>
            </div>

            {/* Right — Score Badge */}
            <MovingBorderButton
                borderRadius="9999px"
                containerClassName="h-auto w-auto p-[1px]"
                className="flex items-center gap-3 px-4 py-1.5 bg-black/40 backdrop-blur-md border-0"
                duration={3000}
                borderClassName={score > 0 ? "bg-[radial-gradient(#10b981_40%,transparent_60%)]" : "bg-[radial-gradient(#ef4444_40%,transparent_60%)]"}

            >
                <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">Builder Score</span>
                <div className={`h-2 w-2 rounded-full transition-all duration-500 ${score > 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
                <span className={`text-sm font-mono font-bold tabular-nums ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                    {score.toFixed(1)}
                </span>
            </MovingBorderButton>
        </nav>
    );
};

export default Navbar;
