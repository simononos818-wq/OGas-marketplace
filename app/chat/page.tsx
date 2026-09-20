'use client';

import ChatListScreen from '@/components/ChatListScreen';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

export default function ChatInboxPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f8' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#12a5b0' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: '#f4f6f8' }}>
        <div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#16305e' }}>Messages</h1>
          <p className="text-sm mb-5" style={{ color: '#8a8f98' }}>Sign in to see chats for your orders.</p>
          <Link href="/login" className="inline-block px-6 py-3 text-white font-bold rounded-xl" style={{ background: '#12a5b0' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <ChatListScreen />;
}
