import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

interface AIWelcomeProps {
  isRegistered: boolean;
  userName?: string;
}

export function AIWelcome({ isRegistered, userName }: AIWelcomeProps) {
  const [showMessage, setShowMessage] = useState(true);

  const welcomeMessage = isRegistered
    ? `Hello ${userName}, I am KESEGO MOLOSIWA your intelligent system provider called Smart Transportation. Welcome to the world of AI-powered transportation. Relax, buckle up, and enjoy your smart journey!`
    : `I am KESEGO MOLOSIWA, your intelligence provider powering Smart Transportation. Let me walk you through the registration process.`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!showMessage) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-indigo-600 text-white p-6 rounded-lg shadow-xl animate-fade-in">
      <div className="flex items-start space-x-4">
        <div className="bg-white p-2 rounded-full">
          <Bot className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm leading-relaxed">{welcomeMessage}</p>
          <button
            onClick={() => setShowMessage(false)}
            className="mt-2 text-xs underline hover:text-indigo-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}