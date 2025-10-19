import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ChatInterface } from './components/ChatInterface';
import { ChatbotSelector } from './components/ChatbotSelector';
import { Message, GoogleUser, ChatbotType } from './types';
import { saveAuthData, getAuthToken, getUserData, clearAuthData, decodeJWT } from './utils/auth';
import { sendMessageToWebhook } from './utils/api';

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotType>('nurse');

  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();

    if (token && userData) {
      setUser(userData);
    }
  }, []);

  const handleLogin = (credential: string) => {
    setAuthError('');

    const decoded = decodeJWT(credential);
    if (!decoded) {
      setAuthError('Failed to process authentication');
      return;
    }

    const email = decoded.email || '';
    if (!email.endsWith('@rockcreekwellness.com')) {
      setAuthError('Access restricted to Rock Creek Wellness staff only');
      return;
    }

    const userData: GoogleUser = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      token: credential,
    };

    saveAuthData(credential, userData);
    setUser(userData);
  };

  const handleChatbotChange = (chatbot: ChatbotType) => {
    setSelectedChatbot(chatbot);
    setMessages([]);

    if (chatbot === 'sop') {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'The SOP Chatbot will be available soon for internal operations guidance.',
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (selectedChatbot === 'sop') {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessageToWebhook(content, selectedChatbot);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Access restricted')) {
          clearAuthData();
          setUser(null);
          setAuthError(error.message);
          setMessages([]);
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${error.message}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={authError} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <ChatbotSelector selected={selectedChatbot} onSelect={handleChatbotChange} />
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={selectedChatbot === 'sop'}
        />
      </main>
    </div>
  );
}

export default App;
