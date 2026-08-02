import { Hono } from "hono";
import { eq, or, and } from "drizzle-orm";
import { db, initDb } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generate6DigitCode,
} from "../utils/crypto.js";

import { runAdminSeed } from "../scripts/seed.js";

const auth = new Hono().basePath("/api/auth");

auth.notFound((c) => {
  return c.json({ error: "Endpoint tidak ditemukan." }, 404);
});

// Endpoint to trigger idempotent admin seed on demand via ADMIN_EMAIL & ADMIN_PASSWORD env vars
auth.get("/seed", async (c) => {
  try {
    const result = await runAdminSeed(c.env as any);
    return c.json({
      success: true,
      message: `Seed admin berhasil (${result.email}). Seluruh akun demo telah dibersihkan.`,
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Gagal melakukan seeding admin." }, 500);
  }
});

// 1. SIGN UP (POST /api/auth/register)
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, email, phone, password, gender, location, crops } = body;

  if (!name || !email || !phone || !password) {
    return c.json(
      { error: "Mohon lengkapi seluruh kolom pendaftaran (Nama, Email, No. WhatsApp, dan Kata Sandi)." },
      400
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  // Check existing user by email or phone
  const existingUser = await db
    .select()
    .from(users)
    .where(or(eq(users.email, cleanEmail), eq(users.phone, cleanPhone)))
    .get();

  if (existingUser) {
    return c.json(
      { error: "Alamat email atau nomor WhatsApp ini sudah pernah terdaftar. Silakan masuk atau gunakan Lupa Kata Sandi." },
      400
    );
  }

  const userId = "usr_" + Date.now();
  const verificationToken = generate6DigitCode();
  const passwordHash = hashPassword(password);

  await db.insert(users).values({
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
    gender: gender || "Bapak (Pria)",
    location: location?.trim() || "",
    crops: crops?.trim() || "",
    role: "farmer",
    isVerified: false,
    verificationToken,
  });

  return c.json({
    success: true,
    message: "Pendaftaran berhasil! Kode verifikasi telah dikirimkan ke email/WhatsApp Anda.",
    userId,
    verificationToken, // Provided for easy verification in simulation
  });
});

// 2. VERIFICATION (POST /api/auth/verify)
auth.post("/verify", async (c) => {
  const body = await c.req.json();
  const { identifier, token } = body;

  if (!token) {
    return c.json({ error: "Kode verifikasi diperlukan." }, 400);
  }

  let user: typeof users.$inferSelect | undefined;
  if (identifier) {
    const cleanId = identifier.trim().toLowerCase();
    user = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.email, cleanId), eq(users.phone, cleanId)),
          eq(users.verificationToken, token.trim())
        )
      )
      .get();
  } else {
    user = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token.trim()))
      .get();
  }

  if (!user) {
    return c.json({ error: "Kode verifikasi tidak valid atau tidak ditemukan." }, 400);
  }

  await db
    .update(users)
    .set({
      isVerified: true,
      verificationToken: null,
    })
    .where(eq(users.id, user.id));

  return c.json({
    success: true,
    message: "Akun Anda telah berhasil diverifikasi! Silakan masuk.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      location: user.location,
      crops: user.crops,
      role: user.role,
      isVerified: true,
    },
  });
});

// 3. SIGN IN (POST /api/auth/login)
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { identifier, password } = body;

  if (!identifier || !password) {
    return c.json({ error: "Mohon masukkan Email/No. WhatsApp dan Kata Sandi." }, 400);
  }

  const cleanId = identifier.trim().toLowerCase();

  const user = await db
    .select()
    .from(users)
    .where(or(eq(users.email, cleanId), eq(users.phone, cleanId)))
    .get();

  if (!user) {
    return c.json(
      { error: "Alamat email atau nomor WhatsApp ini belum terdaftar." },
      401
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return c.json({ error: "Kata sandi yang Anda masukkan salah." }, 401);
  }

  if (!user.isVerified) {
    return c.json(
      {
        error: "Akun Anda belum terverifikasi. Silakan masukkan kode verifikasi terlebih dahulu.",
        needsVerification: true,
        userId: user.id,
      },
      403
    );
  }

  const sessionToken = generateToken("session");

  return c.json({
    success: true,
    message: "Berhasil masuk!",
    token: sessionToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      location: user.location,
      crops: user.crops,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// 4. LOGOUT (POST /api/auth/logout)
auth.post("/logout", async (c) => {
  return c.json({
    success: true,
    message: "Berhasil keluar dari akun.",
  });
});

// 5. FORGOT PASSWORD - CHECK & GENERATE TOKEN (POST /api/auth/forgot-password)
auth.post("/forgot-password", async (c) => {
  const body = await c.req.json();
  const { identifier } = body;

  if (!identifier) {
    return c.json({ error: "Mohon masukkan Alamat Email atau Nomor WhatsApp Anda." }, 400);
  }

  const cleanId = identifier.trim().toLowerCase();

  const user = await db
    .select()
    .from(users)
    .where(or(eq(users.email, cleanId), eq(users.phone, cleanId)))
    .get();

  if (!user) {
    return c.json(
      { error: "Alamat email atau nomor WhatsApp tersebut belum terdaftar dalam sistem CahTani AI." },
      404
    );
  }

  const resetToken = generate6DigitCode();
  const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await db
    .update(users)
    .set({
      resetToken,
      resetTokenExpires,
    })
    .where(eq(users.id, user.id));

  return c.json({
    success: true,
    message: `Akun ditemukan! Kode verifikasi reset telah dikirim ke ${user.email} / ${user.phone}.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    resetToken, // Provided for convenience in demo mode
  });
});

// 5b. RESET PASSWORD SUBMIT (POST /api/auth/reset-password)
auth.post("/reset-password", async (c) => {
  const body = await c.req.json();
  const { identifier, resetToken, newPassword } = body;

  if (!resetToken || !newPassword) {
    return c.json({ error: "Kode reset dan kata sandi baru wajib diisi." }, 400);
  }

  const cleanId = identifier ? identifier.trim().toLowerCase() : "";

  let user: typeof users.$inferSelect | undefined;
  if (cleanId) {
    user = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.email, cleanId), eq(users.phone, cleanId)),
          eq(users.resetToken, resetToken.trim())
        )
      )
      .get();
  } else {
    user = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, resetToken.trim()))
      .get();
  }

  if (!user) {
    return c.json({ error: "Kode verifikasi reset tidak valid atau tidak sesuai." }, 400);
  }

  const newHash = hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: newHash,
      resetToken: null,
      resetTokenExpires: null,
    })
    .where(eq(users.id, user.id));

  return c.json({
    success: true,
    message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru.",
  });
});

export default auth;
