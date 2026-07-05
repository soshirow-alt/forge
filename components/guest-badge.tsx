export function GuestBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border border-zinc-600/50 bg-zinc-800/60 px-2 py-0.5 text-[11px] font-medium text-zinc-400 ${className}`}
    >
      ゲスト
    </span>
  );
}
