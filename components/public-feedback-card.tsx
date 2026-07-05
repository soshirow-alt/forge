"use client";

import { UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";

type PublicFeedbackCardViewProps = {
  card: PublicFeedbackCard;
};

const DETAILED_FIELDS = [
  { key: "goodPoints" as const, label: "良かった点" },
  { key: "concerns" as const, label: "気になった点" },
  { key: "bugs" as const, label: "バグっぽい挙動" },
  { key: "otherNotes" as const, label: "その他・自由に伝えたいこと" },
];

function formatCardDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CardAuthor({ card }: { card: PublicFeedbackCard }) {
  if (card.authorKind === "guest") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500"
          aria-hidden="true"
        >
          <UserRound className="size-4" />
        </span>
        <span className="rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
          ゲスト
        </span>
      </div>
    );
  }

  const displayName = card.authorDisplayName?.trim() || "プレイヤー";

  return (
    <div className="flex items-center gap-2">
      {card.authorAvatarUrl ? (
        <ProfileAvatar src={card.authorAvatarUrl} alt="" className="size-8" size={32} />
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400"
          aria-hidden="true"
        >
          {displayName.slice(0, 1)}
        </span>
      )}
      <span className="text-sm font-medium text-zinc-200">{displayName}</span>
    </div>
  );
}

function CardBody({ card }: { card: PublicFeedbackCard }) {
  if (card.cardKind === "detailed") {
    const visibleFields = DETAILED_FIELDS.filter((field) => card[field.key]?.trim());

    return (
      <div className="mt-3 space-y-3">
        {visibleFields.map((field) => (
          <div key={field.key}>
            <p className="text-[11px] font-medium text-zinc-500">{field.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {card[field.key]}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {card.promptText ? (
        <p className="text-xs font-medium text-zinc-500">{card.promptText}</p>
      ) : null}
      {card.bodyText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {card.bodyText}
        </p>
      ) : null}
    </div>
  );
}

export function PublicFeedbackCardView({ card }: PublicFeedbackCardViewProps) {
  return (
    <li className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-4 sm:px-5 sm:py-5">
      <CardAuthor card={card} />
      <CardBody card={card} />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/60 pt-3">
        <time className="text-[11px] text-zinc-600" dateTime={card.createdAt}>
          {formatCardDate(card.createdAt)}
        </time>
        <div
          className="flex min-h-6 items-center gap-2"
          data-feedback-card-actions
          aria-hidden="true"
        />
      </div>
    </li>
  );
}
