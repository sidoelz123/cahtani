import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Upload, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, X, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CROP_OPTIONS, normalizeCropId } from "../data/mockData";
import { getFarmerProfile } from "../lib/session";
import { apiClient } from "../lib/api";
import { WilayahLocationPicker } from "./WilayahLocationPicker";

interface DiagnosisToolProps {
  selectedCrop: string;
  onSelectCrop: (cropId: string) => void;
}

export const DiagnosisTool: React.FC<DiagnosisToolProps> = ({ selectedCrop, onSelectCrop }) => {
  const activeCropId = normalizeCropId(selectedCrop);
  const [symptoms, setSymptoms] = useState("");
  const [cropType, setCropType] = useState(selectedCrop || "");
  const [customCropName, setCustomCropName] = useState("");
  const [region, setRegion] = useState("Jawa Tengah");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get("/api/presets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPresets(data.data);
        }
      })
      .catch((err) => console.error("Error fetching presets:", err));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagnosisToastIdRef = useRef<string | number | null>(null);

  const diagnoseMutation = useMutation({
    mutationFn: async (payload: {
      prompt: string;
      cropType: string;
      region: string;
      imageBase64: string | null;
      mimeType: string;
      farmerProfile: any;
    }) => {
      diagnosisToastIdRef.current = toast.loading("Sedang menganalisis penyakit tanaman dengan AI...");
      const response = await apiClient.post("/api/diagnose", payload);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan diagnosa.");
      }
      return data.result as string;
    },
    onSuccess: (result) => {
      setDiagnosisResult(result);
      if (diagnosisToastIdRef.current) {
        toast.success("Diagnosa penyakit dengan AI berhasil diselesaikan!", {
          id: diagnosisToastIdRef.current,
        });
      } else {
        toast.success("Diagnosa penyakit dengan AI berhasil diselesaikan!");
      }
    },
    onError: (err: any) => {
      const msg = err.message || "Terjadi kendala saat menghubungi AI CahTani. Coba lagi.";
      setErrorMessage(msg);
      if (diagnosisToastIdRef.current) {
        toast.error(msg, { id: diagnosisToastIdRef.current });
      } else {
        toast.error(msg);
      }
    },
  });

  const isLoading = diagnoseMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        const msg = "Ukuran foto terlalu besar. Maksimal 10MB.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      const uploadToastId = toast.loading("Mengunggah dan memproses foto dari galeri...");
      setMimeType(file.type || "image/jpeg");
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        // Base64 without data prefix
        const base64Data = result.split(",")[1];
        setImageBase64(base64Data);
        toast.success("Foto berhasil diunggah dari galeri!", { id: uploadToastId });
      };
      reader.onerror = () => {
        const errMsg = "Gagal mengunggah foto. Silakan coba lagi.";
        setErrorMessage(errMsg);
        toast.error(errMsg, { id: uploadToastId });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (selectedCrop && !cropType) {
      setCropType(selectedCrop);
    }
  }, [selectedCrop]);

  const handlePresetSelect = (preset: { crop: string; symptoms: string }) => {
    setSymptoms(preset.symptoms);
    setCropType(preset.crop);
    const crop = CROP_OPTIONS.find((c) => c.label.includes(preset.crop));
    if (crop) onSelectCrop(crop.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() && !imageBase64) {
      setErrorMessage("Mohon ketik gejala penyakit atau unggah foto daun/tanaman terlebih dahulu.");
      return;
    }

    setErrorMessage(null);
    setDiagnosisResult(null);

    const farmerProfile = getFarmerProfile();

    const selectedCropLabel = cropType.trim() ? cropType.trim().toUpperCase() : "TANAMAN UMUM";

    diagnoseMutation.mutate({
      prompt: symptoms,
      cropType: selectedCropLabel,
      region,
      imageBase64,
      mimeType,
      farmerProfile,
    });
  };

  return (
    <section id="diagnosis-workspace" className="py-20 md:py-32 bg-[#F7F9F4] border-b-2 border-[#3A4A3E]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-12 border-b-2 border-[#3A4A3E] pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-wider mb-4">
            <span>LAYANAN DIAGNOSA UTAMA</span>
          </div>
          <h2 className="font-display font-black text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter text-[#14201A]">
            DIAGNOSA PENYAKIT & HAMA TANAMAN
          </h2>
          <p className="font-body text-xl md:text-2xl text-[#3F4C42] mt-3 font-medium max-w-3xl">
            Unggah foto daun atau ketik tanda-tanda kerusakan pada tanaman Anda. CahTani AI memberikan hasil diagnosa presisi dalam waktu singkat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 bg-[#E7ECE2] border-2 border-[#3A4A3E] p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Crop Selection */}
              <div>
                <label className="block text-base md:text-lg font-bold uppercase tracking-wide text-[#14201A] mb-3">
                  1. PILIH JENIS TANAMAN:
                </label>
                <input
                  type="text"
                  required
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  placeholder="KETIK JENIS TANAMAN (CONTOH: PADI, CABAI, JAGUNG, BAWANG MERAH...)"
                  className="w-full h-12 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                />
              </div>

              {/* Region Selection */}
              <WilayahLocationPicker
                value={region}
                onChange={(newLoc) => setRegion(newLoc)}
                label="2. LOKASI PERTANIAN / WILAYAH (OPEN API WILAYAH.ID):"
                placeholder="CONTOH: DESA NGAWI, KEC. NGAWI, KAB. NGAWI, JAWA TIMUR"
              />

              {/* Image Upload Area */}
              <div>
                <label className="block text-base md:text-lg font-bold uppercase tracking-wide text-[#14201A] mb-2">
                  3. FOTO DAUN / TANAMAN (SANGAT DIREKOMENDASIKAN):
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#3A4A3E] bg-[#F7F9F4] p-8 text-center cursor-pointer hover:bg-[#15803D]/10 transition-all"
                  >
                    <div className="w-16 h-16 bg-[#15803D] text-[#F7F9F4] mx-auto mb-3 flex items-center justify-center font-bold text-2xl border-2 border-[#3A4A3E]">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="block font-black text-lg md:text-xl uppercase tracking-tight text-[#14201A]">
                      AMBIL FOTO / PILIH DARI GALERI HP
                    </span>
                    <span className="block text-sm font-medium text-[#3F4C42] mt-1">
                      (Format JPG, PNG — Ambil bagian daun atau buah yang terserang)
                    </span>
                  </div>
                ) : (
                  <div className="relative border-2 border-[#3A4A3E] bg-[#F7F9F4] p-3 flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Preview tanaman"
                      className="w-24 h-24 object-cover border border-[#3A4A3E]"
                    />
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase mb-1">
                        FOTO TERUAPLOAD
                      </span>
                      <p className="font-bold text-sm text-[#14201A]">Siap dianalisis oleh CahTani AI</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-2 bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer border border-[#3A4A3E]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input for Symptoms */}
              <div>
                <label className="block text-base md:text-lg font-bold uppercase tracking-wide text-[#14201A] mb-2">
                  4. KETIK GEJALA / KERUSAKAN TANAMAN:
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="CONTOH: DAUN PADI MENGUNING DARI PINGGIR, ADA BERCAK COKELAT, ATAU BANYAK ULAT DI PUCUK JAGUNG..."
                  rows={4}
                  className="w-full bg-[#F7F9F4] border-2 border-[#3A4A3E] p-4 font-medium text-lg text-[#14201A] focus:outline-none focus:border-[#15803D] uppercase placeholder:text-[#8B9A8E]"
                />
              </div>

              {/* 1-Click Preset Suggestions */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#3F4C42] mb-2">
                  ATAU PILIH CONTOH GEJALA POPULER (1-KLIK TES):
                </span>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="px-3 py-1.5 bg-[#F7F9F4] border border-[#3A4A3E] text-xs font-bold text-[#14201A] uppercase hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors cursor-pointer"
                    >
                      ⚡ {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-100 border-2 border-red-700 text-red-900 font-bold text-sm flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-red-700" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-6 bg-[#15803D] text-[#F7F9F4] font-black text-xl md:text-2xl uppercase tracking-tighter border-2 border-[#3A4A3E] flex items-center justify-center gap-3 transition-all cursor-pointer rounded-none ${
                  isLoading
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-95"
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span>SEDANG MENDIAGNOSA PENYAKIT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-8 h-8" />
                    <span>MULAI DIAGNOSA AI SEKARANG</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Results Box */}
          <div className="lg:col-span-5 bg-[#F7F9F4] border-2 border-[#3A4A3E] p-6 md:p-8 min-h-[500px] flex flex-col justify-between">
            {diagnosisResult ? (
              <div className="space-y-6">
                <div className="bg-[#15803D] text-[#F7F9F4] p-4 border-2 border-[#3A4A3E] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                    <span className="font-black text-lg uppercase tracking-tight">
                      HASIL DIAGNOSA CAHTANI AI
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-[#14201A] px-2 py-1">
                    AKURAT & PRESISI
                  </span>
                </div>

                <div className="bg-[#E7ECE2] border-2 border-[#3A4A3E] p-6 font-body text-base md:text-lg text-[#14201A] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[600px]">
                  {diagnosisResult}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(diagnosisResult);
                      alert("Hasil diagnosa telah disalin ke papan klip!");
                    }}
                    className="flex-1 py-3 bg-[#E7ECE2] text-[#14201A] font-bold text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> SALIN TEKS
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Hasil Diagnosa CahTani AI",
                          text: diagnosisResult,
                        });
                      } else {
                        alert("Fitur bagikan siap disalin.");
                      }
                    }}
                    className="flex-1 py-3 bg-[#15803D] text-[#F7F9F4] font-bold text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:bg-[#14201A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> BAGIKAN KE WHATSAPP
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#3A4A3E] bg-[#E7ECE2]/50">
                <div className="w-20 h-20 bg-[#15803D] text-[#F7F9F4] rounded-full flex items-center justify-center font-black text-3xl mb-4 border-2 border-[#3A4A3E]">
                  🌱
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#14201A] mb-2">
                  HASIL DIAGNOSA AKAN TAMPIL DI SINI
                </h3>
                <p className="font-body text-base md:text-lg text-[#3F4C42] max-w-sm">
                  Isi formulir di sebelah kiri dan klik <strong>'MULAI DIAGNOSA AI'</strong> untuk melihat hasil analisis penyakit & petunjuk pengobatan lengkap.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
