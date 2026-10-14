import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mediaUrl(key?: string | null) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  const base =
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL ??
    "http://corujinha-media.web.garage.localhost:3902";
  const includeBucket = process.env.NEXT_PUBLIC_S3_PUBLIC_INCLUDE_BUCKET === "true";
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "corujinha-media";
  const root = base.replace(/\/$/, "");
  if (includeBucket) {
    return `${root}/${bucket}/${key}`;
  }
  return `${root}/${key}`;
}
