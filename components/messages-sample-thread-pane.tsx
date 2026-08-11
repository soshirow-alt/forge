"use client";

import Image from "next/image";
import Link from "next/link";
import { ConsultationContextCard } from "@/components/consultation-context-card";
import {
  MESSAGES_SAMPLE_THREAD,
  type MessagesSampleMessage,
} from "@/lib/messages-sample-thread";

function SampleAvatar({
  src,
  mine,
}: {
  src: string;
  mine?: boolean;
}) {
  return (
    <span
      className={`relative size-8 shrink-0 overflow-hidden rounded-full border ${
        mine ? "border-violet-500/40" : "border-zinc-700"
      }`}
    >
      <Image src={src} alt="" fill className="object-cover" sizes="32px" unoptimized />
    </span>
  );
}

function SampleBubble({
  message,
  showAvatar,
}: {
  message: MessagesSampleMessage;
  showAvatar: boolean;
}) {
  const mine = message.sender === "self";
  const avatarSrc = mine
    ? MESSAGES_SAMPLE_THREAD.selfAvatarSrc
    : MESSAGES_SAMPLE_THREAD.counterpartAvatarSrc;

  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine ? (
        showAvatar ? (
          <SampleAvatar src={avatarSrc} />
        ) : (
          <span className="size-8 shrink-0" aria-hidden="true" />
        )
      ) : null}
      <div className={`flex max-w-[65%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            mine
              ? "rounded-br-md bg-violet-600/80 text-white"
              : "rounded-bl-md border border-zinc-800 bg-zinc-900 text-zinc-100"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
        <time className="mt-1 px-1 text-[11px] text-zinc-500">{message.createdAtLabel}</time>
      </div>
      {mine ? (
        showAvatar ? (
          <SampleAvatar src={avatarSrc} mine />
        ) : (
          <span className="size-8 shrink-0" aria-hidden="true" />
        )
      ) : null}
    </div>
  );
}

export function MessagesSampleThreadPane({
  embedded = false,
  basePath = "/messages",
}: {
  embedded?: boolean;
  basePath?: string;
}) {
  const sample = MESSAGES_SAMPLE_THREAD;

  return (
    <div className={embedded ? "flex h-full min-h-0 flex-col" : "mx-auto max-w-3xl"}>
      {embedded ? (
        <Link href={basePath} className="text-sm text-violet-300 lg:hidden">
          ← メッセージ
        </Link>
      ) : (
        <Link href={basePath} className="text-sm text-violet-300">
          ← メッセージ
        </Link>
      )}

      <header className={`flex items-start gap-3 ${embedded ? "mt-2 lg:mt-0" : "mt-4"}`}>
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full border border-zinc-700">
          <Image
            src={sample.counterpartAvatarSrc}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-white">
              {sample.counterpartName}
            </h2>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {sample.headerBadge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">プロフィールを見る</p>
        </div>
      </header>

      <div
        className={`${
          embedded ? "min-h-0 flex-1 overflow-y-auto" : ""
        } mt-6 space-y-3 pr-1`}
      >
        <ConsultationContextCard
          title={sample.context.heading}
          projectTitle={sample.context.projectTitle}
          creatorName={sample.context.creatorName}
          purpose={sample.context.purpose}
          ownProjectTitle={sample.context.ownProjectTitle}
        />
        {sample.messages.map((message, index) => {
          const prev = sample.messages[index - 1];
          const showAvatar = !prev || prev.sender !== message.sender;
          return (
            <SampleBubble key={message.id} message={message} showAvatar={showAvatar} />
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/80 px-4 py-3">
        <p className="whitespace-pre-wrap text-center text-sm text-zinc-500">
          {sample.composerNote}
        </p>
      </div>
    </div>
  );
}
