
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
    const isLockedRef = useRef(isLocked);

    // Keep refs in sync
    useEffect(() => {
        versionIdRef.current = prePasteVersionId;
    }, [prePasteVersionId]);

    useEffect(() => {
        isLockedRef.current = isLocked;
    }, [isLocked]);

    useEffect(() => {
        if (!editorInstance) return;

        // Intercept all keystrokes via Monaco's onKeyDown.
        // When locked: block everything EXCEPT Ctrl+Z / Cmd+Z.
        // This avoids using readOnly: true which prevents undo from working.
        const disposable = editorInstance.onKeyDown((e: monaco.IKeyboardEvent) => {
            if (!isLockedRef.current) return;

            const isCtrlZ =
                (e.ctrlKey || e.metaKey) &&
                e.keyCode === monaco.KeyCode.KeyZ &&
                !e.shiftKey &&
                !e.altKey;

            if (isCtrlZ) {
                // Allow the undo to go through by NOT preventing default.
                // After a microtask, check if we've reached the pre-paste version.
                setTimeout(() => {
                    const currentVersionId = editorInstance.getModel()?.getAlternativeVersionId();
                    if (currentVersionId !== undefined && currentVersionId <= versionIdRef.current) {
                        console.log("Full undo achieved! Unlocking...");
                        onUndoComplete();
                    } else {
                        console.log("Undo step taken, version:", currentVersionId, "target:", versionIdRef.current);
                    }
                }, 0);
            } else {
                // Block all other keystrokes while locked
                e.preventDefault();
                e.stopPropagation();
            }
        });

        return () => {
            disposable.dispose();
        };
    }, [editorInstance, onUndoComplete]);
};
