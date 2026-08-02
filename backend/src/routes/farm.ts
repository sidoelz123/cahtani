import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { db, initDb } from "../db/index.js";
import {
  plantGrowthLogs,
  plantingSchedules,
  plantingMilestones,
  customReminders,
} from "../db/schema.js";

const farm = new Hono().basePath("/api");

farm.onError((err, c) => {
  console.error("Hono Farm App Error:", err);
  return c.json({ error: err.message || "Internal Server Error in Farm API" }, 500);
});

farm.notFound((c) => {
  return c.json({ error: "Endpoint farm tidak ditemukan." }, 404);
});

// Ensure DB initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// Helper to sanitize stage
function normalizeStage(stage: string): "pembibitan" | "vegetatif" | "generatif" | "siap_panen" {
  const lower = stage.toLowerCase().trim();
  if (lower.includes("pembibitan")) return "pembibitan";
  if (lower.includes("generatif")) return "generatif";
  if (lower.includes("panen")) return "siap_panen";
  return "vegetatif";
}

function normalizeCategory(cat: string): "tanam" | "pupuk" | "pestisida" | "irigasi" | "panen" {
  const lower = cat.toLowerCase().trim();
  if (lower.includes("tanam")) return "tanam";
  if (lower.includes("pestisida")) return "pestisida";
  if (lower.includes("irigasi")) return "irigasi";
  if (lower.includes("panen")) return "panen";
  return "pupuk";
}

// ==========================================
// 1. PLANT GROWTH LOGS API (/api/logs)
// ==========================================

// GET /api/logs
farm.get("/logs", async (c) => {
  await ensureDb();
  const userId = c.req.query("userId");

  let logs;
  if (userId) {
    logs = await db
      .select()
      .from(plantGrowthLogs)
      .where(eq(plantGrowthLogs.userId, userId))
      .orderBy(desc(plantGrowthLogs.createdAt))
      .all();
  } else {
    logs = await db
      .select()
      .from(plantGrowthLogs)
      .orderBy(desc(plantGrowthLogs.createdAt))
      .all();
  }

  return c.json({
    success: true,
    data: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      cropName: l.cropName,
      stage:
        l.stage === "pembibitan"
          ? "Pembibitan"
          : l.stage === "generatif"
          ? "Generatif"
          : l.stage === "siap_panen"
          ? "Siap Panen"
          : "Vegetatif",
      heightCm: l.heightCm,
      notes: l.notes || "",
      photoBase64: l.photoBase64 || undefined,
      date: l.logDate,
      createdAt: l.createdAt,
    })),
  });
});

// POST /api/logs
farm.post("/logs", async (c) => {
  try {
    await ensureDb();
    const body = await c.req.json();
    const { userId, cropName, stage, heightCm, notes, photoBase64, logDate } = body;

    if (!cropName) {
      return c.json({ error: "Nama tanaman wajib diisi." }, 400);
    }

    const newId = "log_" + Date.now();
    const formattedStage = normalizeStage(stage || "Vegetatif");
    const currentDate = logDate || new Date().toLocaleDateString("id-ID");

    await db.insert(plantGrowthLogs).values({
      id: newId,
      userId: userId || null,
      cropName: cropName.trim(),
      stage: formattedStage,
      heightCm: Number(heightCm) || 0,
      notes: notes ? notes.trim() : "",
      photoBase64: photoBase64 || null,
      logDate: currentDate,
    });

    return c.json({
      success: true,
      message: "Catatan jurnal perkembangan berhasil disimpan!",
      data: {
        id: newId,
        userId: userId || null,
        cropName: cropName.trim(),
        stage: stage || "Vegetatif",
        heightCm: Number(heightCm) || 0,
        notes: notes ? notes.trim() : "",
        photoBase64: photoBase64 || undefined,
        date: currentDate,
      },
    });
  } catch (err: any) {
    console.error("POST /logs error:", err);
    return c.json({ error: err?.message || String(err) }, 500);
  }
});

