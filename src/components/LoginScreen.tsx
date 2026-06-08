import { useEffect, useRef, useState } from 'react';

interface LoginScreenProps {
  onLogin: (credential: string) => void;
  error?: string;
}

interface CredentialResponse {
  credential?: string;
}

const SCRIPT_ID = 'google-gsi-script';
const FALLBACK_TIMEOUT = 5000;
const POLL_MAX_ATTEMPTS = 50;
const POLL_INTERVAL = 100;

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const pollTimerRef = useRef<<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    function clearPollTimer() {
      if (pollTimerRef.current !== null) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    function initializeGoogle() {
      if (cancelled) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: CredentialResponse) => {
          if (response.credential) {
            onLogin(response.credential);
          }
        },
        auto_select: false,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';

        const availableWidth = googleButtonRef.current.offsetWidth;
        const buttonWidth = Math.min(280, availableWidth || 280);

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: buttonWidth,
        });
      }

      clearTimeout(fallbackTimer);
      setShowFallback(false);
    }

    function waitForGoogle(attempts = 0) {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        initializeGoogle();
        return;
      }
      if (attempts < POLL_MAX_ATTEMPTS) {
        pollTimerRef.current = setTimeout(() => {
          waitForGoogle(attempts + 1);
        }, POLL_INTERVAL);
      }
    }

    function loadGoogleScript() {
      if (window.google?.accounts?.id) {
        initializeGoogle();
        return;
      }

      const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.google?.accounts?.id) {
            initializeGoogle();
          } else {
            waitForGoogle();
          }
        });
        existingScript.addEventListener('error', () => {
          if (!cancelled) setShowFallback(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          initializeGoogle();
        } else {
          waitForGoogle();
        }
      };
      script.onerror = () => {
        if (!cancelled) setShowFallback(true);
      };
      document.head.appendChild(script);
    }

    fallbackTimer = setTimeout(() => {
      if (!cancelled) setShowFallback(true);
    }, FALLBACK_TIMEOUT);

    loadGoogleScript();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      clearPollTimer();
    };
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

        <div ref={googleButtonRef} className="flex justify-center w-full"></div>

        {showFallback && (
          <p className="mt-4 text-sm text-amber-700">
            Google Sign-In is taking longer than expected. Refresh the page or contact support.
          </p>
        )}

        <p className="mt-6 text-xs text-gray-500">
          Access restricted to Rock Creek Wellness staff
        </p>
      </div>
    </div>
  );
}
