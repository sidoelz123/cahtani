import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Bot } from "lucide-react";

export interface FixedBottomNavProps {
  onOpenChat?: () => void;
  setIsChatOpen?: (open: boolean) => void;
}

export const FixedBottomNav: React.FC<FixedBottomNavProps> = ({
  onOpenChat,
  setIsChatOpen,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const footer = document.querySelector("footer");
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const defaultBottom = 24;
        if (footerRect.top < viewportHeight) {
          const overlap = viewportHeight - footerRect.top;
          setBottomOffset(defaultBottom + overlap);
        } else {
          setBottomOffset(defaultBottom);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChatClick = () => {
    if (onOpenChat) {
      onOpenChat();
    } else if (setIsChatOpen) {
      setIsChatOpen(true);
    }
  };

  return (
    <AnimatePresence>
      {showScrollTop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed right-4 md:right-8 z-40 flex items-center gap-2.5"
          style={{ bottom: `${bottomOffset}px` }}
        >
          <button
            onClick={handleChatClick}
            className="px-4 py-3 bg-[#15803D] text-[#F7F9F4] font-black text-xs md:text-sm uppercase tracking-wider border-2 border-[#3A4A3E] shadow-[3px_3px_0px_0px_#3A4A3E] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#3A4A3E] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_#3A4A3E] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
            <span>Chat AI</span>
          </button>

          <button
            onClick={scrollToTop}
            title="Kembali ke atas"
            aria-label="Kembali ke atas"
            className="p-3 bg-[#F7F9F4] text-[#14201A] font-black text-xs md:text-sm border-2 border-[#3A4A3E] shadow-[3px_3px_0px_0px_#3A4A3E] hover:bg-[#E7ECE2] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#3A4A3E] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_#3A4A3E] transition-all flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-5 h-5 text-[#15803D]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
