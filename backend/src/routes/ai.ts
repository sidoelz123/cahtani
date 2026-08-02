import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { db, initDb, asyncLocalStorage } from "../db/index.js";
import { diagnosisRecords, chatSessions, chatMessages, users } from "../db/schema.js";

const aiApp = new Hono().basePath("/api");

aiApp.onError((err, c) => {
  console.error("Hono AI App Error:", err);
  return c.json({ error: err.message || "Internal Server Error in AI Service" }, 500);
});

aiApp.notFound((c) => {
  return c.json({ error: "Endpoint AI tidak ditemukan." }, 404);
});

// Lazy DB initializer
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// Helper to resolve valid userId to satisfy foreign keys
async function resolveValidUserId(requestedUserId?: string | null): Promise<string | null> {
  if (!requestedUserId) return null;
  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, requestedUserId)).get();
  if (user) return user.id;
  const fallback = await db.select({ id: users.id }).from(users).get();
  return fallback ? fallback.id : null;
}

// Helper to get Gemini client
const getGeminiClient = (c?: any) => {
  const store = asyncLocalStorage.getStore();
  const apiKey = c?.env?.GEMINI_API_KEY || store?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di lingkungan server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper for model fallback and retries
async function generateWithFallback(ai: GoogleGenAI, params: { contents: any; config: any }) {
  const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt + 1} with model ${model} failed: ${err?.message || err}`);
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }
  throw lastError;
}

// ==========================================
// 1. PLANT DIAGNOSIS API (/api/diagnose & /api/diagnosis)
// ==========================================

async function handleDiagnosisProcess(c: any) {
  await ensureDb();
  const body = await c.req.json();
  const { prompt, imageBase64, mimeType, cropType, region, userId, farmerProfile } = body;

  if (!prompt && !imageBase64) {
    return c.json({ error: "Mohon masukkan deskripsi gejala atau unggah foto tanaman." }, 400);
  }

  const ai = getGeminiClient();

  let profileContext = "";
  if (farmerProfile && farmerProfile.name) {
    profileContext = `
PROFIL PETANI:
- Nama: ${farmerProfile.name}
- Panggilan/Gender: ${farmerProfile.gender || "Petani"}
- Lokasi Lengkap: ${farmerProfile.location || region || "Indonesia"}
- Tanaman yang Ditanam: ${farmerProfile.crops || cropType}
Sapa petani secara ramah menggunakan panggilannya (contoh: ${farmerProfile.gender === "Ibu (Wanita)" ? "Bu" : "Pak"} ${farmerProfile.name}).
`;
  }

  const systemInstruction = `Anda adalah CahTani AI — Asisten Ahli Pertanian dan Dokter Tanaman khusus untuk Petani Indonesia.
${profileContext}
BATASAN TOPIK SANGAT KETAT:
Anda HANYA diperbolehkan menjawab pertanyaan yang berkaitan dengan dunia pertanian, budidaya tanaman, penyakit & hama tanaman, tanah, pemupukan, pestisida/obat tanaman, irigasi, dan topik seputar sawah/ladang.
Jika pertanyaan atau gambar TIDAK berhubungan dengan pertanian (misalnya teknologi umum, pemrograman, politik, hiburan, olahraga, resep makanan non-pertanian, atau tugas sekolah umum), Anda HARUS MENOLAK dengan sopan dan mengingatkan pengguna bahwa Anda hanya melayani pertanyaan seputar pertanian.

Tugas utama Anda untuk pertanyaan pertanian:
1. Mendiagnosis penyakit tanaman atau mengidentifikasi hama (pests) secara cepat, akurat, dan praktis.
2. Memberikan rekomendasi penanganan konkret: langkah penanganan organik/hayati, penanganan kimiawi (jika diperlukan dengan dosis aman), tindakan pencegahan, serta tata cara perawatan tanah/pupuk.
3. Gaya Bahasa: Bahasa Indonesia yang ramah, sopan, tajam, dan mudah dipahami oleh petani (usia 30-70 tahun). Gunakan istilah lokal jika relevan (misal: wereng, penggerek batang, antraknosa, busuk daun, kresek, bulai).
4. Struktur Jawaban:
   - 🔍 **IDENTIFIKASI MASALAH**: Nama penyakit/hama & tingkat keparahan.
   - 🌿 **PENYEBAB UTAMA**: Bakteri, jamur, virus, atau kondisi cuaca/tanah.
   - 🛠️ **LANGKAH PENANGANAN SEGERA**: Tindakan darurat hari ini.
   - 💊 **REKOMENDASI OBAT/OBAT HAYATI**: Solusi pestisida/fungisida atau racikan alami (misal pestisida nabati daun mimba/serai).
   - 🛡️ **PENCEGAHAN JANGKA PANJANG**: Cara cegah penularan ke petak lahan lain.

Jawaban harus ringkas, jelas, dengan poin-poin tebal yang sangat mudah dibaca.`;

  const contentsParts: any[] = [];

  if (imageBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    });
  }

  const fullPrompt = `Tanaman: ${cropType || "Umum/Padi/Jagung/Cabai/Sayur"}
Lokasi/Wilayah: ${region || "Indonesia"}
Pertanyaan/Keterangan Gejala Petani:
${prompt || "Mohon analisa foto daun/tanaman ini dan berikan diagnosa serta solusinya."}`;

  contentsParts.push({ text: fullPrompt });

  const response = await generateWithFallback(ai, {
    contents: { parts: contentsParts },
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  const resultText = response.text || "Tidak ada hasil diagnosa yang dihasilkan.";

  // Save record to SQLite diagnosis_records
  const recordId = "diag_" + Date.now();
  const rawUserId = userId || farmerProfile?.id || null;
  const effectiveUserId = await resolveValidUserId(rawUserId);

  try {
    await db.insert(diagnosisRecords).values({
      id: recordId,
      userId: effectiveUserId,
      cropType: cropType || "Umum",
      region: region || "Indonesia",
      symptoms: prompt || null,
      imageBase64: imageBase64 || null,
      resultMarkdown: resultText,
    });
  } catch (dbErr) {
    console.error("Failed to persist diagnosis record:", dbErr);
  }

  return c.json({
    success: true,
    result: resultText,
    recordId,
  });
}

// POST /api/diagnose
aiApp.post("/diagnose", handleDiagnosisProcess);

// POST /api/diagnosis
aiApp.post("/diagnosis", handleDiagnosisProcess);

// GET /api/diagnosis (Fetch Diagnosis History)
aiApp.get("/diagnosis", async (c) => {
  await ensureDb();
  const userId = c.req.query("userId");

  let records;
  if (userId) {
    records = await db
      .select()
      .from(diagnosisRecords)
      .where(eq(diagnosisRecords.userId, userId))
      .orderBy(desc(diagnosisRecords.createdAt))
      .all();
  } else {
    records = await db
      .select()
      .from(diagnosisRecords)
      .orderBy(desc(diagnosisRecords.createdAt))
      .all();
  }

  return c.json({
    success: true,
    data: records,
  });
});

// DELETE /api/diagnosis/:id
aiApp.delete("/diagnosis/:id", async (c) => {
  await ensureDb();
  const recordId = c.req.param("id");

  await db.delete(diagnosisRecords).where(eq(diagnosisRecords.id, recordId));

  return c.json({
    success: true,
    message: "Catatan riwayat diagnosa berhasil dihapus.",
  });
});

// ==========================================
// 2. AI CHAT ASSISTANT API (/api/chat)
// ==========================================

// POST /api/chat
aiApp.post("/chat", async (c) => {
  await ensureDb();
  const body = await c.req.json();
  const { messages, cropType, farmerProfile, userId, sessionId } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "Messages array required and cannot be empty." }, 400);
  }

  const ai = getGeminiClient();

  let profileContext = "";
  if (farmerProfile && farmerProfile.name) {
    profileContext = `
PROFIL PETANI PENANYA:
- Nama Lengkap/Panggilan: ${farmerProfile.name}
- Jenis Kelamin/Panggilan: ${farmerProfile.gender || "Petani"}
- Lokasi Lengkap Sawah/Ladang: ${farmerProfile.location || "Indonesia"}
- Tanaman yang Ditanam: ${farmerProfile.crops || cropType || "Semua Tanaman"}

PETUNJUK SAPAAN:
Gunakan panggilannya secara akrab dan ramah (contoh: "Bapak ${farmerProfile.name}" atau "Ibu ${farmerProfile.name}"). Berikan rekomendasi pertanian yang sangat disesuaikan dengan kondisi geografis & cuaca wilayah ${farmerProfile.location}.
`;
  }

  const systemInstruction = `Anda adalah CahTani AI, asisten percakapan khusus pertanian untuk petani Indonesia.
${profileContext}
BATASAN UTAMA & ATURAN MUTLAK:
1. Anda HANYA diizinkan menjawab pertanyaan yang berkaitan dengan PERTANIAN DAN PERKEBUNAN (seperti tanaman: ${cropType || "semua jenis tanaman"}, diagnosa hama, penyakit daun/buah, pemupukan, racikan pestisida, perawatan tanah, irigasi, dan masalah sawah/ladang).
2. Jika pengguna menanyakan hal di luar dunia pertanian (misalnya tentang coding, matematika umum, sejarah umum, selebriti, politik, hiburan, olahraga, resep makanan non-pertanian, dll), Anda HARUS MENOLAK dengan sopan.
   Contoh respon penolakan: "Mohon maaf, saya adalah CahTani AI yang khusus bertugas membantu petani seputar pertanian, hama, dan penyakit tanaman. Silakan tanyakan hal seputar perawatan tanaman, pupuk, atau kendala di sawah/ladang Anda!"

3. Jawablah dengan ramah, langsung pada inti masalah pertanian, menggunakan format ringkas, praktis, dan bahasa Indonesia yang mudah dipahami oleh petani.`;

  const formattedContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const response = await generateWithFallback(ai, {
    contents: formattedContents,
    config: {
      systemInstruction,
      temperature: 0.5,
    },
  });

  const replyText = response.text || "Mohon maaf, terjadi kesalahan memproses percakapan.";

  // Persist session & messages if userId/sessionId available
  const rawUserId = userId || farmerProfile?.id || null;
  const effectiveUserId = await resolveValidUserId(rawUserId);
  let currentSessionId = sessionId;

  if (!currentSessionId) {
    currentSessionId = "sess_" + Date.now();
  }

  try {
    // Ensure session exists
    const existingSession = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, currentSessionId))
      .get();

    if (!existingSession) {
      await db.insert(chatSessions).values({
        id: currentSessionId,
        userId: effectiveUserId,
        cropType: cropType || "Umum",
      });
    }

    // Insert last user message
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user") {
      await db.insert(chatMessages).values({
        id: "msg_" + Date.now() + "_u",
        sessionId: currentSessionId,
        sender: "user",
        text: lastUserMsg.content,
      });
    }

    // Insert bot reply
    await db.insert(chatMessages).values({
      id: "msg_" + Date.now() + "_b",
      sessionId: currentSessionId,
      sender: "bot",
      text: replyText,
    });
  } catch (dbErr) {
    console.error("Failed to persist chat session/messages:", dbErr);
  }

  return c.json({
    reply: replyText,
    sessionId: currentSessionId,
  });
});

// GET /api/chat/sessions (List Sessions)
aiApp.get("/chat/sessions", async (c) => {
  await ensureDb();
  const userId = c.req.query("userId");

  let sessions;
  if (userId) {
    sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt))
      .all();
  } else {
    sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.createdAt))
      .all();
  }

  return c.json({
    success: true,
    data: sessions,
  });
});

// GET /api/chat/messages (Get Messages for Session)
aiApp.get("/chat/messages", async (c) => {
  await ensureDb();
  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    return c.json({ error: "sessionId required." }, 400);
  }

  const msgs = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .all();

  return c.json({
    success: true,
    data: msgs,
  });
});

// DELETE /api/chat/sessions/:id (Delete Chat Session)
aiApp.delete("/chat/sessions/:id", async (c) => {
  await ensureDb();
  const sessionId = c.req.param("id");

  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));

  return c.json({
    success: true,
    message: "Sesi percakapan berhasil dihapus.",
  });
});

export default aiApp;
