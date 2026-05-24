import type { Memory, MemoryImage } from "@/lib/types";

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function getCoverImage(memory: Memory): MemoryImage | undefined {
  return memory.images.find((image) => image.isCover) ?? memory.images[0];
}

export function normalizeImages(images: MemoryImage[]): MemoryImage[] {
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
      base64: image.base64,
      isCover: image.isCover,
    })),
  };
}

export function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
