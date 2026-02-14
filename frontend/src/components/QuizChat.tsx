
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface QuizChatProps {
    streamedText: string;
    isEvaluating: boolean;
    questionNumber: number;
    onAnswerSubmit: (answer: string) => void;
}

const QuizChat: React.FC<QuizChatProps> = ({ streamedText, isEvaluating, questionNumber, onAnswerSubmit }) => {
    const [answer, setAnswer] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom of question as it streams
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamedText]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (answer.trim() && !isEvaluating) {
                onAnswerSubmit(answer);
                setAnswer(""); // Clear input on submit? Or keep until next Q?
                // Usually better to clear or disable.
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-200">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Mentor Message (Question) */}
                <div className="flex items-start space-x-3">
                    <div className="text-2xl mt-1">🧠</div>
                    <div className="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <h4 className="text-xs uppercase tracking-wide text-blue-400 font-bold mb-1">
                            Question {questionNumber}
                        </h4>
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                            <ReactMarkdown>{streamedText}</ReactMarkdown>
                        </div>
                        {/* Blinking cursor if streaming? */}
                    </div>
                </div>

                {/* Evaluating State */}
                {isEvaluating && (
                    <div className="flex items-center space-x-2 text-gray-500 animate-pulse pl-12">
                        <span>Evaluating answer...</span>
                    </div>
                )}

                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900 border-t border-gray-800">
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Explain your logic..."
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-24"
                    disabled={isEvaluating}
                />
                <div className="text-xs text-gray-600 mt-2 flex justify-between">
                    <span>Shift + Enter for new line</span>
                    <span>Enter to submit</span>
                </div>
            </div>
        </div>
    );
};

export default QuizChat;
