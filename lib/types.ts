export type MemoryTag =
  | "Travel"
  | "Family"
  | "Work"
  | "Love"
  | "Achievement"
  | "Loss"
  | "Friendship"
  | "Everyday";

export type MemoryMediaType = "image" | "video";

export interface MemoryMedia {
  id: string;
  zipPath: string;
  base64: string;
  isCover: boolean;
  mediaType: MemoryMediaType;
  mimeType: string;
  fileName: string;
  fileSize: number;
  originalFile?: File;
}

export type MemoryImage = MemoryMedia;

export interface Memory {
  id: string;
  title: string;
  date: string;
  time: string | null;
  description: string;
  tag: MemoryTag | null;
  images: MemoryMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineData {
  version: string;
  lastUpdated: string;
  memories: Memory[];
}

export interface TimelineExport {
  version: string;
  exportedAt: string;
  metadata: {
    totalMemories: number;
    createdAt: string;
  };
  memories: Memory[];
}

export type ViewMode = "timeline" | "year";
export type SortOrder = "newest" | "oldest";

export const MEMORY_TAGS: MemoryTag[] = [
  "Travel",
  "Family",
  "Work",
  "Love",
  "Achievement",
  "Loss",
  "Friendship",
  "Everyday",
];
