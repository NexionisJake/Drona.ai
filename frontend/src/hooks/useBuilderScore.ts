
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseBuilderScoreReturn {
    score: number;
    updateOnTyping: (newContent: string) => void;
    deductScore: (amount: number) => void;
    addScore: (amount: number) => void;
    resetScore: () => void;
}

// Simple hash implementation for hackathon demonstration
// In production, this would be server-side or more robust
const SALT = "anti-copilot-secure-salt-v1";
const simpleHash = (val: number): string => {
    let str = val.toString() + SALT;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

export const useBuilderScore = (initialScore: number = 0): UseBuilderScoreReturn => {
    // Load from localStorage if available
    const [score, setScore] = useState(() => {
        try {
            const stored = localStorage.getItem('builderScore');
            if (stored) {
                const { value, hash } = JSON.parse(stored);
                if (simpleHash(value) === hash) {
                    return value;
                } else {
                    console.warn("Tampering detected! Resetting score.");
                    return 0;
                }
            }
        } catch (e) {
            console.error("Failed to load score", e);
        }
        return initialScore;
    });

    const previousLengthRef = useRef<number>(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Persist score changes (debounced to avoid excessive localStorage writes)
    useEffect(() => {
        if (persistTimerRef.current) {
            clearTimeout(persistTimerRef.current);
        }

        persistTimerRef.current = setTimeout(() => {
            const data = JSON.stringify({
                value: score,
                hash: simpleHash(score)
            });
            localStorage.setItem('builderScore', data);
        }, 1000);

        return () => {
            if (persistTimerRef.current) {
                clearTimeout(persistTimerRef.current);
            }
        };
    }, [score]);

    const updateOnTyping = useCallback((newContent: string) => {
        const currentLength = newContent.length;
        const previousLength = previousLengthRef.current;

        // 1. Detect if length increased (Typing / Pasting)
        // We only reward if it's NOT a massive jump (paste is handled separately)
        // Let's assume typing is small increments.
        // Actually, paste detection is handled by `onDidPaste` in another hook.
        // So here we just want "typing".
        // But pasting also triggers onChange.
        // Recommendation: If change < 5 chars? Or just rely on debounce?

        // If length grew
        if (currentLength > previousLength) {
            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set new timer
            debounceTimerRef.current = setTimeout(() => {
                setScore(prev => prev + 0.2);
            }, 500);
        }

        previousLengthRef.current = currentLength;
    }, []);

    const deductScore = useCallback((amount: number) => {
        setScore(prev => prev + amount); // amount is usually negative, e.g. -5.0
    }, []);

    const addScore = useCallback((amount: number) => {
        setScore(prev => prev + amount);
    }, []);

    const resetScore = useCallback(() => {
        setScore(0);
        previousLengthRef.current = 0;
    }, []);

    return {
        score,
        updateOnTyping,
        deductScore,
        addScore,
        resetScore
    };
};
