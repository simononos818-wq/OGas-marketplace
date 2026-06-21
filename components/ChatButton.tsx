'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

interface ChatButtonProps {
  orderId: string;
  chatId?: string;
  variant?: 'primary' | 'outline' | 'floating';
}

export default function ChatButton({ orderId, chatId, variant = 'primary' 
}: ChatButtonProps) {
  const router = useRouter();
  const targetChatId = chatId || orderId;

  if (variant === 'floating') {
    return (
      <button
        onClick={() => router.push(`/chat/${targetChatId}`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 
rounded-full flex items-center justify-center shadow-lg 
shadow-orange-500/40 hover:bg-orange-400 transition z-50"
      >
        <MessageSquare size={24} className="text-black" />
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={() => router.push(`/chat/${targetChatId}`)}
        className="flex items-center gap-2 px-5 py-3 border-2 
border-orange-500 text-orange-500 rounded-xl font-bold 
hover:bg-orange-500/10 transition"
      >
        <MessageSquare size={18} />
        Message
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push(`/chat/${targetChatId}`)}
      className="flex items-center gap-2 px-5 py-3 bg-orange-500 
text-black rounded-xl font-bold hover:bg-orange-400 transition"
    >
      <MessageSquare size={18} />
      Chat Now
    </button>
  );
}
