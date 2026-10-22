import { createHash, randomBytes } from "node:crypto";
import { customAlphabet } from "nanoid";

export const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);
// Gift links: short, unguessable, no look-alike characters.
const slugCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);

export function newSlug(prefix?: string): string {
  const clean = (prefix ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  return clean ? `${clean}-${slugCode()}` : slugCode();
}

export function newSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
