'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/components/Icon';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok) { router.push('/admin'); router.refresh(); }
      else setError(data?.error || 'Login gagal');
    } catch { setError('Tidak dapat terhubung ke server.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-14 bg-[radial-gradient(900px_400px_at_50%_-10%,rgba(31,127,120,0.25),transparent)]">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8">
        <div className="text-center">
          <Image src="/images/soera-ai-logo.png" alt="SOERA AI" width={72} height={72} className="mx-auto h-16 w-16 object-contain" />
          <h1 className="mt-3 text-xl font-black text-rst-900">Panel Admin SOERA AI</h1>
          <p className="mt-1 text-xs text-rst-500">Khusus petugas RSUP Dr. Soeradji Tirtonegoro — Keluhan · Home Care · Kampanye · Pengaturan AI</p>
        </div>
        <div className="mt-6 space-y-4">
          <div><label className="label" htmlFor="u">Username</label><input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus /></div>
          <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 font-semibold">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading ? 'Memeriksa…' : 'Masuk'}<Icon name="shield" size={17} /></button>
        </div>
        <p className="mt-4 text-center text-[10.5px] text-rst-400">Default kredensial pengembangan: <code className="bg-rst-50 px-1.5 py-0.5 rounded">admin / admin123</code><br />Ubah via env <code className="bg-rst-50 px-1.5 py-0.5 rounded">ADMIN_USERNAME</code> &amp; <code className="bg-rst-50 px-1.5 py-0.5 rounded">ADMIN_PASSWORD</code>.</p>
      </form>
    </div>
  );
}
