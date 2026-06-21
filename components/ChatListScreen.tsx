'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useChatList } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Flame, ChevronRight } from 'lucide-react';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chats, loading, totalUnread } = useChatList();

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new 
Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: 
'2-digit', hour12: true });
    } else if (diff < 172800000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-NG', { day: 'numeric', month: 
'short' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center 
justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 
border-orange-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center 
justify-center px-8">
        <MessageSquare size={64} className="text-gray-800 mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">No Messages 
Yet</h2>
        <p className="text-gray-500 text-center">
          Your chat conversations will appear here once you place an order
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b 
border-gray-800 z-40 px-5 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-extrabold">Messages</h1>
          {totalUnread > 0 && (
            <span className="bg-orange-500 text-white text-sm font-bold 
px-3 py-1 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="px-4 py-2 space-y-1">
        {chats.map((chat) => {
          const unreadCount = chat.unreadCount?.[user?.uid || ''] || 0;
          const lastMessage = chat.lastMessage;

          return (
            <button
              key={chat.id}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl 
hover:bg-gray-900 transition text-left"
            >
              {/* Avatar */}
              <div className="relative">
                {chat.otherUser?.photoURL ? (
                  <img 
                    src={chat.otherUser.photoURL} 
                    alt="" 
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-500 
flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(chat.otherUser?.displayName || 
'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 
bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs 
font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-base font-semibold truncate 
${unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                    {chat.otherUser?.displayName || 'User'}
                  </h3>
                  <span className="text-gray-600 
text-xs">{formatTime(lastMessage?.timestamp)}</span>
                </div>
                
                <p className={`text-sm truncate ${unreadCount > 0 ? 
'text-white font-medium' : 'text-gray-500'}`}>
                  {lastMessage?.senderId === user?.uid ? 'You: ' : ''}
                  {lastMessage?.text || 'No messages yet'}
                </p>

                {chat.orderId && (
                  <p className="text-orange-500 text-xs mt-1 font-medium">
                    Order #{chat.orderId.slice(-6).toUpperCase()}
                  </p>
                )}
              </div>

              <ChevronRight size={18} className="text-gray-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
