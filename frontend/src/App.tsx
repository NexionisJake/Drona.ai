
import { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import MentorSidebar from './components/MentorSidebar';
import LockOverlay from './components/LockOverlay';
import { Toaster, toast } from 'react-hot-toast';
import type { OnMount } from '@monaco-editor/react';
import { usePasteDetection } from './hooks/usePasteDetection';
import { useUndoEscape } from './hooks/useUndoEscape';
import { useBuilderScore } from './hooks/useBuilderScore';
import { analyzePaste, validateAnswer, analyzeError, mentorChat } from './services/api';
import type { Message } from './components/MentorChat';

function App() {
    const { score, updateOnTyping, deductScore, addScore } = useBuilderScore(0);
    const [isLocked, setIsLocked] = useState(false);
    const [linesPasted, setLinesPasted] = useState(0);
    const [scorePenalty, setScorePenalty] = useState(0);
    const [pastedCode, setPastedCode] = useState("");
    const [prePasteVersionId, setPrePasteVersionId] = useState<number>(0);

    // Quiz State
    const [questionNumber, setQuestionNumber] = useState(1);
    const [streamedText, setStreamedText] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [q1Text, setQ1Text] = useState("");
    const [a1Text, setA1Text] = useState("");

    // Mentor Chat State
    const [mentorMode, setMentorMode] = useState<'idle' | 'active' | 'chat'>('idle');
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [isChatStreaming, setIsChatStreaming] = useState(false);
    const [selectedContext, setSelectedContext] = useState("");

    const editorRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value && !isLocked) {
            updateOnTyping(value);
        }
    };

    const startQuiz = async (code: string) => {
        setStreamedText("");
        setQuestionNumber(1);
        setIsEvaluating(false);
        setMentorMode('active'); // Quiz active

        abortControllerRef.current = new AbortController();

        // Get full content for context
        const context = editorRef.current?.getModel()?.getValue() || "";

        await analyzePaste({
            codeSnippet: code,
            contextSummary: context,
            onChunk: (text) => setStreamedText(prev => prev + text),
            onDone: () => console.log("Stream complete"),
            onError: (err) => {
                if (err !== "Timeout") toast.error(`Mentor Error: ${err}`);
            },
            abortSignal: abortControllerRef.current ? abortControllerRef.current.signal : undefined
        });
    };

    const handlePasteDetected = ({ pastedText, lineCount, prePasteVersionId }: { pastedText: string, lineCount: number, prePasteVersionId: number }) => {
        if (isLocked) return;

        setIsLocked(true);
        setPastedCode(pastedText);
        setLinesPasted(lineCount);
        setPrePasteVersionId(prePasteVersionId);

        const penalty = lineCount * -0.2;
        setScorePenalty(penalty);
        deductScore(penalty);

        toast.error(`Vibe Coding Detected! ${lineCount} lines pasted.`);

        // Trigger Analysis
        startQuiz(pastedText);
    };

    const handleAnswerSubmit = async (answer: string) => {
        setIsEvaluating(true);

        try {
            const response = await validateAnswer({
                question: questionNumber === 1 ? streamedText : streamedText,
                userAnswer: answer,
                codeSnippet: pastedCode,
                questionNumber: questionNumber,
                question1: questionNumber === 2 ? q1Text : undefined,
                answer1: questionNumber === 2 ? a1Text : undefined
            });

            if (response.status === "next_question" && response.next_question) {
                // Move to Q2
                setQ1Text(streamedText);
                setA1Text(answer);
                setQuestionNumber(2);
                setStreamedText(response.next_question);
                toast.success(response.feedback);
            } else if (response.status === "pass") {
                // Unlock!
                toast.success("Unlocked! Penalty refunded.");
                setIsLocked(false);
                setMentorMode('idle');
                addScore(-scorePenalty);
            } else {
                // Fail
                toast.error("Explanation failed. Try again.");
            }

        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleUndoComplete = () => {
        setIsLocked(false);
        setMentorMode('idle');
        addScore(-scorePenalty);

        setQuestionNumber(1);
        setStreamedText("");
        setPastedCode("");
        setLinesPasted(0);

        // Abort in-flight quiz stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        toast.success("Paste undone. Score restored.");
    };

    // --- Mentor Mode Handlers ---

    const handleErrorDetected = async (errorMsg: string, lineContent: string) => {
        if (isLocked || mentorMode === 'active') return;

        setMentorMode('chat');
        // Start a new chat session with the hint
        const initialMsg: Message = { role: 'assistant', content: '' };
        setChatMessages([initialMsg]);
        setIsChatStreaming(true);

        const context = editorRef.current?.getModel()?.getValue() || "";

        await analyzeError({
            errorMessage: errorMsg,
            lineCode: lineContent,
            contextSummary: context,
            onChunk: (text) => {
                setChatMessages(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { ...last, content: last.content + text }];
                });
            },
            onDone: () => setIsChatStreaming(false),
            onError: (err) => {
                console.error(err);
                setIsChatStreaming(false);
            }
        });
    };

    const handleMentorTrigger = (code: string) => {
        if (isLocked || mentorMode === 'active') return;

        setMentorMode('chat');
        setSelectedContext(code);
        setChatMessages([]);
        toast("Mentor Mode Activated", { icon: "🧠" });
        // We wait for user to type their first message in the chat
    };

    const handleChatMessage = async (msg: string) => {
        // Add user message
        const userMsg: Message = { role: 'user', content: msg };
        setChatMessages(prev => [...prev, userMsg]);

        // Add placeholder assistant message
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        setIsChatStreaming(true);

        const context = editorRef.current?.getModel()?.getValue() || "";

        await mentorChat({
            selectedCode: selectedContext, // Might be empty if just chatting generally, or highlighting
            userQuery: msg,
            contextSummary: context,
            fullFile: context,
            onChunk: (text) => {
                setChatMessages(prev => {
                    const last = prev[prev.length - 1];
                    const others = prev.slice(0, -1);
                    return [...others, { ...last, content: last.content + text }];
                });
            },
            onDone: () => setIsChatStreaming(false),
            onError: (err) => {
                toast.error(err);
                setIsChatStreaming(false);
            }
        });
    };

    usePasteDetection({
        editorInstance: editorRef.current,
        onPasteDetected: handlePasteDetected,
        isLocked
    });

    useUndoEscape({
        editorInstance: editorRef.current,
        isLocked,
        prePasteVersionId,
        onUndoComplete: handleUndoComplete
    });

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
            <Navbar score={score} />

            <div className="flex-1 flex pt-16 h-full relative">
                <div className="w-[70%] relative flex-1 bg-[#1e1e1e] border-r border-[#30363d] shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
                    <CodeEditor
                        isLocked={isLocked}
                        onEditorMount={handleEditorMount}
                        onContentChange={handleEditorChange}
                        onErrorDetected={handleErrorDetected}
                        onMentorTrigger={handleMentorTrigger}
                    />
                    <LockOverlay
                        isVisible={isLocked}
                        linesPasted={linesPasted}
                        scorePenalty={scorePenalty}
                    />
                </div>

                <div className="w-[30%] h-full bg-[#0d1117]">
                    <MentorSidebar
                        quizState={mentorMode}
                        streamedText={streamedText}
                        isEvaluating={isEvaluating}
                        questionNumber={questionNumber}
                        onAnswerSubmit={handleAnswerSubmit}
                        messages={chatMessages}
                        isStreaming={isChatStreaming}
                        onChatMessage={handleChatMessage}
                    />
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

