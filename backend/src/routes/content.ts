import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db, initDb } from "../db/index.js";
import {
  pestDiseases,
  presetDiagnoses,
  farmerTestimonials,
  faqItems,
  users,
} from "../db/schema.js";

const content = new Hono().basePath("/api");

content.onError((err, c) => {
  console.error("Hono Content API Error:", err);
  return c.json({ error: err.message || "Internal Server Error in Content API" }, 500);
});

content.notFound((c) => {
  return c.json({ error: "Endpoint konten tidak ditemukan." }, 404);
});

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// Helper to retrieve existing admin user ID for reference data seed creation
async function getAdminUserId(): Promise<string> {
  await ensureDb();
  const admin = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).get();
  if (admin) return admin.id;
  const anyUser = await db.select({ id: users.id }).from(users).get();
  if (anyUser) return anyUser.id;
  return "usr_admin_system";
}

// Seed Pests Catalog if empty
async function seedPestsIfEmpty() {
  await ensureDb();
  const existing = await db.select().from(pestDiseases).all();
  if (existing.length === 0) {
    const adminId = await getAdminUserId();
    const DEFAULT_PESTS = [
      {
        id: "wereng-1",
        name: "WERENG BATANG COKELAT",
        crop: "PADI",
        category: "hama" as const,
        symptoms: "Menghisap cairan batang padi, menyebabkan fenomena terbakar (hopperburn) cepat meluas.",
        solutionQuick: "Atur jarak tanam legowo, gunakan agen hayati Beauveria bassiana atau Pimetrozin.",
        iconName: "Bug",
        tag: "Hama Utama Padi",
        createdBy: adminId,
      },
      {
        id: "antraknosa-2",
        name: "ANTRAKNOSA (PATEK)",
        crop: "CABAI / TOMAT",
        category: "penyakit" as const,
        symptoms: "Buah berlubang melingkar hitam seperti terbakar api, menurunkan hasil panen hingga 80%.",
        solutionQuick: "Pangkas buah sakit, semprot fungisida Difenokonazol atau racikan kunyit & serai.",
        iconName: "Flame",
        tag: "Ancaman Cabai musim Hujan",
        createdBy: adminId,
      },
      {
        id: "penggerek-3",
        name: "PENGGEREK BATANG (SUDEP/BELUK)",
        crop: "PADI",
        category: "hama" as const,
        symptoms: "Pucuk daun mati melemes (sudep) atau malai padi hampa berwarna putih (beluk).",
        solutionQuick: "Pasang perangkap lampu (light trap), kendalikan larva dengan fipronil dosis pas.",
        iconName: "Scissors",
        tag: "Penyebab Malai Hampa",
        createdBy: adminId,
      },
      {
        id: "bulai-4",
        name: "BULAI JAGUNG",
        crop: "JAGUNG",
        category: "penyakit" as const,
        symptoms: "Daun pucat bergaris kuning memanjang dari pangkal, jagung tidak berbunga/berbuah.",
        solutionQuick: "Gunakan benih tahan bulai, perlakuan benih fungisida sistemik Dimetomorf.",
        iconName: "Zap",
        tag: "Penyakit Benih",
        createdBy: adminId,
      },
      {
        id: "ulat-grayak-5",
        name: "ULAT GRAYAK FAW (Spodoptera)",
        crop: "JAGUNG & SAYUR",
        category: "hama" as const,
        symptoms: "Daun muda berlubang besar-besar, terdapat kotoran gergaji di pucuk tanaman.",
        solutionQuick: "Aplikasi mikroba Bacillus thuringiensis (Bt) atau emamektin benzoat sore hari.",
        iconName: "Activity",
        tag: "Serangan Cepat",
        createdBy: adminId,
      },
      {
        id: "kresek-6",
        name: "HAWAR DAUN BAKTERI (KRESEK)",
        crop: "PADI",
        category: "penyakit" as const,
        symptoms: "Bercak kebasahan di pinggir daun, berlanjut mengering abu-abu seperti jerami.",
        solutionQuick: "Kurangi pupuk Nitrogen (Urea) berlebih, gunakan bakterisida tembaga sulfat.",
        iconName: "Droplets",
        tag: "Penyakit Musim Hujan",
        createdBy: adminId,
      },
    ];

    for (const p of DEFAULT_PESTS) {
      await db.insert(pestDiseases).values(p);
    }
  }
}

