"use client";

import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import {
  buildVoicePromptAggregates,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";
import { interpretVoiceAggregate } from "@/lib/voice-interpretation";

type DeveloperVoiceInsightsProps = {
  aggregates: VoicePromptAggregate[];
  versionKey: string;
};

export function DeveloperVoiceInsights({
  aggregates,
  versionKey,
}: DeveloperVoiceInsightsProps) {
  const withResponses = aggregates.filter((item) => item.totalResponses > 0);

  if (withResponses.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
        <p className="text-xs font-medium text-zinc-500">
          届いている回答（v{versionKey}）
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          この版への回答はまだありません。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-500">
        届いている回答（v{versionKey}）— 解釈
      </p>
      {withResponses.map((aggregate) => {
        const lines = interpretVoiceAggregate(aggregate);
        return (
          <div
            key={aggregate.promptId}
            className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3"
          >
            <p className="text-sm font-medium text-zinc-200">
              {aggregate.promptText}
            </p>
            <ul className="mt-2 space-y-1">
              {lines.map((line) => (
                <li key={line} className="text-xs leading-relaxed text-orange-200/85">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-zinc-800/60 pt-3">
              <VoiceAggregateBars aggregate={aggregate} compact />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function buildDeveloperVoiceAggregatesFromRows(
  rows: Parameters<typeof buildVoicePromptAggregates>[0],
) {
  return buildVoicePromptAggregates(rows);
}
