// Service Worker & Planting Calendar Notification Utility
import { toast } from "sonner";
import { CustomReminder, PlantingMilestone, PlantingSchedule } from "../types";

export interface TaskAlertItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  notes: string;
  status: "TODAY" | "TOMORROW" | "OVERDUE";
  source: "CALENDAR" | "REMINDER";
  completed: boolean;
}

const NOTIFIED_TASKS_KEY = "cahtani_notified_tasks";

/**
 * Register Service Worker for offline background capabilities and push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("CahTani ServiceWorker registered successfully:", registration.scope);
    return registration;
  } catch (error) {
    console.warn("ServiceWorker registration failed or not supported in current frame:", error);
    return null;
  }
}

/**
 * Request Browser Notification Permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Send welcome notification
      showNativeNotification(
        "🔔 Pengingat Kalender Tanam CahTani AI Aktif!",
        "Anda akan menerima notifikasi otomatis untuk jadwal pemupukan, semprot pestisida, dan panen sawah Anda."
      );
    }
    return permission;
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return "denied";
  }
}

/**
 * Get current notification permission state
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Shows native browser notification using Service Worker registration or Web Notification fallback
 */
export async function showNativeNotification(title: string, body: string, tag = "cahtani-alert") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>",
          tag,
          data: { url: "/dashboard" },
        } as any);
        return;
      }
    }
    // Fallback if Service Worker is not active
    new Notification(title, {
      body,
      tag,
      icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>",
    });
  } catch (e) {
    console.error("Error showing notification:", e);
  }
}

/**
 * Collect all active pending tasks from Planting Schedule & Manual Reminders
 */
export function getAllPendingTaskAlerts(): TaskAlertItem[] {
  if (typeof window === "undefined") return [];

  const alerts: TaskAlertItem[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // 1. Check Planting Schedule Milestones
  try {
    const scheduleRaw = localStorage.getItem("agribot_planting_schedule");
    if (scheduleRaw) {
      const schedule: PlantingSchedule = JSON.parse(scheduleRaw);
      if (schedule && Array.isArray(schedule.milestones)) {
        schedule.milestones.forEach((m: PlantingMilestone) => {
          if (!m.completed) {
            let status: "TODAY" | "TOMORROW" | "OVERDUE" | null = null;
            if (m.date === todayStr) {
              status = "TODAY";
            } else if (m.date === tomorrowStr) {
              status = "TOMORROW";
            } else if (m.date < todayStr) {
              status = "OVERDUE";
            }

            if (status) {
              alerts.push({
                id: m.id,
                title: `${m.stageName} (${schedule.cropType})`,
                category: m.category,
                dueDate: m.date,
                notes: m.notes,
                status,
                source: "CALENDAR",
                completed: false,
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error("Error parsing planting schedule for notifications:", e);
  }

  // 2. Check Custom Manual Reminders
  try {
    const remindersRaw = localStorage.getItem("agribot_manual_reminders");
    if (remindersRaw) {
      const reminders: CustomReminder[] = JSON.parse(remindersRaw);
      if (Array.isArray(reminders)) {
        reminders.forEach((r: CustomReminder) => {
          if (!r.completed) {
            let status: "TODAY" | "TOMORROW" | "OVERDUE" | null = null;
            if (r.dueDate === todayStr) {
              status = "TODAY";
            } else if (r.dueDate === tomorrowStr) {
              status = "TOMORROW";
            } else if (r.dueDate < todayStr) {
              status = "OVERDUE";
            }

            if (status) {
              alerts.push({
                id: r.id,
                title: r.title,
                category: r.category,
                dueDate: r.dueDate,
                notes: r.notes,
                status,
                source: "REMINDER",
                completed: false,
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error("Error parsing manual reminders for notifications:", e);
  }

  // Sort: TODAY first, then OVERDUE, then TOMORROW
  return alerts.sort((a, b) => {
    const priority = { TODAY: 1, OVERDUE: 2, TOMORROW: 3 };
    return priority[a.status] - priority[b.status];
  });
}

/**
 * Evaluates pending tasks and fires browser notifications if due today or overdue,
 * while preventing repeated duplicate notifications on the same day.
 */
export function checkUpcomingTasksAndNotify() {
  const pendingTasks = getAllPendingTaskAlerts();
  if (pendingTasks.length === 0) return;

  const todayStr = new Date().toISOString().split("T")[0];
  let notifiedRecord: { date: string; taskIds: string[] } = {
    date: todayStr,
    taskIds: [],
  };

  try {
    const recordRaw = localStorage.getItem(NOTIFIED_TASKS_KEY);
    if (recordRaw) {
      const parsed = JSON.parse(recordRaw);
      if (parsed.date === todayStr && Array.isArray(parsed.taskIds)) {
        notifiedRecord = parsed;
      }
    }
  } catch (e) {
    console.error("Error reading notified tasks record:", e);
  }

  const urgentTasks = pendingTasks.filter(
    (t) => (t.status === "TODAY" || t.status === "OVERDUE") && !notifiedRecord.taskIds.includes(t.id)
  );

  if (urgentTasks.length > 0) {
    urgentTasks.forEach((task) => {
      const label = task.status === "OVERDUE" ? "⚠️ PERHATIAN TUGAS TERLEWAT" : "🌱 JADWAL HARI INI";
      showNativeNotification(
        `${label}: ${task.title}`,
        `${task.category} — ${task.notes || "Buka aplikasi CahTani untuk detail tugas."}`,
        `task-${task.id}`
      );
      toast.info(`PENGINGAT KALENDER TANAM: ${task.title}`, {
        description: `Kategori: ${task.category} • Tanggal: ${task.dueDate}${task.notes ? ` • ${task.notes}` : ""}`,
      });
      notifiedRecord.taskIds.push(task.id);
    });

    try {
      localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify(notifiedRecord));
    } catch (e) {
      console.error("Error saving notified tasks record:", e);
    }
  }
}

/**
 * Mark a task as completed directly from notification alert
 */
export function markTaskCompletedInStorage(taskId: string, source: "CALENDAR" | "REMINDER") {
  if (source === "CALENDAR") {
    try {
      const saved = localStorage.getItem("agribot_planting_schedule");
      if (saved) {
        const schedule: PlantingSchedule = JSON.parse(saved);
        if (schedule && Array.isArray(schedule.milestones)) {
          schedule.milestones = schedule.milestones.map((m) =>
            m.id === taskId ? { ...m, completed: true } : m
          );
          localStorage.setItem("agribot_planting_schedule", JSON.stringify(schedule));
        }
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      const saved = localStorage.getItem("agribot_manual_reminders");
      if (saved) {
        const reminders: CustomReminder[] = JSON.parse(saved);
        if (Array.isArray(reminders)) {
          const updated = reminders.map((r) => (r.id === taskId ? { ...r, completed: true } : r));
          localStorage.setItem("agribot_manual_reminders", JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
