'use client';

import ChatListScreen from '@/components/ChatListScreen';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

export default function ChatInboxPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-white text-xl font-bold mb-2">Messages</h1>
          <p className="text-gray-500 text-sm mb-5">Sign in to see chats for your orders.</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-orange-500 text-black font-bold rounded-xl">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <ChatListScreen />;
}