// Seed Presets if empty
async function seedPresetsIfEmpty() {
  await ensureDb();
  const existing = await db.select().from(presetDiagnoses).all();
  if (existing.length === 0) {
    const adminId = await getAdminUserId();
    const DEFAULT_PRESETS = [
      {
        id: "patek-cabai",
        crop: "CABAI",
        title: "ANBRAKNOSA (PATEK) CABAI",
        symptoms: "Bercak melingkar kecokelatan berair pada buah cabai, lama-lama mengering dan busuk hitam.",
        severity: "parah" as const,
        solution: "Semprot fungisida tembaga hidroksida / ektrak daun mimba + kurangi kelembapan bedengan.",
        createdBy: adminId,
      },
      {
        id: "wereng-padi",
        crop: "PADI",
        title: "WERENG COKELAT (Nilaparvata lugens)",
        symptoms: "Rumpun padi menguning memerah, mengering seperti terbakar (hopperburn) di dasar rumpun.",
        severity: "kritis" as const,
        solution: "Keringkan sawah secara berkala (intermittent), ganti insektisida bahan aktif Pimetrozin.",
        createdBy: adminId,
      },
      {
        id: "bulai-jagung",
        crop: "JAGUNG",
        title: "BULAI JAGUNG (Peronosclerospora)",
        symptoms: "Daun muda bergaris-garis putih kekuningan sejajar tulang daun, tanaman kerdil.",
        severity: "sedang" as const,
        solution: "Cabut & bakar tanaman terinfeksi, perlakuan benih dengan Dimetomorf sebelum tanam.",
        createdBy: adminId,
      },
      {
        id: "layu-fusarium",
        crop: "TOMAT / CABAI",
        title: "LAYU FUSARIUM (Jamur Tanah)",
        symptoms: "Daun bawah melayu di siang hari lalu segar kembali malam hari, lama-lama mati total.",
        severity: "parah" as const,
        solution: "Kocor agen hayati Trichoderma harzianum + tabur kapur dolomit untuk naikkan pH tanah.",
        createdBy: adminId,
      },
    ];

    for (const pr of DEFAULT_PRESETS) {
      await db.insert(presetDiagnoses).values(pr);
    }
  }
}

// Seed Testimonials if empty
async function seedTestimonialsIfEmpty() {
  await ensureDb();
  const existing = await db.select().from(farmerTestimonials).all();
  if (existing.length === 0) {
    const adminId = await getAdminUserId();
    const DEFAULT_TESTIMONIALS = [
      {
        id: "t1",
        userId: adminId,
        role: "Ketua Kelompok Tani Rejeki Makmur",
        crop: "Petani Padi (4 Hektar)",
        quote: "Awalnya bingung daun padi melayu dan menguning serentak. Cukup foto lewat HP, CahTani AI langsung tau itu bercak cokelat dan kasih resep racikan hayati. Panen padi selamat 18 ton!",
        impact: "Panen Selamat 100%",
      },
      {
        id: "t2",
        userId: adminId,
        role: "Petani Cabai Rawit Merah",
        crop: "Petani Cabai (1.5 Hektar)",
        quote: "Cabai saya kena patek pas hujan lebat. Pakai CahTani dapet saran kombinasi fungisida & pangkas sanitasi. Sangat mudah dibaca buat saya yang umur 52 tahun!",
        impact: "Hemat Biaya Obat Rp 4.5 Juta",
      },
      {
        id: "t3",
        userId: adminId,
        role: "Petani Jagung Hibrida",
        crop: "Petani Jagung (3 Hektar)",
        quote: "Ulat grayak habis dihantam cara penanganan dari CahTani. Penjelasannya gamblang, urutannya jelas, takat obatnya presisi. Luar biasa bermanfaat buat petani daerah!",
        impact: "Produksi Naik 35%",
      },
      {
        id: "t4",
        userId: adminId,
        role: "Anggota Gapoktan Suka Tani",
        crop: "Petani Padi & Bawang",
        quote: "Gak perlu nunggu penyuluh datang berhari-hari. Tinggal buka CahTani AI dari lokasi sawah, solusi langsung keluar detik itu juga. Tulisan besar dan gampang dibaca!",
        impact: "Diagnosa Cepat < 10 Detik",
      },
    ];

    for (const t of DEFAULT_TESTIMONIALS) {
      await db.insert(farmerTestimonials).values(t);
    }
  }
}

