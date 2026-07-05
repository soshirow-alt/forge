"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import { GuestBadge } from "@/components/guest-badge";
import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";
import type { VoicePromptAggregate } from "@/lib/voice-aggregates";
import type { VersionPromptResponseKind } from "@/lib/version-prompt-types";

function isFreeTextResponseKind(kind: VersionPromptResponseKind): boolean {
  return kind === "short_text";
}

function groupResponsesByPrompt(
  responses: OwnerVoiceResponseDetail[],
): Map<string, OwnerVoiceResponseDetail[]> {
  const map = new Map<string, OwnerVoiceResponseDetail[]>();
  for (const response of responses) {
    const list = map.get(response.promptId) ?? [];
    list.push(response);
    map.set(response.promptId, list);
  }
  return map;
}

type StudioQuestionAnswersDetailModalProps = {
  open: boolean;
  onClose: () => void;
  playableVersion: string;
  aggregates: VoicePromptAggregate[];
  responses: OwnerVoiceResponseDetail[];
};

export function StudioQuestionAnswersDetailModal({
  open,
  onClose,
  playableVersion,
  aggregates,
  responses,
}: StudioQuestionAnswersDetailModalProps) {
  if (!open) {
    return null;
  }

  const withResponses = aggregates.filter((item) => item.totalResponses > 0);
  const responsesByPrompt = groupResponsesByPrompt(responses);

  return (
    <V0SimpleModal
      title="質問への回答"
      subtitle={`v${playableVersion} · 質問ごとの集計と自由記述`}
      onClose={onClose}
      size="xl"
    >
      {withResponses.length === 0 ? (
        <p className="text-sm text-zinc-500">このverの質問への回答はまだありません。</p>
      ) : (
        <div className="space-y-4">
          {withResponses.map((aggregate) => {
            const promptResponses = responsesByPrompt.get(aggregate.promptId) ?? [];
            const isFreeText = isFreeTextResponseKind(aggregate.responseKind);

            return (
              <article
                key={aggregate.promptId}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <h3 className="text-sm font-semibold text-zinc-100">{aggregate.promptText}</h3>
                <p className="mt-1 text-xs text-zinc-500">回答 {aggregate.totalResponses}件</p>

                {isFreeText ? (
                  <ul className="mt-3 space-y-2">
                    {promptResponses.map((response) => (
                      <li
                        key={response.id}
                        className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm leading-relaxed text-zinc-300"
                      >
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          {response.isGuest ? <GuestBadge /> : null}
                        </div>
                        {response.answerLabel?.trim() || response.answerValue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3">
                    <VoiceAggregateBars aggregate={aggregate} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </V0SimpleModal>
  );
}
