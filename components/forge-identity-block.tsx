export function ForgeIdentityBlock({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="border-l-2 border-orange-500/40 pl-3 text-sm leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-400">
          まだ誰も知らないゲームを、一緒に面白くする。
        </span>
        {" "}
        見つけて、遊び、反応を届け、成長を見届けましょう。
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-zinc-950/40 to-violet-600/5 px-5 py-5 sm:px-6">
      <p className="text-base font-bold leading-snug text-zinc-50 sm:text-lg">
        まだ誰も知らないゲームを、一緒に面白くする。
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Forgeでは、開発中のゲームを見つけ、
        遊び、
        フィードバックし、
        成長を見届けることができます。
      </p>
    </div>
  );
}
