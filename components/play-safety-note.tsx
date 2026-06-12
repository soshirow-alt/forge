import {
  DOWNLOAD_SAFETY_NOTE,
  EXTERNAL_LINK_SAFETY_NOTE,
  isDownloadLink,
} from "@/lib/play-environment";

type PlaySafetyNoteProps = {
  playUrl: string;
  variant?: "external" | "download" | "auto";
  className?: string;
};

export function PlaySafetyNote({
  playUrl,
  variant = "auto",
  className = "",
}: PlaySafetyNoteProps) {
  const isDownload =
    variant === "download" || (variant === "auto" && isDownloadLink(playUrl));

  const message = isDownload ? DOWNLOAD_SAFETY_NOTE : EXTERNAL_LINK_SAFETY_NOTE;

  return (
    <p className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}>
      {message}
    </p>
  );
}

export function ExternalLinkSafetyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}>
      {EXTERNAL_LINK_SAFETY_NOTE}
    </p>
  );
}

export function DownloadSafetyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}>
      {DOWNLOAD_SAFETY_NOTE}
    </p>
  );
}
