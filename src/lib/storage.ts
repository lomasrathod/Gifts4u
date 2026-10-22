import { AwsClient } from "aws4fetch";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

// Photos are stored under random keys and served only through /api/media,
// so nothing is listed or indexed. R2 in production, local disk in dev.

const r2 =
  env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket
    ? {
        client: new AwsClient({ accessKeyId: env.r2.accessKeyId, secretAccessKey: env.r2.secretAccessKey, service: "s3", region: "auto" }),
        base: `https://${env.r2.accountId}.r2.cloudflarestorage.com/${env.r2.bucket}`,
      }
    : null;

const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
const KEY_RE = /^[a-z0-9]{16,32}\.(jpg|png|webp|gif)$/;

export function isValidKey(key: string) {
  return KEY_RE.test(key);
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  if (r2) {
    const res = await r2.client.fetch(`${r2.base}/${key}`, {
      method: "PUT",
      body: body as BodyInit,
      headers: { "Content-Type": contentType },
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, key), body);
}

export async function getObject(key: string): Promise<Uint8Array | null> {
  if (!isValidKey(key)) return null;
  if (r2) {
    const res = await r2.client.fetch(`${r2.base}/${key}`);
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  }
  try {
    return new Uint8Array(await readFile(path.join(LOCAL_DIR, key)));
  } catch {
    return null;
  }
}
