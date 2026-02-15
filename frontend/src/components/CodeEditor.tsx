
import React from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import { useFlowState } from '../hooks/useFlowState';
import { soundManager } from '../utils/SoundManager';
import { Zap, Volume2, VolumeX } from 'lucide-react';

interface CodeEditorProps {
    isLocked: boolean;
    onEditorMount: OnMount;
    onContentChange?: OnChange;
    onErrorDetected?: (error: string, lineContent: string) => void;
    onMentorTrigger?: (selectedCode: string, fullFile: string) => void;
}

const DEFAULT_CODE = `from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Anti-Copilot API Running"}`;

const CodeEditor: React.FC<CodeEditorProps> = ({ isLocked: _isLocked, onEditorMount, onContentChange, onErrorDetected, onMentorTrigger }) => {
    const editorRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);
    const [isSoundEnabled, setIsSoundEnabled] = React.useState(true);

    // Flow State Hook
    const { flowState, registerKeystroke } = useFlowState();

    // Typing-aware debounce: tracks last keystroke time
    const typingTimerRef = React.useRef<any>(null);
    const errorCheckTimerRef = React.useRef<any>(null);

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

        // 2. Ctrl+M Manual Trigger — sends both selection AND full file
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
            if (!onMentorTrigger) return;
            const selection = editor.getSelection();
            const fullFile = editor.getModel()?.getValue() || "";
            if (selection) {
                const selectedText = editor.getModel()?.getValueInRange(selection) || "";
                onMentorTrigger(selectedText, fullFile);
            } else {
                onMentorTrigger("", fullFile);
            }
        });

        // Initial validation
        validateCode(editor.getValue(), editor.getModel());

        // 3. Audio & Flow Integration
        editor.onKeyDown(() => {
            if (isSoundEnabled) soundManager.playKeyClick();
            registerKeystroke();
        });
    };

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

    return (
        <div className="h-full w-full relative group">
            <Editor
                height="100%"
                defaultLanguage="python"
                defaultValue={DEFAULT_CODE}
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
            <div className={`pointer-events-none absolute inset-0 z-10 border-2 transition-all duration-300 ${flowState.intensity > 0.8 ? 'border-purple-500/50 shadow-[inset_0_0_100px_rgba(168,85,247,0.2)]' :
                flowState.intensity > 0.4 ? 'border-blue-500/30 shadow-[inset_0_0_50px_rgba(59,130,246,0.1)]' :
                    'border-transparent'
                }`} />

            {/* Combo Counter */}
            <div className={`absolute top-4 right-6 z-20 transition-opacity duration-500 ${flowState.streak > 5 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className={`text-4xl font-black italic tabular-nums tracking-tighter ${flowState.intensity > 0.8 ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse' :
                            'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]'
                            }`}>
                            {flowState.streak}x
                        </span>
                        <Zap className={`w-6 h-6 ${flowState.intensity > 0.8 ? 'text-yellow-400 fill-yellow-400 animate-bounce' : 'text-blue-400'
                            }`} />
                    </div>
                    <div className="text-xs font-mono text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Running Hot • {flowState.wpm > 0 && `${flowState.wpm} WPM`}
                    </div>

                    {/* Intensity Bar */}
                    <div className="w-full h-1 bg-gray-800 mt-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-100 ${flowState.intensity > 0.8 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-blue-500'
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

export default CodeEditor;
