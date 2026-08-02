import React from "react";
import { motion } from "motion/react";
import { Sparkles, Camera, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { CROP_OPTIONS, normalizeCropId } from "../data/mockData";

interface HeroSectionProps {
  onSelectCrop: (cropId: string) => void;
  selectedCrop: string;
  onStartDiagnosis: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectCrop,
  selectedCrop,
  onStartDiagnosis,
}) => {
  return (
    <section className="relative bg-[#F7F9F4] border-b-2 border-[#3A4A3E] py-16 md:py-24 overflow-hidden bg-noise">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E7ECE2] border-2 border-[#3A4A3E] text-[#14201A] font-bold text-sm md:text-lg uppercase tracking-wider mb-6"
        >
          <Zap className="w-5 h-5 text-[#15803D]" />
          <span>KECERDASAN BUATAN KHUSUS PETANI INDONESIA</span>
        </motion.div>

        {/* Viewport Width Kinetic Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="font-display font-black text-[clamp(2.8rem,8.5vw,9.5rem)] uppercase leading-[0.85] tracking-tighter text-[#14201A] mb-8"
        >
          DOKTER <span className="text-[#15803D]">TANAMAN</span> <br />
          DI SAKU PETANI
        </motion.h1>

        {/* Subtitle with extra readable font size for 30-70 age group */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="font-body text-xl md:text-2xl lg:text-3xl text-[#3F4C42] max-w-4xl font-medium leading-relaxed mb-10"
        >
          Cukup <strong className="text-[#14201A]">foto daun atau tanaman</strong> yang sakit dari
          HP Anda. CahTani AI langsung mendiagnosis penyakit, mengidentifikasi hama (wereng, patek,
          ulat), dan memberikan{" "}
          <strong className="text-[#15803D]">resep pengobatan & pemupukan presisi</strong> detik ini
          juga.
        </motion.p>

        {/* Crop Selection Bar */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mb-10"
        >
          <label className="block text-sm md:text-base font-bold uppercase tracking-wide text-[#3F4C42] mb-3">
            PILIH TANAMAN ANDA SEKARANG:
          </label>
          <div className="flex flex-wrap gap-3">
            {CROP_OPTIONS.map((crop, idx) => {
              const isSelected = normalizeCropId(selectedCrop) === crop.id;
              return (
                <motion.button
                  key={crop.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                  onClick={() => onSelectCrop(crop.id)}
                  className={`px-5 py-3 border-2 font-black text-sm md:text-lg uppercase tracking-tight flex items-center gap-2 transition-all cursor-pointer rounded-none ${
                    isSelected
                      ? "bg-[#15803D] text-[#F7F9F4] border-[#3A4A3E] scale-105 shadow-md"
                      : "bg-[#E7ECE2] text-[#14201A] border-[#3A4A3E] hover:bg-[#15803D] hover:text-[#F7F9F4]"
                  }`}
                >
                  <span className="text-xl">{crop.icon}</span>
                  <span>{crop.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        */}

        {/* Big Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6 pt-4"
        >
          <button
            onClick={onStartDiagnosis}
            className="px-8 py-6 bg-[#15803D] text-[#F7F9F4] font-black text-xl md:text-2xl uppercase tracking-tighter border-2 border-[#3A4A3E] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-none rounded-none"
          >
            <Camera className="w-8 h-8" />
            <span>UNGGAH FOTO & DIAGNOSA</span>
            <ArrowRight className="w-7 h-7" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("pest-catalog");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-8 py-6 bg-[#E7ECE2] text-[#14201A] font-bold text-lg md:text-xl uppercase tracking-tight border-2 border-[#3A4A3E] flex items-center justify-center gap-2 hover:bg-[#14201A] hover:text-[#F7F9F4] transition-all rounded-none cursor-pointer"
          >
            <span>LIHAT KATALOG HAMA</span>
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 pt-8 border-t-2 border-[#3A4A3E] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-base font-bold text-[#3F4C42] uppercase"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#15803D]" />
            <span>100% BEBAS BIAYA UNTUK PETANI</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#15803D]" />
            <span>DIAGNOSA AKURAT & CEPAT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span>RESEP OBAT ORGANIK & KIMIA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <span>HURUF BESAR & MUDAH DIBACA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
