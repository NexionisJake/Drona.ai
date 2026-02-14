import React from 'react';
import QuizChat from './QuizChat';

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
        <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col font-sans">
            <div className="p-6 border-b border-gray-800 flex items-center space-x-2">
                <span className="text-2xl">🧠</span>
                <h2 className="text-xl font-bold text-white">Mentor</h2>
            </div>

            {quizState === 'idle' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-6">
                    <div className="text-4xl mb-4">👀</div>
                    <p className="text-lg text-gray-300">I am watching your code structure.</p>
                    <p className="text-sm mt-2 text-gray-500">Paste with caution.</p>
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
