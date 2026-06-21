"use client";

import Image from "next/image";
import { isDataOrBlobAvatar } from "@/lib/profile-avatar-presets";

type ProfileAvatarProps = {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
};

export function ProfileAvatar({ src, alt = "", className = "size-24", size = 96 }: ProfileAvatarProps) {
  if (isDataOrBlobAvatar(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />
    );
  }

  return (
    <span className={`relative block overflow-hidden rounded-full bg-zinc-800 ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={`${size}px`} />
    </span>
  );
}
