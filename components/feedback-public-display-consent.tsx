"use client";

type FeedbackPublicDisplayConsentProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  idPrefix: string;
};

export function FeedbackPublicDisplayConsent({
  checked,
  onCheckedChange,
  idPrefix,
}: FeedbackPublicDisplayConsentProps) {
  const checkboxId = `${idPrefix}-public-display-consent`;

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
      <p className="text-xs leading-relaxed text-zinc-500">
        投稿したフィードバックは、作品ページの「みんなのフィードバック」に表示されます。個人情報や公開したくない内容は書かないでください。
      </p>
      <label
        htmlFor={checkboxId}
        className="mt-3 flex cursor-pointer items-start gap-2.5"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/40"
        />
        <span className="text-xs leading-relaxed text-zinc-400">
          上記を確認し、作品ページへの表示に同意します
        </span>
      </label>
    </div>
  );
}
