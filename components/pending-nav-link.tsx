"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  FORGE_NAV_PENDING_CLASS,
  forgeNavPendingLabel,
} from "@/lib/forge-nav-pending";

type PendingNavLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  pendingLabel?: boolean;
  idleLabel?: string;
};

function hrefPathname(href: ComponentProps<typeof Link>["href"]): string | null {
  if (typeof href === "string") {
    const path = href.split("?")[0]?.split("#")[0] ?? href;
    return path || null;
  }
  if (href && typeof href === "object" && "pathname" in href) {
    return href.pathname ?? null;
  }
  return null;
}

/**
 * Minimal Forge-native click feedback for full-route Links (opacity + aria-busy).
 * Consumer onClick runs first; respects preventDefault; skips same-route clicks;
 * blocks double-activation while pending.
 */
export function PendingNavLink({
  children,
  className = "",
  onClick,
  pendingLabel = false,
  idleLabel,
  href,
  ...rest
}: PendingNavLinkProps) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const targetPath = hrefPathname(href);
  const sameDestination = Boolean(targetPath) && pathname === targetPath;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (pending) {
      event.preventDefault();
      return;
    }

    if (sameDestination) {
      return;
    }

    if (
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      event.button === 0
    ) {
      setPending(true);
    }
  }

  const content =
    pendingLabel && typeof idleLabel === "string"
      ? forgeNavPendingLabel(pending, idleLabel)
      : children;

  return (
    <Link
      {...rest}
      href={href}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      className={`${className}${pending ? FORGE_NAV_PENDING_CLASS : ""}`}
      onClick={handleClick}
      tabIndex={pending ? -1 : rest.tabIndex}
    >
      {content}
    </Link>
  );
}
