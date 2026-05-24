import type { MemoryImage } from "@/lib/types";
import { createId } from "@/lib/utils";

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const DISPLAY_QUALITY = 0.82;

export interface ImageProcessResult {
  image: MemoryImage;
  warning?: string;
}

export async function processImageFile(file: File, memoryId: string, index: number): Promise<ImageProcessResult> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("This image is over 50MB. Try a smaller file.");
  }

  const rawBase64 = await readFileAsDataUrl(file);
  const compressed = await compressDataUrl(rawBase64).catch(() => rawBase64);

  return {
    image: {
      id: createId(),
      zipPath: `images/memory-${memoryId}-img-${index}.jpg`,
      base64: compressed,
      isCover: false,
      originalFile: file,
    },
    warning: file.type.toLowerCase().includes("heic")
      ? "HEIC previews depend on browser support, but the file will still be kept for backup."
      : undefined,
  };
}

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read this image."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.readAsDataURL(file);
  });
}

export async function compressDataUrl(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const scale = Math.min(MAX_WIDTH / image.width, MAX_HEIGHT / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare this image.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", DISPLAY_QUALITY);
}

export function base64ToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be previewed."));
    image.src = src;
  });
}
