import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatClient from '@/components/ChatClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tanya SAPA PASIEN' };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-rst-600">Memuat SAPA PASIEN…</div>}>
      <ChatClient />
    </Suspense>
  );
}
