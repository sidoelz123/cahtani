import { db, initDb } from "../db/index.js";
import { users, shopProducts, pestDiseases, presetDiagnoses, farmerTestimonials, faqItems } from "../db/schema.js";
import { hashPassword } from "../utils/crypto.js";
import { eq, or, inArray } from "drizzle-orm";

export async function runAdminSeed(envInput?: Record<string, any>) {
  // Extract env variables from passed envInput (e.g. c.env or c from Hono) or fallback to process.env
  const env = (envInput && "env" in envInput ? envInput.env : envInput) || (typeof process !== "undefined" ? process.env : {}) || {};

  await initDb(envInput);

  const rawEmail = env.ADMIN_EMAIL || (typeof process !== "undefined" ? process.env?.ADMIN_EMAIL : undefined);
  const rawPassword = env.ADMIN_PASSWORD || (typeof process !== "undefined" ? process.env?.ADMIN_PASSWORD : undefined);

  const adminEmail = rawEmail?.trim().toLowerCase();
  const adminPassword = rawPassword;

  if (!adminEmail || !adminPassword) {
    console.error("\n❌ Error: ADMIN_EMAIL dan ADMIN_PASSWORD wajib dikonfigurasi di environment variables!");
    console.error("Contoh usage:\n  ADMIN_EMAIL=admin@cahtani.id ADMIN_PASSWORD=PasswordSuperAman123! npm run db:seed\n");
    throw new Error("Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD");
  }

  const rawName = env.ADMIN_NAME || (typeof process !== "undefined" ? process.env?.ADMIN_NAME : undefined);
  const rawPhone = env.ADMIN_PHONE || (typeof process !== "undefined" ? process.env?.ADMIN_PHONE : undefined);

  const adminName = rawName?.trim() || "Admin CahTani";
  const adminPhone = rawPhone?.trim() || "081100000000";

  // 1. Remove all legacy demo accounts
  const demoUserIds = ["usr_demo_01", "usr_demo_02", "usr_demo_03", "usr_demo_04", "usr_admin_01"];
  const demoEmails = ["suwandi@gmail.com", "maryati@gmail.com", "herman@gmail.com", "kasman@gmail.com", "admin@cahtani.id"];
  const demoPhones = ["081234567890", "081234567891", "081234567892", "081234567893", "081299998888"];

  console.log("🧹 Membersihkan seluruh akun demo/dummy dari basis data...");

  // Delete legacy demo accounts from users
  for (const demoId of demoUserIds) {
    await db.delete(users).where(eq(users.id, demoId));
  }
  for (const demoMail of demoEmails) {
    await db.delete(users).where(eq(users.email, demoMail));
  }
  for (const demoPhone of demoPhones) {
    await db.delete(users).where(eq(users.phone, demoPhone));
  }

  // 2. Check if admin with ADMIN_EMAIL already exists
  let existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .get();

  let adminId: string;

  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log(`✅ Akun Admin dengan email '${adminEmail}' sudah ada di database (ID: ${adminId}). Mengabaikan pembuatan ulang (Idempotent).`);

    // Ensure role is admin
    if (existingAdmin.role !== "admin") {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, adminId));
      console.log(`🔒 Peran pengguna '${adminEmail}' diperbarui menjadi 'admin'.`);
    }
  } else {
    adminId = "usr_admin_" + Date.now().toString(36);
    const passwordHash = hashPassword(adminPassword);

    await db.insert(users).values({
      id: adminId,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      passwordHash: passwordHash,
      gender: "Bapak (Pria)",
      location: "Indonesia",
      crops: "Pengelola Sistem & Toko",
      role: "admin",
      isVerified: true,
    });

    console.log(`🎉 Akun Admin tunggal berhasil dibuat!`);
    console.log(`   - Email : ${adminEmail}`);
    console.log(`   - Peran : admin`);
    console.log(`   - ID    : ${adminId}`);
  }

  // 3. Re-assign references in seed reference tables to the admin account
  // So reference data (shop products, FAQs, etc.) remains intact with valid foreign key
  await db.update(shopProducts).set({ createdBy: adminId }).where(inArray(shopProducts.createdBy, demoUserIds));
  await db.update(pestDiseases).set({ createdBy: adminId }).where(inArray(pestDiseases.createdBy, demoUserIds));
  await db.update(presetDiagnoses).set({ createdBy: adminId }).where(inArray(presetDiagnoses.createdBy, demoUserIds));
  await db.update(faqItems).set({ createdBy: adminId }).where(inArray(faqItems.createdBy, demoUserIds));
  await db.update(farmerTestimonials).set({ userId: adminId }).where(inArray(farmerTestimonials.userId, demoUserIds));

  console.log("✨ Seeding admin selesai. Tidak ada akun demo tersisa!");
  return { adminId, email: adminEmail };
}

// Allow direct execution from CLI: `tsx src/scripts/seed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
