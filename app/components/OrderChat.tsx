'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useAuth } from '@/hooks/useAuth'; // ← change if needed
import { Send, Loader2 } from 'lucide-react';

interface Props {
  orderId: string;
  className?: string;
}

export default function OrderChat({ orderId, className = '' }: Props) {
  const { user } = useAuth();
  const { messages, loading, sending, error, sendMessage } = 
useOrderChat(orderId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msg = text;
    setText('');
    await sendMessage(msg);
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        Sign in to chat about this order
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[420px] bg-gray-900 rounded-2xl 
border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-950">
        <h3 className="font-semibold text-sm">Order Chat</h3>
        <p className="text-xs text-gray-500">Only you and the other party 
can see this</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-10">
            No messages yet. Say hello 👋
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user.uid;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 
'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm 
${
                    isMe
                      ? 'bg-orange-500 text-black rounded-br-md'
                      : 'bg-gray-800 text-white rounded-bl-md'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-medium text-orange-400 
mb-0.5">
                      {m.senderName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap 
break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-black/60' 
: 'text-gray-500'}`}>
                    {m.createdAt?.toDate
                      ? m.createdAt.toDate().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-900/40 text-red-300 
text-xs">{error}</div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-800 bg-gray-950 flex 
gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && 
handleSend()}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 bg-gray-800 border border-gray-700 
rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 
focus:ring-orange-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 
text-black w-11 h-11 rounded-full flex items-center justify-center 
transition"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send 
className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
