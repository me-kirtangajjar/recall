import JSZip from "jszip";
import type { Memory, TimelineExport } from "@/lib/types";
import { base64ToBlob, readFileAsDataUrl } from "@/lib/imageUtils";
import { normalizeImages, stripOriginalFiles } from "@/lib/utils";
import { VERSION } from "@/lib/storageUtils";

export interface BuildZipResult {
  blob: Blob;
  filename: string;
}

export async function buildTimelineZip(
  memories: Memory[],
  onProgress?: (progress: number) => void,
): Promise<BuildZipResult> {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");
  const exportedMemories: Memory[] = [];
  let imageCount = 0;

  for (const memory of memories) {
    const images = normalizeImages(memory.images).map((image, index) => {
      imageCount += 1;
      return {
        ...image,
        zipPath: `images/memory-${memory.id}-img-${index}.jpg`,
      };
    });

    exportedMemories.push(stripOriginalFiles({ ...memory, images }));
  }

  let processed = 0;
  for (const memory of memories) {
    for (let index = 0; index < memory.images.length; index += 1) {
      const image = memory.images[index];
      const zipPath = `memory-${memory.id}-img-${index}.jpg`;
      const content = image.originalFile ?? base64ToBlob(image.base64);
      imagesFolder?.file(zipPath, content);
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
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
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
    const images = [];

    for (const image of memory.images ?? []) {
      const fileFromZip = image.zipPath ? zip.file(image.zipPath) : null;
      if (fileFromZip) {
        const blob = await fileFromZip.async("blob");
        images.push({
          ...image,
          base64: await readFileAsDataUrl(blob),
          originalFile: new File([blob], image.zipPath.split("/").pop() ?? "memory-image.jpg", {
            type: blob.type || "image/jpeg",
          }),
        });
      } else if (image.base64) {
        images.push(image);
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
