/**
 * Cloudinary Direct Upload Helper
 * Uses unsigned upload preset for client-side uploads
 */

const CLOUD_NAME = "drccz5crh";
const UPLOAD_PRESET = "golden_beans_unsigned";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!file) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("File must be an image");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "golden-beans/menu");

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
  };
}

export function getOptimizedUrl(url: string, options: { width?: number; height?: number; square?: boolean } = {}): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  const { width = 600, height = 600, square = true } = options;

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    square ? "c_fill" : "c_limit",
    "g_auto",
    "q_auto:good",
    "f_auto",
  ].join(",");

  return url.replace("/upload/", `/upload/${transformations}/`);
}

export function getThumbnailUrl(url: string): string {
  return getOptimizedUrl(url, { width: 200, height: 200 });
}

export function getHeroUrl(url: string): string {
  return getOptimizedUrl(url, { width: 800, height: 800 });
}
