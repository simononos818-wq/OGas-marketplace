'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Shield } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../app/hooks/useAuth';
import { chipsForRole } from '../lib/chat';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

export default function ChatScreen({ chatId }: { chatId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { messages, chatInfo, loading, sending, error, role, counterpart, sendMessage } = useChat(chatId);
  const [inputText, setInputText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const chips = chipsForRole(role) || [];

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: TEAL }} />
      </div>
    );
  }

  return (
    <div className="ogas-chat-thread min-h-screen flex flex-col" style={{ background: '#f4f6f8' }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-white border-b" style={{ borderColor: '#eee' }}>
        <button onClick={() => router.push('/chat')} className="p-2 -ml-2 rounded-lg" style={{ background: '#f4f6f8' }} aria-label="All chats">
          <ArrowLeft size={20} style={{ color: NAVY }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate" style={{ color: NAVY }}>{counterpart}</h1>
          <p className="text-xs truncate" style={{ color: '#8a8f98' }}>
            {chatInfo?.productLabel || 'Delivery chat'}
            {chatInfo?.orderId ? ` · #${chatInfo.orderId.slice(-6).toUpperCase()}` : ''}
          </p>
        </div>
        <button
          onClick={() => router.push(role === 'seller' ? '/seller/dashboard' : '/orders')}
          className="text-xs font-bold px-3 py-2 rounded-lg text-white"
          style={{ background: TEAL }}
        >
          {role === 'seller' ? 'Accept' : 'Order'}
        </button>
      </div>

      <div className="px-4 py-2 border-b bg-white" style={{ borderColor: '#eee' }}>
        <p className="text-[11px] flex items-center gap-1.5 font-bold" style={{ color: '#8a8f98' }}>
          <Shield size={12} style={{ color: TEAL }} className="shrink-0" />
          Numbers stay private. Door Codes are blocked in chat — say them at the door.
        </p>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.type === 'system' || msg.senderRole === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <p className="max-w-[90%] text-center text-xs leading-relaxed" style={{ color: '#8a8f98' }}>{msg.text}</p>
              </div>
            );
          }
          const me = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-4 py-2.5"
                style={me
                  ? { background: TEAL, color: '#fff', borderRadius: '16px 16px 4px 16px' }
                  : { background: '#fff', color: '#1a1d23', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 3px rgba(20,30,50,.08)' }}
              >
                {!me && msg.senderRole === 'seller' && (
                  <p className="mb-1 text-[10px] uppercase tracking-wide font-bold" style={{ color: '#8a8f98' }}>Desk</p>
                )}
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className="text-[10px] mt-1" style={{ color: me ? 'rgba(255,255,255,.7)' : '#8a8f98' }}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t bg-white px-3 pt-3 pb-5" style={{ borderColor: '#eee' }}>
        {error && <p className="mb-2 text-xs font-bold" style={{ color: '#e74c3c' }}>{error}</p>}
        {chips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => handleSend(chip.body, chip.key)}
                disabled={sending}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold"
                style={{ borderColor: '#bfe6e9', background: '#e6f7f8', color: TEAL }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: '#f4f6f8', border: '1.5px solid #e6e9ee' }}>
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
              className="w-full bg-transparent text-sm font-bold resize-none outline-none"
              style={{ color: NAVY }}
              rows={1}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || sending}
            className="p-3 rounded-xl"
            style={inputText.trim() ? { background: TEAL } : { background: '#e6e9ee' }}
            aria-label="Send"
          >
            <Send size={20} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
