import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, Calendar, AlertTriangle, X, ShieldCheck, Sparkles } from "lucide-react";
import {
  checkUpcomingTasksAndNotify,
  getAllPendingTaskAlerts,
  getNotificationPermissionState,
  markTaskCompletedInStorage,
  registerServiceWorker,
  requestNotificationPermission,
  TaskAlertItem,
} from "../lib/notifications";

interface TaskNotificationWidgetProps {
  onNavigateDashboard?: () => void;
}

export const TaskNotificationWidget: React.FC<TaskNotificationWidgetProps> = ({ onNavigateDashboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskAlertItem[]>([]);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [bannerAlert, setBannerAlert] = useState<TaskAlertItem | null>(null);
  const [hasDismissedBanner, setHasDismissedBanner] = useState(false);

  // Load pending tasks and initialize SW / notification check on mount
  useEffect(() => {
    registerServiceWorker();

    const currentPermission = getNotificationPermissionState();
    setPermissionState(currentPermission);

    // Initial task check
    const pending = getAllPendingTaskAlerts();
    setTasks(pending);

    // Automatically check and trigger native notifications if permitted
    checkUpcomingTasksAndNotify();

    // Set banner alert for urgent tasks (TODAY or OVERDUE)
    const urgent = pending.find((t) => t.status === "TODAY" || t.status === "OVERDUE");
    if (urgent) {
      setBannerAlert(urgent);
    }

    // Set periodic check every 30 minutes or on tab focus
    const interval = setInterval(() => {
      const updatedPending = getAllPendingTaskAlerts();
      setTasks(updatedPending);
      checkUpcomingTasksAndNotify();
    }, 30 * 60 * 1000);

    const handleFocus = () => {
      const updatedPending = getAllPendingTaskAlerts();
      setTasks(updatedPending);
      checkUpcomingTasksAndNotify();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    checkUpcomingTasksAndNotify();
  };

  const handleCompleteTask = (taskId: string, source: "CALENDAR" | "REMINDER") => {
    markTaskCompletedInStorage(taskId, source);
    const updated = getAllPendingTaskAlerts();
    setTasks(updated);

    if (bannerAlert?.id === taskId) {
      const nextUrgent = updated.find((t) => t.status === "TODAY" || t.status === "OVERDUE");
      setBannerAlert(nextUrgent || null);
    }
  };

  const todayCount = tasks.filter((t) => t.status === "TODAY" || t.status === "OVERDUE").length;

  return (
    <>
      {/* Top Sticky Notification Banner for Urgent Farming Tasks */}
      {bannerAlert && !hasDismissedBanner && (
        <div className="bg-[#15803D] text-[#F7F9F4] border-b-2 border-[#3A4A3E] px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <span className="px-2 py-0.5 bg-[#14201A] text-amber-300 rounded-none text-[10px] md:text-xs font-extrabold uppercase shrink-0">
              {bannerAlert.status === "OVERDUE" ? "⚠️ PERHATIAN TUGAS TERLEWAT" : "🌱 TUGAS KALENDER HARI INI"}
            </span>
            <span className="truncate">
              <strong>{bannerAlert.title}:</strong> {bannerAlert.notes || "Lakukan perawatan sesuai jadwal tanam."}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCompleteTask(bannerAlert.id, bannerAlert.source)}
              className="px-2.5 py-1 bg-[#14201A] text-[#F7F9F4] hover:bg-emerald-950 text-xs font-black uppercase border border-[#3A4A3E] transition-colors cursor-pointer"
            >
              ✓ Selesai
            </button>
            {onNavigateDashboard && (
              <button
                onClick={() => {
                  onNavigateDashboard();
                  setHasDismissedBanner(true);
                }}
                className="hidden sm:inline-block underline text-xs hover:text-amber-200 cursor-pointer font-bold uppercase"
              >
                Lihat Kalender
              </button>
            )}
            <button
              onClick={() => setHasDismissedBanner(true)}
              className="p-1 hover:bg-[#14201A] transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-4 h-4 text-[#F7F9F4]" />
            </button>
          </div>
        </div>
      )}

      {/* Header Notification Bell Button & Popover */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center h-11 w-11 bg-[#E7ECE2] text-[#14201A] border-2 border-[#3A4A3E] hover:bg-[#15803D] hover:text-[#F7F9F4] transition-colors cursor-pointer shrink-0"
          title="Pengingat & Notifikasi Kalender Tanam"
        >
          <Bell className="w-5 h-5" />
          {todayCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#3A4A3E] animate-bounce">
              {todayCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-14 w-[340px] sm:w-[400px] bg-[#F7F9F4] border-4 border-[#3A4A3E] shadow-[8px_8px_0px_0px_#3A4A3E] z-50 text-[#14201A]">
            {/* Header */}
            <div className="p-4 bg-[#14201A] text-[#F7F9F4] flex items-center justify-between border-b-2 border-[#3A4A3E]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-black text-sm uppercase tracking-tight">
                  PENGINGAT KALENDER TANAM
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#3A4A3E] transition-colors text-[#F7F9F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Permission Banner */}
            <div className="p-3 bg-[#E7ECE2] border-b-2 border-[#3A4A3E] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#14201A]">
                <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  Notifikasi HP:{" "}
                  <strong
                    className={
                      permissionState === "granted" ? "text-[#15803D]" : "text-amber-700"
                    }
                  >
                    {permissionState === "granted"
                      ? "Aktif (Service Worker)"
                      : permissionState === "denied"
                      ? "Diblokir Browser"
                      : "Belum Aktif"}
                  </strong>
                </span>
              </div>
              {permissionState !== "granted" && (
                <button
                  onClick={handleRequestPermission}
                  className="px-2 py-1 bg-[#15803D] text-[#F7F9F4] font-black uppercase text-[10px] hover:bg-[#14201A] transition-colors cursor-pointer shrink-0"
                >
                  Aktifkan
                </button>
              )}
            </div>

            {/* Content List */}
            <div className="max-h-[360px] overflow-y-auto p-4 space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-[#3F4C42]">
                  <CheckCircle2 className="w-10 h-10 text-[#15803D] mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-sm uppercase">Semua Tugas Tanam Selesai!</p>
                  <p className="text-xs text-[#3F4C42] mt-1">
                    Tidak ada jadwal pemupukan atau penanganan hama yang tertunda hari ini.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border-2 border-[#3A4A3E] transition-all ${
                      task.status === "OVERDUE"
                        ? "bg-rose-100 border-rose-800"
                        : task.status === "TODAY"
                        ? "bg-amber-100 border-amber-800"
                        : "bg-[#E7ECE2]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-extrabold uppercase border border-[#3A4A3E] ${
                            task.status === "OVERDUE"
                              ? "bg-rose-700 text-white"
                              : task.status === "TODAY"
                              ? "bg-amber-600 text-white"
                              : "bg-[#15803D] text-white"
                          }`}
                        >
                          {task.status === "OVERDUE"
                            ? "Terlewat"
                            : task.status === "TODAY"
                            ? "Hari Ini"
                            : "Besok"}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#14201A] text-[#F7F9F4] uppercase">
                          {task.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#3F4C42]">
                        {task.dueDate}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#14201A] leading-tight">
                      {task.title}
                    </h4>
                    {task.notes && (
                      <p className="text-xs text-[#3F4C42] font-medium mt-1 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#3A4A3E]/30">
                      <button
                        onClick={() => handleCompleteTask(task.id, task.source)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#15803D] text-[#F7F9F4] font-bold text-xs uppercase hover:bg-[#14201A] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesaikan</span>
                      </button>

                      {onNavigateDashboard && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onNavigateDashboard();
                          }}
                          className="text-xs font-extrabold text-[#15803D] hover:underline uppercase cursor-pointer"
                        >
                          Lihat Kalender →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#E7ECE2] border-t-2 border-[#3A4A3E] flex items-center justify-between text-xs font-bold text-[#3F4C42]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#15803D]" /> Disinkronkan Otomatis
              </span>
              {onNavigateDashboard && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateDashboard();
                  }}
                  className="text-[#14201A] hover:text-[#15803D] underline cursor-pointer uppercase"
                >
                  Kelola Kalender Tanam
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
