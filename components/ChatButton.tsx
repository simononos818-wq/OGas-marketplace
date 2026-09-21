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
      ? 'flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl font-bold'
      : 'flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-bold';

  const style =
    variant === 'outline'
      ? { borderColor: '#12a5b0', color: '#12a5b0' }
      : { background: '#12a5b0' };

  return (
    <button onClick={open} className={`${base} ${variant === 'block' || variant === 'outline' || variant === 'primary' ? 'w-full' : ''} mt-2`} style={style}>
      <MessageSquare size={18} />
      {label}
    </button>
  );
}
