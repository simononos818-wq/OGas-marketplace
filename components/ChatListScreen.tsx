'use client';

import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useChatList } from '../hooks/useChat';
import { useAuth } from '../app/hooks/useAuth';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 z-40 px-5 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-extrabold">Messages</h1>
          {totalUnread > 0 && (
            <span className="bg-orange-500 text-black text-sm font-bold px-3 py-1 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Chat opens with the order. Numbers stay private. Door Codes stay off the thread.
        </p>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-24">
          <MessageSquare size={56} className="text-gray-800 mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">No messages yet</h2>
          <p className="text-gray-500 text-center text-sm">
            Order gas and the store chat opens instantly — no WhatsApp, no extra signup.
          </p>
          <button
            onClick={() => router.push('/buy')}
            className="mt-5 px-6 py-3 bg-orange-500 text-black font-bold rounded-xl"
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
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-900 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-black text-lg font-bold">{name[0]?.toUpperCase() || 'O'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-base font-semibold truncate ${unread ? 'text-white' : 'text-gray-300'}`}>
                      {name}
                    </h3>
                    <span className="text-gray-600 text-xs shrink-0">{formatTime(chat.lastMessageAt || chat.updatedAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${unread ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {chat.lastSenderRole === 'system' ? '' : chat.lastSenderId === user?.uid ? 'You: ' : ''}
                    {chat.lastMessage || 'Chat opened'}
                  </p>
                  <p className="text-orange-500 text-xs mt-0.5 font-medium">
                    {chat.productLabel || `Order #${(chat.orderId || chat.id).slice(-6).toUpperCase()}`}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="min-w-5 h-5 px-1.5 bg-orange-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
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
