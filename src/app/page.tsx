import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/Icon';

export const metadata = { title: 'Beranda' };

const QUICK = [
  { href: '/chat', icon: 'chat' as const, title: 'Tanya SOERA AI', desc: 'Chatbot cerdas 24 jam: keluhan, jadwal dokter, tarif, pendaftaran — online & offline.', tone: 'bg-rst-600 text-white' },
  { href: '/jadwal', icon: 'calendar' as const, title: 'Jadwal Dokter', desc: 'Cari jadwal poliklinik & dokter spesialis terbaru, bisa dicetak.', tone: 'bg-white text-rst-900' },
  { href: '/home-care', icon: 'home' as const, title: 'Soeradji Go Care', desc: 'Layanan dokter & perawat ke rumah + tarif resmi SK 2024 · pemesanan homecare online.', tone: 'bg-white text-rst-900' },
  { href: '/keluhan', icon: 'inbox' as const, title: 'Keluhan & Pengaduan', desc: 'Buat tiket pengaduan, lacak status penindakannya.', tone: 'bg-white text-rst-900' },
];

const SUGGESTIONS = [
  'Jadwal dokter poli jantung hari Senin',
  'Cara daftar online RST',
  'Tarif pasang infus Home Care',
  'Nomor IGD 24 jam',
  'Cara membuat tiket keluhan',
];

