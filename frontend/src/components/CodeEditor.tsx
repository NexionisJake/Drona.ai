
import React, { useRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';

interface CodeEditorProps {
    isLocked: boolean;
    onEditorMount: OnMount;
    onContentChange?: OnChange;
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

const CodeEditor: React.FC<CodeEditorProps> = ({ isLocked, onEditorMount, onContentChange }) => {
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
                onMount={onEditorMount}
                onChange={onContentChange}
            />
        </div>
    );
};

export default CodeEditor;