// DELETE /api/logs/:id
farm.delete("/logs/:id", async (c) => {
  const id = c.req.param("id");

  await db.delete(plantGrowthLogs).where(eq(plantGrowthLogs.id, id));

  return c.json({
    success: true,
    message: "Catatan jurnal berhasil dihapus.",
  });
});

// ==========================================
// 2. PLANTING SCHEDULES API (/api/schedules)
// ==========================================

// GET /api/schedules
farm.get("/schedules", async (c) => {
  await ensureDb();
  const userId = c.req.query("userId");

  let schedules;
  if (userId) {
    schedules = await db
      .select()
      .from(plantingSchedules)
      .where(eq(plantingSchedules.userId, userId))
      .orderBy(desc(plantingSchedules.createdAt))
      .all();
  } else {
    schedules = await db
      .select()
      .from(plantingSchedules)
      .orderBy(desc(plantingSchedules.createdAt))
      .all();
  }

  const latestSchedule = schedules[0];
  if (!latestSchedule) {
    return c.json({ success: true, data: null });
  }

  // Fetch milestones
  const milestones = await db
    .select()
    .from(plantingMilestones)
    .where(eq(plantingMilestones.scheduleId, latestSchedule.id))
    .all();

  return c.json({
    success: true,
    data: {
      id: latestSchedule.id,
      userId: latestSchedule.userId,
      cropType: latestSchedule.cropType,
      startDate: latestSchedule.startDate,
      harvestTargetDate: latestSchedule.harvestTargetDate,
      milestones: milestones.map((m) => ({
        id: m.id,
        date: m.milestoneDate,
        stageName: m.stageName,
        category: m.category,
        notes: m.notes || "",
        completed: Boolean(m.completed),
      })),
    },
  });
});

// POST /api/schedules
farm.post("/schedules", async (c) => {
  await ensureDb();
  const body = await c.req.json();
  const { userId, cropType, startDate, harvestTargetDate, milestones } = body;

  if (!cropType || !startDate) {
    return c.json({ error: "Jenis tanaman dan tanggal mulai tanam wajib diisi." }, 400);
  }

  const scheduleId = "sch_" + Date.now();
  const targetHarvest = harvestTargetDate || new Date(new Date(startDate).getTime() + 90 * 86400000).toISOString().split("T")[0];

  // Insert schedule
  await db.insert(plantingSchedules).values({
    id: scheduleId,
    userId: userId || null,
    cropType: cropType.trim(),
    startDate,
    harvestTargetDate: targetHarvest,
  });

  // Insert milestones
  const createdMilestones: Array<{
    id: string;
    date: string;
    stageName: string;
    category: string;
    notes: string;
    completed: boolean;
  }> = [];
  if (Array.isArray(milestones) && milestones.length > 0) {
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      const mId = `m_${i}_${Date.now()}`;
      const milestoneDate = m.date || new Date(new Date(startDate).getTime() + i * 15 * 86400000).toISOString().split("T")[0];

      let cat: "olahan_tanah" | "pupuk_1" | "pupuk_2" | "cek_hama" | "panen" = "pupuk_1";
      const catLower = (m.category || "").toLowerCase();
      if (catLower.includes("tanah") || catLower.includes("olah")) cat = "olahan_tanah";
      else if (catLower.includes("pupuk_2") || catLower.includes("susulan")) cat = "pupuk_2";
      else if (catLower.includes("hama") || catLower.includes("semprot")) cat = "cek_hama";
      else if (catLower.includes("panen")) cat = "panen";

      await db.insert(plantingMilestones).values({
        id: mId,
        scheduleId,
        milestoneDate,
        stageName: m.stageName || m.title || `Tahap ${i + 1}`,
        category: cat,
        notes: m.notes || "",
        completed: Boolean(m.completed),
      });

      createdMilestones.push({
        id: mId,
        date: milestoneDate,
        stageName: m.stageName || m.title || `Tahap ${i + 1}`,
        category: m.category || "Pupuk 1",
        notes: m.notes || "",
        completed: Boolean(m.completed),
      });
    }
  }

  return c.json({
    success: true,
    message: "Kalender tanam berhasil disimpan!",
    data: {
      id: scheduleId,
      userId: userId || null,
      cropType,
      startDate,
      harvestTargetDate: targetHarvest,
      milestones: createdMilestones,
    },
  });
});

