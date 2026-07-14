"use client";

import { resolvePublicXLink } from "@/lib/public-x-link";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.527-8.601L1.5 2.25h3.986l4.255 5.708L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function PublicXLink({
  accountOrUrl,
  className = "inline-flex items-center gap-1 text-violet-300 transition-colors hover:text-violet-200",
}: {
  accountOrUrl: string | null | undefined;
  className?: string;
}) {
  const link = resolvePublicXLink(accountOrUrl);
  if (!link) return null;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      <XLogo className="size-3.5 shrink-0" />
      <span>{link.label}</span>
    </a>
  );
}
