import crypto from "node:crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cahtani_salt_2026").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(prefix: string = "token"): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
