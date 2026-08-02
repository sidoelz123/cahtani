import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Send, Bot, User, Sparkles, RefreshCw, UserCheck, Edit3, Clock } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, FarmerProfile, User as UserType } from "../types";
import { WilayahLocationPicker } from "./WilayahLocationPicker";
import {
  checkAndCleanChatSession,
  getFarmerProfile,
  saveFarmerProfileSession,
  getChatHistory,
  saveChatHistorySession,
} from "../lib/session";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCrop: string;
  currentUser?: UserType | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, selectedCrop, currentUser }) => {
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(() => {
    if (currentUser) {
      return {
        name: currentUser.name,
        gender: currentUser.gender || "Bapak (Pria)",
        location: currentUser.location || "",
        crops: currentUser.crops || selectedCrop || "Padi",
      };
    }
    return getFarmerProfile();
  });

  const isProfileComplete = Boolean(
    currentUser ||
      (farmerProfile &&
        farmerProfile.name?.trim() &&
        farmerProfile.gender?.trim() &&
        farmerProfile.location?.trim() &&
        farmerProfile.crops?.trim())
  );

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(!isProfileComplete);

  const [profName, setProfName] = useState(farmerProfile?.name || currentUser?.name || "");
  const [profGender, setProfGender] = useState(farmerProfile?.gender || currentUser?.gender || "Bapak (Pria)");
  const [profLocation, setProfLocation] = useState(farmerProfile?.location || currentUser?.location || "");
  const [profCrops, setProfCrops] = useState(farmerProfile?.crops || currentUser?.crops || "");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or restore session on open / mount
  useEffect(() => {
    if (!isOpen) return;

    // Check if session has expired (>24 hours inactive)
    const wasExpired = checkAndCleanChatSession();
    
    let activeProfile: FarmerProfile | null = null;

    if (currentUser) {
      activeProfile = {
        name: currentUser.name,
        gender: currentUser.gender || "Bapak (Pria)",
        location: currentUser.location || "Lokasi Belum Diatur",
        crops: currentUser.crops || selectedCrop || "Padi",
      };
      setFarmerProfile(activeProfile);
      saveFarmerProfileSession(activeProfile);
      setIsEditingProfile(false);
      setProfName(activeProfile.name);
      setProfGender(activeProfile.gender);
      setProfLocation(activeProfile.location);
      setProfCrops(activeProfile.crops);
    } else {
      activeProfile = getFarmerProfile();
      setFarmerProfile(activeProfile);
      const isComp = Boolean(
        activeProfile &&
          activeProfile.name?.trim() &&
          activeProfile.gender?.trim() &&
          activeProfile.location?.trim() &&
          activeProfile.crops?.trim()
      );

      if (wasExpired || !isComp) {
        setIsEditingProfile(true);
      }
    }

    const history = getChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      // Create initial greeting
      const currentProf = activeProfile || farmerProfile;
      const isComp = Boolean(currentProf && currentProf.name?.trim());
      const welcomeMsg: ChatMessage = currentProf && isComp
        ? {
            id: "m-welcome",
            sender: "bot",
            text: `Halo ${currentProf.gender === "Ibu (Wanita)" ? "Ibu" : "Bapak"} ${currentProf.name}! ${currentUser ? "Data akun Anda otomatis terhubung" : "Data profil Anda terhubung"} (Lokasi: ${currentProf.location}, Tanaman: ${currentProf.crops}). Ada kendala hama, penyakit, atau kebutuhan pupuk apa hari ini?`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }
        : {
            id: "m-welcome",
            sender: "bot",
            text: "Halo Bapak/Ibu Petani! Mohon isi data profil singkat Anda terlebih dahulu agar CahTani AI dapat memberikan jawaban presisi sesuai wilayah & tanaman Anda.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

      setMessages([welcomeMsg]);
      saveChatHistorySession([welcomeMsg]);
    }
  }, [isOpen, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isEditingProfile) scrollToBottom();
  }, [messages, isOpen, isEditingProfile]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profName.trim() || !profLocation.trim() || !profCrops.trim()) {
      const msg = "Mohon isi semua data profil (Nama, Gender, Lokasi Lengkap, & Tanaman).";
      toast.error(msg);
      return;
    }

    const toastId = toast.loading("Menyimpan profil petani & menginisialisasi sesi chat...");

    try {
      const newProf: FarmerProfile = {
        name: profName.trim(),
        gender: profGender,
        location: profLocation.trim(),
        crops: profCrops.trim(),
      };

      setFarmerProfile(newProf);
      saveFarmerProfileSession(newProf);
      setIsEditingProfile(false);

      const initMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "bot",
        text: `Salam hangat ${newProf.gender === "Ibu (Wanita)" ? "Ibu" : "Bapak"} ${newProf.name}! Profil Anda telah disimpan (Lokasi: ${newProf.location}, Tanaman: ${newProf.crops}). Ada masalah hama atau keluhan tanaman apa yang ingin dikonsultasikan?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages([initMsg]);
      saveChatHistorySession([initMsg]);

      toast.success("Profil petani berhasil disimpan & sesi chat diaktifkan!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan profil atau memulai sesi chat.", { id: toastId });
    }
  };

  const quickQuestions = [
    "Bagaimana racikan pestisida nabati dari serai & kunyit?",
    "Berapa takaran pupuk Urea & NPK untuk tanaman saya?",
    "Bagaimana cara membasmi hama ulat tanah secara alami?",
    "Apa obat paling ampuh untuk busuk buah cabai?",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    if (!isProfileComplete) {
      setIsEditingProfile(true);
      alert("Mohon simpan data profil petani Anda terlebih dahulu sebelum memulai percakapan.");
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveChatHistorySession(newMessages);

    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType: selectedCrop,
          farmerProfile,
          messages: newMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mendapatkan balasan.");

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      saveChatHistorySession(finalMessages);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Mohon maaf, koneksi ke CahTani AI terganggu. Pastikan internet aktif dan coba lagi.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      saveChatHistorySession(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chat-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed inset-0 z-50 bg-[#14201A]/80 backdrop-blur-sm flex justify-end cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            key="chat-drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-2xl bg-[#F7F9F4] h-full border-l-2 border-[#3A4A3E] flex flex-col justify-between shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="p-6 bg-[#15803D] text-[#F7F9F4] border-b-2 border-[#3A4A3E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#14201A] border border-[#3A4A3E] flex items-center justify-center font-bold text-xl">
              🌾
            </div>
            <div>
              <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight">
                CAHTANI AI CHAT ASSISTANT
              </h3>
              <p className="text-xs font-bold text-emerald-100 uppercase flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                SESI BERLAKU 1 HARI (24 JAM AKTIFA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#14201A] text-[#F7F9F4] border border-[#3A4A3E] hover:bg-red-700 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Session Expiry Info Banner */}
        <div className="bg-[#14201A] text-[#F7F9F4] px-6 py-2 border-b-2 border-[#3A4A3E] flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>SESI 24 JAM: RIWAYAT CHAT & PROFIL DIHAPUS OTOMATIS JIKA TIDAK DIGUNAKAN DALAM 1 HARI.</span>
        </div>

        {/* Profile Status Badge */}
        {isProfileComplete && !isEditingProfile && (
          <div className="bg-[#E7ECE2] px-6 py-3 border-b-2 border-[#3A4A3E] flex items-center justify-between text-xs md:text-sm font-bold uppercase text-[#14201A]">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <UserCheck className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>
                PROFIL: {farmerProfile?.gender === "Ibu (Wanita)" ? "BU" : "PAK"} {farmerProfile?.name} • {farmerProfile?.location} ({farmerProfile?.crops})
              </span>
            </div>
            <button
              onClick={() => {
                setProfName(farmerProfile?.name || "");
                setProfGender(farmerProfile?.gender || "Bapak (Pria)");
                setProfLocation(farmerProfile?.location || "");
                setProfCrops(farmerProfile?.crops || "");
                setIsEditingProfile(true);
              }}
              className="ml-2 px-3 py-1 bg-[#15803D] text-[#F7F9F4] hover:bg-[#14201A] text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer border border-[#3A4A3E]"
            >
              <Edit3 className="w-3 h-3 inline mr-1" /> UBAH
            </button>
          </div>
        )}

        {/* Profile Onboarding Form Modal / Card (For New Sessions or Editing) */}
        {isEditingProfile ? (
          <div className="flex-1 p-6 overflow-y-auto bg-[#E7ECE2]">
            <div className="bg-[#F7F9F4] border-2 border-[#3A4A3E] p-6 md:p-8 space-y-6">
              <div className="border-b-2 border-[#3A4A3E] pb-4">
                <span className="inline-block px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider mb-2">
                  PROFIL PETANI (SESI BARU)
                </span>
                <h4 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#14201A]">
                  LENGKAPI DATA PETANI ANDA
                </h4>
                <p className="font-body text-sm md:text-base text-[#3F4C42] mt-1 font-medium">
                  CahTani AI membutuhkan data diri & lokasi Anda agar saran pengobatan, dosis pupuk, dan analisa penyakit tepat sasaran.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide text-[#14201A] mb-2">
                    1. NAMA LENGKAP / PANGGULAN PETANI:
                  </label>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    placeholder="CONTOH: PAK SUWANDI / BU MARYATI"
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide text-[#14201A] mb-2">
                    2. PANGGULAN / JENIS KELAMIN:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProfGender("Bapak (Pria)")}
                      className={`py-3 border-2 font-black text-sm uppercase tracking-tight cursor-pointer ${
                        profGender === "Bapak (Pria)"
                          ? "bg-[#15803D] text-[#F7F9F4] border-[#3A4A3E]"
                          : "bg-[#E7ECE2] text-[#14201A] border-[#3A4A3E]"
                      }`}
                    >
                      👴 BAPAK (PRIA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfGender("Ibu (Wanita)")}
                      className={`py-3 border-2 font-black text-sm uppercase tracking-tight cursor-pointer ${
                        profGender === "Ibu (Wanita)"
                          ? "bg-[#15803D] text-[#F7F9F4] border-[#3A4A3E]"
                          : "bg-[#E7ECE2] text-[#14201A] border-[#3A4A3E]"
                      }`}
                    >
                      👵 IBU (WANITA)
                    </button>
                  </div>
                </div>

                <WilayahLocationPicker
                  value={profLocation}
                  onChange={(newLoc) => setProfLocation(newLoc)}
                  required
                  label="3. LOKASI LENGKAP SAWAH / LADANG (OPEN API WILAYAH.ID):"
                  placeholder="DESA / KECAMATAN / KABUPATEN / PROVINSI"
                />

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide text-[#14201A] mb-2">
                    4. JENIS TANAMAN UTAMA YANG DITANAM:
                  </label>
                  <input
                    type="text"
                    required
                    value={profCrops}
                    onChange={(e) => setProfCrops(e.target.value)}
                    placeholder="CONTOH: PADI, CABAI, JAGUNG, BAWANG..."
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  {isProfileComplete && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-4 bg-[#E7ECE2] text-[#14201A] font-bold text-base uppercase border-2 border-[#3A4A3E]"
                    >
                      BATAL
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#15803D] text-[#F7F9F4] font-black text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    SIMPAN PROFIL & MULAI CHAT
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Messages Body */
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F7F9F4]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-5 border-2 border-[#3A4A3E] ${
                    m.sender === "user"
                      ? "bg-[#15803D] text-[#F7F9F4]"
                      : "bg-[#E7ECE2] text-[#14201A]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-wider opacity-80">
                    {m.sender === "user" ? (
                      <>
                        <User className="w-3.5 h-3.5" /> PETANI ({farmerProfile?.name})
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-[#15803D]" /> CAHTANI AI
                      </>
                    )}
                    <span>• {m.timestamp}</span>
                  </div>
                  <p className="font-body text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-4 bg-[#E7ECE2] border-2 border-[#3A4A3E] max-w-fit text-[#14201A] font-bold text-sm uppercase">
                <RefreshCw className="w-5 h-5 animate-spin text-[#15803D]" />
                <span>CAHTANI SEDANG MENGETIK JAWABAN...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Question Chips (Only if profile is completed and not editing) */}
        {!isEditingProfile && (
          <div className="p-4 bg-[#E7ECE2] border-t-2 border-[#3A4A3E]">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#3F4C42] mb-2">
              CONTOH PERTANYAAN CEPAT:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1 bg-[#F7F9F4] border border-[#3A4A3E] text-xs font-bold text-[#14201A] hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors cursor-pointer text-left"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        {!isEditingProfile && (
          <div className="p-4 bg-[#F7F9F4] border-t-2 border-[#3A4A3E]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="KETIK PERTANYAAN TENTANG TANAMAN, HAMA, ATAU PUPUK..."
                className="flex-1 h-14 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base md:text-lg text-[#14201A] focus:outline-none focus:border-[#15803D] uppercase placeholder:text-[#8B9A8E]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 h-14 bg-[#15803D] text-[#F7F9F4] font-black text-lg uppercase tracking-tight border-2 border-[#3A4A3E] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">KIRIM</span>
              </button>
            </form>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
