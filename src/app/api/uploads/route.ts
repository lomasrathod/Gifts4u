import { allow, clientIp } from "@/lib/rate-limit";
import { putObject } from "@/lib/storage";
import { newId } from "@/lib/tokens";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!allow(`upload:${clientIp(req)}`, 40, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many uploads. Please wait a bit." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use a JPG, PNG, WebP or GIF photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Photos must be under 8 MB." }, { status: 400 });
  const key = `${newId()}${newId()}`.slice(0, 24) + `.${ext}`;
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return Response.json({ key });
}
