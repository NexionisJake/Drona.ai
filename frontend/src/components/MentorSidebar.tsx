
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MentorSidebarProps {
    quizState?: 'idle' | 'active'; // Expanded later
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ quizState = 'idle' }) => {
    return (
        <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col p-6 text-gray-300 font-sans">
            <div className="mb-6 flex items-center space-x-2">
                <span className="text-2xl">🧠</span>
                <h2 className="text-xl font-bold text-white">Mentor</h2>
            </div>

            {quizState === 'idle' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="text-4xl mb-4">👀</div>
                    <p className="text-lg">I am watching your code structure.</p>
                    <p className="text-sm mt-2 text-gray-500">Paste with caution.</p>
                </div>
            ) : (
                <div className="flex-1">
                    {/* Placeholder for active quiz state */}
                    <p>Active Quiz Placeholder</p>
                </div>
            )}
        </div>
    );
};

export default MentorSidebar;
