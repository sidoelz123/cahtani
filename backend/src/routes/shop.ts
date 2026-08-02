import { Hono } from "hono";
import { eq, like, or, and, desc } from "drizzle-orm";
import { db, initDb } from "../db/index.js";
import { productCategories, shopProducts, users } from "../db/schema.js";

const shop = new Hono().basePath("/api");

shop.onError((err, c) => {
  console.error("Hono Shop App Error:", err);
  return c.json({ error: err.message || "Internal Server Error in Shop API" }, 500);
});

shop.notFound((c) => {
  return c.json({ error: "Endpoint toko tidak ditemukan." }, 404);
});

// Lazy DB initializer
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// Default Categories
const DEFAULT_CATEGORIES = [
  { id: "cat_PUPUK", key: "PUPUK", label: "PUPUK & NUTRISI", iconName: "🧪", sortOrder: 1 },
  { id: "cat_PESTISIDA", key: "PESTISIDA", label: "OBAT & PESTISIDA", iconName: "🛡️", sortOrder: 2 },
  { id: "cat_MEDIA_TANAM", key: "MEDIA_TANAM", label: "MEDIA TANAM & TANAH", iconName: "🌱", sortOrder: 3 },
  { id: "cat_ALAT_MESIN", key: "ALAT_MESIN", label: "ALAT & MESIN TANAM", iconName: "🚜", sortOrder: 4 },
  { id: "cat_BENIH", key: "BENIH", label: "BENIH UNGGUL", iconName: "🌽", sortOrder: 5 },
];

