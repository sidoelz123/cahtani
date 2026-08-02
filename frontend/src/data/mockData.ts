import { PestDiseaseItem, TestimonialItem, FaqItem } from "../types";

export const CROP_OPTIONS = [
  { id: "padi", label: "PADI", icon: "🌾" },
  { id: "cabai", label: "CABAI / LOMBOK", icon: "🌶️" },
  { id: "jagung", label: "JAGUNG", icon: "🌽" },
  { id: "bawang", label: "BAWANG MERAH", icon: "🧅" },
  { id: "tomat", label: "TOMAT & SAYURAN", icon: "🍅" },
  { id: "sawit", label: "KELAPA SAWIT", icon: "🌴" },
  { id: "kopi", label: "KOPI & COKLAT", icon: "☕" },
  { id: "lainnya", label: "TANAMAN LAINNYA", icon: "🌱" },
];

export const normalizeCropId = (cropInput: string): string => {
  if (!cropInput) return "padi";
  const clean = cropInput.trim().toLowerCase();
  for (const option of CROP_OPTIONS) {
    if (
      option.id.toLowerCase() === clean ||
      option.label.toLowerCase() === clean ||
      clean.includes(option.id.toLowerCase()) ||
      option.label.toLowerCase().includes(clean)
    ) {
      return option.id;
    }
  }
  return "lainnya";
};

export const PRESET_DIAGNOSES = [
  {
    id: "patek-cabai",
    crop: "CABAI",
    title: "ANBRAKNOSA (PATEK) CABAI",
    symptoms: "Bercak melingkar kecokelatan berair pada buah cabai, lama-lama mengering dan busuk hitam.",
    severity: "PARAH",
    solution: "Semprot fungisida tembaga hidroksida / ektrak daun mimba + kurangi kelembapan bedengan."
  },
  {
    id: "wereng-padi",
    crop: "PADI",
    title: "WERENG COKELAT (Nilaparvata lugens)",
    symptoms: "Rumpun padi menguning memerah, mengering seperti terbakar (hopperburn) di dasar rumpun.",
    severity: "KRITIS",
    solution: "Keringkan sawah secara berkala (intermittent), ganti insektisida bahan aktif Pimetrozin."
  },
  {
    id: "bulai-jagung",
    crop: "JAGUNG",
    title: "BULAI JAGUNG (Peronosclerospora)",
    symptoms: "Daun muda bergaris-garis putih kekuningan sejajar tulang daun, tanaman kerdil.",
    severity: "SEDANG",
    solution: "Cabut & bakar tanaman terinfeksi, perlakuan benih dengan Dimetomorf sebelum tanam."
  },
  {
    id: "layu-fusarium",
    crop: "TOMAT / CABAI",
    title: "LAYU FUSARIUM (Jamur Tanah)",
    symptoms: "Daun bawah melayu di siang hari lalu segar kembali malam hari, lama-lama mati total.",
    severity: "PARAH",
    solution: "Kocor agen hayati Trichoderma harzianum + tabur kapur dolomit untuk naikkan pH tanah."
  }
];

export const PEST_CATALOG: PestDiseaseItem[] = [
  {
    id: "wereng-1",
    name: "WERENG BATANG COKELAT",
    crop: "PADI",
    category: "HAMA",
    symptoms: "Menghisap cairan batang padi, menyebabkan fenomena terbakar (hopperburn) cepat meluas.",
    solutionQuick: "Atur jarak tanam legowo, gunakan agen hayati Beauveria bassiana atau Pimetrozin.",
    iconName: "Bug",
    tag: "Hama Utama Padi"
  },
  {
    id: "antraknosa-2",
    name: "ANTRAKNOSA (PATEK)",
    crop: "CABAI / TOMAT",
    category: "PENYAKIT",
    symptoms: "Buah berlubang melingkar hitam seperti terbakar api, menurunkan hasil panen hingga 80%.",
    solutionQuick: "Pangkas buah sakit, semprot fungisida Difenokonazol atau racikan kunyit & serai.",
    iconName: "Flame",
    tag: "Ancaman Cabai musim Hujan"
  },
  {
    id: "penggerek-3",
    name: "PENGGEREK BATANG (SUDEP/BELUK)",
    crop: "PADI",
    category: "HAMA",
    symptoms: "Pucuk daun mati melemes (sudep) atau malai padi hampa berwarna putih (beluk).",
    solutionQuick: "Pasang perangkap lampu (light trap), kendalikan larva dengan fipronil dosis pas.",
    iconName: "Scissors",
    tag: "Penyebab Malai Hampa"
  },
  {
    id: "bulai-4",
    name: "BULAI JAGUNG",
    crop: "JAGUNG",
    category: "PENYAKIT",
    symptoms: "Daun pucat bergaris kuning memanjang dari pangkal, jagung tidak berbunga/berbuah.",
    solutionQuick: "Gunakan benih tahan bulai, perlakuan benih fungisida sistemik Dimetomorf.",
    iconName: "Zap",
    tag: "Penyakit Benih"
  },
  {
    id: "ulat-grayak-5",
    name: "ULAT GRAYAK FAW (Spodoptera)",
    crop: "JAGUNG & SAYUR",
    category: "HAMA",
    symptoms: "Daun muda berlubang besar-besar, terdapat kotoran gergaji di pucuk tanaman.",
    solutionQuick: "Aplikasi mikroba Bacillus thuringiensis (Bt) atau emamektin benzoat sore hari.",
    iconName: "Activity",
    tag: "Serangan Cepat"
  },
  {
    id: "kresek-6",
    name: "HAWAR DAUN BAKTERI (KRESEK)",
    crop: "PADI",
    category: "PENYAKIT",
    symptoms: "Bercak kebasahan di pinggir daun, berlanjut mengering abu-abu seperti jerami.",
    solutionQuick: "Kurangi pupuk Nitrogen (Urea) berlebih, gunakan bakterisida tembaga sulfat.",
    iconName: "Droplets",
    tag: "Penyakit Musim Hujan"
  }
];

