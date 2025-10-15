import { ChatbotType, ChatbotConfig } from '../types';

interface ChatbotSelectorProps {
  selected: ChatbotType;
  onSelect: (chatbot: ChatbotType) => void;
}

const chatbots: ChatbotConfig[] = [
  {
    id: 'nurse',
    name: 'Nurse Assistant',
    description: 'Healthcare guidance and support',
    available: true,
  },
  {
    id: 'sop',
    name: 'SOP Chatbot',
    description: 'Coming Soon',
    available: false,
  },
];

export function ChatbotSelector({ selected, onSelect }: ChatbotSelectorProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="max-w-4xl mx-auto flex gap-3">
        {chatbots.map((chatbot) => (
          <button
            key={chatbot.id}
            onClick={() => chatbot.available && onSelect(chatbot.id)}
            disabled={!chatbot.available}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selected === chatbot.id
                ? 'bg-teal-600 text-white'
                : chatbot.available
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm">{chatbot.name}</span>
              {!chatbot.available && (
                <span className="text-xs opacity-75">{chatbot.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
