
import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface UseUndoEscapeProps {
    editorInstance: monaco.editor.IStandaloneCodeEditor | null;
    isLocked: boolean;
    prePasteVersionId: number;
    onUndoComplete: () => void;
}

export const useUndoEscape = ({
    editorInstance,
    isLocked,
    prePasteVersionId,
    onUndoComplete
}: UseUndoEscapeProps) => {
    const versionIdRef = useRef(prePasteVersionId);

    // Keep ref in sync just in case (though prePasteVersionId shouldn't change while locked)
    useEffect(() => {
        versionIdRef.current = prePasteVersionId;
    }, [prePasteVersionId]);

    useEffect(() => {
        if (!editorInstance || !isLocked) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();

                // 1. Temporarily unlock to allow programmatic undo
                editorInstance.updateOptions({ readOnly: false });

                // 2. Trigger Undo
                editorInstance.trigger('keyboard', 'undo', null);

                // 3. Check version ID
                const currentVersionId = editorInstance.getModel()?.getAlternativeVersionId();

                if (currentVersionId === versionIdRef.current) {
                    // Full undo achieved!
                    console.log("Full undo achieved! Unlocking...");
                    // Keep readOnly: false
                    onUndoComplete();
                } else {
                    // Partial undo or mismatch? Re-lock.
                    // Wait, if we are in the middle of undoing a massive paste, 
                    // Monaco might do it in one go or steps. 
                    // Usually single paste = single undo step.
                    // If it fails to match, we must re-lock.
                    console.log("Undo step taken, but version mismatch. Re-locking.");
                    editorInstance.updateOptions({ readOnly: true });
                }
            }
        };

        // Add listener to the window/document to capture capture phase? 
        // Or editor container? Editor consumes keys.
        // Monaco has its own command service.
        // We should probably use editor.addCommand or onKeyDown.
        // But editor.onKeyDown might not fire if readOnly is true?
        // "In read-only mode, the editor does not process typing, but it does process scroll/navigation."
        // It might swallow command keys?
        // Let's try adding a DOM listener to the editor's container or window.

        window.addEventListener('keydown', handleKeyDown, true); // true = capture phase

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [editorInstance, isLocked, onUndoComplete]);
};
