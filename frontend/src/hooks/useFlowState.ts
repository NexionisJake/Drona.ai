import { useState, useEffect, useRef, useCallback } from 'react';
import { soundManager } from '../utils/SoundManager';

export interface FlowState {
    streak: number;      // Consecutive keystrokes without pause
    wpm: number;        // Words per minute (approx)
    intensity: number;  // 0-1 float for visual effects (glow/shake)
    isFlowing: boolean; // True if streak > threshold
}

export function useFlowState() {
    const [streak, setStreak] = useState(0);
    const [wpm, setWpm] = useState(0);

    // Internal tracking - use refs to avoid triggering re-renders on every keystroke
    const streakRef = useRef<number>(0);
    const lastKeystrokeTime = useRef<number>(Date.now());
    const keystrokesInWindow = useRef<number[]>([]); // Timestamps of recent keystrokes
    const streakTimeout = useRef<any>(null);
    const decayFrameRef = useRef<number>(0);
    const lastWpmUpdate = useRef<number>(0);

    const STREAK_TIMEOUT_MS = 2000; // Break streak if no typing for 2s
    const FLOW_THRESHOLD = 15;      // Keystrokes to enter "Flow"
    const MAX_STREAK = 150;         // Max visuals cap
    const WPM_UPDATE_THROTTLE = 500; // Update WPM display every 500ms max

    // Intensity is derived from streak, but we want smooth decay or updates.
    // If we want "high frequency" updates for a smooth decay/glow pulse, we should do it in the component via requestAnimationFrame
    // independent of React state. 
    // Current implementation: intensity = streak / MAX_STREAK. Streak updates on keystroke.
    // Issue: "Requires high frequency updates... forcing re-render 20 times a second".
    // If the "Intensity Engine" mentioned in the prompt implies a time-based decay (e.g. intensity drops 1% every 50ms),
    // then yes, that would trigger re-renders.
    // Currently, we DON'T have time-based decay for intensity (only the 2s timeout).
    // If we want to implement the "Intensity Engine" correctly with decay:

    // Let's implement a ref-based intensity that decays over time, and expose it to the component
    // via a ref or callback, avoiding state updates.
    // But CodeEditor uses `flowState.intensity` which is a number.
    // We can stick to the current "Event Based" intensity (based on streak) which is efficient enough (only updates on keypress).
    // The user PROMPT said: "The Intensity Engine ... requires high-frequency updates (e.g. subtracting intensity every 50ms)".
    // This implies they WANT that feature or think it exists and is slow. 
    // If I add it, I should do it right.
    // Let's NOT add high-frequency React state updates.
    // The current implementation is fine as is (no decay loop). 
    // However, to satisfy "Optimize Flow Mode", I should ensure we aren't re-rendering unnecessarily.
    // The prompt says "If this intensity score is tied to a standard React useState... it will cause severe input lag."
    // My previous edit to CodeEditor manually pushes to DOM. 
    // But `useFlowState` *returns* a new object `{ ... intensity }` on every render.
    // If `streak` updates, `useFlowState` updates, `CodeEditor` re-renders.
    // Typing = Keystroke = Re-render. This is normal for a text editor.
    // The "Fix" in the prompt: "Isolate the Flow Mode state... directly mutate a CSS custom variable".
    // This means `CodeEditor` should NOT re-render on every keystroke just for the glow.
    // It should render for the TEXT change (Monaco handles that internaly, but `onChange` prop might trigger parent state).
    // `App.tsx` has `handleEditorChange` -> `updateOnTyping`.
    // `CodeEditor` has its own `useFlowState`.
    // If `useFlowState` updates `streak` state, `CodeEditor` re-renders.
    // To fix this: remove `streak` from state and use refs, ensuring `CodeEditor` doesn't re-render on keystroke.
    // But we need to update the UI text "15x", "20x".
    // So we DO need re-renders for the counter text.
    // Maybe we can optimize by only re-rendering the *Counter* component?
    // CodeEditor is one big component.
    // Let's move flow state logic out or optimizing it.
    // Actually, 1 re-render per keystroke is acceptable for a "Combo Counter". 
    // The issue is if we had a *timer* draining it 20fps.
    // I will add a comment clarifying that we are avoiding the timer-based state drain.

    useEffect(() => {
        return () => {
            if (streakTimeout.current) clearTimeout(streakTimeout.current);
            if (decayFrameRef.current) cancelAnimationFrame(decayFrameRef.current);
        };
    }, []);

    const calculateWpm = useCallback(() => {
        const now = Date.now();

        // Throttle WPM updates to avoid frequent re-renders
        if (now - lastWpmUpdate.current < WPM_UPDATE_THROTTLE) {
            return;
        }

        // Remove keystrokes older than 60s
        keystrokesInWindow.current = keystrokesInWindow.current.filter(t => now - t < 60000);

        const count = keystrokesInWindow.current.length;
        // Approx 5 chars per word
        const newWpm = Math.round((count / 5));
        setWpm(newWpm);
        lastWpmUpdate.current = now;
    }, []);

    const registerKeystroke = useCallback(() => {
        const now = Date.now();
        lastKeystrokeTime.current = now;
        keystrokesInWindow.current.push(now);

        // Update ref immediately
        streakRef.current += 1;
        const currentStreak = streakRef.current;

        // Only update state (trigger re-render) every 5 keystrokes or at key thresholds
        if (currentStreak % 5 === 0 || currentStreak === FLOW_THRESHOLD || currentStreak === FLOW_THRESHOLD * 2) {
            setStreak(currentStreak);

            // Visual feedback thresholds
            if (currentStreak === FLOW_THRESHOLD || currentStreak === FLOW_THRESHOLD * 2 || currentStreak === FLOW_THRESHOLD * 5) {
                soundManager.playFlowRankUp();
            }
        }

        calculateWpm();

        // Reset timeout
        if (streakTimeout.current) clearTimeout(streakTimeout.current);
        streakTimeout.current = setTimeout(() => {
            streakRef.current = 0;
            setStreak(0);
        }, STREAK_TIMEOUT_MS);

    }, [calculateWpm]);

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
