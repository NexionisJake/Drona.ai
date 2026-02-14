import React from 'react';
import QuizChat, { type QuizMessage } from './QuizChat';
import MentorChat, { type Message } from './MentorChat';
import { Brain, Sparkles, Zap } from 'lucide-react';
import { TextShimmer } from './TextShimmer';

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
        <div className="h-full bg-[#161b22] flex flex-col font-sans border-l border-[#30363d]">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#30363d] bg-[#0d1117]">
                {quizState === 'active' ? (
                    <Brain className="w-5 h-5 text-red-400 animate-pulse" />
                ) : quizState === 'chat' ? (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                ) : (
                    <Brain className="w-5 h-5 text-gray-400" />
                )}

                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                    {quizState === 'active' ? 'Knowledge Check' : quizState === 'chat' ? 'Mentor Mode' : 'Mentor'}
                </h2>
            </div>

            {quizState === 'idle' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#0d1117]">
                    <div className="flex flex-col items-center p-8 text-center text-gray-500 animate-pulse">
                        <Zap size={48} className="mb-4 opacity-20" />
                        <TextShimmer className="italic text-sm">Scanning for vibe coding...</TextShimmer>
                        <p className="text-xs mt-2 opacity-50">Paste detection active</p>
                    </div>
                    <p className="text-xs text-[#484f58] mt-2">
                        Ctrl+M to ask Mentor
                    </p>
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
