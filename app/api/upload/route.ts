import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Upload a JPG, PNG, WEBP, or GIF image up to 5 MB." }, { status: 400 });
    }
    const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
    if (!cloud || !key || !secret) {
      return Response.json({ error: "Persistent image storage is not configured." }, { status: 503 });
    }
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHash("sha1").update(`folder=class-members&timestamp=${timestamp}${secret}`).digest("hex");
    const data = new FormData();
    data.append("file", file);
    data.append("api_key", key);
    data.append("timestamp", timestamp);
    data.append("folder", "class-members");
    data.append("signature", signature);
    const result = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: data });
    if (!result.ok) return Response.json({ error: "Image storage rejected the upload." }, { status: 502 });
    const uploaded = (await result.json()) as { secure_url?: string };
    if (!uploaded.secure_url) return Response.json({ error: "Image storage returned no URL." }, { status: 502 });
    return Response.json({ url: uploaded.secure_url }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
