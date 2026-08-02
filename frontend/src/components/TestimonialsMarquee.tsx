import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { Quote } from "lucide-react";
import { TestimonialItem } from "../types";
import { apiClient } from "../lib/api";

export const TestimonialsMarquee: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    apiClient.get("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTestimonials(data.data);
        }
      })
      .catch((err) => console.error("Error fetching testimonials:", err));
  }, []);
  return (
    <section className="py-24 bg-[#F7F9F4] border-b-2 border-[#3A4A3E] overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 mb-12 border-b-2 border-[#3A4A3E] pb-6">
        <span className="inline-block px-4 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-wider mb-4">
          KISAH NYATA DARI SAWAH
        </span>
        <h2 className="font-display font-black text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter text-[#14201A]">
          TESTIMONI PETANI INDONESIA
        </h2>
      </div>

      <Marquee speed={35} gradient={false} autoFill={true}>
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="w-[380px] md:w-[480px] bg-[#E7ECE2] border-2 border-[#3A4A3E] p-8 mx-4 flex flex-col justify-between shrink-0"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-extrabold text-xs uppercase tracking-wider">
                  {t.impact}
                </span>
                <Quote className="w-8 h-8 text-[#15803D]" />
              </div>

              <p className="font-body text-lg md:text-xl text-[#14201A] font-medium leading-relaxed italic mb-6">
                "{t.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-[#3A4A3E]/30 flex items-center justify-between">
              <div>
                <h4 className="font-display font-black text-lg md:text-xl uppercase tracking-tight text-[#14201A]">
                  {t.name}
                </h4>
                <p className="font-bold text-xs uppercase text-[#3F4C42]">
                  {t.role} • {t.location}
                </p>
              </div>
              <span className="text-2xl">👨‍🌾</span>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
};
