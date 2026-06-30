type FeatureComingSoonPanelProps = {
  title?: string;
  description?: string;
};

export function FeatureComingSoonPanel({ title, description }: FeatureComingSoonPanelProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-12 text-center">
      <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
        Coming Soon
      </span>
      {title ? <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2> : null}
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        {description ?? "公開をお待ちください。"}
      </p>
    </div>
  );
}
