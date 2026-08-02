import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. Users Table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  gender: text("gender"),
  location: text("location"),
  crops: text("crops"),
  role: text("role", { enum: ["farmer", "admin"] }).default("farmer").notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpires: text("reset_token_expires"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 2. Plant Growth Logs Table
export const plantGrowthLogs = sqliteTable("plant_growth_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  cropName: text("crop_name").notNull(),
  stage: text("stage", {
    enum: ["pembibitan", "vegetatif", "generatif", "siap_panen"],
  }).notNull(),
  heightCm: integer("height_cm").notNull(),
  notes: text("notes"),
  photoBase64: text("photo_base64"),
  logDate: text("log_date").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 3. Planting Schedules Table
export const plantingSchedules = sqliteTable("planting_schedules", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  cropType: text("crop_type").notNull(),
  startDate: text("start_date").notNull(),
  harvestTargetDate: text("harvest_target_date").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 4. Planting Milestones Table
export const plantingMilestones = sqliteTable("planting_milestones", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id")
    .notNull()
    .references(() => plantingSchedules.id, { onDelete: "cascade" }),
  milestoneDate: text("milestone_date").notNull(),
  stageName: text("stage_name").notNull(),
  category: text("category", {
    enum: ["olahan_tanah", "pupuk_1", "pupuk_2", "cek_hama", "panen"],
  }).notNull(),
  notes: text("notes"),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
});

// 5. Custom Reminders Table
export const customReminders = sqliteTable("custom_reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  category: text("category", {
    enum: ["tanam", "pupuk", "pestisida", "irigasi", "panen"],
  }).notNull(),
  dueDate: text("due_date").notNull(),
  notes: text("notes"),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 6. Product Categories Table
export const productCategories = sqliteTable("product_categories", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  iconName: text("icon_name"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// 7. Shop Products Table
export const shopProducts = sqliteTable("shop_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => productCategories.id),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  cropTarget: text("crop_target").notNull(),
  rating: real("rating").default(5.0),
  soldCount: text("sold_count"),
  priceRange: text("price_range").notNull(),
  description: text("description"),
  aiRecommendation: text("ai_recommendation"),
  image: text("image"),
  searchQuery: text("search_query"),
  badge: text("badge"),
  shopeeKeyword: text("shopee_keyword"),
  tokopediaKeyword: text("tokopedia_keyword"),
  tiktokKeyword: text("tiktok_keyword"),
  shopeeAffiliateUrl: text("shopee_affiliate_url"),
  tokopediaAffiliateUrl: text("tokopedia_affiliate_url"),
  tiktokAffiliateUrl: text("tiktok_affiliate_url"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 8. Pest & Diseases Catalog Table
export const pestDiseases = sqliteTable("pest_diseases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  crop: text("crop").notNull(),
  category: text("category", {
    enum: ["hama", "penyakit", "gangguan_nutrisi"],
  }).notNull(),
  symptoms: text("symptoms").notNull(),
  solutionQuick: text("solution_quick").notNull(),
  iconName: text("icon_name"),
  tag: text("tag"),
  createdBy: text("created_by").references(() => users.id),
});

// 9. Preset Diagnoses Table
export const presetDiagnoses = sqliteTable("preset_diagnoses", {
  id: text("id").primaryKey(),
  crop: text("crop").notNull(),
  title: text("title").notNull(),
  symptoms: text("symptoms").notNull(),
  severity: text("severity", {
    enum: ["ringan", "sedang", "parah", "kritis"],
  }).notNull(),
  solution: text("solution").notNull(),
  createdBy: text("created_by").references(() => users.id),
});

// 10. Farmer Testimonials Table
export const farmerTestimonials = sqliteTable("farmer_testimonials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").notNull(),
  crop: text("crop").notNull(),
  quote: text("quote").notNull(),
  impact: text("impact").notNull(),
});

// 11. FAQ Items Table
export const faqItems = sqliteTable("faq_items", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
});

// 12. Chat Sessions Table
export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  cropType: text("crop_type"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 13. Chat Messages Table
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  sender: text("sender", { enum: ["user", "bot"] }).notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});

// 14. Diagnosis Records Table
export const diagnosisRecords = sqliteTable("diagnosis_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  cropType: text("crop_type").notNull(),
  region: text("region"),
  symptoms: text("symptoms"),
  imageBase64: text("image_base64"),
  resultMarkdown: text("result_markdown").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()).notNull(),
});
