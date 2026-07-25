export function ExplorePrototypeEmptyState({ query }: { query: string }) {
  const trimmed = query.trim();
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center">
      <p className="text-sm font-medium text-zinc-300">
        {trimmed ? `「${trimmed}」に一致する作品はありません` : "作品がありません"}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        キーワードやカテゴリを変えてみてください
      </p>
    </div>
  );
}
