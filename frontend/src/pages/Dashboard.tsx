import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkUpcomingTasksAndNotify } from "../lib/notifications";
import { apiClient } from "../lib/api";
import {
  Sprout,
  CloudSun,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Camera,
  RefreshCw,
  Search,
  MapPin,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  CalendarDays,
  Clock,
  ChevronRight,
  ShieldCheck,
  User,
  ArrowLeft,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import {
  User as UserType,
  PlantGrowthLog,
  WeatherData,
  PlantingSchedule,
  CustomReminder,
} from "../types";
import { WilayahLocationPicker } from "../components/WilayahLocationPicker";
import { Header } from "../components/Header";
import { FixedBottomNav } from "../components/FixedBottomNav";

interface DashboardProps {
  currentUser: UserType | null;
  onNavigateHome: () => void;
  onNavigateShop?: () => void;
  onOpenChat: () => void;
  onOpenAuthModal: (mode?: "login" | "signup") => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateShop,
  onOpenChat,
  onOpenAuthModal,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"tracker" | "weather" | "calendar">("tracker");

  // ================= 1. PLANT GROWTH TRACKER STATE =================
  const [growthLogs, setGrowthLogs] = useState<PlantGrowthLog[]>(() => {
    try {
      const saved = localStorage.getItem("agribot_growth_logs");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [logCropName, setLogCropName] = useState(currentUser?.crops || "Padi");
  const [logStage, setLogStage] = useState<"Pembibitan" | "Vegetatif" | "Generatif" | "Siap Panen">("Vegetatif");
  const [logHeight, setLogHeight] = useState<number>(25);
  const [logNotes, setLogNotes] = useState("");
  const [logPhotoBase64, setLogPhotoBase64] = useState<string | null>(null);

  // Sync with backend API on mount or user change
  useEffect(() => {
    const fetchBackendFarmData = async () => {
      try {
        const uParam = currentUser?.id ? `?userId=${currentUser.id}` : "";

        // 1. Fetch Logs
        const logsRes = await apiClient.get(`/api/logs${uParam}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (logsData.success && Array.isArray(logsData.data)) {
            setGrowthLogs(logsData.data);
          }
        }

        // 2. Fetch Schedule
        const schRes = await apiClient.get(`/api/schedules${uParam}`);
        if (schRes.ok) {
          const schData = await schRes.json();
          if (schData.success && schData.data) {
            setActiveSchedule(schData.data);
          }
        }

        // 3. Fetch Reminders
        const remRes = await apiClient.get(`/api/reminders${uParam}`);
        if (remRes.ok) {
          const remData = await remRes.json();
          if (remData.success && Array.isArray(remData.data)) {
            setReminders(remData.data);
          }
        }
      } catch (e) {
        console.error("Failed to load initial farm data from backend:", e);
      }
    };

    fetchBackendFarmData();
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem("agribot_growth_logs", JSON.stringify(growthLogs));
  }, [growthLogs]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran foto maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGrowthLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logCropName.trim()) {
      toast.error("Mohon masukkan nama tanaman.");
      return;
    }

    const toastId = toast.loading("Menyimpan jurnal perkembangan tanaman...");

    const payload = {
      userId: currentUser?.id,
      cropName: logCropName.trim(),
      stage: logStage,
      heightCm: Number(logHeight) || 0,
      notes: logNotes.trim(),
      photoBase64: logPhotoBase64 || undefined,
      logDate: new Date().toLocaleDateString("id-ID"),
    };

    try {
      const res = await apiClient.post("/api/logs", payload);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setGrowthLogs([data.data, ...growthLogs]);
      } else {
        const fallbackLog: PlantGrowthLog = { id: "log_" + Date.now(), ...payload, date: payload.logDate };
        setGrowthLogs([fallbackLog, ...growthLogs]);
      }
      toast.success("Jurnal perkembangan tanaman berhasil disimpan!", { id: toastId });
    } catch (err) {
      const fallbackLog: PlantGrowthLog = { id: "log_" + Date.now(), ...payload, date: payload.logDate };
      setGrowthLogs([fallbackLog, ...growthLogs]);
      toast.success("Jurnal perkembangan tanaman berhasil disimpan!", { id: toastId });
    }

    setLogNotes("");
    setLogPhotoBase64(null);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan jurnal ini?")) {
      try {
        await apiClient.delete(`/api/logs/${id}`);
      } catch (e) {
        console.error(e);
      }
      setGrowthLogs(growthLogs.filter((l) => l.id !== id));
      toast.success("Catatan jurnal berhasil dihapus.");
    }
  };

  // ================= 2. WEATHER INTEGRATION STATE =================
  const [weatherLocation, setWeatherLocation] = useState(currentUser?.location || "Ngawi, Jawa Timur");
  const [showWilayahPicker, setShowWilayahPicker] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    location: currentUser?.location || "Ngawi, Jawa Timur",
    tempC: 30,
    airHumidity: 78,
    soilHumidity: 82,
    rainProbability: 45,
    windSpeedKmH: 12,
    condition: "Cerah Berawan / Hujan Lokal Sore",
    fertilizationAdvice: "Aman untuk penaburan pupuk NPK sore ini. Kelembapan tanah memadai untuk penyerapan nutrisi.",
    sprayingAdvice: "Kecepatan angin 12 km/jam tergolong stabil. Lakukan penyemprotan sebelum pukul 10.00 WIB untuk cegah penguapan.",
  });

  const weatherToastIdRef = useRef<string | number | null>(null);

  const weatherAdvisoryMutation = useMutation({
    mutationFn: async (locToFetch: string) => {
      weatherToastIdRef.current = toast.loading("Menganalisis cuaca & menyusun saran AI...");
      const res = await apiClient.post("/api/weather-advisory", {
        location: locToFetch,
        tempC: weatherData.tempC,
        airHumidity: weatherData.airHumidity,
        soilHumidity: weatherData.soilHumidity,
        rainProbability: weatherData.rainProbability,
        windSpeedKmH: weatherData.windSpeedKmH,
        cropType: currentUser?.crops || "Padi / Cabai",
      });
      return await res.json();
    },
    onSuccess: (data, locToFetch) => {
      if (data.advice) {
        const adviceText = data.advice;
        const parts = adviceText.split(/\n(?=2\.|SARAN PENYEMPROTAN)/i);

        setWeatherData((prev) => ({
          ...prev,
          location: locToFetch,
          fertilizationAdvice: parts[0] || adviceText,
          sprayingAdvice: parts[1] || "Kondisi angin memadai untuk aplikasi fungisida/pestisida hayati.",
        }));
      }
      if (weatherToastIdRef.current) {
        toast.success("Informasi cuaca & saran AI berhasil diperbarui!", { id: weatherToastIdRef.current });
      } else {
        toast.success("Informasi cuaca & saran AI berhasil diperbarui!");
      }
    },
    onError: (e) => {
      console.error(e);
      if (weatherToastIdRef.current) {
        toast.error("Gagal memperbarui saran cuaca AI. Coba lagi.", { id: weatherToastIdRef.current });
      } else {
        toast.error("Gagal memperbarui saran cuaca AI.");
      }
    },
  });

  const isWeatherLoading = weatherAdvisoryMutation.isPending;

  const fetchWeatherAiAdvisory = (locToFetch: string) => {
    weatherAdvisoryMutation.mutate(locToFetch);
  };

  const handleAutoDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detectedStr = `Kab. ${currentUser?.location.split(",")[0] || "Sawah"} (GPS Logged)`;
          setWeatherLocation(detectedStr);
          fetchWeatherAiAdvisory(detectedStr);
        },
        (err) => {
          toast.error("Gagal mendeteksi lokasi GPS. Menggunakan lokasi profil Anda.");
          fetchWeatherAiAdvisory(weatherLocation);
        }
      );
    } else {
      fetchWeatherAiAdvisory(weatherLocation);
    }
  };

  // ================= 3. PLANTING CALENDAR & REMINDERS STATE =================
  const [selectedCropForSchedule, setSelectedCropForSchedule] = useState(currentUser?.crops || "Padi");
  const [startDateForSchedule, setStartDateForSchedule] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeSchedule, setActiveSchedule] = useState<PlantingSchedule | null>(() => {
    try {
      const saved = localStorage.getItem("agribot_planting_schedule");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const scheduleToastIdRef = useRef<string | number | null>(null);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      scheduleToastIdRef.current = toast.loading("Membuat kalender tanam otomatis dengan AI...");
      const res = await apiClient.post("/api/planting-schedule", {
        cropType: selectedCropForSchedule,
        startDate: startDateForSchedule,
        location: currentUser?.location || "Indonesia",
      });
      return await res.json();
    },
    onSuccess: (data) => {
      const newSchedule: PlantingSchedule = {
        id: "sch_" + Date.now(),
        cropType: selectedCropForSchedule,
        startDate: startDateForSchedule,
        harvestTargetDate: data.harvestTargetDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        milestones: (data.milestones || []).map((m: any, index: number) => {
          const milestoneDate = new Date(new Date(startDateForSchedule).getTime() + (m.daysFromStart || index * 15) * 86400000)
            .toISOString()
            .split("T")[0];
          return {
            id: `m_${index}_${Date.now()}`,
            date: milestoneDate,
            stageName: m.stageName || m.title || `Tahap ${index + 1}`,
            category: m.category || "Pupuk 1",
            notes: m.notes || "Lakukan perawatan sesuai anjuran.",
            completed: false,
          };
        }),
      };

      setActiveSchedule(newSchedule);

      // Save to backend database asynchronously
      try {
        apiClient.post("/api/schedules", {
          userId: currentUser?.id,
          cropType: newSchedule.cropType,
          startDate: newSchedule.startDate,
          harvestTargetDate: newSchedule.harvestTargetDate,
          milestones: newSchedule.milestones,
        }).catch(console.error);
      } catch (e) {
        console.error(e);
      }

      if (scheduleToastIdRef.current) {
        toast.success("Kalender tanam otomatis AI berhasil dibuat!", { id: scheduleToastIdRef.current });
      } else {
        toast.success("Kalender tanam otomatis AI berhasil dibuat!");
      }
    },
    onError: (e) => {
      console.error(e);
      if (scheduleToastIdRef.current) {
        toast.error("Gagal membuat kalender otomatis.", { id: scheduleToastIdRef.current });
      } else {
        toast.error("Gagal membuat kalender otomatis.");
      }
    },
  });

  const isScheduleGenerating = scheduleMutation.isPending;

  const handleGenerateAiSchedule = () => {
    scheduleMutation.mutate();
  };

  // Manual Reminders State
  const [reminders, setReminders] = useState<CustomReminder[]>(() => {
    try {
      const saved = localStorage.getItem("agribot_manual_reminders");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderCategory, setReminderCategory] = useState<"Tanam" | "Pupuk" | "Pestisida" | "Irigasi" | "Panen">("Pupuk");
  const [reminderDueDate, setReminderDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [reminderNotes, setReminderNotes] = useState("");

  useEffect(() => {
    localStorage.setItem("agribot_manual_reminders", JSON.stringify(reminders));
    checkUpcomingTasksAndNotify();
  }, [reminders]);

  useEffect(() => {
    if (activeSchedule) {
      localStorage.setItem("agribot_planting_schedule", JSON.stringify(activeSchedule));
      checkUpcomingTasksAndNotify();
    }
  }, [activeSchedule]);

  const toggleMilestoneComplete = async (milestoneId: string) => {
    if (!activeSchedule) return;
    const milestoneObj = activeSchedule.milestones.find((m) => m.id === milestoneId);
    const nextVal = milestoneObj ? !milestoneObj.completed : true;

    const updated = {
      ...activeSchedule,
      milestones: activeSchedule.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: nextVal } : m
      ),
    };
    setActiveSchedule(updated);

    try {
      await apiClient.patch(`/api/schedules/milestones/${milestoneId}`, { completed: nextVal });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddManualReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) {
      toast.error("Mohon masukkan judul pengingat.");
      return;
    }

    const toastId = toast.loading("Menyimpan pengingat baru...");

    const payload = {
      userId: currentUser?.id,
      title: reminderTitle.trim(),
      category: reminderCategory,
      dueDate: reminderDueDate,
      notes: reminderNotes.trim(),
    };

    try {
      const res = await apiClient.post("/api/reminders", payload);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setReminders([data.data, ...reminders]);
      } else {
        const newRem: CustomReminder = { id: "rem_" + Date.now(), ...payload, completed: false };
        setReminders([newRem, ...reminders]);
      }
      toast.success("Pengingat baru berhasil disimpan!", { id: toastId });
    } catch (e) {
      const newRem: CustomReminder = { id: "rem_" + Date.now(), ...payload, completed: false };
      setReminders([newRem, ...reminders]);
      toast.success("Pengingat baru berhasil disimpan!", { id: toastId });
    }

    setReminderTitle("");
    setReminderNotes("");
  };

  const toggleReminderComplete = async (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    const nextVal = rem ? !rem.completed : true;

    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, completed: nextVal } : r))
    );

    try {
      await apiClient.patch(`/api/reminders/${id}`, { completed: nextVal });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm("Hapus pengingat ini?")) {
      setReminders(reminders.filter((r) => r.id !== id));
      try {
        await apiClient.delete(`/api/reminders/${id}`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4] text-[#14201A] font-sans pb-20">
      {/* Shared Header Navigation */}
      <Header
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
        onLogout={onLogout}
        onNavigateHome={onNavigateHome}
        onNavigateShop={onNavigateShop}
        onNavigateDashboard={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenChat={onOpenChat}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        {/* Welcome & Farmer Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#15803D] text-[#F7F9F4] border-4 border-[#3A4A3E] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#14201A] text-emerald-400 font-bold text-xs uppercase tracking-widest border border-[#F7F9F4]">
              <ShieldCheck className="w-4 h-4" /> AKUN TERVERIFIKASI CAHTANI MEMBER
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight">
              SALAM TANI, {currentUser ? currentUser.name.toUpperCase() : "BAPAK/IBU PETANI"}!
            </h1>
            <p className="font-body text-base md:text-lg font-medium text-[#E7ECE2]">
              📍 Lokasi Sawah/Ladang:{" "}
              <strong className="text-white">{currentUser?.location || "Ngawi, Jawa Timur"}</strong> •
              Tanaman Utama: <strong className="text-white">{currentUser?.crops || "Padi & Jagung"}</strong>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center shrink-0">
            <div className="bg-[#14201A] p-3 border-2 border-[#F7F9F4]">
              <span className="block text-2xl md:text-3xl font-black text-[#F7F9F4]">
                {growthLogs.length}
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#8B9A8E]">
                JURNAL LOG
              </span>
            </div>
            <div className="bg-[#14201A] p-3 border-2 border-[#F7F9F4]">
              <span className="block text-2xl md:text-3xl font-black text-emerald-400">
                {weatherData.tempC}°C
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#8B9A8E]">
                SUHU SAWAH
              </span>
            </div>
            <div className="bg-[#14201A] p-3 border-2 border-[#F7F9F4]">
              <span className="block text-2xl md:text-3xl font-black text-amber-300">
                {reminders.filter((r) => !r.completed).length}
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#8B9A8E]">
                PENGINGAT
              </span>
            </div>
          </div>
        </motion.div>

        {/* Workspace Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b-4 border-[#3A4A3E] pb-2">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`p-5 font-black text-base md:text-lg uppercase tracking-tight flex items-center justify-center gap-3 border-4 border-[#3A4A3E] transition-all cursor-pointer ${
              activeTab === "tracker"
                ? "bg-[#15803D] text-[#F7F9F4] scale-105 shadow-lg"
                : "bg-[#E7ECE2] text-[#14201A] hover:bg-[#15803D] hover:text-[#F7F9F4]"
            }`}
          >
            <Sprout className="w-6 h-6" />
            1. JURNAL PERKEMBANGAN
          </button>

          <button
            onClick={() => setActiveTab("weather")}
            className={`p-5 font-black text-base md:text-lg uppercase tracking-tight flex items-center justify-center gap-3 border-4 border-[#3A4A3E] transition-all cursor-pointer ${
              activeTab === "weather"
                ? "bg-[#15803D] text-[#F7F9F4] scale-105 shadow-lg"
                : "bg-[#E7ECE2] text-[#14201A] hover:bg-[#15803D] hover:text-[#F7F9F4]"
            }`}
          >
            <CloudSun className="w-6 h-6" />
            2. CUACA & SARAN AI
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`p-5 font-black text-base md:text-lg uppercase tracking-tight flex items-center justify-center gap-3 border-4 border-[#3A4A3E] transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-[#15803D] text-[#F7F9F4] scale-105 shadow-lg"
                : "bg-[#E7ECE2] text-[#14201A] hover:bg-[#15803D] hover:text-[#F7F9F4]"
            }`}
          >
            <CalendarDays className="w-6 h-6" />
            3. KALENDER & PENGINGAT
          </button>
        </div>

        {/* Animate Tab Content Switches */}
        <AnimatePresence mode="wait">
          {/* TAB 1: PLANT GROWTH TRACKER */}
          {activeTab === "tracker" && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Form Input Log */}
              <div className="lg:col-span-5 bg-[#E7ECE2] border-4 border-[#3A4A3E] p-6 space-y-6">
                <div className="border-b-2 border-[#3A4A3E] pb-3">
                  <span className="inline-block px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider mb-1">
                    CATATAN BARU
                  </span>
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#14201A]">
                    TAMBAH JURNAL PERTUMBUHAN
                  </h3>
                </div>

                <form onSubmit={handleAddGrowthLog} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      1. NAMA TANAMAN / VARIETAS:
                    </label>
                    <input
                      type="text"
                      required
                      value={logCropName}
                      onChange={(e) => setLogCropName(e.target.value)}
                      placeholder="CONTOH: PADI CIHERANG / CABAI RAWIT"
                      className="w-full h-12 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                        2. FASE PERTUMBUHAN:
                      </label>
                      <select
                        value={logStage}
                        onChange={(e: any) => setLogStage(e.target.value)}
                        className="w-full h-12 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-3 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                      >
                        <option value="Pembibitan">🌱 PEMBIBITAN</option>
                        <option value="Vegetatif">🌿 VEGETATIF (TUNAS)</option>
                        <option value="Generatif">🌸 GENERATIF (BUNGA/BUAH)</option>
                        <option value="Siap Panen">🌾 SIAP PANEN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                        3. TINGGI TANAMAN (CM):
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={logHeight}
                        onChange={(e) => setLogHeight(Number(e.target.value))}
                        className="w-full h-12 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      4. CATATAN PENGAMATAN TANAMAN:
                    </label>
                    <textarea
                      rows={3}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="CATATAN WARNA DAUN, JUMLAH ANAKAN, PEMUPUKAN HARI INI, DLL..."
                      className="w-full p-3 bg-[#F7F9F4] border-2 border-[#3A4A3E] font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      5. UNGGAH FOTO TANAMAN (OPSIONAL):
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 h-12 bg-[#14201A] text-[#F7F9F4] border-2 border-[#3A4A3E] px-4 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider hover:bg-[#15803D] cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>{logPhotoBase64 ? "GANTI FOTO" : "PILIH FOTO DAUN/LADANG"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {logPhotoBase64 && (
                      <div className="mt-2 border-2 border-[#3A4A3E] p-2 bg-[#F7F9F4] flex items-center gap-3">
                        <img
                          src={logPhotoBase64}
                          alt="Preview"
                          className="w-16 h-16 object-cover border border-[#3A4A3E]"
                        />
                        <span className="text-xs font-bold text-[#15803D] uppercase">
                          FOTO TERHUBUNG LENGKAP
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#15803D] text-[#F7F9F4] font-black text-lg uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> SIMPAN JURNAL HARIAN
                  </button>
                </form>
              </div>

              {/* Timeline Logs List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#3A4A3E] pb-2">
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#14201A]">
                    RIWAYAT JURNAL TANGAN PETANI ({growthLogs.length})
                  </h3>
                  <span className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
                    KRONOLOGIS TERUPDATE
                  </span>
                </div>

                {growthLogs.length === 0 ? (
                  <div className="p-12 text-center bg-[#E7ECE2] border-4 border-[#3A4A3E] space-y-2">
                    <Sprout className="w-12 h-12 text-[#15803D] mx-auto" />
                    <p className="font-bold text-lg uppercase text-[#14201A]">
                      BELUM ADA CATATAN PERKEMBANGAN TANAMAN
                    </p>
                    <p className="text-sm font-medium text-[#3F4C42]">
                      Gunakan formulir di sebelah kiri untuk mencatat pertumbuhan tanaman Anda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {growthLogs.map((log, idx) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                        className="bg-[#F7F9F4] border-4 border-[#3A4A3E] p-6 space-y-4 shadow-sm hover:border-[#15803D] transition-colors"
                      >
                        <div className="flex items-center justify-between border-b-2 border-[#3A4A3E] pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-black text-xs uppercase tracking-wider">
                              {log.stage}
                            </span>
                            <h4 className="font-black text-xl uppercase text-[#14201A]">
                              {log.cropName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-[#14201A] text-emerald-400 font-bold text-xs uppercase">
                              📏 TINGGI: {log.heightCm} CM
                            </span>
                            <span className="text-xs font-bold text-[#3F4C42] uppercase">
                              📅 {log.date}
                            </span>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-[#3A4A3E] transition-colors cursor-pointer"
                              title="Hapus Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {log.notes && (
                          <p className="font-body text-base font-medium text-[#14201A] leading-relaxed">
                            "{log.notes}"
                          </p>
                        )}

                        {log.photoBase64 && (
                          <div className="pt-2">
                            <img
                              src={log.photoBase64}
                              alt={log.cropName}
                              className="w-full max-h-64 object-cover border-2 border-[#3A4A3E]"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: AGRICULTURAL WEATHER INTEGRATION & AI ADVISORY */}
          {activeTab === "weather" && (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Search & Location Bar */}
              <div className="bg-[#E7ECE2] border-4 border-[#3A4A3E] p-6 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <MapPin className="w-7 h-7 text-[#15803D] shrink-0" />
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-[#3F4C42]">
                        INTEGRASI CUACA WILAYAH PERTANI:
                      </span>
                      <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#14201A]">
                        {weatherData.location}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      value={weatherLocation}
                      onChange={(e) => setWeatherLocation(e.target.value)}
                      placeholder="KABUPATEN / DESA SAWAH..."
                      className="h-12 bg-[#F7F9F4] border-2 border-[#3A4A3E] px-4 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] flex-1 md:w-64"
                    />
                    <button
                      onClick={() => fetchWeatherAiAdvisory(weatherLocation)}
                      disabled={isWeatherLoading}
                      className="h-12 px-4 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider border-2 border-[#3A4A3E] hover:bg-[#14201A] cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                    >
                      {isWeatherLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>CARI CUACA</span>
                    </button>
                    <button
                      onClick={() => setShowWilayahPicker(!showWilayahPicker)}
                      className="h-12 px-3 bg-[#3A4A3E] text-white font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-[#15803D] cursor-pointer shrink-0 flex items-center gap-1"
                      title="Pilih Wilayah Indonesia"
                    >
                      <span>🗺️ WILAYAH.ID</span>
                    </button>
                    <button
                      onClick={handleAutoDetectLocation}
                      className="h-12 px-3 bg-[#14201A] text-[#F7F9F4] font-bold text-xs uppercase border-2 border-[#3A4A3E] hover:bg-[#15803D] cursor-pointer shrink-0"
                      title="Deteksi GPS"
                    >
                      📍 GPS
                    </button>
                  </div>
                </div>

                {showWilayahPicker && (
                  <div className="pt-2 border-t-2 border-[#3A4A3E]">
                    <WilayahLocationPicker
                      value={weatherLocation}
                      onChange={(newLoc) => {
                        setWeatherLocation(newLoc);
                        fetchWeatherAiAdvisory(newLoc);
                      }}
                      label="PILIH TINGKAT WILAYAH SAWAH / LADANG (OPEN API WILAYAH.ID):"
                    />
                  </div>
                )}
              </div>

              {/* Metrics Dashboard Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    icon: <Thermometer className="w-8 h-8 text-red-600 mx-auto" />,
                    value: `${weatherData.tempC}°C`,
                    label: "SUHU UDARA",
                  },
                  {
                    icon: <Droplets className="w-8 h-8 text-blue-600 mx-auto" />,
                    value: `${weatherData.airHumidity}%`,
                    label: "KELEMBAPAN UDARA",
                  },
                  {
                    icon: <Sprout className="w-8 h-8 text-[#15803D] mx-auto" />,
                    value: `${weatherData.soilHumidity}%`,
                    label: "KELEMBAPAN TANAH",
                  },
                  {
                    icon: <CloudSun className="w-8 h-8 text-amber-600 mx-auto" />,
                    value: `${weatherData.rainProbability}%`,
                    label: "PELUANG HUJAN",
                  },
                  {
                    icon: <Wind className="w-8 h-8 text-slate-600 mx-auto" />,
                    value: `${weatherData.windSpeedKmH} KM/H`,
                    label: "KECEPATAN ANGIN",
                    colSpan: "col-span-2 md:col-span-1",
                  },
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                    className={`bg-[#F7F9F4] border-4 border-[#3A4A3E] p-5 text-center space-y-1 ${
                      metric.colSpan || ""
                    }`}
                  >
                    {metric.icon}
                    <span className="block text-2xl md:text-3xl font-black text-[#14201A]">
                      {metric.value}
                    </span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#3F4C42]">
                      {metric.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Real-time AgriBot AI Advisory Cards */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="bg-[#14201A] text-[#F7F9F4] border-4 border-[#3A4A3E] p-6 md:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b-2 border-[#3A4A3E] pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#15803D] text-[#F7F9F4] border border-[#F7F9F4] flex items-center justify-center font-bold text-xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#F7F9F4]">
                        REKOMENDASI CAHTANI AI BERDASARKAN CUACA
                      </h3>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                        ANALISA SPESIFIK WILAYAH {weatherData.location.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => fetchWeatherAiAdvisory(weatherData.location)}
                    disabled={isWeatherLoading}
                    className="px-4 py-2 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider border-2 border-[#F7F9F4] hover:bg-emerald-700 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isWeatherLoading ? "animate-spin" : ""}`} />
                    <span>ANALISA AI TERBARU</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fertilization Advice Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                    className="bg-[#1D2B22] border-2 border-[#15803D] p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wider">
                      <Sprout className="w-5 h-5 text-amber-300" />
                      <span>1. SARAN PEMUPUKAN TANAMAN</span>
                    </div>
                    <p className="font-body text-base text-[#E7ECE2] leading-relaxed font-medium">
                      {weatherData.fertilizationAdvice}
                    </p>
                  </motion.div>

                  {/* Spraying Advice Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="bg-[#1D2B22] border-2 border-[#15803D] p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
                      <Wind className="w-5 h-5 text-emerald-400" />
                      <span>2. SARAN PENYEMPROTAN PESTISIDA/FUNGISIDA</span>
                    </div>
                    <p className="font-body text-base text-[#E7ECE2] leading-relaxed font-medium">
                      {weatherData.sprayingAdvice}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* TAB 3: PLANTING CALENDAR & REMINDERS */}
          {activeTab === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Section A: Automated AI Planting Schedule Generator */}
              <div className="bg-[#E7ECE2] border-4 border-[#3A4A3E] p-6 md:p-8 space-y-6">
                <div className="border-b-2 border-[#3A4A3E] pb-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="inline-block px-3 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider mb-1">
                      AI AUTOMATED TIMELINE GENERATOR
                    </span>
                    <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#14201A]">
                      A. KALENDER & JADWAL TANAM OTOMATIS AI
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#F7F9F4] border-2 border-[#3A4A3E] p-5">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      1. PILIH TANAMAN:
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedCropForSchedule}
                      onChange={(e) => setSelectedCropForSchedule(e.target.value)}
                      placeholder="CONTOH: PADI, CABAI, JAGUNG, BAWANG..."
                      className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] uppercase focus:outline-none focus:border-[#15803D] placeholder:text-[#8B9A8E]"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      2. TANGGAL MULAI TANAM:
                    </label>
                    <input
                      type="date"
                      value={startDateForSchedule}
                      onChange={(e) => setStartDateForSchedule(e.target.value)}
                      className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-base text-[#14201A] focus:outline-none focus:border-[#15803D]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      onClick={handleGenerateAiSchedule}
                      disabled={isScheduleGenerating}
                      className="w-full h-12 bg-[#15803D] text-[#F7F9F4] font-black text-sm uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isScheduleGenerating ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      <span>GENERASI DENGAN AI</span>
                    </button>
                  </div>
                </div>

                {/* Active Schedule Display */}
                {activeSchedule ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#F7F9F4] border-4 border-[#3A4A3E] p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between border-b-2 border-[#3A4A3E] pb-3 flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#15803D] uppercase tracking-wider block">
                          JADWAL TANAM ELEKTRONIK
                        </span>
                        <h4 className="font-black text-2xl uppercase text-[#14201A]">
                          {activeSchedule.cropType} (Mulai: {activeSchedule.startDate})
                        </h4>
                      </div>

                      <div className="px-4 py-2 bg-[#14201A] text-amber-300 font-bold text-xs md:text-sm uppercase tracking-wider border-2 border-[#3A4A3E]">
                        🎯 ESTIMASI HARI PANEN: {activeSchedule.harvestTargetDate}
                      </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="space-y-4">
                      {activeSchedule.milestones.map((m, idx) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.06 }}
                          onClick={() => toggleMilestoneComplete(m.id)}
                          className={`p-5 border-2 border-[#3A4A3E] flex items-start gap-4 transition-all cursor-pointer ${
                            m.completed
                              ? "bg-emerald-100 border-emerald-700 opacity-80 line-through"
                              : "bg-[#E7ECE2] hover:bg-[#F7F9F4]"
                          }`}
                        >
                          <button className="mt-1 text-[#15803D]">
                            {m.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
                            ) : (
                              <Circle className="w-6 h-6 text-[#3A4A3E]" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-black text-sm uppercase text-[#15803D]">
                                {idx + 1}. [{m.category}] — {m.stageName}
                              </span>
                              <span className="text-xs font-bold text-[#14201A] uppercase bg-[#F7F9F4] px-2 py-1 border border-[#3A4A3E]">
                                📅 TANGGAL: {m.date}
                              </span>
                            </div>
                            <p className="font-body text-sm font-medium text-[#14201A] no-underline">
                              {m.notes}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F9F4] border-2 border-[#3A4A3E] text-[#3F4C42] font-bold text-sm uppercase">
                    Klik tombol "GENERASI DENGAN AI" untuk memuat linimasa kalender tanam otomatis untuk tanaman Anda.
                  </div>
                )}
              </div>

              {/* Section B: Manual Reminders */}
              <div className="bg-[#E7ECE2] border-4 border-[#3A4A3E] p-6 md:p-8 space-y-6">
                <div className="border-b-2 border-[#3A4A3E] pb-4">
                  <span className="inline-block px-3 py-1 bg-[#14201A] text-[#F7F9F4] font-bold text-xs uppercase tracking-wider mb-1">
                    MANUAL TASK REMINDERS
                  </span>
                  <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#14201A]">
                    B. PENGINGAT TUGAS MANDIRI SAWAH/LADANG
                  </h3>
                </div>

                {/* Form Manual Reminder */}
                <form onSubmit={handleAddManualReminder} className="bg-[#F7F9F4] border-2 border-[#3A4A3E] p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                        1. TUGAS / KEGIATAN:
                      </label>
                      <input
                        type="text"
                        required
                        value={reminderTitle}
                        onChange={(e) => setReminderTitle(e.target.value)}
                        placeholder="CONTOH: PENYEMPROTAN FUNGISIDA DAUN"
                        className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                        2. KATEGORI:
                      </label>
                      <select
                        value={reminderCategory}
                        onChange={(e: any) => setReminderCategory(e.target.value)}
                        className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-3 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                      >
                        <option value="Tanam">🌱 TANAM</option>
                        <option value="Pupuk">🧪 PUPUK</option>
                        <option value="Pestisida">🪲 PESTISIDA</option>
                        <option value="Irigasi">💧 IRIGASI</option>
                        <option value="Panen">🌾 PANEN</option>
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                        3. JATUH TEMPO (TANGGAL):
                      </label>
                      <input
                        type="date"
                        required
                        value={reminderDueDate}
                        onChange={(e) => setReminderDueDate(e.target.value)}
                        className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-sm text-[#14201A] focus:outline-none focus:border-[#15803D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#14201A] mb-1">
                      4. CATATAN / DOSIS KHUSUS:
                    </label>
                    <input
                      type="text"
                      value={reminderNotes}
                      onChange={(e) => setReminderNotes(e.target.value)}
                      placeholder="DOSIS 10ml PER TANGKI / TABUR SORE..."
                      className="w-full h-12 bg-[#E7ECE2] border-2 border-[#3A4A3E] px-4 font-bold text-sm text-[#14201A] uppercase focus:outline-none focus:border-[#15803D]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#15803D] text-[#F7F9F4] font-black text-base uppercase tracking-tight border-2 border-[#3A4A3E] hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> TAMBAHKAN PENGINGAT
                  </button>
                </form>

                {/* Reminders List */}
                <div className="space-y-3">
                  {reminders.length === 0 ? (
                    <p className="p-4 text-center text-xs font-bold text-[#3F4C42] uppercase">
                      Belum ada pengingat tugas.
                    </p>
                  ) : (
                    reminders.map((r, idx) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className={`p-4 border-2 border-[#3A4A3E] flex items-center justify-between gap-4 transition-all ${
                          r.completed
                            ? "bg-emerald-100 border-emerald-600 opacity-60 line-through"
                            : "bg-[#F7F9F4]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleReminderComplete(r.id)}
                            className="text-[#15803D] cursor-pointer"
                          >
                            {r.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
                            ) : (
                              <Circle className="w-6 h-6 text-[#3A4A3E]" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[#14201A] text-emerald-400 font-bold text-[10px] uppercase">
                                {r.category}
                              </span>
                              <h5 className="font-bold text-base text-[#14201A] uppercase">
                                {r.title}
                              </h5>
                            </div>
                            {r.notes && (
                              <p className="text-xs font-medium text-[#3F4C42] uppercase">
                                {r.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-[#15803D] uppercase bg-[#E7ECE2] px-2 py-1 border border-[#3A4A3E]">
                            📅 {r.dueDate}
                          </span>
                          <button
                            onClick={() => handleDeleteReminder(r.id)}
                            className="p-1 text-red-600 hover:text-red-900 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FixedBottomNav onOpenChat={onOpenChat} />
    </div>
  );
};
