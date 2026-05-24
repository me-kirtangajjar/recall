import JSZip from "jszip";
import type { Memory, MemoryMedia, TimelineExport } from "@/lib/types";
import { base64ToBlob, getFileExtension, getMimeFromDataUrl, readFileAsDataUrl } from "@/lib/imageUtils";
import { inferMediaTypeFromStoredValue, normalizeImages, stripOriginalFiles } from "@/lib/utils";
import { VERSION } from "@/lib/storageUtils";
import { getMediaBlob } from "@/lib/dbUtils";

export interface BuildZipResult {
  blob: Blob;
  filename: string;
}

export async function buildTimelineZip(
  memories: Memory[],
  onProgress?: (progress: number) => void,
): Promise<BuildZipResult> {
  const zip = new JSZip();
  const mediaFolder = zip.folder("media");
  const exportedMemories: Memory[] = [];
  let imageCount = 0;

  for (const memory of memories) {
    const images = normalizeImages(memory.images).map((image, index) => {
      imageCount += 1;
      const extension = image.fileName.split(".").pop() || (image.mediaType === "video" ? "mp4" : "jpg");
      return {
        ...image,
        zipPath: `media/memory-${memory.id}-media-${index}.${extension}`,
      };
    });

    exportedMemories.push(stripOriginalFiles({ ...memory, images }));
  }

  let processed = 0;
  for (const memory of memories) {
    for (let index = 0; index < memory.images.length; index += 1) {
      const image = memory.images[index];
      const extension = image.fileName.split(".").pop() || (image.mediaType === "video" ? "mp4" : "jpg");
      const zipPath = `memory-${memory.id}-media-${index}.${extension}`;
      const content = image.originalFile ?? (await getMediaBlob(image.id)) ?? (image.base64 ? base64ToBlob(image.base64) : null);
      if (content) {
        mediaFolder?.file(zipPath, content);
      }
      processed += 1;
      onProgress?.(imageCount === 0 ? 50 : Math.round((processed / imageCount) * 70));
    }
  }

  const createdAt =
    memories.map((memory) => memory.createdAt).sort((a, b) => a.localeCompare(b))[0] ??
    new Date().toISOString();

  const timeline: TimelineExport = {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    metadata: {
      totalMemories: memories.length,
      createdAt,
    },
    memories: exportedMemories,
  };

  zip.file("timeline.json", JSON.stringify(timeline, null, 2));
  const blob = await zip.generateAsync(
    { type: "blob", compression: "STORE" },
    (metadata) => onProgress?.(70 + Math.round(metadata.percent * 0.3)),
  );

  const date = new Date().toISOString().slice(0, 10);
  return { blob, filename: `recall-backup-${date}.zip` };
}

export async function parseTimelineZip(file: File): Promise<Memory[]> {
  const zip = await JSZip.loadAsync(file);
  const timelineFile = zip.file("timeline.json");

  if (!timelineFile) {
    throw new Error("This doesn't look like a valid Recall backup file.");
  }

  let parsed: Partial<TimelineExport>;
  try {
    parsed = JSON.parse(await timelineFile.async("string")) as Partial<TimelineExport>;
  } catch {
    throw new Error("The timeline file inside this backup is corrupted.");
  }

  if (!parsed.version || !Array.isArray(parsed.memories)) {
    throw new Error("This doesn't look like a valid Recall backup file.");
  }

  const memories: Memory[] = [];
  for (const memory of parsed.memories) {
    const images: MemoryMedia[] = [];

    for (const image of memory.images ?? []) {
      const fileFromZip = image.zipPath ? zip.file(image.zipPath) : null;
      if (fileFromZip) {
        const blob = await fileFromZip.async("blob");
        const fileName = image.fileName ?? image.zipPath.split("/").pop() ?? "memory-media";
        const base64 = await readFileAsDataUrl(blob);
        const mimeType =
          image.mimeType || blob.type || getMimeFromDataUrl(base64) || fallbackMimeType(fileName, image.base64);
        images.push({
          ...image,
          base64,
          mediaType: image.mediaType ?? inferMediaTypeFromStoredValue({ base64, mimeType, fileName }),
          mimeType,
          fileName,
          fileSize: image.fileSize || blob.size,
          originalFile: new File([blob], fileName, {
            type: mimeType,
          }),
        });
      } else if (image.base64) {
        const fileName = image.fileName ?? image.zipPath?.split("/").pop() ?? "memory-media";
        const mimeType = image.mimeType || getMimeFromDataUrl(image.base64) || fallbackMimeType(fileName, image.base64);
        images.push({
          ...image,
          mediaType: image.mediaType ?? inferMediaTypeFromStoredValue({ base64: image.base64, mimeType, fileName }),
          mimeType,
          fileName,
          fileSize: image.fileSize ?? base64ToBlob(image.base64).size,
        });
      }
    }

    memories.push({
      ...memory,
      time: memory.time ?? null,
      tag: memory.tag ?? null,
      description: memory.description ?? "",
      images: normalizeImages(images),
    });
  }

  return memories;
}

function fallbackMimeType(fileName: string, base64?: string): string {
  const fromDataUrl = base64 ? getMimeFromDataUrl(base64) : null;
  if (fromDataUrl) {
    return fromDataUrl;
  }

  const extension = getFileExtension(fileName);
  if (["mp4", "m4v"].includes(extension)) {
    return "video/mp4";
  }
  if (extension === "mov") {
    return "video/quicktime";
  }
  if (extension === "webm") {
    return "video/webm";
  }
  if (extension === "avi") {
    return "video/x-msvideo";
  }
  if (extension === "mkv") {
    return "video/x-matroska";
  }
  if (["mpeg", "mpg"].includes(extension)) {
    return "video/mpeg";
  }
  if (extension === "ogv") {
    return "video/ogg";
  }
  if (["3gp", "3g2"].includes(extension)) {
    return "video/3gpp";
  }
  if (["mts", "m2ts"].includes(extension)) {
    return "video/mp2t";
  }
  if (["jpg", "jpeg"].includes(extension)) {
    return "image/jpeg";
  }
  if (extension) {
    return `image/${extension}`;
  }

  return "application/octet-stream";
}
