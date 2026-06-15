"use client";

import { useState } from "react";
import { formatFeedbackDate } from "@/lib/feedback-display";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";

type OwnerVoiceResponseListProps = {
  responses: OwnerVoiceResponseDetail[];
};

export function OwnerVoiceResponseList({
  responses,
}: OwnerVoiceResponseListProps) {
  const [expanded, setExpanded] = useState(false);

  if (responses.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-zinc-800/60 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-xs text-zinc-500 transition-colors hover:text-orange-400"
      >
        個別の回答 {responses.length}件（開発者のみ）
        {expanded ? " ▲" : " ▼"}
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2">
          {responses.map((response) => (
            <li
              key={response.id}
              className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
            >
              <p className="text-[11px] text-zinc-600">
                {formatFeedbackDate(response.createdAt)}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-400">
                {response.promptText}
              </p>
              <p className="mt-1 text-sm text-zinc-200">
                {response.answerLabel ?? response.answerValue}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
