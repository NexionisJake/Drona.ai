import React from 'react';
import QuizChat from './QuizChat';
import { Brain, Radar } from 'lucide-react';

interface MentorSidebarProps {
    quizState: 'idle' | 'active';
    streamedText?: string;
    isEvaluating?: boolean;
    questionNumber?: number;
    onAnswerSubmit?: (answer: string) => void;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({
    quizState = 'idle',
    streamedText = "",
    isEvaluating = false,
    questionNumber = 1,
    onAnswerSubmit = () => { }
}) => {
    return (
        <div className="h-full bg-[#161b22] flex flex-col font-sans">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#30363d] bg-[#0d1117]/50">
                <Brain className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Mentor</h2>
            </div>

            {quizState === 'idle' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="relative flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <Radar className="w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                    <p className="text-sm text-[#7d8590] font-medium tracking-wide">
                        Scanning for vibe coding...
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <QuizChat
                        streamedText={streamedText}
                        isEvaluating={isEvaluating}
                        questionNumber={questionNumber}
                        onAnswerSubmit={onAnswerSubmit}
                    />
                </div>
            )}
        </div>
    );
};

export default MentorSidebar;
