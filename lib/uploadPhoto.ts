import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_DIMENSION = 1280;
const WATCHDOG_MS = 45000;
const PREP_TIMEOUT_MS = 12000;

// Never let a step hang forever: race against a timeout, fall back.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
}

async function compressIfBig(file: Blob): Promise<Blob> {
  if (file.size < 400 * 1024) return file;
  try {
    const bitmap = await withTimeout(
      createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null),
      PREP_TIMEOUT_MS, null
    );
    if (!bitmap) return file;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const out = await withTimeout(
      new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.75)),
      PREP_TIMEOUT_MS, null
    );
    return out ?? file;
  } catch {
    return file;
  }
}

export async function uploadPhoto(opts: {
  path: string;
  file: Blob;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  const attempt = async () => {
    const blob = await compressIfBig(opts.file); // timeout-protected, cannot hang
    const storageRef = ref(storage, opts.path);
    return await new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob, { contentType: "image/jpeg" });
      const watchdog = setTimeout(() => { task.cancel(); reject(new Error("timeout")); }, WATCHDOG_MS);
      task.on(
        "state_changed",
        (snap) => opts.onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => { clearTimeout(watchdog); reject(err); },
        async () => {
          clearTimeout(watchdog);
          try { resolve(await getDownloadURL(task.snapshot.ref)); } catch (e) { reject(e); }
        }
      );
    });
  };
  try {
    return await attempt();
  } catch {
    opts.onProgress?.(0);
    return await attempt(); // one automatic retry
  }
}
