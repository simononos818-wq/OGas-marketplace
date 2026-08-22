'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { authHeaders } from '../lib/client-auth';

interface ChatButtonProps {
  orderId: string;
  chatId?: string;
  variant?: 'primary' | 'outline' | 'block';
  label?: string;
}

export default function ChatButton({ orderId, chatId, variant = 'primary', label = 'Message' }: ChatButtonProps) {
  const router = useRouter();
  const target = chatId || orderId;

  const open = async () => {
    try {
      const headers = await authHeaders();
      await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'open', orderId: target }),
      });
    } catch {
      /* still navigate — the thread page will retry */
    }
    router.push(`/chat/${target}`);
  };

  const base =
    variant === 'outline'
      ? 'flex items-center justify-center gap-2 px-4 py-3 border-2 border-orange-500 text-orange-500 rounded-xl font-bold'
      : 'flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-black rounded-xl font-bold';

  return (
    <button onClick={open} className={`${base} ${variant === 'block' || variant === 'outline' || variant === 'primary' ? 'w-full' : ''} mt-2`}>
      <MessageSquare size={18} />
      {label}
    </button>
  );
}
