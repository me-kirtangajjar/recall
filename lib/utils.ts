import type { Memory, MemoryMedia } from "@/lib/types";

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function getCoverImage(memory: Memory): MemoryMedia | undefined {
  return memory.images.find((image) => image.isCover) ?? memory.images[0];
}

export function normalizeImages(images: MemoryMedia[]): MemoryMedia[] {
  if (images.length === 0) {
    return [];
  }

  const coverIndex = images.findIndex((image) => image.isCover);
  const selectedCover = coverIndex >= 0 ? coverIndex : 0;

  return images.map((image, index) => ({
    ...image,
    isCover: index === selectedCover,
  }));
}

export function stripOriginalFiles(memory: Memory): Memory {
  return {
    ...memory,
    images: memory.images.map((image) => ({
      id: image.id,
      zipPath: image.zipPath,
      isCover: image.isCover,
      mediaType: image.mediaType,
      mimeType: image.mimeType,
      fileName: image.fileName,
      fileSize: image.fileSize,
    })),
  };
}

export function inferMediaTypeFromStoredValue(value: {
  base64?: string;
  mimeType?: string;
  fileName?: string;
}): "image" | "video" {
  const mimeType = value.mimeType || value.base64?.match(/^data:(.*?);/)?.[1] || "";
  if (mimeType.startsWith("video/")) {
    return "video";
  }

  const extension = value.fileName?.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "m4v", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "ogv", "3gp", "3g2", "mts", "m2ts"].includes(extension)) {
    return "video";
  }

  return "image";
}

export function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
