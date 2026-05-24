"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MemoryImage } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function ImageCarousel({ images }: { images: MemoryImage[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const active = images[index];
  const go = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  return (
    <div className="relative bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={active.base64} alt="" className="h-[280px] w-full object-cover sm:h-[400px]" loading="lazy" />
      {images.length > 1 ? (
        <>
          <Button
            variant="icon"
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--text)]">
            {index + 1} / {images.length}
          </div>
        </>
      ) : null}
    </div>
  );
}