// Default Products Seed Data
const DEFAULT_PRODUCTS = [
  {
    id: "prod-npk-161616",
    name: "Pupuk NPK Mutiara 16-16-16 Repack 1kg / 5kg Super Premium",
    categoryKey: "PUPUK",
    cropTarget: "Padi, Cabai, Jagung, Bawang",
    rating: 4.9,
    soldCount: "12.5k+ Terjual",
    priceRange: "Rp 18.000 - Rp 85.000",
    description: "Pupuk seimbang NPK (Nitrogen, Phospat, Kalium) impor kualitas tinggi untuk mempercepat pertumbuhan vegetatif dan generative tanaman.",
    aiRecommendation: "Rekomendasi utama CahTani AI saat fase awal pemupukan susulan 1 & 2 untuk menguatkan batang dan merangsang anakan.",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
    searchQuery: "pupuk npk mutiara 161616",
    badge: "Paling Laris",
    shopeeKeyword: "pupuk npk mutiara 16 16 16 1kg",
    tokopediaKeyword: "pupuk npk mutiara 16 16 16",
    tiktokKeyword: "pupuk npk mutiara 161616 asli",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=pupuk%20npk%20mutiara%2016%2016%2016%201kg&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=pupuk%20npk%20mutiara%2016%2016%2016&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=pupuk%20npk%20mutiara%20161616%20asli",
  },
  {
    id: "prod-trichoderma",
    name: "Agen Hayati Trichoderma Harzianum Powder 500g (Anti Layu Fusarium)",
    categoryKey: "PUPUK",
    cropTarget: "Cabai, Tomat, Bawang, Padi",
    rating: 4.9,
    soldCount: "8.2k+ Terjual",
    priceRange: "Rp 35.000 - Rp 65.000",
    description: "Jamur antagonis hayati pengendali penyakit jamur tular tanah seperti Layu Fusarium, Akar Gada, dan Busuk Pangkal Batang.",
    aiRecommendation: "Wajib dikocor saat pengolahan lahan & pembuatan bedengan untuk mencegah serangan patek dan layu sejak dini.",
    image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=800&auto=format&fit=crop",
    searchQuery: "trichoderma harzianum bio hayati",
    badge: "Rekomendasi Organik",
    shopeeKeyword: "trichoderma harzianum powder 500g",
    tokopediaKeyword: "trichoderma harzianum bio organik",
    tiktokKeyword: "trichoderma harzianum obat akar",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=trichoderma%20harzianum%20powder%20500g&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=trichoderma%20harzianum%20bio%20organik&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=trichoderma%20harzianum%20obat%20akar",
  },
  {
    id: "prod-poc-gandasil",
    name: "Pupuk Daun Gandasil D & Gandasil B Original 500 Gram",
    categoryKey: "PUPUK",
    cropTarget: "Semua Jenis Tanaman",
    rating: 4.8,
    soldCount: "15.1k+ Terjual",
    priceRange: "Rp 28.000 - Rp 52.000",
    description: "Pupuk foliar larut air dengan mikronutrisi lengkap. Gandasil D untuk fase pertumbuhan daun, Gandasil B untuk lebat pembungaan & buah.",
    aiRecommendation: "Aplikasi semprot pagi hari dikombinasikan dengan perekat untuk hasil daun hijau pekat dan bobot buah maksimal.",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop",
    searchQuery: "pupuk gandasil d dan b",
    badge: "Paling Laris",
    shopeeKeyword: "pupuk gandasil d gandasil b original",
    tokopediaKeyword: "gandasil d b 500gr",
    tiktokKeyword: "pupuk gandasil daun buah",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=pupuk%20gandasil%20d%20gandasil%20b%20original&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=gandasil%20d%20b%20500gr&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=pupuk%20gandasil%20daun%20buah",
  },
  {
    id: "prod-humic-acid",
    name: "Asam Humat (Humic Acid) 90% Powder 1Kg — Pembenah Tanah Kritis",
    categoryKey: "PUPUK",
    cropTarget: "Lahan Pertanian & Perkebunan",
    rating: 4.9,
    soldCount: "4.3k+ Terjual",
    priceRange: "Rp 45.000 - Rp 78.000",
    description: "Meningkatkan kapasitas tukar kation tanah, memperbaiki struktur tanah asam/keras, serta memaksimalkan penyerapan pupuk kimia.",
    aiRecommendation: "Sangat direkomendasikan untuk sawah/ladang yang sering dipupuk kimia agar tanah kembali gembur & kaya mikroorganisme.",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop",
    searchQuery: "asam humat humic acid 1kg",
    badge: "Rekomendasi AI",
    shopeeKeyword: "asam humat humic acid 90 1kg",
    tokopediaKeyword: "humic acid asam humat pembenah tanah",
    tiktokKeyword: "asam humat pembenah tanah",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=asam%20humat%20humic%20acid%2090%201kg&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=humic%20acid%20asam%20humat%20pembenah%20tanah&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=asam%20humat%20pembenah%20tanah",
  },
  {
    id: "prod-regent-50sc",
    name: "Insektisida Regent 50SC Red / White (Fipronil) 100ml / 250ml / 500ml",
    categoryKey: "PESTISIDA",
    cropTarget: "Padi, Jagung, Cabai",
    rating: 4.9,
    soldCount: "21.4k+ Terjual",
    priceRange: "Rp 38.000 - Rp 140.000",
    description: "Insektisida sistemik racun kontak & lambung untuk membasmi Wereng Cokelat, Ulat Penggerek Batang (Sundep/Beluk), dan Thrips.",
    aiRecommendation: "Solusi cepat saat terjadi ancaman insiden wereng padi & penggerek batang di fasa pembentukan bulir.",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=800&auto=format&fit=crop",
    searchQuery: "insektisida regent 50sc fipronil",
    badge: "Kritis Hama",
    shopeeKeyword: "insektisida regent 50sc red 250ml",
    tokopediaKeyword: "regent 50sc fipronil insektisida",
    tiktokKeyword: "insektisida regent wereng padi",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=insektisida%20regent%2050sc%20red%20250ml&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=regent%2050sc%20fipronil%20insektisida&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=insektisida%20regent%20wereng%20padi",
  },
  {
    id: "prod-antracol-70wp",
    name: "Fungisida Antracol 70 WP (Propineb + Seng Zink) 250g / 500g / 1kg",
    categoryKey: "PESTISIDA",
    cropTarget: "Cabai, Bawang Merah, Tomat, Padi",
    rating: 4.9,
    soldCount: "19.8k+ Terjual",
    priceRange: "Rp 32.000 - Rp 115.000",
    description: "Fungisida kontak berbentuk tepung kuning dengan kandungan Zink tinggi untuk mengendalikan Patek (Antraknosa), Bercak Daun, dan Embun Bulai.",
    aiRecommendation: "Semprotkan pencegahan setiap 5-7 hari sekali di musim hujan agar cabai & bawang tidak kena patek berair.",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop",
    searchQuery: "fungisida antracol 70wp",
    badge: "Paling Laris",
    shopeeKeyword: "fungisida antracol 70 wp 500g",
    tokopediaKeyword: "antracol 70 wp zink fungisida",
    tiktokKeyword: "fungisida antracol obat patek cabai",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=fungisida%20antracol%2070%20wp%20500g&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=antracol%2070%20wp%20zink%20fungisida&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=fungisida%20antracol%20obat%20patek%20cabai",
  },
  {
    id: "prod-beauveria-bassiana",
    name: "Agens Hayati Beauveria Bassiana Liquid / Powder 500ml (Pembasmi Hama Organik)",
    categoryKey: "PESTISIDA",
    cropTarget: "Sayuran, Cabai, Padi, Jagung",
    rating: 4.8,
    soldCount: "3.9k+ Terjual",
    priceRange: "Rp 30.000 - Rp 58.000",
    description: "Cendawan entomatogen ramah lingkungan yang memunculkan penyakit mummifikasi putih pada ulat grayak, kutu kebul, dan walang sangit.",
    aiRecommendation: "Pestisida organik paling aman tanpa meninggalkan residu kimia berbahaya pada sayuran & buah siap panen.",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop",
    searchQuery: "beauveria bassiana agens hayati",
    badge: "Ramah Lingkungan",
    shopeeKeyword: "beauveria bassiana agens hayati 500ml",
    tokopediaKeyword: "beauveria bassiana pembasmi hama hayati",
    tiktokKeyword: "beauveria bassiana bio pestisida",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=beauveria%20bassiana%20agens%20hayati%20500ml&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=beauveria%20bassiana%20pembasmi%20hama%20hayati&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=beauveria%20bassiana%20bio%20pestisida",
  },
  {
    id: "prod-perekat-agristick",
    name: "Perekat Penembus & Perata Agristick / Apsa-80 500ml",
    categoryKey: "PESTISIDA",
    cropTarget: "Semua Tanaman",
    rating: 4.9,
    soldCount: "11.2k+ Terjual",
    priceRange: "Rp 22.000 - Rp 65.000",
    description: "Pencampur semprotan agar fungisida & insektisida tidak luntur tersapu air hujan serta menembus lapisan lilin daun berbuku.",
    aiRecommendation: "Campurkan 0.5ml per liter air setiap kali penyemprotan obat di musim hujan agar pestisida bekerja 100%.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
    searchQuery: "perekat perata penembus pestisida agristick",
    badge: "Wajib Musim Hujan",
    shopeeKeyword: "perekat penembus perata pestisida agristick",
    tokopediaKeyword: "agristick perekat perata pestisida",
    tiktokKeyword: "perekat penembus semprotan pestisida",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=perekat%20penembus%20perata%20pestisida%20agristick&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=agristick%20perekat%20perata%20pestisida&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=perekat%20penembus%20semprotan%20pestisida",
  },
  {
    id: "prod-cocopeat-steril",
    name: "Cocopeat Sabut Kelapa Halus Steril Low EC 10kg / 25kg (Bebas Garam)",
    categoryKey: "MEDIA_TANAM",
    cropTarget: "Pembibitan Cabai, Sayur, Polibag",
    rating: 4.9,
    soldCount: "7.8k+ Terjual",
    priceRange: "Rp 25.000 - Rp 65.000",
    description: "Media tanam serabut kelapa yang telah dicuci bersih (Low EC) menyimpan air 8x bobotnya dan mempercepat pembentukan akar bibit.",
    aiRecommendation: "Media terbaik untuk persemaian benih cabai, tomat, dan melon sebelum dipindah ke lahan sawah.",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop",
    searchQuery: "cocopeat halus steril low ec 10kg",
    badge: "Super Steril",
    shopeeKeyword: "cocopeat halus steril low ec 10kg",
    tokopediaKeyword: "cocopeat steril low ec media tanam",
    tiktokKeyword: "cocopeat halus steril penyemaian",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=cocopeat%20halus%20steril%20low%20ec%2010kg&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=cocopeat%20steril%20low%20ec%20media%20tanam&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=cocopeat%20halus%20steril%20penyemaian",
  },
  {
    id: "prod-soil-ph-meter",
    name: "Soil Tester pH Meter 4-in-1 Digital (pH Tanah, Kelembapan, Cahaya, Suhu)",
    categoryKey: "MEDIA_TANAM",
    cropTarget: "Sawah & Bedengan Hortikultura",
    rating: 4.8,
    soldCount: "6.1k+ Terjual",
    priceRange: "Rp 75.000 - Rp 125.000",
    description: "Alat ukur presisi untuk mendeteksi keasaman tanah (pH 3.5 - 9.0). Mencegah kegagalan tanam akibat tanah terlalu asam.",
    aiRecommendation: "Lakukan cek pH sebelum tanam. Jika pH < 6.0, segera taburkan Kapur Dolomit untuk menaikkan pH ideal.",
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?q=80&w=800&auto=format&fit=crop",
    searchQuery: "soil ph meter tester digital 4in1",
    badge: "Alat Wajib Petani",
    shopeeKeyword: "soil ph meter digital 4 in 1 tanah",
    tokopediaKeyword: "soil ph meter tester digital 4in1",
    tiktokKeyword: "alat ukur ph tanah digital",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=soil%20ph%20meter%20digital%204%20in%201%20tanah&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=soil%20ph%20meter%20tester%20digital%204in1&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=alat%20ukur%20ph%20tanah%20digital",
  },
  {
    id: "prod-sprayer-elektrik",
    name: "Tangki Sprayer Elektrik Knapsack 16 Liter Battery 12V 8Ah High Pressure",
    categoryKey: "ALAT_MESIN",
    cropTarget: "Padi, Cabai, Jagung, Perkebunan",
    rating: 4.9,
    soldCount: "9.4k+ Terjual",
    priceRange: "Rp 265.000 - Rp 380.000",
    description: "Sprayer gendong elektrik dengan nozel kembara adjustable, semprotan kencang halus, baterai tahan hingga 18-20 tangki sekali cas.",
    aiRecommendation: "Menghemat tenaga & waktu penyemprotan pupuk daun/pestisida hingga 70% dibanding tangki manual engkol.",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=800&auto=format&fit=crop",
    searchQuery: "tangki sprayer elektrik 16 liter 12v",
    badge: "Paling Laris",
    shopeeKeyword: "tangki sprayer elektrik 16 liter cas",
    tokopediaKeyword: "sprayer elektrik 16 liter knapsack",
    tiktokKeyword: "tangki sprayer elektrik 16l super kencang",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=tangki%20sprayer%20elektrik%2016%20liter%20cas&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=sprayer%20elektrik%2016%20liter%20knapsack&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=tangki%20sprayer%20elektrik%2016l%20super%20kencang",
  },
  {
    id: "prod-benih-padi-inpari32",
    name: "Benih Padi Inpari 32 HDB Sertifikat Kemasan 5kg Super Label Biru",
    categoryKey: "BENIH",
    cropTarget: "Sawah Irigasi & Tadah Hujan",
    rating: 4.9,
    soldCount: "18.3k+ Terjual",
    priceRange: "Rp 65.000 - Rp 85.000",
    description: "Varietas padi unggul tahan Hawar Daun Bakteri (HDB) & Blas. Anakan banyak (30-35 batang), potensi hasil 9-10 ton per hektar.",
    aiRecommendation: "Benih terfavorit petani Indonesia dengan gabah bening kuning bersih serta rendemen beras giling tinggi.",
    image: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?q=80&w=800&auto=format&fit=crop",
    searchQuery: "benih padi inpari 32 hdb 5kg label biru",
    badge: "Hasil 10 Ton/Ha",
    shopeeKeyword: "benih padi inpari 32 hdb 5kg",
    tokopediaKeyword: "benih padi inpari 32 bersertifikat 5kg",
    tiktokKeyword: "benih padi inpari 32 label biru",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=benih%20padi%20inpari%2032%20hdb%205kg&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=benih%20padi%20inpari%2032%20bersertifikat%205kg&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=benih%20padi%20inpari%2032%20label%20biru",
  },
  {
    id: "prod-benih-cabai-ori212",
    name: "Benih Cabai Rawit Merah Ori 212 Aura Seed 10 Gram (Tahan Layu & Virus)",
    categoryKey: "BENIH",
    cropTarget: "Dataran Rendah & Tinggi",
    rating: 4.9,
    soldCount: "14.6k+ Terjual",
    priceRange: "Rp 80.000 - Rp 110.000",
    description: "Cabai rawit tipe menggantung berbuah sangat lebat, warna merah menyala keras padat, tahan simpan transportasi jarak jauh.",
    aiRecommendation: "Pilihan utama petani cabai komersial karena daya adaptasi cuaca ekstrem tinggi & produktivitas panen melimpah.",
    image: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=800&auto=format&fit=crop",
    searchQuery: "benih cabai rawit ori 212 aura seed",
    badge: "Super Lebat",
    shopeeKeyword: "benih cabai rawit ori 212 asli",
    tokopediaKeyword: "benih cabai rawit ori 212 aura seed 10gr",
    tiktokKeyword: "benih cabai rawit ori 212 berbuah lebat",
    shopeeAffiliateUrl: "https://shopee.co.id/search?keyword=benih%20cabai%20rawit%20ori%20212%20asli&af_siteid=cahtani_affiliate",
    tokopediaAffiliateUrl: "https://www.tokopedia.com/search?st=product&q=benih%20cabai%20rawit%20ori%20212%20aura%20seed%2010gr&aff_id=cahtani_affiliate",
    tiktokAffiliateUrl: "https://www.tiktok.com/search?q=benih%20cabai%20rawit%20ori%20212%20berbuah%20lebat",
  }
];

