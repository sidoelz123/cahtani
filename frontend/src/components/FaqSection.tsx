import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FaqItem } from "../types";
import { apiClient } from "../lib/api";

export const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    apiClient.get("/api/faqs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setFaqs(data.data);
        }
      })
      .catch((err) => console.error("Error fetching FAQs:", err));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-[#E7ECE2] border-b-2 border-[#3A4A3E]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 border-b-2 border-[#3A4A3E] pb-6"
        >
          <span className="inline-block px-4 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-wider mb-4">
            TANYA JAWAB PETANI
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter text-[#14201A]">
            PERTANYAAN UMUM (FAQ)
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="border-2 border-[#3A4A3E] bg-[#F7F9F4] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 md:p-8 text-left font-display font-black text-xl md:text-2xl uppercase tracking-tight text-[#14201A] flex items-center justify-between gap-4 hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <HelpCircle className="w-6 h-6 text-[#15803D] shrink-0" />
                    <span>{item.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-7 h-7 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="p-6 md:p-8 bg-[#E7ECE2] border-t-2 border-[#3A4A3E] font-body text-lg md:text-xl text-[#14201A] font-medium leading-relaxed"
                    >
                      {item.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
