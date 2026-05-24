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
  if (media.mediaType === "video") {
    return (
      <video
        src={media.base64}
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
  return <img src={media.base64} alt="" className={className} loading="lazy" />;
}
