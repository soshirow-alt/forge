"use client";

import { useState } from "react";

const PREVIEW_MAX_CHARS = 160;

function getDescriptionPreview(description: string): {
  preview: string;
  isTruncated: boolean;
} {
  const trimmed = description.trim();

  if (trimmed.length <= PREVIEW_MAX_CHARS) {
    return { preview: trimmed, isTruncated: false };
  }

  const cut = trimmed.lastIndexOf(" ", PREVIEW_MAX_CHARS);
  const index = cut > 80 ? cut : PREVIEW_MAX_CHARS;

  return {
    preview: `${trimmed.slice(0, index).trimEnd()}…`,
    isTruncated: true,
  };
}

type GameDescriptionSectionProps = {
  description: string;
};

export function GameDescriptionSection({
  description,
}: GameDescriptionSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { preview, isTruncated } = getDescriptionPreview(description);
  const showToggle = isTruncated;

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500">説明</h2>
      <div
        className={`mt-1.5 text-sm leading-relaxed text-zinc-300 ${
          expanded ? "whitespace-pre-wrap" : ""
        }`}
      >
        {expanded || !showToggle ? description : preview}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
        >
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </section>
  );
}
