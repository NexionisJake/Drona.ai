
import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';

interface UsePasteDetectionProps {
    editorInstance: editor.IStandaloneCodeEditor | null;
    onPasteDetected: (params: { pastedText: string; lineCount: number; prePasteVersionId: number }) => void;
    isLocked: boolean;
}

export const usePasteDetection = ({ editorInstance, onPasteDetected, isLocked }: UsePasteDetectionProps) => {
    // Use current and previous to track version ID history
    const prevVersionId = useRef<number>(0);
    const currVersionId = useRef<number>(0);
    const internalClipboardRef = useRef<string | null>(null);

    useEffect(() => {
        if (!editorInstance) return;

        const model = editorInstance.getModel();
        if (!model) return;

        // Initialize version IDs
        currVersionId.current = model.getAlternativeVersionId();
        prevVersionId.current = currVersionId.current;

        const changeDisposable = editorInstance.onDidChangeModelContent(() => {
            // If locked, usually readOnly prevents changes, but good to be safe
            if (isLocked) return;

            // Update history: shift current to previous
            prevVersionId.current = currVersionId.current;
            currVersionId.current = model.getAlternativeVersionId();
        });

        // Track internal copies
        // Note: onDidCopy is not directly exposed on IStandaloneCodeEditor in strict TS without casting or using specific service,
        // but typically we can listen to the DOM or use internal events.
        // However, Monaco has specific command events.
        // Easier approach: Use the editor's onKeyDown or onDidCompositionEnd?
        // Actually, let's try to intercept the copy via the model or editor.
        // Standard way:
        const domNode = editorInstance.getDomNode();
        const handleCopy = () => {
            const selection = editorInstance.getSelection();
            if (selection && !selection.isEmpty()) {
                internalClipboardRef.current = model.getValueInRange(selection);
            }
        };

        // Listen to copy event on the textarea/container
        domNode?.addEventListener('copy', handleCopy);
        domNode?.addEventListener('cut', handleCopy);

        const pasteDisposable = editorInstance.onDidPaste((e) => {
            const model = editorInstance.getModel();
            if (!model) return;

            const range = e.range;
            // Get the pasted text from the model
            const pastedText = model.getValueInRange(range);
            const lineCount = pastedText.split('\n').length;

            // Threshold check: >= 25 lines
            if (lineCount >= 25) {
                // Check internal clipboard
                if (internalClipboardRef.current === pastedText) {
                    console.log("Internal paste detected - Allowed");
                    return;
                }

                // The paste just happened, so currVersionId is the post-paste ID.
                // prevVersionId contains the ID before this paste (from the concurrent/prior change event logic).
                onPasteDetected({
                    pastedText,
                    lineCount,
                    prePasteVersionId: prevVersionId.current
                });
            }
        });

        return () => {
            changeDisposable.dispose();
            pasteDisposable.dispose();
            domNode?.removeEventListener('copy', handleCopy);
            domNode?.removeEventListener('cut', handleCopy);
        };
    }, [editorInstance, onPasteDetected, isLocked]);
};
