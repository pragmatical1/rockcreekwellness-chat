import { useEffect, useRef } from 'react';

interface LoginScreenProps {
  onLogin: (credential: string) => void;
  error?: string;
}

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: (response: any) => {
          onLogin(response.credential);
        },
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 280,
      });
    }
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C648E] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/nurse-assistant-chatbot-icon.jpg"
            alt="Nursing Assistant"
            className="w-24 h-24 rounded-full"
          />
        </div>
        <div className="flex justify-center mb-2">
          <img
            src="/RCW-Logo-Main.png"
            alt="Rock Creek Wellness"
            className="h-12"
          />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-8">AI Agent Chatbot</h2>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div ref={googleButtonRef} className="flex justify-center"></div>

        <p className="mt-6 text-xs text-gray-500">
          Access restricted to Rock Creek Wellness staff
        </p>
      </div>
    </div>
  );
}
