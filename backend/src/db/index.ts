import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { AsyncLocalStorage } from "node:async_hooks";
import * as schema from "./schema.js";

export const asyncLocalStorage = new AsyncLocalStorage<any>();

let localLibsqlClient: any = null;

export function getDb(c?: any): any {
  const ctx = c || asyncLocalStorage.getStore();
  const d1 = ctx?.env?.DB || ctx?.DB || (globalThis as any).__D1_DB__;
  if (d1 && typeof d1.prepare === "function") {
    return drizzleD1(d1, { schema });
  }

  // Fallback for standalone Node.js CLI script execution (e.g. db:seed)
  if (!localLibsqlClient) {
    const dbUrl = process.env.DATABASE_URL || "file:cahtani.db";
    localLibsqlClient = createClient({ url: dbUrl });
  }
  return drizzleLibsql(localLibsqlClient, { schema });
}

// Proxy export for 'db' so existing route code works without changes
export const db = new Proxy({} as any, {
  get(target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

// Helper to auto-initialize DB tables if migrations haven't run
export async function initDb(c?: any) {
  const ctx = c || asyncLocalStorage.getStore();
  const d1 = ctx?.env?.DB || ctx?.DB || (globalThis as any).__D1_DB__;

  const createTablesSql = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      gender TEXT,
      location TEXT,
      crops TEXT,
      role TEXT NOT NULL DEFAULT 'farmer',
      is_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expires TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS plant_growth_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      crop_name TEXT NOT NULL,
      stage TEXT NOT NULL,
      height_cm INTEGER NOT NULL,
      notes TEXT,
      photo_base64 TEXT,
      log_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS planting_schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      crop_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      harvest_target_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS planting_milestones (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL REFERENCES planting_schedules(id) ON DELETE CASCADE,
      milestone_date TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      completed INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS custom_reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      notes TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon_name TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS shop_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES product_categories(id),
      created_by TEXT NOT NULL REFERENCES users(id),
      crop_target TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      sold_count TEXT,
      price_range TEXT NOT NULL,
      description TEXT,
      ai_recommendation TEXT,
      image TEXT,
      search_query TEXT,
      badge TEXT,
      shopee_keyword TEXT,
      tokopedia_keyword TEXT,
      tiktok_keyword TEXT,
      shopee_affiliate_url TEXT,
      tokopedia_affiliate_url TEXT,
      tiktok_affiliate_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS pest_diseases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      crop TEXT NOT NULL,
      category TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      solution_quick TEXT NOT NULL,
      icon_name TEXT,
      tag TEXT,
      created_by TEXT REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS preset_diagnoses (
      id TEXT PRIMARY KEY,
      crop TEXT NOT NULL,
      title TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      severity TEXT NOT NULL,
      solution TEXT NOT NULL,
      created_by TEXT REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS farmer_testimonials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      crop TEXT NOT NULL,
      quote TEXT NOT NULL,
      impact TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS faq_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      crop_type TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS diagnosis_records (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      crop_type TEXT NOT NULL,
      region TEXT,
      symptoms TEXT,
      image_base64 TEXT,
      result_markdown TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  ];

  try {
    if (d1 && typeof d1.batch === "function") {
      await d1.batch(createTablesSql.map((sql) => d1.prepare(sql)));
    } else {
      if (!localLibsqlClient) {
        const dbUrl = process.env.DATABASE_URL || "file:cahtani.db";
        localLibsqlClient = createClient({ url: dbUrl });
      }
      for (const query of createTablesSql) {
        await localLibsqlClient.execute(query);
      }
    }
  } catch (err) {
    console.error("initDb Error:", err);
  }
}
