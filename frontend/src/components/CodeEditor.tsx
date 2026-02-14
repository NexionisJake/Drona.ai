
import React from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';

interface CodeEditorProps {
    isLocked: boolean;
    onEditorMount: OnMount;
    onContentChange?: OnChange;
    onErrorDetected?: (error: string, lineContent: string) => void;
    onMentorTrigger?: (code: string) => void;
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

const CodeEditor: React.FC<CodeEditorProps> = ({ isLocked, onEditorMount, onContentChange, onErrorDetected, onMentorTrigger }) => {
    const editorRef = React.useRef<any>(null);
    const debounceRef = React.useRef<any>(null);
    const monacoRef = React.useRef<any>(null);

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
                    message: "SyntaxError: Expeced ':'",
                });
            }
        });

        monacoRef.current.editor.setModelMarkers(model, "owner", markers);
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        onEditorMount(editor, monaco);

        // 1. Error Detection (Shoulder Tap)
        const updateMarkers = () => {
            if (!onErrorDetected) return;
            const model = editor.getModel();
            if (!model) return;

            const markers = monaco.editor.getModelMarkers({ resource: model.uri });
            const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);

            if (errors.length > 0) {
                const firstError = errors[0];
                const lineContent = model.getLineContent(firstError.startLineNumber);

                // Debounce 2s
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                    onErrorDetected(firstError.message, lineContent);
                }, 2000);
            }
        };

        // Listen for marker changes
        monaco.editor.onDidChangeMarkers(() => {
            updateMarkers();
        });

        // 2. Ctrl+M Manual Trigger
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
            if (!onMentorTrigger) return;
            const selection = editor.getSelection();
            if (selection) {
                const selectedText = editor.getModel()?.getValueInRange(selection) || "";
                onMentorTrigger(selectedText);
            }
        });

        // Initial validation
        validateCode(editor.getValue(), editor.getModel());
    };

    const handleChange: OnChange = (value, ev) => {
        if (onContentChange) onContentChange(value, ev);
        if (editorRef.current && value) {
            validateCode(value, editorRef.current.getModel());
        }
    };

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="python"
                defaultValue={DEFAULT_CODE}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    readOnly: isLocked,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                }}
                onMount={handleMount}
                onChange={handleChange}
            />
        </div>
    );
};

export default CodeEditor;
