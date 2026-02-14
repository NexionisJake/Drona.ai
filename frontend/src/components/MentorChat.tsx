import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot } from 'lucide-react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface MentorChatProps {
    messages: Message[];
    isStreaming: boolean;
    onSendMessage: (message: string) => void;
    placeholder?: string;
}

const MentorChat: React.FC<MentorChatProps> = ({
    messages,
    isStreaming,
    onSendMessage,
    placeholder = "Ask your mentor..."
}) => {
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isStreaming) {
                onSendMessage(input);
                setInput("");
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] text-gray-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={`flex-1 max-w-[85%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-[#1f6feb] text-white'
                                : 'bg-[#161b22] border border-[#30363d]'
                            }`}>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isStreaming && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 animate-pulse">
                            <Bot size={16} />
                        </div>
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                            <span className="text-gray-500 text-sm">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-[#30363d] bg-[#161b22]">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-20 scrollbar-hide"
                        disabled={isStreaming}
                    />
                    <button
                        onClick={() => {
                            if (input.trim() && !isStreaming) {
                                onSendMessage(input);
                                setInput("");
                            }
                        }}
                        disabled={!input.trim() || isStreaming}
                        className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-xs text-gray-600 mt-2 flex justify-between px-1">
                    <span>Shift + Enter for new line</span>
                    <span>Enter to send</span>
                </div>
            </div>
        </div>
    );
};

export default MentorChat;
