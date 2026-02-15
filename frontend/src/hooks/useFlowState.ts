import { useState, useEffect, useRef, useCallback } from 'react';

export interface FlowState {
    streak: number;      // Consecutive keystrokes without pause
    wpm: number;        // Words per minute (approx)
    intensity: number;  // 0-1 float for visual effects (glow/shake)
    isFlowing: boolean; // True if streak > threshold
}

export function useFlowState() {
    const [streak, setStreak] = useState(0);
    const [wpm, setWpm] = useState(0);

    // Internal tracking
    const lastKeystrokeTime = useRef<number>(Date.now());
    const keystrokesInWindow = useRef<number[]>([]); // Timestamps of recent keystrokes
    const streakTimeout = useRef<any>(null);

    const STREAK_TIMEOUT_MS = 2000; // Break streak if no typing for 2s
    const FLOW_THRESHOLD = 15;      // Keystrokes to enter "Flow"
    const MAX_STREAK = 150;         // Max visuals cap

    const calculateWpm = useCallback(() => {
        const now = Date.now();
        // Remove keystrokes older than 60s
        keystrokesInWindow.current = keystrokesInWindow.current.filter(t => now - t < 60000);

        const count = keystrokesInWindow.current.length;
        // Approx 5 chars per word
        const newWpm = Math.round((count / 5));
        setWpm(newWpm);
    }, []);

    const registerKeystroke = useCallback(() => {
        const now = Date.now();
        lastKeystrokeTime.current = now;
        keystrokesInWindow.current.push(now);

        setStreak(prev => {
            const next = prev + 1;
            // Visual feedback thresholds
            if (next === FLOW_THRESHOLD || next === FLOW_THRESHOLD * 2 || next === FLOW_THRESHOLD * 5) {
                // Could trigger specific level-up sounds/effects here via return value or side effect
            }
            return next;
        });

        calculateWpm();

        // Reset timeout
        if (streakTimeout.current) clearTimeout(streakTimeout.current);
        streakTimeout.current = setTimeout(() => {
            setStreak(0);
        }, STREAK_TIMEOUT_MS);

    }, [calculateWpm]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (streakTimeout.current) clearTimeout(streakTimeout.current);
        };
    }, []);

    const intensity = Math.min(streak / MAX_STREAK, 1);

    return {
        flowState: {
            streak,
            wpm,
            intensity,
            isFlowing: streak > FLOW_THRESHOLD
        },
        registerKeystroke
    };
}
