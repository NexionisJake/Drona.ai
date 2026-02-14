
import { useState, useRef, useCallback } from 'react';

interface UseBuilderScoreReturn {
    score: number;
    updateOnTyping: (newContent: string) => void;
    deductScore: (amount: number) => void;
    addScore: (amount: number) => void;
    resetScore: () => void;
}

export const useBuilderScore = (initialScore: number = 0): UseBuilderScoreReturn => {
    const [score, setScore] = useState(initialScore);
    const previousLengthRef = useRef<number>(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
