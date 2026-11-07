import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_DIMENSION = 1280;
const WATCHDOG_MS = 45000;

async function compressIfBig(file: Blob): Promise<Blob> {
  if (file.size < 400 * 1024) return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.75));
  return out ?? file;
}

export async function uploadPhoto(opts: {
  path: string;
  file: Blob;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  const blob = await compressIfBig(opts.file);
  const storageRef = ref(storage, opts.path);
  const attempt = () =>
    new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob, { contentType: "image/jpeg" });
      const watchdog = setTimeout(() => { task.cancel(); reject(new Error("timeout")); }, WATCHDOG_MS);
      task.on(
        "state_changed",
        (snap) => opts.onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => { clearTimeout(watchdog); reject(err); },
        async () => { clearTimeout(watchdog); resolve(await getDownloadURL(task.snapshot.ref)); }
      );
    });
  try { return await attempt(); }
  catch { opts.onProgress?.(0); return await attempt(); }
}