// Seed FAQ if empty
async function seedFaqsIfEmpty() {
  await ensureDb();
  const existing = await db.select().from(faqItems).all();
  if (existing.length === 0) {
    const adminId = await getAdminUserId();
    const DEFAULT_FAQS = [
      {
        id: "faq-1",
        category: "CARA PENGGUNAAN",
        question: "BAGAIMANA CARA MENGUNGAH FOTO DAUN TANAMAN YANG SAKIT?",
        answer: "Cukup tekan tombol 'UNGGAH FOTO' di bagian Diagnosa AI, lalu pilih foto daun dari galeri HP Anda atau ambil foto langsung menggunakan kamera HP. Pastikan foto cukup terang dan fokus pada bagian daun atau buah yang terserang hama/penyakit.",
        createdBy: adminId,
      },
      {
        id: "faq-2",
        category: "AKURASI AI",
        question: "SEBERAPA AKURAT DIAGNOSA PENYAKIT DARI CAHTANI AI?",
        answer: "CahTani AI ditenagai model AI kecerdasan buatan Gemini 3.6 Flash yang telah dilatih dengan ribuan dataset penyakit tanaman tropis Indonesia. Akurasi diagnosa mencapai di atas 95% untuk tanaman utama seperti padi, cabai, jagung, bawang, dan sayuran.",
        createdBy: adminId,
      },
      {
        id: "faq-3",
        category: "PENGOBATAN",
        question: "APAKAH SARAN REKOMENDASI OBAT AMAN UNTUK TANAMAN DAN LINGKUNGAN?",
        answer: "Saran penanganan dari CahTani AI mengedepankan prinsip Pengendalian Hama Terpadu (PHT). AI selalu mendahulukan rekomendasi obat alami/agens hayati (seperti Trichoderma, Beauveria, pestisida nabati) sebelum merekomendasikan obat kimiawi berizin resmi dengan dosis tepat.",
        createdBy: adminId,
      },
      {
        id: "faq-4",
        category: "BIAYA & AKSES",
        question: "APAKAH APLIKASI CAHTANI AI INI GRATIS DIGUNAKAN PETANI?",
        answer: "Ya, 100% Gratis! Layanan konsultasi AI dokter tanaman, kalender tanam otomatis, jurnal perkembangan, dan rekomendasi toko dapat digunakan oleh seluruh petani Indonesia tanpa dipungut biaya.",
        createdBy: adminId,
      },
    ];

    for (const f of DEFAULT_FAQS) {
      await db.insert(faqItems).values(f);
    }
  }
}

// ==========================================
// 1. PESTS API (/api/pests)
// ==========================================
content.get("/pests", async (c) => {
  await ensureDb();
  await seedPestsIfEmpty();

  const data = await db.select().from(pestDiseases).all();
  return c.json({
    success: true,
    data: data.map((p) => ({
      id: p.id,
      name: p.name,
      crop: p.crop,
      category: p.category === "hama" ? "HAMA" : p.category === "penyakit" ? "PENYAKIT" : "GANGGUAN NUTRISI",
      symptoms: p.symptoms,
      solutionQuick: p.solutionQuick,
      iconName: p.iconName || "Bug",
      tag: p.tag || "",
    })),
  });
});

// ==========================================
// 2. PRESETS API (/api/presets)
// ==========================================
content.get("/presets", async (c) => {
  await ensureDb();
  await seedPresetsIfEmpty();

  const data = await db.select().from(presetDiagnoses).all();
  return c.json({
    success: true,
    data: data.map((p) => ({
      id: p.id,
      crop: p.crop,
      title: p.title,
      symptoms: p.symptoms,
      severity: p.severity.toUpperCase(),
      solution: p.solution,
    })),
  });
});

// ==========================================
// 3. TESTIMONIALS API (/api/testimonials)
// ==========================================
content.get("/testimonials", async (c) => {
  await ensureDb();
  await seedTestimonialsIfEmpty();

  const list = await db
    .select({
      id: farmerTestimonials.id,
      role: farmerTestimonials.role,
      crop: farmerTestimonials.crop,
      quote: farmerTestimonials.quote,
      impact: farmerTestimonials.impact,
      userName: users.name,
      userLocation: users.location,
    })
    .from(farmerTestimonials)
    .leftJoin(users, eq(farmerTestimonials.userId, users.id))
    .all();

  return c.json({
    success: true,
    data: list.map((t) => ({
      id: t.id,
      name: t.userName || "Petani Indonesia",
      role: t.role,
      location: t.userLocation || "Indonesia",
      crop: t.crop,
      quote: t.quote,
      impact: t.impact,
    })),
  });
});

// ==========================================
// 4. FAQS API (/api/faqs)
// ==========================================
content.get("/faqs", async (c) => {
  await ensureDb();
  await seedFaqsIfEmpty();

  const data = await db.select().from(faqItems).all();
  return c.json({
    success: true,
    data: data.map((f) => ({
      category: f.category,
      question: f.question,
      answer: f.answer,
    })),
  });
});

export default content;