// Helper to seed categories if missing
async function seedCategoriesIfEmpty() {
  const existing = await db.select().from(productCategories).all();
  if (existing.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(productCategories).values(cat);
    }
  }
}

// Helper to seed products if missing
// Helper to retrieve existing admin user ID for product creation/seeding
async function getAdminUserId(): Promise<string> {
  await ensureDb();
  const admin = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).get();
  if (admin) return admin.id;
  const anyUser = await db.select({ id: users.id }).from(users).get();
  if (anyUser) return anyUser.id;
  return "usr_admin_system";
}

async function seedProductsIfEmpty() {
  await seedCategoriesIfEmpty();
  const existing = await db.select().from(shopProducts).all();
  if (existing.length === 0) {
    const adminId = await getAdminUserId();
    for (const p of DEFAULT_PRODUCTS) {
      await db.insert(shopProducts).values({
        id: p.id,
        name: p.name,
        categoryId: `cat_${p.categoryKey}`,
        createdBy: adminId,
        cropTarget: p.cropTarget,
        rating: p.rating,
        soldCount: p.soldCount,
        priceRange: p.priceRange,
        description: p.description,
        aiRecommendation: p.aiRecommendation,
        image: p.image,
        searchQuery: p.searchQuery,
        badge: p.badge,
        shopeeKeyword: p.shopeeKeyword,
        tokopediaKeyword: p.tokopediaKeyword,
        tiktokKeyword: p.tiktokKeyword,
        shopeeAffiliateUrl: p.shopeeAffiliateUrl,
        tokopediaAffiliateUrl: p.tokopediaAffiliateUrl,
        tiktokAffiliateUrl: p.tiktokAffiliateUrl,
      });
    }
  }
}