export default function LandingPage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero-pattern relative overflow-hidden text-white">
        <div className="grid-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400">
              <Icon name="shield" size={14} /> RSUP Dr. Soeradji Tirtonegoro · RS Vertikal Kemenkes RI · Kelas A
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
              SOERA<br /><span className="text-gold-400">AI</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base font-semibold uppercase tracking-[0.14em] text-rst-100/90 max-w-xl">
              Soeradji Assistant Intelligent
            </p>
            <p className="mt-5 text-lg sm:text-xl text-rst-50 max-w-2xl leading-relaxed">
              Asisten digital resmi rumah sakit untuk <strong>respons cepat keluhan</strong>, <strong>pertanyaan jadwal dokter</strong>, dan <strong>kampanye kesehatan daring</strong> — bisa dipakai <strong>online maupun offline</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/chat" className="btn btn-gold text-base px-6 py-4"><Icon name="chat" size={20} /> Mulai Bertanya Sekarang</Link>
              <Link href="/jadwal" className="btn btn-ghost text-base px-6 py-4"><Icon name="calendar" size={20} /> Lihat Jadwal Dokter</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-rst-100/80">
              <span className="flex items-center gap-1.5"><Icon name="wifiOff" size={14} className="text-gold-400" /> Bisa offline (AI lokal via PrivateLM)</span>
              <span className="flex items-center gap-1.5"><Icon name="bolt" size={14} className="text-gold-400" /> Respons &lt; 1 menit</span>
              <span className="flex items-center gap-1.5"><Icon name="shield" size={14} className="text-gold-400" /> Data tersimpan di server RS, aman</span>
            </div>
          </div>

          {/* kartu chat preview */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Image src="/images/soera-ai-logo.png" alt="SOERA AI" width={36} height={36} className="h-9 w-9 object-contain bg-white rounded-full p-0.5" />
                <div className="leading-tight">
                  <p className="font-bold">SOERA AI</p>
                  <p className="text-[10px] text-emerald-300 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> Online — siap membantu 24/7</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-[13px]">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white text-rst-900 px-4 py-2.5">Halo Kak, saya ingin tanya jadwal dokter poli jantung terdekat.</div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-rst-600 text-white px-4 py-2.5">Siap! <strong>Poliklinik Jantung &amp; Pembuluh Darah</strong>: dr. Muhammad Yulianto SA, Sp.JP(K) dan dr. Donna Paramita, Sp.JP — <strong>Senin s.d. Jumat</strong>. Daftar online via WA 0816-9170-00 (H-7 s/d H-1). Mau saya buatkan janji? 😊</div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white text-rst-900 px-4 py-2.5">Dan berapa biaya visite dokter spesialis home care?</div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-rst-600 text-white px-4 py-2.5">Kunjungan dokter spesialis ke rumah: <strong>Rp225.000</strong> (Jasa Sarana Rp25.000 + Jasa Pelayanan Rp200.000) sesuai SK Dirut RST No. HK.02.03/D.XXVI/5441/2024.</div>
              </div>
              <Link href="/chat" className="mt-4 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-3 text-rst-400 text-sm hover:bg-white transition">Ketik pertanyaan Anda… <span className="ml-auto"><Icon name="send" size={16} /></span></Link>
            </div>
          </div>
        </div>

        {/* quick question marquee */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="mx-auto max-w-7xl px-4 h-12 flex items-center gap-4 overflow-x-auto nice-scroll text-xs text-rst-100 whitespace-nowrap">
            <span className="uppercase tracking-widest text-[10px] font-bold text-gold-400 shrink-0">Sering ditanya:</span>
            {SUGGESTIONS.map((s) => (
              <Link key={s} href={`/chat?q=${encodeURIComponent(s)}`} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/15 hover:text-white transition">{s}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-0 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className={`card group p-5 hover:-translate-y-1 transition-all duration-200 ${q.tone === 'bg-white text-rst-900' ? '' : '!bg-rst-600 !text-white border-rst-600'}`}>
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${q.tone === 'bg-white text-rst-900' ? 'bg-rst-50 text-rst-600' : 'bg-white/15 text-gold-400'}`}>
                <Icon name={q.icon} size={22} />
              </span>
              <p className="mt-3 font-extrabold">{q.title}</p>
              <p className={`mt-1 text-xs leading-relaxed ${q.tone === 'bg-white text-rst-900' ? 'text-rst-600' : 'text-rst-50/90'}`}>{q.desc}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${q.tone === 'bg-white text-rst-900' ? 'text-rst-600' : 'text-gold-400'}`}>Buka <Icon name="chevronRight" size={12} className="group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== STATS & LAYANAN UNGGULAN ===== */}
      <section className="bg-white border-y border-rst-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['1927', 'Berdiri (RS Dr. Scheurer)'],
            ['Kelas A', 'Rumah Sakit Umum Pusat'],
            ['Kemenkes RI', 'RS Vertikal & BLU'],
            ['24/7', 'IGD & Layanan Darurat'],
          ].map(([n, d]) => (
            <div key={n as string}>
              <p className="text-3xl sm:text-4xl font-black text-rst-800">{n}</p>
              <p className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-rst-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <h2 className="text-2xl font-extrabold text-rst-900 tracking-tight">Layanan Unggulan RST</h2>
          <p className="mt-1 text-sm text-rst-600">Pusat rujukan dengan penekanan pada kardiologi &amp; pembuluh darah serta penatalaksanaan kelainan darah paripurna.</p>
          <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Kardiologi Intervensi', 'PCI & Rotablator penyakit jantung koroner'],
              ['Bedah Digestif', 'Digestive Laparoscopic Surgery'],
              ['Bedah Vaskuler & Endovaskuler', 'EVLA — terapi varises laser minimal invasif'],
              ['Orthopedi Hip & Knee', 'Sendi pinggul & lutut, termasuk spine'],
              ['Hematologi Onkologi Medik', 'Penatalaksanaan kelainan darah paripurna — bertaraf Asia'],
              ['Bedah Saraf & Bedah Jantung Anak', 'Rujukan nasional bedah saraf & jantung anak'],
            ].map(([t, d]) => (
              <div key={t as string} className="rounded-2xl border border-rst-100 bg-rst-50/50 p-4 hover:border-rst-300 transition">
                <p className="font-bold text-rst-900 flex items-center gap-2"><Icon name="activity" size={15} className="text-rst-500 shrink-0" />{t}</p>
                <p className="mt-1 text-xs text-rst-600 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="card p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon name="alert" size={20} /></span>
              <h3 className="font-extrabold text-rst-900">Dalam Keadaan Darurat?</h3>
            </div>
            <ol className="mt-4 space-y-2.5 text-sm text-rst-800">
              <li className="flex gap-2"><span className="font-black text-rst-400">1.</span>Segera hubungi <a href="tel:0272321020" className="font-bold text-rst-900 underline">(0272) 321020 ext 200</a> atau <a href="tel:119" className="font-bold text-rst-900 underline">119</a>.</li>
              <li className="flex gap-2"><span className="font-black text-rst-400">2.</span>Jangan menunggu antrean online — langsung ke IGD 24 jam RST.</li>
              <li className="flex gap-2"><span className="font-black text-rst-400">3.</span>Bawa KTP/BPJS &amp; berkas rujukan bila memungkinkan; untuk kondisi kritis tidak perlu berkas.</li>
            </ol>
            <div className="mt-5 rounded-2xl bg-rst-950 text-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">Maklumat Pelayanan</p>
              <p className="mt-1 text-xs leading-relaxed text-rst-100">"Kami berkomitmen memberikan pelayanan yang berkualitas, profesional, transparan, dan berorientasi pada kepuasan serta keselamatan masyarakat."</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-gold-400 font-bold">Stop Gratifikasi</p>
              <p className="mt-1 text-xs text-rst-100">Dilarang memberi/menerima imbalan dalam bentuk apapun. Lapor: <a href="tel:085179577302" className="underline font-semibold">0851-7957-7302</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
