"use client";

type DeveloperHelpfulMarkButtonProps = {
  marked: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function DeveloperHelpfulMarkButton({
  marked,
  disabled = false,
  onToggle,
}: DeveloperHelpfulMarkButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
        marked
          ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
          : "border border-zinc-700 text-zinc-400 hover:border-violet-500/30 hover:text-violet-200"
      }`}
      title="プレイヤーには表示されません"
    >
      {marked ? "役立った ✓" : "開発に役立った"}
    </button>
  );
}
