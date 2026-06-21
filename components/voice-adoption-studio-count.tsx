"use client";

import { useStudioAdoptionCount } from "@/hooks/use-player-voice-adoptions";

type VoiceAdoptionStudioCountProps = {
  gameId: string;
  latestPublishedDevlogId?: string;
};

export function VoiceAdoptionStudioCount({
  gameId,
  latestPublishedDevlogId,
}: VoiceAdoptionStudioCountProps) {
  const count = useStudioAdoptionCount(gameId, latestPublishedDevlogId);

  if (count === null || count === 0) {
    return null;
  }

  return (
    <p className="text-sm text-violet-300">
      あなたのフィードバックが反映された件数: <span className="font-semibold">{count}</span>
      件
    </p>
  );
}
