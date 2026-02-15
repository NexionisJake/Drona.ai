import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Send, User } from 'lucide-react';
import { TextShimmer } from './TextShimmer';
import { preprocessMarkdown } from '../utils/markdownUtils';

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
                        <div className={`rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'w-8 h-8 bg-blue-600/80' : 'w-12 h-12 bg-transparent'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <img src="/logo.png" alt="AI" className="w-12 h-12 object-contain" />}
                        </div>

                        <div className={`flex-1 max-w-[85%] rounded-lg p-3 overflow-hidden break-words ${msg.role === 'user'
                            ? 'bg-blue-600/20 border border-blue-500/20 text-gray-200'
                            : 'bg-[#161b22] border border-white/[0.06]'
                            }`}>
                            <div className="prose prose-invert prose-sm max-w-none break-words [overflow-wrap:anywhere] prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-ul:my-2 prose-li:marker:text-blue-400">
                                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{preprocessMarkdown(msg.content)}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isStreaming && (!messages.length || messages[messages.length - 1].content === '') && (
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <img src="/logo.png" alt="Thinking" className="w-12 h-12 object-contain" />
                        </div>
                        <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-3">
                            <TextShimmer className="text-sm text-purple-400">Thinking...</TextShimmer>
                        </div>
                    </div>
                )}

                <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-white/[0.06] bg-[#0d1117]">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full bg-[#161b22] border border-white/[0.08] rounded-lg pl-4 pr-10 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-20 scrollbar-hide"
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
