"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import type { MemoryImage } from "@/lib/types";
import { processImageFile } from "@/lib/imageUtils";
import { Button } from "@/components/ui/Button";
import { cn, normalizeImages } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function ImageUpload({
  memoryId,
  images,
  onChange,
  onWarning,
}: {
  memoryId: string;
  images: MemoryImage[];
  onChange: (images: MemoryImage[]) => void;
  onWarning: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList).filter((file) => {
      const accepted = ACCEPTED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".heic");
      if (!accepted) {
        onWarning("That file type is not supported. Try JPEG, PNG, WEBP, or HEIC.");
      }
      return accepted;
    });

    if (images.length + files.length > 20) {
      onWarning("That's a wonderfully full memory. Above 20 images, backups can take a little longer.");
    }

    setBusy(true);
    try {
      const processed = await Promise.all(
        files.map((file, index) => processImageFile(file, memoryId, images.length + index)),
      );
      const warnings = processed.map((result) => result.warning).filter((warning): warning is string => Boolean(warning));
      warnings.forEach(onWarning);
      const next = [...images, ...processed.map((result) => result.image)];
      const hasCover = next.some((image) => image.isCover);
      if (!hasCover && next.length > 0) {
        const randomCover = Math.floor(Math.random() * next.length);
        onChange(next.map((image, index) => ({ ...image, isCover: index === randomCover })));
      } else {
        onChange(normalizeImages(next));
      }
    } catch (error) {
      onWarning(error instanceof Error ? error.message : "One image could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    onChange(normalizeImages(images.filter((image) => image.id !== id)));
  };

  const setCover = (id: string) => {
    onChange(images.map((image) => ({ ...image, isCover: image.id === id })));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border border-dashed border-[var(--border)] bg-stone-50 p-5 text-center transition",
          dragging && "border-[var(--accent)] bg-[color:var(--accent-soft)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic"
          onChange={onInputChange}
          className="sr-only"
        />
        <ImagePlus className="mx-auto h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
        <p className="mt-2 text-sm font-semibold text-[var(--text)]">Drop images here</p>
        <p className="mt-1 text-sm text-[var(--muted)]">or choose a few from this device</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Preparing images..." : "Choose Images"}
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.base64} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-1 top-1 flex justify-between gap-1">
                {image.isCover ? (
                  <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    className="rounded-full bg-white/90 p-1 opacity-0 transition group-hover:opacity-100"
                    onClick={() => setCover(image.id)}
                    aria-label="Set image as cover"
                  >
                    <Star className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-full bg-white/90 p-1 opacity-0 transition group-hover:opacity-100"
                  onClick={() => removeImage(image.id)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
