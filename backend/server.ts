import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { GoogleGenAI } from "@google/genai";

import { asyncLocalStorage } from "./src/db/index.js";
import authApp from "./src/routes/auth.js";
import farmApp from "./src/routes/farm.js";
import shopApp from "./src/routes/shop.js";
import aiApp from "./src/routes/ai.js";
import contentApp from "./src/routes/content.js";
import { openApiSpec } from "./src/docs/openapi.js";

const app = new Hono();

// Store Hono request context in AsyncLocalStorage so DB proxy & secrets work seamlessly
app.use("*", async (c, next) => {
  return asyncLocalStorage.run(c, () => next());
});

// Enable CORS for frontend requests
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// OpenAPI JSON & Swagger UI Documentation
app.get("/api/openapi.json", (c) => c.json(openApiSpec));
app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));
app.get("/api/docs", swaggerUI({ url: "/api/openapi.json" }));
app.get("/swagger", swaggerUI({ url: "/api/openapi.json" }));

// Error handling
app.onError((err, c) => {
  console.error("Hono Backend Error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// Healthcheck
app.get("/api/health", (c) => {
  return c.json({ status: "ok", framework: "HonoJS", timestamp: new Date().toISOString() });
});

// Proxy for Wilayah.id API to bypass browser CORS restrictions
app.get("/api/wilayah/*", async (c) => {
  const path = c.req.path.replace(/^\/api\/wilayah\//, "");
  const targetUrl = `https://wilayah.id/api/${path}`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return c.json({ error: `Gagal mengambil data dari wilayah.id: ${res.statusText}` }, res.status as any);
    }
    const data = await res.json();
    return c.json(data);
  } catch (err: any) {
    console.error("Wilayah Proxy Error:", err);
    return c.json({ error: err.message || "Gagal menghubungkan ke wilayah.id" }, 500);
  }
});

// Mount Hono route modules
app.route("/", authApp);
app.route("/", farmApp);
app.route("/", shopApp);
app.route("/", aiApp);
app.route("/", contentApp);

// Helper function to initialize Gemini Client safely
const getGeminiClient = (c?: any) => {
  const store = asyncLocalStorage.getStore();
  const apiKey = c?.env?.GEMINI_API_KEY || store?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
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

// Helper function for fallback models
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

// Weather AI Advisory Endpoint
app.post("/api/weather-advisory", async (c) => {
  try {
    const body = await c.req.json();
    const { location, tempC, airHumidity, soilHumidity, rainProbability, windSpeedKmH, cropType } = body;
    const ai = getGeminiClient();

    const prompt = `LOKASI PETANI: ${location || "Indonesia"}
Suhu: ${tempC}°C, Kelembapan Udara: ${airHumidity}%, Kelembapan Tanah: ${soilHumidity}%, Peluang Hujan: ${rainProbability}%, Kecepatan Angin: ${windSpeedKmH} km/jam.
Tanaman Utama: ${cropType || "Padi / Cabai / Jagung"}

Berikan saran ringkas, tajam, & langsung praktek dalam Bahasa Indonesia untuk petani:
1. SARAN PEMUPUKAN: Apakah kondisi suhu/kelembapan ini ideal untuk penaburan pupuk padat atau pupuk cair? Sebutkan alasannya.
2. SARAN PENYEMPROTAN PESTISIDA/FUNGISIDA: Apakah kecepatan angin & peluang hujan aman untuk penyemprotan hari ini?

Jawab singkat maksimal 2-3 kalimat per poin.`;

    const response = await generateWithFallback(ai, {
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: "Anda adalah pakar agronomis pertanian Indonesia. Berikan instruksi cuaca & pertanian yang sangat praktis dan aman untuk petani.",
        temperature: 0.3,
      },
    });

    return c.json({ advice: response.text });
  } catch (error: any) {
    console.error("Error in /api/weather-advisory:", error);
    return c.json({
      advice: "Jaga kelembapan tanah, hindari menyemprot pestisida saat angin di atas 15 km/jam atau hujan lebat.",
    });
  }
});

// Automated AI Planting Schedule Generator Endpoint
app.post("/api/planting-schedule", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const { cropType, startDate, location } = body || {};
  try {
    const ai = getGeminiClient();

    const prompt = `Buatkan jadwal kalender penanaman pertanian otomatis untuk jenis tanaman: "${cropType || "Padi"}" yang dimulai pada tanggal: "${startDate || new Date().toISOString().split("T")[0]}" di wilayah "${location || "Indonesia"}".

Keluarkan respon HANYA berupa JSON valid dalam format persis seperti ini (tanpa markdown tambahan):
{
  "harvestTargetDate": "YYYY-MM-DD",
  "milestones": [
    {
      "category": "Olahan Tanah",
      "stageName": "Pengolahan Tanah & Pengapuran/Pupuk Dasar",
      "daysFromStart": 0,
      "notes": "Penaburan pupuk kandang/kompos dan pengemburan tanah."
    },
    {
      "category": "Pupuk 1",
      "stageName": "Pemupukan Susulan 1 (Vegetatif Awal)",
      "daysFromStart": 14,
      "notes": "Penaburan NPK & Urea dosis awal untuk pacu tunas."
    },
    {
      "category": "Pupuk 2",
      "stageName": "Pemupukan Susulan 2 (Generatif/Pembungaan)",
      "daysFromStart": 35,
      "notes": "Aplikasi pupuk tinggi Kalium (KCL) & NPK agar buah/bulir berisi."
    },
    {
      "category": "Cek Hama",
      "stageName": "Inspeksi Hama & Penyemprotan Pencegahan",
      "daysFromStart": 50,
      "notes": "Pemeriksaan serangan ulat/jamur dan penyemprotan organik/hayati."
    },
    {
      "category": "Panen",
      "stageName": "Target Masa Panen Raya",
      "daysFromStart": 90,
      "notes": "Pengeringan lahan & pemanenan hasil saat 85% buah/bulir menguning."
    }
  ]
}`;

    const response = await generateWithFallback(ai, {
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: "Anda adalah sistem kalender pertanian otomatis. Keluarkan HANYA JSON valid.",
        temperature: 0.2,
      },
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(rawText);

    return c.json(data);
  } catch (error: any) {
    console.error("Error in /api/planting-schedule:", error);
    const start = new Date(startDate || Date.now());

    const addDays = (d: Date, days: number) => {
      const result = new Date(d);
      result.setDate(result.getDate() + days);
      return result.toISOString().split("T")[0];
    };

    return c.json({
      harvestTargetDate: addDays(start, 90),
      milestones: [
        {
          category: "Olahan Tanah",
          stageName: "Pengolahan Lahan & Pupuk Dasar",
          daysFromStart: 0,
          notes: "Gemburkan tanah dan campurkan pupuk kompos/kandang.",
        },
        {
          category: "Pupuk 1",
          stageName: "Pemupukan Susulan Pertama (14 Hari)",
          daysFromStart: 14,
          notes: "Aplikasi NPK / Urea untuk pertumbuhan akar & daun.",
        },
        {
          category: "Pupuk 2",
          stageName: "Pemupukan Susulan Kedua (35 Hari)",
          daysFromStart: 35,
          notes: "Aplikasi pupuk pembukaan bunga & pembuahan (KCL/KNO3).",
        },
        {
          category: "Cek Hama",
          stageName: "Pemeriksaan Berkala Hama & Penyakit",
          daysFromStart: 50,
          notes: "Amati daun & batang dari serangan ulat, kresek, atau jamur.",
        },
        {
          category: "Panen",
          stageName: "Estimasi Hari Panen Raya",
          daysFromStart: 90,
          notes: "Panen saat bulir/buah telah menguning sempurna.",
        },
      ],
    });
  }
});

// SEO Endpoints: robots.txt
app.get("/robots.txt", (c) => {
  const host = c.req.header("host") || "cahtani.ai";
  const protocol = c.req.header("x-forwarded-proto") || "https";
  return c.text(`User-agent: *
Allow: /
Disallow: /dashboard

Sitemap: ${protocol}://${host}/sitemap.xml
`);
});

// SEO Endpoints: sitemap.xml
app.get("/sitemap.xml", (c) => {
  const host = c.req.header("host") || "cahtani.ai";
  const protocol = c.req.header("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;
  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  c.header("content-type", "application/xml");
  return c.body(xml);
});

// Only start standalone HTTP server when executed directly as entry script
const isDirectEntry = process.argv[1] && (process.argv[1].endsWith("backend/server.ts") || process.argv[1].endsWith("backend/server.js"));
if (isDirectEntry || process.env.RUN_STANDALONE_BACKEND === "true") {
  const port = Number(process.env.BACKEND_PORT) || 5000;
  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`🚀 Pure HonoJS Backend Server running on http://localhost:${info.port}`);
  });
}

export default app;