// ==========================================
// 1. CATEGORIES API (/api/categories)
// ==========================================

// GET /api/categories
shop.get("/categories", async (c) => {
  await ensureDb();
  await seedCategoriesIfEmpty();

  const categories = await db
    .select()
    .from(productCategories)
    .orderBy(productCategories.sortOrder)
    .all();

  return c.json({
    success: true,
    data: [
      { id: "ALL", key: "ALL", label: "SEMUA KATALOG", icon: "🌾" },
      ...categories.map((cat) => ({
        id: cat.key,
        key: cat.key,
        label: cat.label,
        icon: cat.iconName || "📦",
      })),
    ],
  });
});

// ==========================================
// 2. SHOP PRODUCTS API (/api/shop/products)
// ==========================================

// Helper to format category display string
function getCategoryLabel(categoryKey: string): string {
  switch (categoryKey) {
    case "PUPUK":
      return "Pupuk & Nutrisi";
    case "PESTISIDA":
      return "Obat & Pestisida";
    case "MEDIA_TANAM":
      return "Media Tanam & Tanah";
    case "ALAT_MESIN":
      return "Alat & Mesin Tanam";
    case "BENIH":
      return "Benih Unggul";
    default:
      return "Katalog Pertanian";
  }
}

// GET /api/shop/products
shop.get("/shop/products", async (c) => {
  await ensureDb();
  await seedProductsIfEmpty();

  const categoryParam = c.req.query("category");
  const cropParam = c.req.query("crop");
  const searchParam = c.req.query("search");

  let allProducts = await db
    .select()
    .from(shopProducts)
    .orderBy(desc(shopProducts.createdAt))
    .all();

  // Filter in memory or query
  let filtered = allProducts;

  if (categoryParam && categoryParam !== "ALL") {
    filtered = filtered.filter(
      (p) => p.categoryId === `cat_${categoryParam}` || p.categoryId === categoryParam
    );
  }

  if (cropParam && cropParam !== "SEMUA") {
    const lowerCrop = cropParam.toLowerCase();
    filtered = filtered.filter((p) => p.cropTarget.toLowerCase().includes(lowerCrop));
  }

  if (searchParam && searchParam.trim().length > 0) {
    const q = searchParam.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cropTarget.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.searchQuery && p.searchQuery.toLowerCase().includes(q))
    );
  }

  // Format into frontend ShopProduct shape
  const formattedData = filtered.map((p) => {
    const catKey = p.categoryId.replace(/^cat_/, "");
    return {
      id: p.id,
      name: p.name,
      category: catKey as any,
      categoryLabel: getCategoryLabel(catKey),
      cropTarget: p.cropTarget,
      rating: p.rating || 5.0,
      soldCount: p.soldCount || "0 Terjual",
      priceRange: p.priceRange,
      description: p.description || "",
      aiRecommendation: p.aiRecommendation || "",
      image: p.image || "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
      searchQuery: p.searchQuery || p.name.toLowerCase(),
      badge: p.badge || undefined,
      shopeeSearchKeyword: p.shopeeKeyword || p.name,
      tokopediaSearchKeyword: p.tokopediaKeyword || p.name,
      tiktokSearchKeyword: p.tiktokKeyword || p.name,
      shopeeAffiliateUrl: p.shopeeAffiliateUrl || undefined,
      tokopediaAffiliateUrl: p.tokopediaAffiliateUrl || undefined,
      tiktokAffiliateUrl: p.tiktokAffiliateUrl || undefined,
    };
  });

  return c.json({
    success: true,
    data: formattedData,
  });
});