// PATCH /api/schedules/milestones/:id
farm.patch("/schedules/milestones/:id", async (c) => {
  const milestoneId = c.req.param("id");
  const body = await c.req.json();
  const { completed } = body;

  await db
    .update(plantingMilestones)
    .set({ completed: Boolean(completed) })
    .where(eq(plantingMilestones.id, milestoneId));

  return c.json({
    success: true,
    message: "Status tahapan kalender berhasil diperbarui.",
  });
});

// DELETE /api/schedules/:id
farm.delete("/schedules/:id", async (c) => {
  const id = c.req.param("id");

  await db.delete(plantingSchedules).where(eq(plantingSchedules.id, id));

  return c.json({
    success: true,
    message: "Jadwal tanam berhasil dihapus.",
  });
});

// ==========================================
// 3. CUSTOM REMINDERS API (/api/reminders)
// ==========================================

// GET /api/reminders
farm.get("/reminders", async (c) => {
  await ensureDb();
  const userId = c.req.query("userId");

  let reminders;
  if (userId) {
    reminders = await db
      .select()
      .from(customReminders)
      .where(eq(customReminders.userId, userId))
      .orderBy(desc(customReminders.createdAt))
      .all();
  } else {
    reminders = await db
      .select()
      .from(customReminders)
      .orderBy(desc(customReminders.createdAt))
      .all();
  }

  return c.json({
    success: true,
    data: reminders.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      category:
        r.category === "tanam"
          ? "Tanam"
          : r.category === "pestisida"
          ? "Pestisida"
          : r.category === "irigasi"
          ? "Irigasi"
          : r.category === "panen"
          ? "Panen"
          : "Pupuk",
      dueDate: r.dueDate,
      notes: r.notes || "",
      completed: Boolean(r.completed),
      createdAt: r.createdAt,
    })),
  });
});

// POST /api/reminders
farm.post("/reminders", async (c) => {
  await ensureDb();
  const body = await c.req.json();
  const { userId, title, category, dueDate, notes } = body;

  if (!title || !dueDate) {
    return c.json({ error: "Judul dan tanggal tenggat pengingat wajib diisi." }, 400);
  }

  const id = "rem_" + Date.now();
  const catEnum = normalizeCategory(category || "Pupuk");

  await db.insert(customReminders).values({
    id,
    userId: userId || null,
    title: title.trim(),
    category: catEnum,
    dueDate,
    notes: notes ? notes.trim() : "",
    completed: false,
  });

  return c.json({
    success: true,
    message: "Pengingat berhasil ditambahkan!",
    data: {
      id,
      userId: userId || null,
      title: title.trim(),
      category: category || "Pupuk",
      dueDate,
      notes: notes ? notes.trim() : "",
      completed: false,
    },
  });
});

// PATCH /api/reminders/:id
farm.patch("/reminders/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { completed } = body;

  await db
    .update(customReminders)
    .set({ completed: Boolean(completed) })
    .where(eq(customReminders.id, id));

  return c.json({
    success: true,
    message: "Status pengingat berhasil diperbarui.",
  });
});

// DELETE /api/reminders/:id
farm.delete("/reminders/:id", async (c) => {
  const id = c.req.param("id");

  await db.delete(customReminders).where(eq(customReminders.id, id));

  return c.json({
    success: true,
    message: "Pengingat berhasil dihapus.",
  });
});

export default farm;
