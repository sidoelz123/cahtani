import React from "react";
import Marquee from "react-fast-marquee";

export const StatsMarquee: React.FC = () => {
  const stats = [
    { value: "185.000+", label: "TANAMAN TERDIAGNOSA" },
    { value: "98.4%", label: "AKURASI IDENTIFIKASI HAMA" },
    { value: "420+", label: "JENIS HAMA & PENYAKIT DETEKSI" },
    { value: "12.500+", label: "KELOMPOK TANI TERBANTU" },
    { value: "< 5 DETIK", label: "KECEPATAN ANALISA AI" },
    { value: "34 PROVINSI", label: "PETANI INDONESIA AKTIF" },
  ];

  return (
    <div className="bg-[#15803D] text-[#F7F9F4] py-8 border-y-2 border-[#3A4A3E] overflow-hidden">
      <Marquee speed={70} gradient={false} autoFill={true}>
        {stats.map((item, index) => (
          <div key={index} className="flex items-center gap-6 px-10">
            <span className="font-display font-black text-5xl md:text-7xl uppercase tracking-tighter">
              {item.value}
            </span>
            <span className="font-body font-extrabold text-base md:text-xl uppercase tracking-wide text-emerald-100 max-w-[200px] leading-tight">
              {item.label}
            </span>
            <span className="text-3xl text-emerald-300 ml-6">🌿</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
};
