import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { StatsMarquee } from "../components/StatsMarquee";
import { DiagnosisTool } from "../components/DiagnosisTool";
import { FeaturesSticky } from "../components/FeaturesSticky";
import { PestGallery } from "../components/PestGallery";
import { TestimonialsMarquee } from "../components/TestimonialsMarquee";
import { FaqSection } from "../components/FaqSection";
import { FooterSection } from "../components/FooterSection";
import { FixedBottomNav } from "../components/FixedBottomNav";
import { User } from "../types";
import { normalizeCropId } from "../data/mockData";

export interface LandingProps {
  currentUser: User | null;
  selectedCrop: string | null;
  setSelectedCrop: (crop: string) => void;
  setIsChatOpen: (open: boolean) => void;
  handleOpenAuthModal: (mode?: "login" | "signup") => void;
  handleLogout: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  currentUser,
  selectedCrop,
  setSelectedCrop,
  setIsChatOpen,
  handleOpenAuthModal,
  handleLogout,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const cropName = selectedCrop
      ? selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)
      : "Padi";
    document.title = `CAHTANI AI — Asisten AI Petani Indonesia (Diagnosa Hama & Penyakit ${cropName})`;
  }, [selectedCrop]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

  const scrollToDiagnosis = () => {
    const el = document.getElementById("diagnosis-workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectPestFromCatalog = (pestName: string, crop: string, symptoms: string) => {
    if (crop) {
      setSelectedCrop(normalizeCropId(crop));
    }
    scrollToDiagnosis();
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(
            textarea,
            `MINTA ANALISA PENYAKIT/HAMA: ${pestName} (${crop}). Gejala: ${symptoms}`
          );
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }, 300);
  };

  return (
    <>
      <Header
        onOpenDiagnosis={scrollToDiagnosis}
        onOpenChat={() => setIsChatOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onNavigateDashboard={() => navigate({ to: "/dashboard" })}
        onNavigateHome={() => navigate({ to: "/" })}
        onNavigateShop={() => navigate({ to: "/shop" })}
      />

      <FixedBottomNav setIsChatOpen={setIsChatOpen} />

      <HeroSection
        selectedCrop={selectedCrop}
        onSelectCrop={setSelectedCrop}
        onStartDiagnosis={scrollToDiagnosis}
      />

      <StatsMarquee />

      <DiagnosisTool
        selectedCrop={selectedCrop}
        onSelectCrop={setSelectedCrop}
      />

      <FeaturesSticky />

      <PestGallery onSelectPest={handleSelectPestFromCatalog} />

      <TestimonialsMarquee />

      <FaqSection />

      <FooterSection />
    </>
  );
};
