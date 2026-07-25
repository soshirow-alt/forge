import { normalizePublishLinkUrl } from "@/lib/project-publish-links";

export const DISCORD_LINK_KIND = "discord";

export type DiscordRelatedLinkItem = {
  url: string;
  kind?: string;
  label?: string | null;
};

const DISCORD_INVITE_HOSTS = new Set([
  "discord.gg",
  "discord.com",
  "www.discord.com",
  "discordapp.com",
  "www.discordapp.com",
]);

function parseDiscordHostname(url: string): string | null {
  try {
    const normalized = normalizePublishLinkUrl(url);
    if (!normalized) {
      return null;
    }
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isDiscordInviteUrl(url: string): boolean {
  const hostname = parseDiscordHostname(url);
  if (!hostname || !DISCORD_INVITE_HOSTS.has(hostname)) {
    return false;
  }

  try {
    const normalized = normalizePublishLinkUrl(url);
    if (!normalized) {
      return false;
    }
    const parsed = new URL(normalized);
    const path = parsed.pathname.toLowerCase();
    if (hostname === "discord.gg") {
      return path.length > 1;
    }
    return path.startsWith("/invite/");
  } catch {
    return false;
  }
}

export function normalizeDiscordUrl(url: string): string | null {
  const normalized = normalizePublishLinkUrl(url);
  if (!normalized || !isDiscordInviteUrl(normalized)) {
    return null;
  }
  return normalized;
}

function isDiscordRelatedLinkRecord(
  value: unknown,
): value is DiscordRelatedLinkItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.url === "string" && record.url.trim().length > 0;
}

export function isDiscordRelatedLinkItem(value: unknown): boolean {
  if (!isDiscordRelatedLinkRecord(value)) {
    return false;
  }
  if (value.kind === DISCORD_LINK_KIND) {
    return true;
  }
  const label = value.label?.trim().toLowerCase() ?? "";
  if (label.includes("discord")) {
    return true;
  }
  return isDiscordInviteUrl(value.url);
}

export function findDiscordRelatedLinkUrl(raw: unknown): string | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  for (const entry of raw) {
    if (!isDiscordRelatedLinkItem(entry)) {
      continue;
    }
    const normalized = normalizeDiscordUrl(entry.url);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function resolveProjectDiscordUrl(input: {
  relatedLinks?: unknown;
  discordUrl?: string | null;
}): string | null {
  const fromRelatedLinks = findDiscordRelatedLinkUrl(input.relatedLinks);
  if (fromRelatedLinks) {
    return fromRelatedLinks;
  }
  if (!input.discordUrl?.trim()) {
    return null;
  }
  return normalizeDiscordUrl(input.discordUrl);
}

export function resolveDeveloperDiscordUrl(input: {
  relatedLinks?: unknown;
  discordUrl?: string | null;
}): string | null {
  return resolveProjectDiscordUrl(input);
}
