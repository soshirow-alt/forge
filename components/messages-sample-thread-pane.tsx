"use client";

import Link from "next/link";
import {
  MESSAGES_SAMPLE_THREAD,
  type MessagesSampleMessage,
} from "@/lib/messages-sample-thread";

function SampleBubble({
  message,
  showAvatar,
}: {
  message: MessagesSampleMessage;
  showAvatar: boolean;
}) {
  const mine = message.sender === "self";
  const initial = mine ? "あ" : MESSAGES_SAMPLE_THREAD.counterpartInitial;

  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine ? (
        showAvatar ? (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300"
            aria-hidden="true"
          >
            {initial}
          </span>
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
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-xs font-semibold text-violet-200"
            aria-hidden="true"
          >
            {initial}
          </span>
        ) : (
          <span className="size-8 shrink-0" aria-hidden="true" />
        )
      ) : null}
    </div>
  );
}

export function MessagesSampleThreadPane({ embedded = false }: { embedded?: boolean }) {
  const sample = MESSAGES_SAMPLE_THREAD;

  return (
    <div className={embedded ? "flex h-full min-h-0 flex-col" : "mx-auto max-w-3xl"}>
      {embedded ? (
        <Link href="/messages" className="text-sm text-violet-300 lg:hidden">
          ← メッセージ
        </Link>
      ) : (
        <Link href="/messages" className="text-sm text-violet-300">
          ← メッセージ
        </Link>
      )}

      <header className={`flex items-start gap-3 ${embedded ? "mt-2 lg:mt-0" : "mt-4"}`}>
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-base font-semibold text-zinc-200"
          aria-hidden="true"
        >
          {sample.counterpartInitial}
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-400">
              {sample.projectTitle}
            </span>
            <span className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-400">
              {sample.contextLabel}
            </span>
          </div>
        </div>
      </header>

      <div
        className={`${
          embedded ? "min-h-0 flex-1 overflow-y-auto" : ""
        } mt-6 space-y-3 pr-1`}
      >
        {sample.messages.map((message, index) => {
          const prev = sample.messages[index - 1];
          const showAvatar = !prev || prev.sender !== message.sender;
          return (
            <SampleBubble key={message.id} message={message} showAvatar={showAvatar} />
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/80 px-4 py-3">
        <p className="text-center text-sm text-zinc-500">{sample.composerNote}</p>
      </div>
    </div>
  );
}
