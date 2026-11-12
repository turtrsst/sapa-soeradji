import Link from 'next/link';
import Image from 'next/image';
import Icon from './Icon';

export default function Footer() {
  return (
    <footer className="bg-rst-950 text-rst-100">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <Image src="/images/sapa-pasien-logo.png" alt="SAPA PASIEN" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <p className="font-extrabold text-white leading-tight">SAPA PASIEN</p>
              <p className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">RSUP Dr. Soeradji Tirtonegoro</p>
            </div>
          </div>
          <p className="mt-3 text-rst-200/90 leading-relaxed">Strategi Akses Pemasaran Digital &amp; Pelayanan Terintegrasi — respons cepat terhadap keluhan, pertanyaan jadwal dokter, dan kampanye kesehatan daring RSUP Dr. Soeradji Tirtonegoro Klaten.</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-rst-300 mb-2">Kontak RST</p>
          <ul className="space-y-1.5">
            <li>Contact Center: <a className="text-white font-semibold hover:underline" href="tel:0272321020">(0272) 321020</a></li>
            <li>IGD / SPGDT 24 Jam: <a className="text-white font-semibold hover:underline" href="tel:0272321020">(0272) 321020 ext 200</a></li>
            <li>WhatsApp Pendaftaran: <a className="text-white hover:underline" href="https://wa.me/62816917000">0816-9170-00</a></li>
            <li>Hotline Pengaduan: <a className="text-white hover:underline" href="tel:085179577302">0851-7957-7302</a></li>
            <li>Fax: (0272) 321104</li>
            <li>Email: rsupsoeradji_klaten@yahoo.com</li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-rst-300 mb-2">Alamat</p>
          <p className="text-rst-200/90">Jalan KRT Dr. Soeradji Tirtonegoro No. 1, Tegalyoso, Klaten Selatan, Kabupaten Klaten, Jawa Tengah 57424</p>
          <a href="https://maps.app.goo.gl/Dg4VaQR88kVLfsS36" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-gold-400 font-semibold hover:underline">Buka di Google Maps <Icon name="external" size={12} /></a>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-rst-300 mb-2">Tautan</p>
          <ul className="space-y-1.5">
            <li><Link href="/chat" className="hover:text-white">Tanya SAPA PASIEN (Chatbot)</Link></li>
            <li><Link href="/jadwal" className="hover:text-white">Jadwal Dokter Poliklinik</Link></li>
            <li><Link href="/home-care" className="hover:text-white">Home Care Go-Trah &amp; Tarif</Link></li>
            <li><Link href="/kampanye" className="hover:text-white">Kampanye Kesehatan</Link></li>
            <li><Link href="/keluhan" className="hover:text-white">Pengaduan &amp; Keluhan</Link></li>
            <li><a href="https://rsupsoeradji.id" target="_blank" rel="noreferrer" className="hover:text-white">Situs Resmi rsupsoeradji.id</a></li>
            <li><a href="https://www.instagram.com/rssoeradjitirtonegoro" target="_blank" rel="noreferrer" className="hover:text-white">Instagram @rssoeradjitirtonegoro</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-rst-300">
          <p>© {new Date().getFullYear()} RSUP Dr. Soeradji Tirtonegoro Klaten — Instalasi PKRS/Humas &amp; Sistem Informasi. Bukan pengganti konsultasi medis.</p>
          <p>SAPA PASIEN v1.0 · Jaringan internal &amp; internet · Mode offline tersedia</p>
        </div>
      </div>
    </footer>
  );
}
