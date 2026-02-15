
import React from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import { useFlowState } from '../hooks/useFlowState';
import { soundManager } from '../utils/SoundManager';
import { detectLanguage } from '../utils/fileSystem';
import { Volume2, VolumeX } from 'lucide-react';

interface CodeEditorProps {
    isLocked: boolean;
    onEditorMount: OnMount;
    onContentChange?: OnChange;
    onErrorDetected?: (error: string, lineContent: string) => void;
    onMentorTrigger?: (selectedCode: string, fullFile: string) => void;
    onCursorChange?: (line: number, col: number) => void;
    onMarkersChange?: (errors: number, warnings: number) => void;
    fileContent?: string;
    fileName?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    isLocked: _isLocked,
    onEditorMount,
    onContentChange,
    onErrorDetected,
    onMentorTrigger,
    onCursorChange,
    onMarkersChange,
    fileContent,
    fileName
}) => {
    const editorRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isSoundEnabled, setIsSoundEnabled] = React.useState(true);

    // Flow State Hook
    const { flowState, registerKeystroke } = useFlowState();

    // Typing-aware debounce: tracks last keystroke time
    const typingTimerRef = React.useRef<any>(null);
    const errorCheckTimerRef = React.useRef<any>(null);

    // Debounce refs for high-frequency event handlers
    const cursorDebounceRef = React.useRef<any>(null);
    const markerDebounceRef = React.useRef<any>(null);

    const validateCode = (value: string, model: any) => {
        if (!monacoRef.current) return;

        const markers: any[] = [];
        const lines = value.split('\n');

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const lineNumber = index + 1;

            // Check for missing colon after def, if, for, while, class
            if ((trimmed.startsWith('def ') ||
                trimmed.startsWith('if ') ||
                trimmed.startsWith('for ') ||
                trimmed.startsWith('while ') ||
                trimmed.startsWith('class ')) &&
                !trimmed.endsWith(':') &&
                !trimmed.endsWith('pass') // simple check
            ) {
                markers.push({
                    severity: monacoRef.current.MarkerSeverity.Error,
                    startLineNumber: lineNumber,
                    startColumn: line.length + 1,
                    endLineNumber: lineNumber,
                    endColumn: line.length + 2,
                    message: "SyntaxError: Expected ':'",
                });
            }
        });

        monacoRef.current.editor.setModelMarkers(model, "owner", markers);
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        onEditorMount(editor, monaco);

        // Error detection is handled in onChange via typing-aware debounce.
        // We intentionally do NOT listen to onDidChangeMarkers here to avoid
        // double-firing. The onChange handler checks markers after 2.5s of inactivity.

        // 2. Ctrl+M Manual Trigger — sends both selection AND full file (Context Sliced)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
            if (!onMentorTrigger) return;
            const selection = editor.getSelection();
            const model = editor.getModel();
            if (!model) return;

            // Context Slicing: Always get 50 lines above and below cursor for context
            let slicedContext = "";
            const position = editor.getPosition();

            if (position) {
                const startLine = Math.max(1, position.lineNumber - 50);
                const endLine = Math.min(model.getLineCount(), position.lineNumber + 50);
                const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine));
                slicedContext = model.getValueInRange(range);
                console.log(`Context Sliced: Lines ${startLine}-${endLine}`);
            } else {
                slicedContext = model.getValue(); // Fallback
            }

            if (selection && !selection.isEmpty()) {
                const selectedText = model.getValueInRange(selection);
                onMentorTrigger(selectedText, slicedContext);
            } else {
                // No selection, focus on the sliced context
                onMentorTrigger("", slicedContext);
            }
        });

        // Initial validation
        validateCode(editor.getValue(), editor.getModel());

        // 3. Audio & Flow Integration & Undo Trap
        editor.onKeyDown((e: any) => {
            // Undo Trap: If locked, block everything except Ctrl+Z
            if (_isLocked) {
                // Allow Undo (Ctrl+Z or Cmd+Z)
                if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyZ) {
                    // Let it pass, or trigger undo manually if readOnly blocks it.
                    // If readOnly is true, we might need to set it false temporarily, but here we assume we are NOT using readOnly prop.
                    // We are intercepting keys instead.
                    return;
                }

                // Block everything else
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (isSoundEnabled) soundManager.playKeyClick();
            registerKeystroke();
        });

        // 4. Cursor Position Tracking (Debounced to prevent re-render cascade)
        if (onCursorChange) {
            editor.onDidChangeCursorPosition((e: any) => {
                // Debounce cursor updates to 200ms to avoid re-rendering StatusBar on every keystroke
                if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
                cursorDebounceRef.current = setTimeout(() => {
                    onCursorChange(e.position.lineNumber, e.position.column);
                }, 200);
            });
        }

        // 5. Marker Tracking (Errors/Warnings) - Debounced to prevent re-render cascade
        if (onMarkersChange) {
            monaco.editor.onDidChangeMarkers(() => {
                // Debounce marker updates to 250ms to avoid re-rendering StatusBar on every validation
                if (markerDebounceRef.current) clearTimeout(markerDebounceRef.current);
                markerDebounceRef.current = setTimeout(() => {
                    const model = editor.getModel();
                    if (!model) return;
                    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
                    const errors = markers.filter((m: any) => m.severity === monaco.MarkerSeverity.Error).length;
                    const warnings = markers.filter((m: any) => m.severity === monaco.MarkerSeverity.Warning).length;
                    onMarkersChange(errors, warnings);
                }, 250);
            });
        }
    };

    // Cleanup debounce timers on unmount
    React.useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            if (errorCheckTimerRef.current) clearTimeout(errorCheckTimerRef.current);
            if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
            if (markerDebounceRef.current) clearTimeout(markerDebounceRef.current);
        };
    }, []);

    // Update CSS variables for Flow Mode efficiently
    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.style.setProperty('--flow-intensity', flowState.intensity.toString());
            containerRef.current.style.setProperty('--flow-streak', flowState.streak.toString());
        }
    }, [flowState.intensity, flowState.streak]);


    const handleChange: OnChange = (value, ev) => {
        if (onContentChange) onContentChange(value, ev);
        if (editorRef.current && value) {
            validateCode(value, editorRef.current.getModel());
        }

        // Reset typing timer on every keystroke — this prevents error check
        // from firing while the user is still actively typing.
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (errorCheckTimerRef.current) clearTimeout(errorCheckTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            // User stopped typing for 2.5s — now check for errors
            const model = editorRef.current?.getModel();
            if (!model || !monacoRef.current || !onErrorDetected) return;

            const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
            const errors = markers.filter((m: any) => m.severity === monacoRef.current.MarkerSeverity.Error);

            if (errors.length > 0) {
                const firstError = errors[0];
                const lineContent = model.getLineContent(firstError.startLineNumber);
                onErrorDetected(firstError.message, lineContent);
            }
        }, 2500);
    };

    // Detect language from file name
    const language = fileName ? detectLanguage(fileName) : 'plaintext';

    return (
        <div ref={containerRef} className="h-full w-full relative group">
            <Editor
                height="100%"
                language={language}
                value={fileContent}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    // Dynamic rendering options based on flow intensity could go here
                    fontFamily: '"Fira Code", monospace',
                    cursorBlinking: flowState.streak > 10 ? 'smooth' : 'blink',
                    cursorSmoothCaretAnimation: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                }}
                onMount={handleMount}
                onChange={handleChange}
            />

            {/* Flow Mode Overlay */}
            {/* Flow Mode Overlay using CSS variables */}
            <div
                className="pointer-events-none absolute inset-0 z-10 border-2 transition-all duration-300"
                style={{
                    borderColor: flowState.intensity > 0.8 ? 'rgba(168,85,247,0.5)' : flowState.intensity > 0.4 ? 'rgba(59,130,246,0.3)' : 'transparent',
                    boxShadow: flowState.intensity > 0.8 ? 'inset 0 0 100px rgba(168,85,247,0.2)' : flowState.intensity > 0.4 ? 'inset 0 0 50px rgba(59,130,246,0.1)' : 'none'
                }}
            />

            {/* Combo Counter */}
            <div className={`absolute top-4 right-6 z-20 transition-opacity duration-500 ${flowState.streak > 5 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold font-mono tabular-nums tracking-tight ${flowState.intensity > 0.8 ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                            'text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]'
                            }`}>
                            {flowState.streak}x
                        </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                        {flowState.wpm > 0 ? `${flowState.wpm} WPM` : 'FLOW'}
                    </div>

                    {/* Intensity Bar */}
                    <div className="w-16 h-0.5 bg-gray-800 mt-1 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-100 ${flowState.intensity > 0.8 ? 'bg-purple-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${Math.min(flowState.intensity * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sound Toggle */}
            <button
                onClick={() => {
                    const newState = !isSoundEnabled;
                    setIsSoundEnabled(newState);
                    soundManager.toggle(newState);
                }}
                className="absolute bottom-4 right-6 z-20 p-2 rounded-full bg-black/40 hover:bg-black/80 text-gray-500 hover:text-white transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
        </div>
    );
};

// Memoize to prevent re-renders from parent state changes
export default React.memo(CodeEditor, (prevProps, nextProps) => {
    // Only re-render if essential props change
    return (
        prevProps.isLocked === nextProps.isLocked &&
        prevProps.fileContent === nextProps.fileContent &&
        prevProps.fileName === nextProps.fileName
    );
});
