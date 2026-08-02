import React from "react";
import { Shield, PhoneCall, Mail, MapPin, ArrowUpRight } from "lucide-react";

export const FooterSection: React.FC = () => {
  return (
    <footer className="bg-[#15803D] text-[#F7F9F4] border-t-2 border-[#3A4A3E] pt-20 pb-12 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Massive Kinetic Typography Callout */}
        <div className="mb-16 border-b-2 border-[#3A4A3E] pb-12">
          <h2 className="font-display font-black text-[clamp(2.5rem,7vw,8rem)] uppercase leading-none tracking-tighter text-[#F7F9F4] mb-6">
            PANEN MELIMPAH <br />
            PETANI SEJAHTERA
          </h2>
          <p className="font-body text-xl md:text-2xl text-emerald-100 max-w-3xl font-medium">
            CahTani AI siap mendampingi setiap langkah perawatan sawah & ladang Anda. Bebas hama, bebas penyakit, hasil panen maksimal.
          </p>
        </div>

        {/* Footer Navigation & Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#14201A] text-[#F7F9F4] border border-[#3A4A3E] flex items-center justify-center font-black text-2xl">
                🌾
              </div>
              <span className="font-display font-black text-2xl uppercase tracking-tighter">
                CAHTANI.AI
              </span>
            </div>
            <p className="font-body text-base text-emerald-100 leading-relaxed font-medium">
              Platform kecerdasan buatan terdepan khusus untuk diagnosa kesehatan tanaman dan bimbingan pertanian presisi Indonesia.
            </p>
          </div>

          <div>
            <h3 className="font-display font-black text-xl uppercase tracking-tight mb-4 border-b border-[#3A4A3E] pb-2">
              LAYANAN UTAMA
            </h3>
            <ul className="space-y-3 font-body text-base text-emerald-100 font-medium uppercase">
              <li>• Diagnosa Foto Daun Instan</li>
              <li>• Identifikasi Hama Wereng & Ulat</li>
              <li>• Racikan Pestisida Nabati</li>
              <li>• Takaran Pemupukan Presisi</li>
              <li>
                <a href="/shop" className="hover:underline text-amber-300 font-bold flex items-center gap-1">
                  • Toko Tani & Rekomendasi Marketplace →
                </a>
              </li>
              <li>• Konsultasi AI 24 Jam</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-black text-xl uppercase tracking-tight mb-4 border-b border-[#3A4A3E] pb-2">
              DUKUNGAN PETANI
            </h3>
            <ul className="space-y-3 font-body text-base text-emerald-100 font-medium">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-300" />
                <span>HOTLINE: 0800-1-CAHTANI (TOL FREE)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-300" />
                <span>BANTUAN@CAHTANI.ID</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-300" />
                <span>JAKARTA & SURABAYA, INDONESIA</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-black text-xl uppercase tracking-tight mb-4 border-b border-[#3A4A3E] pb-2">
              GABUNG GRUP PETANI WA
            </h3>
            <p className="font-body text-sm text-emerald-100 mb-4">
              Dapatkan berita peringatan dini hama & tips racikan pupuk mingguan langsung ke HP Anda.
            </p>
            <a
              href="https://wa.me/?text=Halo%20CahTani%20AI,%20saya%20petani%20ingin%20gabung%20grup%20konsultasi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#14201A] text-[#F7F9F4] font-black text-base uppercase tracking-tight border border-[#3A4A3E] hover:bg-emerald-950 transition-colors"
            >
              <span>GABUNG WA CAHTANI</span>
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-[#3A4A3E] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-wider text-emerald-200">
          <span>© 2026 CAHTANI AI — DUKUNG KETAHANAN PANGAN INDONESIA</span>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">KEBIJAKAN PRIVASI</a>
            <a href="#" className="hover:underline">SYARAT & KETENTUAN</a>
            <a href="#" className="hover:underline">AKSESIBILITAS PETANI</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
