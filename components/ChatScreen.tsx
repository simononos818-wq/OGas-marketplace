'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat, ChatMessage } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { Flame, Send, ArrowLeft, Phone, MapPin, Check, CheckCheck } from 
'lucide-react';

interface ChatScreenProps {
  chatId: string;
}

export default function ChatScreen({ chatId }: ChatScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    messages, chatInfo, loading, sending, otherUserTyping,
    sendMessage, sendLocationMessage, handleTyping, messagesEndRef,
  } = useChat(chatId);

  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 
messagesContainerRef.current.scrollHeight;
    }
  }, [messages, otherUserTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await sendLocationMessage(
            position.coords.latitude,
            position.coords.longitude,
            'Current Location'
          );
        },
        () => alert('Could not get location. Please enable location 
services.')
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new 
Date(timestamp);
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: 
'2-digit', hour12: true });
  };

  const isMe = (msg: ChatMessage) => msg.senderId === user?.uid;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center 
justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 
border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-lg border-b 
border-gray-800 z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 
hover:bg-gray-900 rounded-lg transition">
          <ArrowLeft size={20} className="text-white" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate">
            {chatInfo?.otherUser?.displayName || 'Chat'}
          </h1>
          {otherUserTyping ? (
            <p className="text-xs text-orange-400 italic">typing...</p>
          ) : (
            <p className="text-xs text-gray-400">
              {chatInfo?.orderId ? `Order 
#${chatInfo.orderId.slice(-6).toUpperCase()}` : 'Online'}
            </p>
          )}
        </div>

        <button 
          onClick={() => chatInfo?.otherUser?.phoneNumber && 
window.open(`tel:${chatInfo.otherUser.phoneNumber}`)}
          className="p-2 hover:bg-gray-900 rounded-lg transition"
        >
          <Phone size={20} className="text-orange-500" />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto 
px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const me = isMe(msg);
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-gray-900 rounded-xl px-4 py-3 
max-w-[85%] text-center">
                  <p className="text-gray-400 text-sm 
whitespace-pre-line">{msg.text}</p>
                  <p className="text-gray-600 text-xs 
mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${me ? 'justify-end' : 
'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                me 
                  ? 'bg-orange-500 text-black rounded-br-md' 
                  : 'bg-gray-800 text-white rounded-bl-md'
              }`}>
                {msg.type === 'location' && msg.location && (
                  <button
                    onClick={() => 
window.open(`https://www.google.com/maps?q=${msg.location!.latitude},${msg.location!.longitude}`)}
                    className="mb-2 bg-black/20 rounded-lg p-3 text-left 
w-full"
                  >
                    <MapPin size={20} className="text-orange-400 mb-1" />
                    <p className="text-sm 
font-medium">{msg.location.address || 'Shared Location'}</p>
                    <p className="text-xs opacity-70">Tap to open in 
Maps</p>
                  </button>
                )}
                
                {msg.text && (
                  <p className="text-[15px] 
leading-relaxed">{msg.text}</p>
                )}

                <div className={`flex items-center gap-1 mt-1 ${me ? 
'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] ${me ? 'text-black/60' : 
'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {me && (
                    msg.readBy.length > 1 
                      ? <CheckCheck size={12} className="text-black/60" />
                      : <Check size={12} className="text-black/60" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 
py-3 flex items-center gap-2">
              <span className="text-gray-400 text-sm italic">typing</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full 
animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full 
animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full 
animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-black px-4 py-3 pb-6">
        <div className="flex items-end gap-2">
          <button 
            onClick={handleShareLocation}
            className="p-3 hover:bg-gray-900 rounded-xl transition"
          >
            <MapPin size={20} className="text-gray-400" />
          </button>

          <div className="flex-1 bg-gray-900 rounded-2xl px-4 py-3">
            <textarea
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); 
handleTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent text-white text-[15px] 
resize-none outline-none placeholder-gray-500"
              rows={1}
              style={{ maxHeight: '100px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className={`p-3 rounded-xl transition ${inputText.trim() && 
!sending ? 'bg-orange-500' : 'bg-gray-800'}`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 
border-white"></div>
            ) : (
              <Send size={20} className={inputText.trim() ? 'text-black' : 
'text-gray-500'} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
