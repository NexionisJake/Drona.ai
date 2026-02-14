
import { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import MentorSidebar from './components/MentorSidebar';
import { Toaster } from 'react-hot-toast';
import { OnMount } from '@monaco-editor/react';

function App() {
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <Navbar score={score} />

      <div className="flex-1 flex pt-16 h-full"> {/* Add top padding for fixed navbar */}
        <div className="w-[70%] relative flex-1">
          <CodeEditor
            isLocked={isLocked}
            onEditorMount={handleEditorMount}
          // onContentChange will be hooked up later
          />
          {/* LockOverlay will go here */}
        </div>

        <div className="w-[30%] h-full">
          <MentorSidebar quizState="idle" />
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
