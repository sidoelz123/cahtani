import React, { useState } from "react";
import { UserCheck, LogIn, LogOut, ChevronDown, ShoppingBag } from "lucide-react";
import { User } from "../types";
import { TaskNotificationWidget } from "./TaskNotificationWidget";

interface HeaderProps {
  onOpenDiagnosis?: () => void;
  onOpenChat?: () => void;
  currentUser: User | null;
  onOpenAuthModal: (mode?: "login" | "signup") => void;
  onLogout?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateHome?: () => void;
  onNavigateShop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuthModal,
  onLogout,
  onNavigateDashboard,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F7F9F4] border-b-2 border-[#3A4A3E]">
      {/* Main Header Bar */}
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <button
          onClick={() => {
            if (onNavigateHome) onNavigateHome();
            else window.location.pathname = "/";
          }}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div className="w-12 h-12 bg-[#15803D] text-[#F7F9F4] border-2 border-[#3A4A3E] flex items-center justify-center font-black text-2xl group-hover:bg-[#14201A] transition-colors">
            🌾
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tighter leading-none text-[#14201A]">
              CAHTANI<span className="text-[#15803D]">.AI</span>
            </span>
            <span className="text-xs md:text-sm font-bold tracking-wider text-[#3F4C42] uppercase">
              ASISTEN DOKTER TANAMAN PETANI
            </span>
          </div>
        </button>

        {/* Quick Actions & Auth Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* 1. Notification Bell Icon (Logged-in only) */}
          {currentUser && (
            <TaskNotificationWidget onNavigateDashboard={onNavigateDashboard} />
          )}

          {/* 2. Toko Tani / Store Icon Button */}
          <button
            onClick={() => {
              if (onNavigateShop) onNavigateShop();
              else window.location.pathname = "/shop";
            }}
            className="flex items-center justify-center gap-2 h-11 px-3 md:px-4 bg-[#14201A] text-[#F7F9F4] font-bold text-xs md:text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#15803D] transition-all cursor-pointer whitespace-nowrap"
            title="Katalog Rekomendasi Pupuk & Alat Tani"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">TOKO TANI</span>
            <span className="sm:hidden">TOKO</span>
          </button>

          {/* 3. Auth Controls: Profile Button (Logged-in) or Login & Register Buttons (Logged-out) */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center justify-center gap-2 h-11 px-3 md:px-4 bg-[#14201A] text-[#F7F9F4] font-bold text-xs md:text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#15803D] transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="max-w-[90px] md:max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#F7F9F4] border-4 border-[#3A4A3E] shadow-xl z-50 p-4 space-y-3">
                  <div className="border-b-2 border-[#3A4A3E] pb-2">
                    <span className="block text-xs font-bold uppercase text-[#15803D]">
                      AKUN PETANI TERKONEKSI
                    </span>
                    <h5 className="font-bold text-sm uppercase text-[#14201A] truncate">
                      {currentUser.name}
                    </h5>
                    <p className="text-xs text-[#3F4C42] font-semibold truncate">
                      📍 {currentUser.location}
                    </p>
                    <p className="text-xs text-[#3F4C42] font-semibold truncate">
                      🌱 {currentUser.crops}
                    </p>
                  </div>

                  {onNavigateDashboard && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateDashboard();
                      }}
                      className="w-full py-2 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider border border-[#3A4A3E] hover:bg-[#14201A] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      📊 BUKA DASHBOARD MEMBER
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full py-2 bg-red-600 text-[#F7F9F4] font-bold text-xs uppercase tracking-wider border border-[#3A4A3E] hover:bg-red-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> KELUAR AKUN
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onOpenAuthModal("login")}
                className="flex items-center justify-center gap-2 h-11 px-3 md:px-4 bg-[#E7ECE2] text-[#14201A] font-bold text-xs md:text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>MASUK</span>
              </button>
              <button
                onClick={() => onOpenAuthModal("signup")}
                className="flex items-center justify-center gap-2 h-11 px-3 md:px-4 bg-[#14201A] text-[#F7F9F4] font-bold text-xs md:text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#15803D] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>DAFTAR</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

