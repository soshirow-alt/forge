import { resolvePlayableVersion } from "@/lib/playable-version";

/** 現行プレイ可能版向けの voice シグナル（studio / my-projects 用） */
export type ProjectVoiceNurtureSignal = {
  projectId: string;
  playableVersion: string;
  responseCount: number;
  latestResponseAt: string | null;
};

export function emptyVoiceNurtureSignal(
  projectId: string,
  playableVersion: string,
): ProjectVoiceNurtureSignal {
  return {
    projectId,
    playableVersion: resolvePlayableVersion(playableVersion),
    responseCount: 0,
    latestResponseAt: null,
  };
}

export function resolveVoiceSignalForGame(
  game: { id: string; playableVersion?: string },
  signals: ProjectVoiceNurtureSignal[],
): ProjectVoiceNurtureSignal {
  const version = resolvePlayableVersion(game.playableVersion);
  return (
    signals.find(
      (signal) =>
        signal.projectId === game.id && signal.playableVersion === version,
    ) ?? emptyVoiceNurtureSignal(game.id, version)
  );
}
