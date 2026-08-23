'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Shield } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../app/hooks/useAuth';
import { chipsForRole } from '../lib/chat';

export default function ChatScreen({ chatId }: { chatId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { messages, chatInfo, loading, sending, error, role, counterpart, sendMessage } = useChat(chatId);
  const [inputText, setInputText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const chips = chipsForRole(role);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length]);

  const handleSend = async (text?: string, quickKey?: string) => {
    const body = (text ?? inputText).trim();
    if (!body && !quickKey) return;
    if (!quickKey) setInputText('');
    try {
      await sendMessage(body, quickKey);
    } catch {
      if (!quickKey) setInputText(body);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="ogas-chat-thread min-h-screen bg-black flex flex-col">
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/chat')} className="p-2 -ml-2 hover:bg-gray-900 rounded-lg" aria-label="All chats">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate">{counterpart}</h1>
          <p className="text-xs text-gray-400 truncate">
            {chatInfo?.productLabel || 'Delivery chat'}
            {chatInfo?.orderId ? ` · #${chatInfo.orderId.slice(-6).toUpperCase()}` : ''}
          </p>
        </div>
        <button
          onClick={() => router.push(role === 'seller' ? '/seller/dashboard' : '/orders')}
          className="text-xs font-semibold text-orange-400 px-3 py-2 rounded-lg hover:bg-gray-900"
        >
          {role === 'seller' ? 'Accept' : 'Order'}
        </button>
      </div>

      <div className="px-4 py-2 border-b border-gray-900 bg-gray-950">
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <Shield size={12} className="text-orange-500 shrink-0" />
          Numbers stay private. Door Codes are blocked in chat — say them at the door.
        </p>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.type === 'system' || msg.senderRole === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <p className="max-w-[90%] text-center text-xs text-gray-500 leading-relaxed">{msg.text}</p>
              </div>
            );
          }
          const me = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 ${
                  me
                    ? 'bg-orange-500 text-black rounded-2xl rounded-br-md'
                    : 'bg-gray-800 text-white rounded-2xl rounded-bl-md'
                }`}
              >
                {!me && msg.senderRole === 'seller' && (
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">Desk</p>
                )}
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${me ? 'text-black/60' : 'text-gray-500'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-800 bg-black px-3 pt-3 pb-5">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => handleSend(chip.body, chip.key)}
              disabled={sending}
              className="shrink-0 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-900 rounded-2xl px-4 py-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message about this delivery…"
              className="w-full bg-transparent text-white text-[15px] resize-none outline-none placeholder-gray-500"
              rows={1}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || sending}
            className={`p-3 rounded-xl ${inputText.trim() && !sending ? 'bg-orange-500' : 'bg-gray-800'}`}
            aria-label="Send"
          >
            <Send size={20} className={inputText.trim() ? 'text-black' : 'text-gray-500'} />
          </button>
        </div>
      </div>
    </div>
  );
}
