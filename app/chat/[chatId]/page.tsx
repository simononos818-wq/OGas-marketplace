'use client';

import { useParams } from 'next/navigation';
import ChatScreen from '@/components/ChatScreen';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

export default function ChatThreadPage() {
  const params = useParams<{ chatId: string }>();
  const { user, loading } = useAuth();
  const chatId = params?.chatId;

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
          <p className="text-gray-400 mb-4">Sign in to open this chat.</p>
          <Link href="/login" className="text-orange-500 font-bold">Sign in</Link>
        </div>
      </div>
    );
  }

  if (!chatId) return null;
  return <ChatScreen chatId={chatId} />;
}
