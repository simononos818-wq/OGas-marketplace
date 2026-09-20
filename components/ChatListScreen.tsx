'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useChatList } from '../hooks/useChat';
import { useAuth } from '../app/hooks/useAuth';

const NAVY = '#16305e';
const TEAL = '#12a5b0';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, totalUnread } = useChatList();

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: TEAL }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f4f6f8' }}>
      <div className="sticky top-0 z-40 px-5 py-4 bg-white border-b" style={{ borderColor: '#eee' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold" style={{ color: NAVY }}>Messages</h1>
          {totalUnread > 0 && (
            <span className="text-white text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#e74c3c' }}>
              {totalUnread}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm" style={{ color: '#8a8f98' }}>
          Chat opens with the order. Numbers stay private. Door Codes stay off the thread.
        </p>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#e6f7f8' }}>
            <MessageSquare size={28} style={{ color: TEAL }} />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: NAVY }}>No messages yet</h2>
          <p className="text-center text-sm" style={{ color: '#8a8f98' }}>
            Order gas and the store chat opens instantly — no WhatsApp, no extra signup.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 px-6 py-3 text-white font-bold rounded-xl"
            style={{ background: TEAL }}
          >
            Order gas
          </button>
        </div>
      ) : (
        <div className="px-3 py-2">
          {chats.map((chat) => {
            const unread = chat.unreadCount?.[user?.uid || ''] || 0;
            const mine = chat.sellerId === user?.uid;
            const name = mine ? chat.buyerName || 'Buyer' : chat.sellerName || 'Store';
            return (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left hover:bg-white transition"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: NAVY }}>
                  <span className="text-white text-lg font-bold">{name[0]?.toUpperCase() || 'O'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold truncate" style={{ color: unread ? NAVY : '#5b616b' }}>
                      {name}
                    </h3>
                    <span className="text-xs shrink-0" style={{ color: '#8a8f98' }}>{formatTime(chat.lastMessageAt || chat.updatedAt)}</span>
                  </div>
                  <p className="text-sm truncate" style={{ color: unread ? '#1a1d23' : '#8a8f98' }}>
                    {chat.lastSenderRole === 'system' ? '' : chat.lastSenderId === user?.uid ? 'You: ' : ''}
                    {chat.lastMessage || 'Chat opened'}
                  </p>
                  <p className="text-xs mt-0.5 font-bold" style={{ color: TEAL }}>
                    {chat.productLabel || `Order #${(chat.orderId || chat.id).slice(-6).toUpperCase()}`}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="min-w-5 h-5 px-1.5 text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ background: TEAL }}>
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
