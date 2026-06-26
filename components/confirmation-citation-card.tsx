"use client";

import Link from "next/link";
import { Quote } from "lucide-react";
import {
  confirmationQuoteHref,
  type ConfirmationRequestQuoteRef,
} from "@/lib/community-types";

export function ConfirmationCitationCard({
  quote,
  linkable = true,
}: {
  quote: ConfirmationRequestQuoteRef;
  linkable?: boolean;
}) {
  const inner = (
    <div className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-orange-300/90">
        <Quote className="size-3.5" aria-hidden="true" />
        確認依頼 {quote.version}
        {quote.publishedAt && <span className="text-zinc-600">· {quote.publishedAt}</span>}
      </div>
      <p className="mt-1 text-sm font-medium text-zinc-200">{quote.title}</p>
      {quote.changesSummary ? (
        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{quote.changesSummary}</p>
      ) : null}
      {quote.askSummary ? (
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">見てほしいこと: {quote.askSummary}</p>
      ) : null}
      {quote.linkedPriorityTitles && quote.linkedPriorityTitles.length > 0 ? (
        <p className="mt-2 text-xs text-orange-300/80">
          対応課題: {quote.linkedPriorityTitles.join("、")}
        </p>
      ) : null}
      {quote.estimatedDuration ? (
        <p className="mt-1 text-xs text-zinc-600">目安: {quote.estimatedDuration}</p>
      ) : null}
    </div>
  );

  const className =
    "mt-3 overflow-hidden rounded-xl border border-orange-500/25 bg-orange-500/[0.06] transition-colors";

  if (!linkable) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link
      href={confirmationQuoteHref(quote)}
      className={`${className} block hover:border-orange-500/40 hover:bg-orange-500/10`}
    >
      {inner}
    </Link>
  );
}
