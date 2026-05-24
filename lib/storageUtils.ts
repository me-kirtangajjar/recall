import type { Memory, TimelineData } from "@/lib/types";
import { inferMediaTypeFromStoredValue, stripOriginalFiles } from "@/lib/utils";

export const STORAGE_KEY = "recall_data";
const LEGACY_STORAGE_KEY = "timelines_data";
export const VERSION = "1.0";

export interface StorageReadResult {
  data: TimelineData | null;
  existed: boolean;
}

export interface StorageWriteResult {
  ok: boolean;
  quotaExceeded: boolean;
}

export function readTimelineStorage(): StorageReadResult {
  if (typeof window === "undefined") {
    return { data: null, existed: false };
  }

  const raw =
    window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return { data: null, existed: false };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TimelineData>;
    if (!Array.isArray(parsed.memories)) {
      return { data: null, existed: true };
    }

    return {
      data: {
        version: typeof parsed.version === "string" ? parsed.version : VERSION,
        lastUpdated:
          typeof parsed.lastUpdated === "string" ? parsed.lastUpdated : new Date().toISOString(),
        memories: parsed.memories.map((memory) => sanitizeMemory(memory)),
      },
      existed: true,
    };
  } catch {
    return { data: null, existed: true };
  }
}

export function writeTimelineStorage(memories: Memory[]): StorageWriteResult {
  if (typeof window === "undefined") {
    return { ok: false, quotaExceeded: false };
  }

  const data: TimelineData = {
    version: VERSION,
    lastUpdated: new Date().toISOString(),
    memories: memories.map(stripOriginalFiles),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return { ok: true, quotaExceeded: false };
  } catch (error) {
    return { ok: false, quotaExceeded: isQuotaExceeded(error) };
  }
}

export function hasTimelineStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(STORAGE_KEY) !== null ||
    window.localStorage.getItem(LEGACY_STORAGE_KEY) !== null
  );
}

export function clearTimelineStorage(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function sanitizeMemory(value: unknown): Memory {
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const memory = value as Partial<Memory>;

  return {
    id: typeof memory.id === "string" ? memory.id : crypto.randomUUID(),
    title: typeof memory.title === "string" ? memory.title : "Untitled memory",
    date: typeof memory.date === "string" ? memory.date : fallbackDate,
    time: typeof memory.time === "string" ? memory.time : null,
    description: typeof memory.description === "string" ? memory.description : "",
    tag: memory.tag ?? null,
    images: Array.isArray(memory.images)
      ? memory.images.map((image, index) => {
          const mediaType =
            image.mediaType === "video" || image.mediaType === "image"
              ? image.mediaType
              : inferMediaTypeFromStoredValue(image);
          const fallbackExtension = mediaType === "video" ? "mp4" : "jpg";

          return {
            id: typeof image.id === "string" ? image.id : crypto.randomUUID(),
            zipPath:
              typeof image.zipPath === "string"
                ? image.zipPath
                : `media/memory-${memory.id}-media-${index}.${fallbackExtension}`,
            base64: typeof image.base64 === "string" ? image.base64 : "",
            isCover: Boolean(image.isCover),
            mediaType,
            mimeType:
              typeof image.mimeType === "string"
                ? image.mimeType
                : mediaType === "video"
                  ? "video/mp4"
                  : "image/jpeg",
            fileName:
              typeof image.fileName === "string"
                ? image.fileName
                : `memory-media-${index}.${fallbackExtension}`,
            fileSize: typeof image.fileSize === "number" ? image.fileSize : 0,
          };
        })
      : [],
    createdAt:
      typeof memory.createdAt === "string" ? memory.createdAt : new Date().toISOString(),
    updatedAt:
      typeof memory.updatedAt === "string" ? memory.updatedAt : new Date().toISOString(),
  };
}
