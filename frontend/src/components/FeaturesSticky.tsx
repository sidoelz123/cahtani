import React from "react";
import { motion } from "motion/react";
import { Camera, Bug, ShieldCheck, Zap } from "lucide-react";

export const FeaturesSticky: React.FC = () => {
  const features = [
    {
      num: "01",
      title: "DIAGNOSA FOTO DAUN INSTAN",
      desc: "Foto bagian daun, batang, atau buah yang terserang penyakit dari kamera HP. Kecerdasan buatan CahTani AI menganalisis gejala mikroskopis dan memberikan diagnosa nama penyakit dalam hitungan detik.",
      icon: Camera,
      tag: "DITENAGAI GEMINI 3.6 FLASH",
    },
    {
      num: "02",
      title: "IDENTIFIKASI HAMA TERINTEGRASI",
      desc: "Deteksi jenis hama pengganggu seperti Wereng Cokelat, Ulat Grayak FAW, Penggerek Batang, Kutu Daun, dan Walang Sangit beserta tingkat bahaya penularannya di area persawahan.",
      icon: Bug,
      tag: "PRESISI > 98%",
    },
    {
      num: "03",
      title: "REKOMENDASI OBAT ORGANIK & KIMIA SAFE-DOSE",
      desc: "Solusi pengobatan dua arah: takaran pestisida nabati (mimba, serai, kunyit) untuk penanganan alami, atau dosis bahan aktif kimia yang aman untuk menekan biaya operasional.",
      icon: ShieldCheck,
      tag: "AMAT RAMAH LINGKUNGAN",
    },
    {
      num: "04",
      title: "PANDUAN PEMUPUKAN & PENCEGAHAN PRESISI",
      desc: "Langkah konkrit penanganan pasca-serangan: penyesuaian pH tanah, rotasi benih tahan penyakit, dan pola irigasi intermittent untuk mencegah wabah berulang musim depan.",
      icon: Zap,
      tag: "HASIL PANEN MAKSIMAL",
    },
  ];

  return (
    <section className="py-24 bg-[#F7F9F4] border-b-2 border-[#3A4A3E]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 border-b-2 border-[#3A4A3E] pb-8"
        >
          <span className="inline-block px-4 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-wider mb-4">
            KEUNGGULAN SISTEM
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl lg:text-8xl uppercase tracking-tighter text-[#14201A]">
            FITUR UTAMA CAHTANI AI
          </h2>
        </motion.div>

        {/* Sticky Stacked Cards */}
        <div className="space-y-12">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="sticky top-28 bg-[#F7F9F4] border-2 border-[#3A4A3E] p-6 sm:p-8 md:p-10 hover:bg-[#15803D] hover:border-[#15803D] hover:text-[#F7F9F4] transition-colors duration-300 group cursor-pointer min-h-[340px] sm:min-h-[300px] lg:min-h-[280px] flex flex-col justify-between"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
                  <div className="flex items-center gap-6">
                    <span className="font-display font-black text-6xl md:text-8xl text-[#E7ECE2] group-hover:text-emerald-300 transition-colors shrink-0">
                      {item.num}
                    </span>
                    <div>
                      <span className="inline-block px-3 py-1 bg-[#E7ECE2] text-[#14201A] font-extrabold text-xs md:text-sm uppercase tracking-wider mb-2 group-hover:bg-[#14201A] group-hover:text-[#F7F9F4] transition-colors">
                        {item.tag}
                      </span>
                      <h3 className="font-display font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tight text-[#14201A] group-hover:text-[#F7F9F4] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#15803D] text-[#F7F9F4] group-hover:bg-[#F7F9F4] group-hover:text-[#15803D] border-2 border-[#3A4A3E] flex items-center justify-center font-bold text-2xl transition-colors shrink-0">
                    <Icon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                </div>

                <p className="font-body text-lg md:text-xl text-[#3F4C42] group-hover:text-emerald-100 font-medium leading-relaxed max-w-5xl transition-colors mt-auto">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
