import { Message } from '../types';
import { User, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
        </div>
      )}

      <div
        className={`max-w-2xl rounded-lg border px-4 py-3 ${
          isUser
            ? 'bg-teal-50 border-teal-200'
            : 'bg-white border-gray-200'
        }`}
      >
        {isUser ? (
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}
