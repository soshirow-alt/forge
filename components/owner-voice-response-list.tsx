"use client";

import { useState } from "react";
import { DeveloperHelpfulMarkButton } from "@/components/developer-helpful-mark-button";
import { GuestBadge } from "@/components/guest-badge";
import { formatFeedbackDate } from "@/lib/feedback-display";
import type { HelpfulMarkSourceType } from "@/lib/developer-helpful-mark";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";

type OwnerVoiceResponseListProps = {
  responses: OwnerVoiceResponseDetail[];
  defaultExpanded?: boolean;
  showToggle?: boolean;
  helpfulMarks?: Set<string>;
  onToggleHelpful?: (sourceType: HelpfulMarkSourceType, sourceId: string, marked: boolean) => void;
};

function VoiceResponseRow({
  response,
  marked,
  onToggleHelpful,
}: {
  response: OwnerVoiceResponseDetail;
  marked: boolean;
  onToggleHelpful?: (sourceType: HelpfulMarkSourceType, sourceId: string, marked: boolean) => void;
}) {
  return (
    <li className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] text-zinc-600">
              {formatFeedbackDate(response.createdAt)}
            </p>
            {response.isGuest ? <GuestBadge /> : null}
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-400">{response.promptText}</p>
          <p className="mt-1 text-sm text-zinc-200">
            {response.answerLabel ?? response.answerValue}
          </p>
        </div>
        {onToggleHelpful && !response.isGuest ? (
          <DeveloperHelpfulMarkButton
            marked={marked}
            onToggle={() => onToggleHelpful("voice_response", response.id, !marked)}
          />
        ) : null}
      </div>
    </li>
  );
}

export function OwnerVoiceResponseList({
  responses,
  defaultExpanded = false,
  showToggle = true,
  helpfulMarks,
  onToggleHelpful,
}: OwnerVoiceResponseListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (responses.length === 0) {
    return null;
  }

  const isMarked = (id: string) => helpfulMarks?.has(`voice_response:${id}`) ?? false;

  if (!showToggle) {
    return (
      <ul className="space-y-2">
        {responses.map((response) => (
          <VoiceResponseRow
            key={response.id}
            response={response}
            marked={isMarked(response.id)}
            onToggleHelpful={onToggleHelpful}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-3 border-t border-zinc-800/60 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-xs text-zinc-500 transition-colors hover:text-orange-400"
      >
        かんたんFB {responses.length}件（開発者のみ）
        {expanded ? " ▲" : " ▼"}
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2">
          {responses.map((response) => (
            <VoiceResponseRow
              key={response.id}
              response={response}
              marked={isMarked(response.id)}
              onToggleHelpful={onToggleHelpful}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
