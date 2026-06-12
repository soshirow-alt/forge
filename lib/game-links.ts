export function getPlayTypeLabel(playUrl: string): string {
  const lower = playUrl.toLowerCase();

  if (lower.includes("steam")) {
    return "Steam";
  }

  if (lower.includes("itch.io")) {
    return "外部サイト";
  }

  if (
    lower.includes("github.io") ||
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.endsWith(".html")
  ) {
    return "ブラウザでプレイ";
  }

  if (lower.includes(".zip") || lower.includes("drive.google.com")) {
    return "ダウンロード";
  }

  return "外部サイト";
}

export type ExternalLink = {
  label: string;
  url: string;
};

export function getExternalLinks(game: {
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
}): ExternalLink[] {
  const links: ExternalLink[] = [];

  if (game.steamUrl) {
    links.push({ label: "Steam", url: game.steamUrl });
  }
  if (game.itchUrl) {
    links.push({ label: "itch.io", url: game.itchUrl });
  }
  if (game.githubUrl) {
    links.push({ label: "GitHub", url: game.githubUrl });
  }
  if (game.discordUrl) {
    links.push({ label: "Discord", url: game.discordUrl });
  }
  if (game.officialUrl) {
    links.push({ label: "公式サイト", url: game.officialUrl });
  }

  return links;
}
