export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "CahTani AI - API Documentation",
    version: "1.0.0",
    description:
      "Dokumentasi API resmi platform CahTani AI: Asisten Pertanian Pintar berbasis Gemini AI, Rekomendasi Obat & Pupuk, Manajemen Catatan Pertumbuhan, serta Katalog Toko Tani.",
    contact: {
      name: "Tim Pengembang CahTani AI",
      email: "support@cahtani.ai",
      url: "https://cahtani.ai",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Server Pengembang (Lokal / Preview)",
    },
    {
      url: "https://cahtani-backend.kairuku226.workers.dev",
      description: "Server Backend Hono Standalone",
    },
  ],
  tags: [
    { name: "System", description: "Endpoint kesehatan dan status sistem" },
    {
      name: "Autentikasi",
      description: "Pendaftaran, Masuk, Verifikasi OTP, & Pengaturan Profil Petani",
    },
    {
      name: "AI & Diagnosis",
      description:
        "Diagnosis Penyakit Tanaman via Gemini AI, Konsultasi Chatbot, Cuaca, & Kalender Tanam",
    },
    {
      name: "Manajemen Pertanian",
      description: "Jurnal Pertumbuhan Tanaman, Kalender Tanam, & Pengingat Tugas",
    },
    { name: "Katalog Toko Tani", description: "Kategori Produk & Rekomendasi Obat/Pupuk Tani" },
  ],
  paths: {
    "/api/health": {
      get: {
        summary: "Pemeriksaan Kesehatan Server",
        description: "Mengembalikan status server backend HonoJS",
        tags: ["System"],
        responses: {
          "200": {
            description: "Server berjalan dengan baik",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    framework: { type: "string", example: "HonoJS" },
                    timestamp: { type: "string", example: "2026-08-01T02:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Pendaftaran Akun Petani Baru",
        tags: ["Autentikasi"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "phone", "password"],
                properties: {
                  name: { type: "string", example: "Pak Budi" },
                  email: { type: "string", example: "budi@gmail.com" },
                  phone: { type: "string", example: "081234567890" },
                  password: { type: "string", example: "rahasia123" },
                  gender: { type: "string", example: "Bapak (Pria)" },
                  location: { type: "string", example: "Nganjuk, Jawa Timur" },
                  crops: { type: "string", example: "Bawang Merah, Cabai" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Pendaftaran berhasil, token OTP dikirimkan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Registrasi berhasil!" },
                    otpToken: { type: "string", example: "123456" },
                    userId: { type: "string", example: "usr_1785520" },
                  },
                },
              },
            },
          },
          "400": { description: "Gagal: Kolom tidak lengkap atau email/phone sudah terdaftar" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Masuk Akun (Login)",
        tags: ["Autentikasi"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "suwandi@gmail.com atau 081234567890" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login berhasil, mengembalikan token & profil pengguna",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    token: { type: "string", example: "jwt-token-string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "usr_1001" },
                        name: { type: "string", example: "Pak Suwandi" },
                        email: { type: "string", example: "suwandi@gmail.com" },
                        phone: { type: "string", example: "081234567890" },
                        role: { type: "string", example: "farmer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Kombinasi email/nomor WhatsApp atau kata sandi salah" },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        summary: "Verifikasi Kode OTP WhatsApp/SMS",
        tags: ["Autentikasi"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "code"],
                properties: {
                  userId: { type: "string", example: "usr_1785520" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Verifikasi OTP berhasil" },
          "400": { description: "Kode OTP tidak cocok" },
        },
      },
    },
    "/api/auth/profile": {
      get: {
        summary: "Ambil Detail Profil Petani",
        tags: ["Autentikasi"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Data profil petani berhasil diambil" },
        },
      },
      put: {
        summary: "Perbarui Profil Petani",
        tags: ["Autentikasi"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", example: "usr_1001" },
                  name: { type: "string" },
                  gender: { type: "string" },
                  location: { type: "string" },
                  crops: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profil berhasil diperbarui" },
        },
      },
    },
    "/api/diagnosis": {
      post: {
        summary: "Diagnosis Gejala / Foto Tanaman via Gemini AI",
        description:
          "Menganalisis gejala atau gambar tanaman yang diunggah dan memberikan analisis diagnosis penyakit, obat rekomendasi, dan pencegahan.",
        tags: ["AI & Diagnosis"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt", "cropType"],
                properties: {
                  prompt: {
                    type: "string",
                    example: "Daun cabai saya keriting dan menguning di bagian pucuk",
                  },
                  cropType: { type: "string", example: "Cabai" },
                  region: { type: "string", example: "Jawa Timur" },
                  imageBase64: { type: "string", example: "data:image/jpeg;base64,/9j/4AAQSk..." },
                  userId: { type: "string", example: "usr_1001" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Diagnosis AI berhasil dihasilkan dalam format Markdown",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    result: {
                      type: "string",
                      example:
                        "Salam Tani! Tanaman cabai Anda terindikasi terserang Virus Gemini...",
                    },
                    recordId: { type: "string", example: "diag_17855208" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        summary: "Riwayat Hasil Diagnosis AI",
        tags: ["AI & Diagnosis"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daftar riwayat diagnosis" },
        },
      },
    },
    "/api/chat": {
      post: {
        summary: "Konsultasi Tanya Jawab Pertanian CahTani AI",
        tags: ["AI & Diagnosis"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", example: "user" },
                        content: {
                          type: "string",
                          example: "Berapa dosis NPK Mutiara yang tepat untuk padi umur 15 hari?",
                        },
                      },
                    },
                  },
                  cropType: { type: "string", example: "Padi" },
                  userId: { type: "string", example: "usr_1001" },
                  sessionId: { type: "string", example: "sess_123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Jawaban rekomendasi AI",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reply: { type: "string" },
                    sessionId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/chat/sessions": {
      get: {
        summary: "Daftar Sesi Perbincangan Chat",
        tags: ["AI & Diagnosis"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daftar sesi chat petani" },
        },
      },
    },
    "/api/chat/messages": {
      get: {
        summary: "Daftar Pesan dalam Suatu Sesi Chat",
        tags: ["AI & Diagnosis"],
        parameters: [
          { name: "sessionId", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Riwayat pesan chat" },
        },
      },
    },
    "/api/weather-advisory": {
      post: {
        summary: "Rekomendasi Tindakan Pertanian Berdasarkan Cuaca Real-time",
        tags: ["AI & Diagnosis"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  location: { type: "string", example: "Ngawi, Jawa Timur" },
                  tempC: { type: "number", example: 31 },
                  airHumidity: { type: "number", example: 75 },
                  soilHumidity: { type: "number", example: 60 },
                  rainProbability: { type: "number", example: 80 },
                  windSpeedKmH: { type: "number", example: 12 },
                  cropType: { type: "string", example: "Padi" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Saran tindakan taktis cuaca",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    advice: {
                      type: "string",
                      example: "Tunda penyemprotan cair karena peluang hujan tingi...",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/planting-schedule": {
      post: {
        summary: "Generator Otomatis Kalender Tanam & Milestone",
        tags: ["AI & Diagnosis"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  cropType: { type: "string", example: "Cabai Merah" },
                  startDate: { type: "string", example: "2026-08-01" },
                  location: { type: "string", example: "Kediri" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Jadwal milestones penanaman otomatis",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    harvestTargetDate: { type: "string", example: "2026-11-01" },
                    milestones: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          stageName: { type: "string" },
                          daysFromStart: { type: "number" },
                          notes: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/logs": {
      get: {
        summary: "Daftar Jurnal Catatan Pertumbuhan Tanaman",
        tags: ["Manajemen Pertanian"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daftar log pertumbuhan" },
        },
      },
      post: {
        summary: "Tambah Catatan Pertumbuhan Baru",
        tags: ["Manajemen Pertanian"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cropName", "stage"],
                properties: {
                  userId: { type: "string", example: "usr_1001" },
                  cropName: { type: "string", example: "Padi Inpari 32" },
                  stage: { type: "string", example: "Vegetatif" },
                  heightCm: { type: "number", example: 35 },
                  notes: { type: "string", example: "Pemupukan susulan pertama selesai" },
                  photoBase64: { type: "string" },
                  date: { type: "string", example: "2026-08-01" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Log pertumbuhan disimpan" },
        },
      },
    },
    "/api/schedules": {
      get: {
        summary: "Daftar Kalender Tanam Aktif",
        tags: ["Manajemen Pertanian"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daftar kalender tanam beserta milestone" },
        },
      },
      post: {
        summary: "Buat Kalender Tanam Baru",
        tags: ["Manajemen Pertanian"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cropName", "startDate"],
                properties: {
                  userId: { type: "string", example: "usr_1001" },
                  cropName: { type: "string", example: "Jagung Bisi 18" },
                  startDate: { type: "string", example: "2026-08-01" },
                  location: { type: "string", example: "Blora" },
                  notes: { type: "string" },
                  milestones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        stageName: { type: "string" },
                        daysFromStart: { type: "number" },
                        notes: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Kalender tanam berhasil disimpan" },
        },
      },
    },
    "/api/reminders": {
      get: {
        summary: "Daftar Pengingat Tani / Tugas Tanam",
        tags: ["Manajemen Pertanian"],
        parameters: [{ name: "userId", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daftar pengingat tugas" },
        },
      },
      post: {
        summary: "Buat Pengingat Tani Baru",
        tags: ["Manajemen Pertanian"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "dueDate"],
                properties: {
                  userId: { type: "string", example: "usr_1001" },
                  title: { type: "string", example: "Penyemprotan Fungisida Antracol" },
                  cropType: { type: "string", example: "Cabai" },
                  dueDate: { type: "string", example: "2026-08-02" },
                  category: { type: "string", example: "pestisida" },
                  notes: { type: "string", example: "Gunakan dosis 2 gram/liter" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Pengingat berhasil dibuat" },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "Kategori Produk Toko Tani",
        tags: ["Katalog Toko Tani"],
        responses: {
          "200": { description: "Daftar kategori produk" },
        },
      },
    },
    "/api/shop/products": {
      get: {
        summary: "Katalog Produk Toko Tani & Rekomendasi Obat",
        tags: ["Katalog Toko Tani"],
        parameters: [
          { name: "category", in: "query", required: false, schema: { type: "string" } },
          { name: "search", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Daftar produk dengan tautan toko resmi (Shopee, Tokopedia, TikTok Shop)",
          },
        },
      },
      post: {
        summary: "Tambah Produk Baru (Admin Toko)",
        tags: ["Katalog Toko Tani"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "categoryKey", "priceRange"],
                properties: {
                  name: { type: "string", example: "Insektisida Regent 50SC 250ml" },
                  categoryKey: { type: "string", example: "PESTISIDA" },
                  cropTarget: { type: "string", example: "Padi, Jagung, Cabai" },
                  priceRange: { type: "string", example: "Rp 38.000 - Rp 140.000" },
                  description: { type: "string" },
                  aiRecommendation: { type: "string" },
                  image: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Produk berhasil ditambahkan" },
        },
      },
    },
  },
};
