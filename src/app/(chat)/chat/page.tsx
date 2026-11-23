import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatClient from '@/components/ChatClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tanya SOERA AI' };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="chat-full flex items-center justify-center bg-[#04100f] text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">Memuat SOERA AI…</div>}>
      <ChatClient />
    </Suspense>
  );
}
