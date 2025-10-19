import { Message } from '../types';
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
          <img
            src="/nurse-assistant-chatbot-icon.jpg"
            alt="Assistant"
            className="w-8 h-8 rounded-full object-cover"
          />
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
          <div className="prose prose-sm max-w-none prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-bold">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => {
                  const href = props.href || '';
                  const isSource = href.startsWith('http');
                  return (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={isSource ? { color: '#0C648E' } : undefined}
                    />
                  );
                },
                p: ({ node, ...props }) => {
                  const content = props.children?.toString() || '';
                  if (content.startsWith('Sources:')) {
                    return (
                      <p {...props}>
                        <strong>Sources:</strong>
                        {content.substring(8)}
                      </p>
                    );
                  }
                  return <p {...props} />;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <img
            src="/RCW-Icon-Reversed.png"
            alt="You"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
