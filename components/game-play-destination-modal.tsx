"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import type { PlayDestination } from "@/lib/game-play-destinations";

type GamePlayDestinationModalProps = {
  destinations: PlayDestination[];
  onSelect: (destination: PlayDestination) => void;
  onClose: () => void;
};

export function GamePlayDestinationModal({
  destinations,
  onSelect,
  onClose,
}: GamePlayDestinationModalProps) {
  return (
    <V0SimpleModal title="どこで遊びますか？" onClose={onClose}>
      <ul className="space-y-2">
        {destinations.map((destination) => (
          <li key={destination.url}>
            <button
              type="button"
              onClick={() => onSelect(destination)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left text-sm text-zinc-200 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
            >
              <span>{destination.actionLabel}</span>
              <span className="text-xs text-zinc-500">{destination.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </V0SimpleModal>
  );
}
