import React, { useEffect } from "react";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { FixedBottomNav } from "../components/FixedBottomNav";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const context = useRouteContext({ from: "__root__" });

  useEffect(() => {
    document.title = "404 Halaman Tidak Ditemukan — CahTani AI";
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9F4] text-[#14201A] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#14201A] text-[#F7F9F4] border-4 border-[#3A4A3E] p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#3A4A3E]">
        <h1 className="font-display font-black text-6xl text-[#15803D] mb-2">404</h1>
        <h2 className="font-display font-black text-2xl uppercase mb-4 text-[#F7F9F4]">
          HALAMAN TIDAK DITEMUKAN
        </h2>
        <p className="text-sm font-medium text-[#E7ECE2] mb-6">
          Mohon maaf, halaman yang Anda tuju tidak ditemukan atau memerlukan akses khusus member.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full py-3 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-all cursor-pointer"
        >
          KEMBALI KE BERANDA
        </button>
      </div>

      <FixedBottomNav setIsChatOpen={context?.setIsChatOpen} />
    </div>
  );
};