// POST /api/shop/products (Create Product)
shop.post("/shop/products", async (c) => {
  await ensureDb();
  await seedCategoriesIfEmpty();

  const body = await c.req.json();
  const {
    name,
    category,
    cropTarget,
    priceRange,
    description,
    aiRecommendation,
    image,
    badge,
    shopeeSearchKeyword,
    tokopediaSearchKeyword,
    tiktokSearchKeyword,
    shopeeAffiliateUrl,
    tokopediaAffiliateUrl,
    tiktokAffiliateUrl,
    createdBy,
  } = body;

  if (!name || !priceRange) {
    return c.json({ error: "Nama produk dan rentang harga wajib diisi." }, 400);
  }

  const catKey = category || "PUPUK";
  const newId = "prod_" + Date.now();

  await db.insert(shopProducts).values({
    id: newId,
    name: name.trim(),
    categoryId: `cat_${catKey}`,
    createdBy: createdBy || (await getAdminUserId()),
    cropTarget: cropTarget || "Semua Tanaman",
    rating: 5.0,
    soldCount: "Baru Diampu",
    priceRange: priceRange.trim(),
    description: description ? description.trim() : "",
    aiRecommendation: aiRecommendation ? aiRecommendation.trim() : "Rekomendasi dari Toko CahTani",
    image: image || "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
    searchQuery: name.toLowerCase().trim(),
    badge: badge ? badge.trim() : undefined,
    shopeeKeyword: shopeeSearchKeyword || name,
    tokopediaKeyword: tokopediaSearchKeyword || name,
    tiktokKeyword: tiktokSearchKeyword || name,
    shopeeAffiliateUrl: shopeeAffiliateUrl || undefined,
    tokopediaAffiliateUrl: tokopediaAffiliateUrl || undefined,
    tiktokAffiliateUrl: tiktokAffiliateUrl || undefined,
  });

  const createdProduct = {
    id: newId,
    name: name.trim(),
    category: catKey,
    categoryLabel: getCategoryLabel(catKey),
    cropTarget: cropTarget || "Semua Tanaman",
    rating: 5.0,
    soldCount: "Baru Diampu",
    priceRange: priceRange.trim(),
    description: description || "",
    aiRecommendation: aiRecommendation || "Rekomendasi dari Toko CahTani",
    image: image || "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
    searchQuery: name.toLowerCase().trim(),
    badge: badge || undefined,
    shopeeSearchKeyword: shopeeSearchKeyword || name,
    tokopediaSearchKeyword: tokopediaSearchKeyword || name,
    tiktokSearchKeyword: tiktokSearchKeyword || name,
    shopeeAffiliateUrl,
    tokopediaAffiliateUrl,
    tiktokAffiliateUrl,
  };

  return c.json({
    success: true,
    message: "Produk berhasil ditambahkan ke katalog!",
    data: createdProduct,
  });
});

