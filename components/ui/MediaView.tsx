"use client";

import type { MemoryMedia } from "@/lib/types";

export function MediaView({
  media,
  className,
  controls = false,
  autoPlay = false,
}: {
  media: MemoryMedia;
  className: string;
  controls?: boolean;
  autoPlay?: boolean;
}) {
  const src = media.objectUrl ?? media.base64 ?? "";

  if (media.mediaType === "video") {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        muted={!controls}
        loop={autoPlay}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} loading="lazy" />;
}
