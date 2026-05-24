import type { MemoryMedia, MemoryMediaType } from "@/lib/types";
import { createId } from "@/lib/utils";

export interface ImageProcessResult {
  image: MemoryMedia;
  warning?: string;
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
  "bmp",
  "tif",
  "tiff",
  "svg",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "m4v",
  "mov",
  "webm",
  "avi",
  "mkv",
  "mpeg",
  "mpg",
  "ogv",
  "3gp",
  "3g2",
  "mts",
  "m2ts",
]);

export const ACCEPTED_MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].map(
  (extension) => `.${extension}`,
);

export async function processMediaFile(file: File, memoryId: string, index: number): Promise<ImageProcessResult> {
  const mediaType = getMediaType(file);
  if (!mediaType) {
    throw new Error("That file type is not supported. Try a common image or video file.");
  }

  const extension = getFileExtension(file.name) || extensionFromMime(file.type) || (mediaType === "video" ? "mp4" : "jpg");

  return {
    image: {
      id: createId(),
      zipPath: `media/memory-${memoryId}-media-${index}.${extension}`,
      objectUrl: URL.createObjectURL(file),
      isCover: false,
      mediaType,
      mimeType: file.type || mimeFromExtension(extension) || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
      fileName: file.name || `memory-media-${index}.${extension}`,
      fileSize: file.size,
      originalFile: file,
    },
    warning: getPreviewWarning(file, mediaType),
  };
}

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read this file."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(dataUrl: string): Blob {
  const [, payload] = dataUrl.split(",");
  const mime = getMimeFromDataUrl(dataUrl) ?? "application/octet-stream";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

export function isSupportedMediaFile(file: File): boolean {
  return getMediaType(file) !== null;
}

export function getMediaType(file: File): MemoryMediaType | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  const extension = getFileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  return null;
}

export function getMimeFromDataUrl(dataUrl: string): string | null {
  return dataUrl.match(/^data:(.*?);/)?.[1] ?? null;
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function extensionFromMime(mimeType: string): string | null {
  const normalized = mimeType.toLowerCase();
  if (!normalized.includes("/")) {
    return null;
  }

  const extension = normalized.split("/")[1].replace("quicktime", "mov").replace("svg+xml", "svg");
  return extension || null;
}

function mimeFromExtension(extension: string): string | null {
  if (IMAGE_EXTENSIONS.has(extension)) {
    return extension === "svg" ? "image/svg+xml" : `image/${extension === "jpg" ? "jpeg" : extension}`;
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    if (extension === "mov") {
      return "video/quicktime";
    }
    if (extension === "m4v") {
      return "video/x-m4v";
    }
    return `video/${extension}`;
  }

  return null;
}

function getPreviewWarning(file: File, mediaType: MemoryMediaType): string | undefined {
  const extension = getFileExtension(file.name);
  if (extension === "heic" || extension === "heif") {
    return "HEIC previews depend on browser support, but the original file is preserved.";
  }

  if (mediaType === "video" && !["mp4", "m4v", "mov", "webm", "ogv"].includes(extension)) {
    return "This video will be preserved exactly, though browser preview support may vary.";
  }

  return undefined;
}