export const FARMER_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "t1",
    name: "PAK SUWANDI",
    role: "Ketua Kelompok Tani Rejeki Makmur",
    location: "Ngawi, Jawa Timur",
    crop: "Petani Padi (4 Hektar)",
    quote: "Awalnya bingung daun padi melayu dan menguning serentak. Cukup foto lewat HP, CahTani AI langsung tau itu bercak cokelat dan kasih resep racikan hayati. Panen padi selamat 18 ton!",
    impact: "Panen Selamat 100%"
  },
  {
    id: "t2",
    name: "BU MARYATI",
    role: "Petani Cabai Rawit Merah",
    location: "Temanggung, Jawa Tengah",
    quote: "Cabai saya kena patek pas hujan lebat. Pakai CahTani dapet saran kombinasi fungisida & pangkas sanitasi. Sangat mudah dibaca buat saya yang umur 52 tahun!",
    crop: "Petani Cabai (1.5 Hektar)",
    impact: "Hemat Biaya Obat Rp 4.5 Juta"
  },
  {
    id: "t3",
    name: "PAK HERMAN",
    role: "Petani Jagung Hibrida",
    location: "Lampung Tengah",
    quote: "Ulat grayak habis dihantam cara penanganan dari CahTani. Penjelasannya gamblang, urutannya jelas, takat obatnya presisi. Luar biasa bermanfaat buat petani daerah!",
    crop: "Petani Jagung (3 Hektar)",
    impact: "Produksi Naik 35%"
  },
  {
    id: "t4",
    name: "PAK KASMAN",
    role: "Anggota Gapoktan Suka Tani",
    location: "Subang, Jawa Barat",
    quote: "Gak perlu nunggu penyuluh datang berhari-hari. Tinggal buka CahTani AI dari lokasi sawah, solusi langsung keluar detik itu juga. Tulisan besar dan gampang dibaca!",
    crop: "Petani Padi & Bawang",
    impact: "Diagnosa Cepat < 10 Detik"
  }
];

export const FAQ_LIST: FaqItem[] = [
  {
    category: "CARA PENGGUNAAN",
    question: "BAGAIMANA CARA MENGUNGAH FOTO DAUN TANAMAN YANG SAKIT?",
    answer: "Cukup tekan tombol 'UNGGAH FOTO' di bagian Diagnosa AI, lalu pilih foto daun dari galeri HP Anda atau ambil foto langsung menggunakan kamera HP. Pastikan foto cukup terang dan fokus pada bagian daun atau buah yang terserang hama/penyakit."
  },
  {
    category: "AKURASI AI",
    question: "SEBERAPA AKURAT DIAGNOSA PENYAKIT DARI CAHTANI AI?",
    answer: "CahTani AI ditenagai model AI kecerdasan buatan Gemini 3.6 Flash yang telah dilatih dengan ribuan dataset penyakit tanaman tropis Indonesia. Akurasi diagnosa mencapai di atas 95% untuk tanaman utama seperti padi, cabai, jagung, bawang, dan sayuran."
  },
  {
    category: "PENGOBATAN",
    question: "APAKAH SARAN REKOMENDASI OBAT AMAN UNTUK TANAMAN DANI LINGKUNGAN?",
    answer: "Ya! CahTani AI selalu mengutamakan kombinasi penanganan hayati/organik (seperti Trichoderma, Beauveria, pestisida nabati) terlebih dahulu. Jika membutuhkan insektisida/fungisida kimiawi, CahTani akan memberikan petunjuk dosis aman dan cara aplikasi yang tepat."
  },
  {
    category: "KEMUDAHAN PETANI",
    question: "APAKAH APLIKASI INI MUDAH DIGUNAKAN UNTUK PETANI SENIOR (USIA 40-70 TAHUN)?",
    answer: "Sangat mudah! Tampilan dirancang khusus dengan huruf besar, kontras warna tinggi (Agri Green Light Mode), tombol berukuran mantap, serta bahasa Indonesia sehari-hari yang ramah dan langsung pada inti solusi tanpa istilah rumit."
  },
  {
    category: "BIAYA & AKSES",
    question: "APAKAH CAHTANI AI BISA DIGUNAKAN SECARA GRATIS OLEH PETANI?",
    answer: "Ya, layanan diagnosa dasar dan konsultasi hama/penyakit tanaman CahTani AI dapat diakses gratis oleh seluruh petani Indonesia demi mendukung ketahanan pangan nasional."
  }
];