// PUT /api/shop/products/:id (Update Product)
shop.put("/shop/products/:id", async (c) => {
  await ensureDb();
  const productId = c.req.param("id");
  const body = await c.req.json();

  const {
    name,
    category,
    cropTarget,
    priceRange,
    description,
    aiRecommendation,
    image,
    badge,
    shopeeSearchKeyword,
    tokopediaSearchKeyword,
    tiktokSearchKeyword,
    shopeeAffiliateUrl,
    tokopediaAffiliateUrl,
    tiktokAffiliateUrl,
  } = body;

  const updateFields: Record<string, any> = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (category !== undefined) updateFields.categoryId = `cat_${category}`;
  if (cropTarget !== undefined) updateFields.cropTarget = cropTarget.trim();
  if (priceRange !== undefined) updateFields.priceRange = priceRange.trim();
  if (description !== undefined) updateFields.description = description.trim();
  if (aiRecommendation !== undefined) updateFields.aiRecommendation = aiRecommendation.trim();
  if (image !== undefined) updateFields.image = image.trim();
  if (badge !== undefined) updateFields.badge = badge.trim();
  if (shopeeSearchKeyword !== undefined) updateFields.shopeeKeyword = shopeeSearchKeyword;
  if (tokopediaSearchKeyword !== undefined) updateFields.tokopediaKeyword = tokopediaSearchKeyword;
  if (tiktokSearchKeyword !== undefined) updateFields.tiktokKeyword = tiktokSearchKeyword;
  if (shopeeAffiliateUrl !== undefined) updateFields.shopeeAffiliateUrl = shopeeAffiliateUrl;
  if (tokopediaAffiliateUrl !== undefined) updateFields.tokopediaAffiliateUrl = tokopediaAffiliateUrl;
  if (tiktokAffiliateUrl !== undefined) updateFields.tiktokAffiliateUrl = tiktokAffiliateUrl;

  await db
    .update(shopProducts)
    .set(updateFields)
    .where(eq(shopProducts.id, productId));

  return c.json({
    success: true,
    message: "Produk berhasil diperbarui.",
  });
});

// DELETE /api/shop/products/:id (Delete Product)
shop.delete("/shop/products/:id", async (c) => {
  await ensureDb();
  const productId = c.req.param("id");

  await db.delete(shopProducts).where(eq(shopProducts.id, productId));

  return c.json({
    success: true,
    message: "Produk berhasil dihapus dari katalog.",
  });
});

// POST /api/shop/reset-defaults (Reset to default catalog)
shop.post("/shop/reset-defaults", async (c) => {
  await ensureDb();
  await db.delete(shopProducts).all();
  await seedProductsIfEmpty();

  return c.json({
    success: true,
    message: "Katalog produk berhasil dikembalikan ke daftar bawaan.",
  });
});

export default shop;
