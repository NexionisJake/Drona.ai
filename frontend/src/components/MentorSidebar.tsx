import React from 'react';
import QuizChat, { type QuizMessage } from './QuizChat';
import MentorChat, { type Message } from './MentorChat';
import { Brain, Sparkles } from 'lucide-react';
import ScannerCardStream from './ScannerCardStream';

interface MentorSidebarProps {
    quizState: 'idle' | 'active' | 'chat';
    streamedText?: string;
    isEvaluating?: boolean;
    questionNumber?: number;
    quizMessages?: QuizMessage[];
    onAnswerSubmit?: (answer: string) => void;

    // Chat Props
    messages?: Message[];
    isStreaming?: boolean;
    onChatMessage?: (msg: string) => void;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({
    quizState = 'idle',
    streamedText = "",
    isEvaluating = false,
    questionNumber = 1,
    quizMessages = [],
    onAnswerSubmit = () => { },
    messages = [],
    isStreaming = false,
    onChatMessage = () => { }
}) => {
    return (
        <div className="h-full bg-[#0d1117] flex flex-col font-sans border-l border-white/[0.12]">
            <div className="sticky top-0 z-10 flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-md">
                {quizState === 'active' ? (
                    <Brain className="w-4.5 h-4.5 text-red-400 animate-pulse" />
                ) : quizState === 'chat' ? (
                    <Sparkles className="w-4.5 h-4.5 text-purple-400" />
                ) : (
                    <Brain className="w-4.5 h-4.5 text-gray-500" />
                )}

                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    {quizState === 'active' ? 'Knowledge Check' : quizState === 'chat' ? 'Mentor Mode' : 'Mentor'}
                </h2>
            </div>

            {quizState === 'idle' ? (
                <div className="relative flex-1 w-full overflow-hidden bg-[#0d1117]">
                    <div className="absolute top-3 left-0 right-0 text-center z-40 pointer-events-none">
                        <p className="text-[10px] text-gray-500 font-mono">
                            Ctrl+M to ask Mentor
                        </p>
                    </div>
                    <ScannerCardStream />
                </div>
            ) : quizState === 'active' ? (
                <div className="flex-1 overflow-hidden">
                    <QuizChat
                        messages={quizMessages}
                        streamedText={streamedText}
                        isEvaluating={isEvaluating}
                        questionNumber={questionNumber}
                        onAnswerSubmit={onAnswerSubmit}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <MentorChat
                        messages={messages}
                        isStreaming={isStreaming}
                        onSendMessage={onChatMessage}
                    />
                </div>
            )}
        </div>
    );
};

export default MentorSidebar;
