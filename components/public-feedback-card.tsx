"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PublicXLink } from "@/components/public-x-link";
import { PublicFeedbackCardActions } from "@/components/public-feedback-card-actions";
import { formatPlayableVersionLabel } from "@/lib/playable-version";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";

type PublicFeedbackCardViewProps = {
  card: PublicFeedbackCard;
  projectId: string;
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

function ChoiceAnswerPill({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[14rem] items-center rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium leading-tight text-orange-200/95">
      回答: {label}
    </span>
  );
}

function VersionBadge({ versionKey }: { versionKey: string }) {
  const label = formatPlayableVersionLabel(versionKey);
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md border border-zinc-700/80 bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
      aria-label={`回答したバージョン: ${label}`}
      title={`回答したバージョン: ${label}`}
    >
      {label}
    </span>
  );
}

function CardAuthor({ card }: { card: PublicFeedbackCard }) {
  if (card.authorKind === "guest") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500"
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
    <div className="flex min-w-0 items-center gap-2">
      <ProfileAvatar src={card.authorAvatarUrl} alt="" className="size-9" size={36} />
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold text-zinc-100">{displayName}</span>
        {card.authorXUsername ? (
          <PublicXLink
            accountOrUrl={card.authorXUsername}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-violet-300 transition-colors hover:text-violet-200"
          />
        ) : null}
      </div>
    </div>
  );
}

function CardBody({ card }: { card: PublicFeedbackCard }) {
  if (card.cardKind === "detailed") {
    const visibleFields = DETAILED_FIELDS.filter((field) => card[field.key]?.trim());

    return (
      <div className="mt-4 space-y-3.5">
        {visibleFields.map((field) => (
          <div key={field.key} className="rounded-lg border border-zinc-800/50 bg-zinc-950/40 px-3 py-2.5">
            <p className="text-[11px] font-medium text-zinc-500">{field.label}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
              {card[field.key]}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2.5">
      {card.promptText ? (
        <p className="text-xs font-medium leading-relaxed text-zinc-500">{card.promptText}</p>
      ) : null}
      {card.bodyText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">{card.bodyText}</p>
      ) : null}
    </div>
  );
}

export function PublicFeedbackCardView({ card, projectId }: PublicFeedbackCardViewProps) {
  const [localCard, setLocalCard] = useState(card);
  const showChoicePill =
    localCard.cardKind === "voice_supplement" && Boolean(localCard.choiceAnswerLabel?.trim());

  return (
    <li
      id={`fb-${localCard.cardId}`}
      className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-4 shadow-sm shadow-black/10 sm:px-5 sm:py-5"
    >
      <div className="flex items-start justify-between gap-3">
        <CardAuthor card={localCard} />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {localCard.developerMarkedHelpful ? (
            <span className="inline-flex items-center rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
              開発者が参考になったFB
            </span>
          ) : null}
          {showChoicePill ? (
            <ChoiceAnswerPill label={localCard.choiceAnswerLabel!.trim()} />
          ) : null}
          <VersionBadge versionKey={localCard.versionKey} />
        </div>
      </div>
      <CardBody card={localCard} />
      <div className="mt-4 border-t border-zinc-800/70 pt-3">
        <div className="flex items-center justify-between gap-3">
          <time className="text-[11px] text-zinc-600" dateTime={localCard.createdAt}>
            {formatCardDate(localCard.createdAt)}
          </time>
        </div>
        <PublicFeedbackCardActions
          projectId={projectId}
          card={localCard}
          onCardChange={setLocalCard}
        />
      </div>
    </li>
  );
}
