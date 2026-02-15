import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { TextShimmer } from './TextShimmer';
import { preprocessMarkdown } from '../utils/markdownUtils';

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
        <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Previous Q&A History */}
                {messages.map((msg, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                        <div className="text-2xl mt-1">
                            {msg.role === 'question' ? '🧠' : '👤'}
                        </div>
                        <div className={`flex-1 rounded-lg p-3 border ${msg.role === 'question'
                            ? 'bg-[#161b22] border-white/[0.06]'
                            : 'bg-blue-500/10 border-blue-500/20'
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
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-ul:my-2 prose-li:marker:text-blue-400">
                                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{preprocessMarkdown(msg.content)}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Current Streaming Question */}
                {streamedText && (
                    <div className="flex items-start space-x-3">
                        <div className="text-2xl mt-1">🧠</div>
                        <div className="flex-1 bg-[#161b22] rounded-lg p-3 border border-white/[0.06]">
                            <h4 className="text-xs uppercase tracking-wide text-blue-400 font-bold mb-1">
                                Question {questionNumber}
                            </h4>
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-ul:my-2 prose-li:marker:text-blue-400">
                                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{preprocessMarkdown(streamedText)}</ReactMarkdown>
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
            <div className="p-4 bg-[#161b22] border-t border-white/[0.06]">
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Explain your logic..."
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-24"
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
