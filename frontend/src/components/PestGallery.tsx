import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bug, ArrowRight, ShieldAlert } from "lucide-react";
import { PestDiseaseItem } from "../types";

interface PestGalleryProps {
  onSelectPest: (pestName: string, crop: string, symptoms: string) => void;
}

export const PestGallery: React.FC<PestGalleryProps> = ({ onSelectPest }) => {
  const [pests, setPests] = useState<PestDiseaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pests")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPests(data.data);
        }
      })
      .catch((err) => console.error("Error loading pests from backend:", err))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section id="pest-catalog" className="py-24 bg-[#E7ECE2] border-b-2 border-[#3A4A3E]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b-2 border-[#3A4A3E] gap-6"
        >
          <div>
            <span className="inline-block px-4 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-wider mb-4">
              KATALOG DIAGNOSA LAPANGAN
            </span>
            <h2 className="font-display font-black text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter text-[#14201A]">
              KATALOG HAMA & PENYAKIT UTAMA
            </h2>
          </div>
          <p className="font-body text-lg md:text-xl text-[#3F4C42] max-w-md font-medium">
            Kenali tanda-tanda kerusakan pada tanaman sebelum meluas. Klik diagnosa untuk saran penanganan cepat dari CahTani AI.
          </p>
        </motion.div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pests.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
              className="bg-[#F7F9F4] border-2 border-[#3A4A3E] p-8 flex flex-col justify-between hover:bg-[#15803D] hover:border-[#15803D] hover:text-[#F7F9F4] transition-all duration-300 group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-[#E7ECE2] text-[#14201A] font-extrabold text-xs uppercase tracking-wider group-hover:bg-[#14201A] group-hover:text-[#F7F9F4] transition-colors">
                    {item.tag}
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wider text-[#3F4C42] group-hover:text-emerald-100">
                    {item.category} • {item.crop}
                  </span>
                </div>

                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#14201A] group-hover:text-[#F7F9F4] mb-3 transition-colors">
                  {item.name}
                </h3>

                <p className="font-body text-base md:text-lg text-[#3F4C42] group-hover:text-emerald-100 font-medium mb-6 leading-relaxed transition-colors">
                  {item.symptoms}
                </p>
              </div>

              <div className="pt-6 border-t border-[#3A4A3E]/30 group-hover:border-emerald-300/40 transition-colors">
                <div className="mb-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#15803D] group-hover:text-emerald-200 mb-1">
                    SOLUSI CEPAT:
                  </span>
                  <p className="font-bold text-sm text-[#14201A] group-hover:text-[#F7F9F4]">
                    {item.solutionQuick}
                  </p>
                </div>

                <button
                  onClick={() => onSelectPest(item.name, item.crop, item.symptoms)}
                  className="w-full py-3 bg-[#15803D] text-[#F7F9F4] group-hover:bg-[#14201A] font-bold text-sm uppercase tracking-wider border border-[#3A4A3E] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>MINTA ANALISA LENGKAP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
