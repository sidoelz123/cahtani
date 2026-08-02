import React, { useState } from "react";
import { X, LogIn, UserPlus, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowRight, HelpCircle, PhoneCall, Mail } from "lucide-react";
import { toast } from "sonner";
import { User, FarmerProfile } from "../types";
import { saveFarmerProfileSession } from "../lib/session";
import { apiClient } from "../lib/api";
import { WilayahLocationPicker } from "./WilayahLocationPicker";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "forgot_password";
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "signup" | "verify" | "forgot_password" | "reset_password">(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  // Signup extra states
  const [fullName, setFullName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [gender, setGender] = useState("Bapak (Pria)");
  const [location, setLocation] = useState("");
  const [crops, setCrops] = useState("");

  // Verification states
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyingUserIdentifier, setVerifyingUserIdentifier] = useState("");
  const [simulatedVerifCode, setSimulatedVerifCode] = useState("");

  // Forgot password & reset states
  const [forgotInput, setForgotInput] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  if (!isOpen) return null;

  // STEP 3: LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!emailOrPhone.trim() || !password.trim()) {
      const msg = "Mohon isi Email/No. WhatsApp dan Kata Sandi.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/login", {
        identifier: emailOrPhone.trim(),
        password,
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Gagal masuk. Periksa kembali kredensial Anda.";
        if (data.needsVerification) {
          setError(errMsg);
          setVerifyingUserIdentifier(emailOrPhone.trim());
          setMode("verify");
          setSuccessMsg("Masukkan kode verifikasi 6 digit yang dikirim ke Email/WhatsApp Anda.");
          toast.error("Akun belum terverifikasi. Masukkan kode verifikasi.");
          return;
        }
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      if (data.success && data.user) {
        const loggedUser: User = {
          ...data.user,
          emailOrPhone: data.user.phone || data.user.email,
          joinedDate: new Date().toLocaleDateString("id-ID"),
        };

        const farmerProf: FarmerProfile = {
          name: loggedUser.name,
          gender: loggedUser.gender,
          location: loggedUser.location,
          crops: loggedUser.crops,
        };
        saveFarmerProfileSession(farmerProf);
        localStorage.setItem("agribot_user", JSON.stringify(loggedUser));
        if (data.token) localStorage.setItem("agribot_session_token", data.token);

        toast.success(`Berhasil masuk! Selamat datang kembali, ${loggedUser.name}.`);
        onLoginSuccess(loggedUser);
        onClose();
      }
    } catch (err) {
      console.error(err);
      const connErr = "Terjadi masalah koneksi dengan server backend.";
      setError(connErr);
      toast.error(connErr);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: SIGNUP
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = emailInput.trim();
    const phone = phoneInput.trim();

    if (!fullName.trim() || !email || !phone || !location.trim() || !crops.trim() || !password.trim()) {
      const msg = "Mohon lengkapi seluruh kolom pendaftaran, termasuk Email dan No. WhatsApp.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 4) {
      const msg = "Kata sandi minimal 4 karakter.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/register", {
        name: fullName.trim(),
        email,
        phone,
        password,
        gender,
        location: location.trim(),
        crops: crops.trim(),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Pendaftaran gagal.";
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      if (data.success) {
        setVerifyingUserIdentifier(email);
        setSimulatedVerifCode(data.verificationToken || "123456");
        setVerifyCode(data.verificationToken || "");
        setMode("verify");
        const msg = `Pendaftaran berhasil! Kode verifikasi telah dikirim ke ${email} / ${phone}.`;
        setSuccessMsg(`${msg} (Kode Verifikasi Demo: ${data.verificationToken})`);
        toast.success(msg);
      }
    } catch (err) {
      console.error(err);
      const netErr = "Terjadi kesalahan jaringan saat mendaftar.";
      setError(netErr);
      toast.error(netErr);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFICATION SUBMIT
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!verifyCode.trim()) {
      const msg = "Mohon masukkan kode verifikasi 6 digit.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/verify", {
        identifier: verifyingUserIdentifier,
        token: verifyCode.trim(),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Kode verifikasi salah atau kedaluwarsa.";
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      if (data.success) {
        toast.success("Verifikasi akun berhasil! Silakan masuk.");
        setSuccessMsg("Verifikasi Berhasil! Akun Anda kini sudah aktif. Mengalihkan ke halaman masuk...");
        setEmailOrPhone(verifyingUserIdentifier);
        setTimeout(() => {
          setMode("login");
          setSuccessMsg("Silakan masuk menggunakan email / nomor WhatsApp dan kata sandi Anda.");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const errM = "Gagal memproses verifikasi kode.";
      setError(errM);
      toast.error(errM);
    } finally {
      setLoading(false);
    }
  };

  // STEP 5: FORGOT PASSWORD - CHECK ACCOUNT
  const handleCheckForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const query = forgotInput.trim().toLowerCase();
    if (!query) {
      setError("Mohon masukkan Alamat Email atau Nomor WhatsApp Anda.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/forgot-password", {
        identifier: query,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Alamat email atau nomor WhatsApp tersebut belum terdaftar dalam sistem CahTani AI.");
        return;
      }

      if (data.success) {
        setMatchedUser(data.user);
        setGeneratedCode(data.resetToken || "123456");
        setResetCode(data.resetToken || "");
        setMode("reset_password");
        setSuccessMsg(`Akun ditemukan! Kode reset verifikasi telah dikirim. (Kode Reset Demo: ${data.resetToken})`);
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi masalah saat memeriksa akun.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 5b: RESET PASSWORD SUBMIT
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetCode.trim()) {
      setError("Kode reset wajib diisi.");
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setError("Kata sandi baru minimal 4 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/reset-password", {
        identifier: forgotInput.trim(),
        resetToken: resetCode.trim(),
        newPassword,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal memperbarui kata sandi.");
        return;
      }

      if (data.success) {
        setSuccessMsg("Kata sandi Anda berhasil diperbarui! Mengalihkan ke halaman masuk...");
        setEmailOrPhone(forgotInput.trim());
        setTimeout(() => {
          setMode("login");
          setSuccessMsg("Silakan masuk dengan kata sandi baru Anda.");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#14201A]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#F7F9F4] border-4 border-[#3A4A3E] w-full max-w-xl my-8 relative shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#15803D] text-[#F7F9F4] p-6 border-b-4 border-[#3A4A3E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#14201A] text-[#F7F9F4] border-2 border-[#F7F9F4] flex items-center justify-center text-xl font-bold">
              🌱
            </div>
            <div>
              <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight">
                {mode === "login" && "MASUK AKUN PETANI"}
                {mode === "signup" && "DAFTAR AKUN PETANI BARU"}
                {mode === "forgot_password" && "LUPA KATA SANDI"}
                {mode === "reset_password" && "RESET KATA SANDI BARU"}
              </h3>
              <p className="text-xs text-[#E7ECE2] font-bold uppercase tracking-wider">
                AKSES LAYANAN LENGKAP CAHTANI AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#14201A] text-[#F7F9F4] hover:bg-[#F7F9F4] hover:text-[#14201A] border-2 border-[#3A4A3E] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 border-b-2 border-[#3A4A3E] bg-[#E7ECE2]">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-4 font-black text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2 border-r border-[#3A4A3E] cursor-pointer ${
              mode === "login" || mode === "forgot_password" || mode === "reset_password"
                ? "bg-[#F7F9F4] text-[#15803D] border-b-4 border-b-[#15803D]"
                : "text-[#3F4C42] hover:text-[#14201A]"
            }`}
          >
            <LogIn className="w-5 h-5" />
            MASUK (LOGIN)
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-4 font-black text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
              mode === "signup"
                ? "bg-[#F7F9F4] text-[#15803D] border-b-4 border-b-[#15803D]"
                : "text-[#3F4C42] hover:text-[#14201A]"
            }`}
          >
            <UserPlus className="w-5 h-5" />
            DAFTAR (SIGNUP)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-600 text-red-900 font-bold text-sm uppercase flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-100 border-2 border-[#15803D] text-[#15803D] font-bold text-sm uppercase flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#15803D]" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "verify" && (
            /* VERIFICATION FORM */
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="p-4 bg-emerald-50 border-2 border-[#15803D] text-[#14201A] font-bold text-xs uppercase space-y-1">
                <span className="font-black text-sm text-[#15803D] flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-[#15803D]" /> LANGKAH 2: VERIFIKASI KODE 6 DIGIT
                </span>
                <p className="text-[11px] text-gray-700 font-medium">
                  Kode verifikasi telah dikirimkan ke <strong>{verifyingUserIdentifier}</strong>. Silakan masukkan 6 digit kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  KODE VERIFIKASI (6 DIGIT):
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="MASUKKAN KODE 6 DIGIT..."
                  className="w-full h-14 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-mono font-black text-xl text-center tracking-[0.3em] text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#15803D] text-[#F7F9F4] font-black text-base md:text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? "MEMPROSES..." : "VERIFIKASI AKUN SEKARANG"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-2.5 bg-[#E7ECE2] text-[#14201A] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-gray-300 transition-colors cursor-pointer text-center"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}

          {mode === "login" && (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  EMAIL ATAU NO. WHATSAPP PETANI:
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="CONTOH: 081234567890 ATAU PETANI@GMAIL.COM"
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A]">
                    KATA SANDI (PASSWORD):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_password");
                      setError(null);
                      setSuccessMsg(null);
                      setForgotInput(emailOrPhone);
                    }}
                    className="text-xs font-extrabold text-[#15803D] underline uppercase hover:text-[#14201A] cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Lupa Kata Sandi?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="MASUKKAN KATA SANDI..."
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-14 bg-[#15803D] text-[#F7F9F4] font-black text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>MASUK AKUN SEKARANG</span>
                </button>
              </div>

              <p className="text-center text-xs font-bold text-[#3F4C42] uppercase pt-2">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#15803D] underline cursor-pointer"
                >
                  Daftar Pendaftaran Baru
                </button>
              </p>
            </form>
          )}

          {mode === "forgot_password" && (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleCheckForgotPassword} className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-amber-500 text-amber-900 font-bold text-xs uppercase space-y-1">
                <div className="flex items-center gap-1.5 font-black text-sm text-amber-800">
                  <HelpCircle className="w-4 h-4" /> CEK KETERDAFTARAN AKUN
                </div>
                <p className="text-[11px] leading-relaxed">
                  Masukkan Email atau No. WhatsApp Anda. Sistem akan memeriksa apakah akun Anda sudah terdaftar sebelum mengirimkan kode reset kata sandi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  EMAIL ATAU NO. WHATSAPP TERDAFTAR:
                </label>
                <input
                  type="text"
                  required
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="CONTOH: 081234567890 ATAU PETANI@GMAIL.COM"
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full h-14 bg-[#15803D] text-[#F7F9F4] font-black text-base md:text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-5 h-5" />
                  <span>CEK AKUN & KIRIM KODE RESET</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-3 bg-[#E7ECE2] text-[#14201A] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-gray-300 transition-colors cursor-pointer text-center"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}

          {mode === "reset_password" && (
            /* RESET PASSWORD FORM */
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-4 bg-emerald-50 border-2 border-[#15803D] text-[#14201A] font-bold text-xs uppercase space-y-1">
                <span className="font-black text-sm text-[#15803D]">AKUN DITEMUKAN: {matchedUser?.name}</span>
                <p className="text-[11px] text-gray-700">
                  Kode verifikasi reset telah dikirim ke ({matchedUser?.emailOrPhone}). Masukkan kode verifikasi 6 digit dan buat kata sandi baru Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  KODE VERIFIKASI RESET (6 DIGIT):
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="MASUKKAN KODE 6 DIGIT..."
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-mono font-black text-lg text-center tracking-widest text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  KATA SANDI BARU:
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="MINIMAL 4 KARAKTER..."
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  KONFIRMASI KATA SANDI BARU:
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="ULANGI KATA SANDI BARU..."
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-14 bg-[#15803D] text-[#F7F9F4] font-black text-base md:text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>SIMPAN KATA SANDI BARU</span>
                </button>
              </div>
            </form>
          )}

          {mode === "signup" && (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  1. NAMA LENGKAP PETANI:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="CONTOH: PAK SUWANDI / BU MARYATI"
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                    2. PANGGULAN / GENDER:
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-3 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="Bapak (Pria)">👴 BAPAK (PRIA)</option>
                    <option value="Ibu (Wanita)">👵 IBU (WANITA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#15803D]" /> 3. ALAMAT EMAIL:
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="PETANI@GMAIL.COM"
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-[#15803D]" /> 4. NO. WHATSAPP:
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="081234567890"
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                    5. JENIS TANAMAN UTAMA:
                  </label>
                  <input
                    type="text"
                    required
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    placeholder="CONTOH: PADI, CABAI, JAGUNG, BAWANG..."
                    className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                  />
                </div>
              </div>

              <WilayahLocationPicker
                value={location}
                onChange={(newLoc) => setLocation(newLoc)}
                required
                label="6. LOKASI SAWAH / LADANG (OPEN API WILAYAH.ID):"
                placeholder="DESA NGAWI, KEC. NGAWI, KAB. NGAWI, JAWA TIMUR"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                  7. BUAT KATA SANDI (PASSWORD):
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="MINIMAL 4 KARAKTER..."
                  className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-14 bg-[#15803D] text-[#F7F9F4] font-black text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>BUAT AKUN PETANI SEKARANG</span>
                </button>
              </div>

              <p className="text-center text-xs font-bold text-[#3F4C42] uppercase pt-2">
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#15803D] underline cursor-pointer"
                >
                  Masuk Halaman Login
                </button>
              </p>
            </form>
          )}

          <div className="border-t-2 border-[#3A4A3E] pt-4 text-center">
            <p className="text-xs font-bold text-[#3F4C42] uppercase flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#15803D]" /> Chatbot AI & Diagnosa Foto Tanaman tetap 100% bebas dipakai tanpa perlu login!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

