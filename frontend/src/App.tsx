
import { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import MentorSidebar from './components/MentorSidebar';
import LockOverlay from './components/LockOverlay';
import { Toaster, toast } from 'react-hot-toast';
import type { OnMount } from '@monaco-editor/react';
import { usePasteDetection } from './hooks/usePasteDetection';

function App() {
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [linesPasted, setLinesPasted] = useState(0);
  const [scorePenalty, setScorePenalty] = useState(0);
  const [pastedCode, setPastedCode] = useState("");
  const [prePasteVersionId, setPrePasteVersionId] = useState<number>(0);

  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handlePasteDetected = ({ pastedText, lineCount, prePasteVersionId }: { pastedText: string, lineCount: number, prePasteVersionId: number }) => {
    if (isLocked) return; // Already locked

    setIsLocked(true);
    setPastedCode(pastedText);
    setLinesPasted(lineCount);
    setPrePasteVersionId(prePasteVersionId);

    // Calculate penalty: -0.2 per line
    const penalty = lineCount * -0.2;
    setScorePenalty(penalty);
    setScore(prev => prev + penalty); // Add negative value

    toast.error(`Vibe Coding Detected! ${lineCount} lines pasted.`);

    // TODO: Trigger backend analysis here (Phase 4)
  };

  usePasteDetection({
    editorInstance: editorRef.current,
    onPasteDetected: handlePasteDetected,
    isLocked
  });

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      <Navbar score={score} />

      <div className="flex-1 flex pt-16 h-full relative">
        <div className="w-[70%] relative flex-1 bg-[#1e1e1e]">
          <CodeEditor
            isLocked={isLocked}
            onEditorMount={handleEditorMount}
          />
          <LockOverlay
            isVisible={isLocked}
            linesPasted={linesPasted}
            scorePenalty={scorePenalty}
          />
        </div>

        <div className="w-[30%] h-full border-l border-gray-800">
          <MentorSidebar quizState={isLocked ? 'active' : 'idle'} />
        </div>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
    </div>
  );
}

export default App;
