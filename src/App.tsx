import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ChatInterface } from './components/ChatInterface';
import { ChatbotSelector } from './components/ChatbotSelector';
import { Message, GoogleUser, ChatbotType } from './types';
import { saveAuthData, getAuthToken, clearAuthData } from './utils/auth';
import { sendMessageToWebhook, verifyGoogleCredential } from './utils/api';

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string>('');
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotType>('nurse');

  useEffect(() => {
    async function restoreSession() {
      const token = getAuthToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const verifiedUser = await verifyGoogleCredential(token);
        saveAuthData(token, verifiedUser);
        setUser(verifiedUser);
      } catch {
        clearAuthData();
      } finally {
        setIsCheckingAuth(false);
      }
    }

    void restoreSession();
  }, []);

  const handleLogin = async (credential: string) => {
    setAuthError('');

    try {
      const verifiedUser = await verifyGoogleCredential(credential);
      saveAuthData(credential, verifiedUser);
      setUser(verifiedUser);
    } catch (loginError) {
      setAuthError(
        loginError instanceof Error ? loginError.message : 'Failed to process authentication'
      );
    }
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
    if (selectedChatbot === 'sop' || !user) {
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
      const response = await sendMessageToWebhook(content, selectedChatbot, user.token);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (requestError) {
      if (requestError instanceof Error) {
        const isAuthError = [
          'Access restricted',
          'Authentication required',
          'Google sign-in',
        ].some((message) => requestError.message.includes(message));

        if (isAuthError) {
          clearAuthData();
          setUser(null);
          setAuthError(requestError.message);
          setMessages([]);
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${requestError.message}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0C648E] to-white flex items-center justify-center">
        <p className="text-sm font-medium text-white">Verifying access...</p>
      </div>
    );
  }

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
