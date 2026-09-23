/**
 * Generate favicons from Corujinha logo (logo1.webp).
 * Usage: pnpm generate:favicons
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, resolve } from "path";

const root = resolve(process.cwd(), "apps/web/public");
const src = join(root, "logo1.webp");
const favDir = join(root, "favicons");

mkdirSync(favDir, { recursive: true });

const outputs = [
  { file: join(favDir, "favicon-16x16.png"), size: 16 },
  { file: join(favDir, "favicon-32x32.png"), size: 32 },
  { file: join(favDir, "apple-touch-icon.png"), size: 180 },
  { file: join(favDir, "android-chrome-192x192.png"), size: 192 },
  { file: join(favDir, "android-chrome-512x512.png"), size: 512 },
  { file: join(favDir, "web-app-manifest-192x192.png"), size: 192 },
  { file: join(favDir, "web-app-manifest-512x512.png"), size: 512 },
];

async function render(size, file) {
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(file);
  console.log("wrote", file);
}

async function main() {
  for (const { file, size } of outputs) {
    await render(size, file);
  }

  await render(32, join(root, "favicon.png"));
  console.log("Done — favicons generated from logo1.webp");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
