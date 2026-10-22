import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

// Photos are stored under random keys in a private Vercel Blob store and served
// only through /api/media, so nothing is listed or indexed. Local disk in dev.

const LOCAL_DIR = process.env.VERCEL ? "/tmp/gifts4u-uploads" : path.join(process.cwd(), ".data", "uploads");
const KEY_RE = /^[a-z0-9]{16,32}\.(jpg|png|webp|gif)$/;
const PREFIX = "photos/";

export function isValidKey(key: string) {
  return KEY_RE.test(key);
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  if (env.blobToken) {
    await put(PREFIX + key, Buffer.from(body), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      token: env.blobToken,
    });
    return;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, key), body);
}

export async function getObject(key: string): Promise<Uint8Array | null> {
  if (!isValidKey(key)) return null;
  if (env.blobToken) {
    try {
      const res = await get(PREFIX + key, { access: "private", token: env.blobToken });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      return new Uint8Array(await new Response(res.stream).arrayBuffer());
    } catch {
      return null;
    }
  }
  try {
    return new Uint8Array(await readFile(path.join(LOCAL_DIR, key)));
  } catch {
    return null;
  }
}
