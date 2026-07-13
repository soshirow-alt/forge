"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isDataOrBlobAvatar } from "@/lib/profile-avatar-presets";

type ProfileAvatarProps = {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
};

function AvatarFallback({ className }: { className: string }) {
  return (
    <span
      className={`block overflow-hidden rounded-full bg-zinc-800 ${className}`}
      aria-hidden="true"
    />
  );
}

function isRemoteHttpAvatar(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

export function ProfileAvatar({
  src,
  alt = "",
  className = "size-24",
  size = 96,
}: ProfileAvatarProps) {
  const resolved = src.trim();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(resolved) && failedSrc === resolved;

  useEffect(() => {
    setFailedSrc(null);
  }, [resolved]);

  if (!resolved || failed) {
    return <AvatarFallback className={className} />;
  }

  if (isDataOrBlobAvatar(resolved) || isRemoteHttpAvatar(resolved)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data/remote avatars bypass next/image
      <img
        src={resolved}
        alt=""
        className={`rounded-full object-cover ${className}`}
        onError={() => setFailedSrc(resolved)}
      />
    );
  }

  return (
    <span className={`relative block overflow-hidden rounded-full bg-zinc-800 ${className}`}>
      <Image
        src={resolved}
        alt=""
        fill
        className="object-cover"
        sizes={`${size}px`}
        onError={() => setFailedSrc(resolved)}
      />
    </span>
  );
}
