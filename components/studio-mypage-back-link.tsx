import Link from "next/link";

const linkClassName =
  "text-sm text-zinc-500 transition-colors hover:text-violet-400";

/** Studio 投稿・編集のページ上部 — 作品一覧（マイページ）へ戻る */
export function StudioMypageBackLink() {
  return (
    <Link href="/studio/mypage" className={linkClassName}>
      ← マイページ
    </Link>
  );
}
