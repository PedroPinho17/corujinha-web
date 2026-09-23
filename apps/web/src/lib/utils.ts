import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mediaUrl(key?: string | null) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  const base =
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? "http://localhost:9012";
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "corujinha-media";
  return `${base.replace(/\/$/, "")}/${bucket}/${key}`;
}
