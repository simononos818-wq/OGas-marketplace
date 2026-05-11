import React, { createContext, useContext, useState } from 'react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface ChatContextType {
  messages: Message[];
  sendMessage: (text: string, senderId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = (text: string, senderId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
