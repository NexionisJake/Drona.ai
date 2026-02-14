import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { TextShimmer } from './TextShimmer';

export interface QuizMessage {
    role: 'question' | 'answer';
    content: string;
    questionNumber?: number;
}

interface QuizChatProps {
    messages: QuizMessage[];
    streamedText: string;
    isEvaluating: boolean;
    questionNumber: number;
    onAnswerSubmit: (answer: string) => void;
}

const QuizChat: React.FC<QuizChatProps> = ({ messages, streamedText, isEvaluating, questionNumber, onAnswerSubmit }) => {
    const [answer, setAnswer] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom as content changes
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamedText, messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (answer.trim() && !isEvaluating) {
                onAnswerSubmit(answer);
                setAnswer(""); // Clear input on submit
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-200">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Previous Q&A History */}
                {messages.map((msg, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                        <div className="text-2xl mt-1">
                            {msg.role === 'question' ? '🧠' : '👤'}
                        </div>
                        <div className={`flex-1 rounded-lg p-3 border ${msg.role === 'question'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-[#1f6feb]/20 border-blue-700/30'
                            }`}>
                            {msg.role === 'question' && (
                                <h4 className="text-xs uppercase tracking-wide text-blue-400 font-bold mb-1">
                                    Question {msg.questionNumber}
                                </h4>
                            )}
                            {msg.role === 'answer' && (
                                <h4 className="text-xs uppercase tracking-wide text-green-400 font-bold mb-1">
                                    Your Answer
                                </h4>
                            )}
                            <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Current Streaming Question */}
                {streamedText && (
                    <div className="flex items-start space-x-3">
                        <div className="text-2xl mt-1">🧠</div>
                        <div className="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700">
                            <h4 className="text-xs uppercase tracking-wide text-blue-400 font-bold mb-1">
                                Question {questionNumber}
                            </h4>
                            <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                <ReactMarkdown>{streamedText}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Evaluating State */}
                {isEvaluating && (
                    <div className="flex items-center space-x-2 text-gray-500 animate-pulse pl-12">
                        <TextShimmer className="text-sm text-gray-400">Evaluating answer...</TextShimmer>
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
