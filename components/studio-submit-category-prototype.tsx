"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StudioShell } from "@/components/studio-shell";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import {
  DOMAIN_EXPANSION_PROTO_BANNER,
  FB_PURPOSE_OPTIONS,
  WORK_CATEGORY_SUBMIT_OPTIONS,
  type WorkCategoryId,
} from "@/lib/prototype/domain-expansion";

type Field = { id: string; label: string; placeholder?: string; hint?: string };

const COMMON_FIELDS: Field[] = [
  { id: "title", label: "タイトル", placeholder: "作品名" },
  { id: "lead", label: "一行説明", placeholder: "キャッチコピー" },
  { id: "description", label: "詳細説明", placeholder: "何ができるか・世界観など" },
  { id: "audience", label: "誰向けか", placeholder: "想定する利用者" },
  { id: "capability", label: "何ができるか", placeholder: "主な体験・機能" },
  { id: "freeScope", label: "無料で試せる範囲", placeholder: "体験版 / 一部機能 など" },
  { id: "media", label: "代表画像・メディア", hint: "プロトタイプ表示のみ（アップロード未接続）" },
  { id: "destination", label: "公開先", placeholder: "今すぐ試せるURL" },
  { id: "authorFocus", label: "作者が今確認したいこと", placeholder: "見てほしい観点" },
];

const CATEGORY_FIELDS: Record<WorkCategoryId, Field[]> = {
  game: [
    { id: "genres", label: "ジャンル", hint: "現行投稿と同じ考え方" },
    { id: "phase", label: "開発フェーズ" },
    { id: "playTime", label: "想定プレイ時間" },
    { id: "platforms", label: "対応環境" },
    { id: "players", label: "プレイ人数" },
  ],
  music: [
    { id: "audioKind", label: "楽曲／音声の種別", placeholder: "BGM / 効果音 / ボイス など" },
    { id: "duration", label: "再生時間" },
    { id: "productionStatus", label: "制作状況", placeholder: "デモ / ミックス中 / 完成 など" },
    { id: "intendedUse", label: "想定用途" },
    { id: "vocal", label: "ボーカル有無" },
    { id: "loop", label: "ループの有無" },
    { id: "assetLicense", label: "素材利用可否" },
  ],
  dev_tool: [
    { id: "helpsWith", label: "誰のどんな作業を助けるか" },
    { id: "os", label: "対応OS" },
    { id: "engine", label: "対応エンジン／ソフトウェア" },
    { id: "install", label: "導入方法" },
    { id: "usageForm", label: "利用形態", placeholder: "プラグイン / CLI / Web など" },
    { id: "skillLevel", label: "必要な技術レベル" },
  ],
  web_service: [
    { id: "problem", label: "誰のどんな問題を解決するか" },
    { id: "devices", label: "対応端末" },
    { id: "signup", label: "登録の要否" },
    { id: "freeTrial", label: "無料で試せる範囲" },
    { id: "trialTime", label: "試用に必要な時間" },
    { id: "features", label: "主な機能" },
  ],
};

function ProtoField({ field }: { field: Field }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-300">{field.label}</span>
      <input
        type="text"
        disabled
        placeholder={field.placeholder ?? "（プロトタイプ・入力のみ）"}
        className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-400 placeholder:text-zinc-600"
      />
      {field.hint ? <span className="block text-[11px] text-zinc-500">{field.hint}</span> : null}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Studio submit category-branch prototype.
 * Does not call submit APIs. Game path links back to real `/studio/submit`.
 */
export function StudioSubmitCategoryPrototype() {
  const [category, setCategory] = useState<WorkCategoryId | null>(null);
  const [fbPurposes, setFbPurposes] = useState<string[]>([]);

  const categoryFields = useMemo(
    () => (category ? CATEGORY_FIELDS[category] : []),
    [category],
  );

  function togglePurpose(value: string) {
    setFbPurposes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <StudioShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <StudioMypageBackLink />

        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            Studio · 投稿プロトタイプ
          </p>
          <h1 className="text-2xl font-bold text-white">カテゴリを選んで投稿</h1>
          <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
            {DOMAIN_EXPANSION_PROTO_BANNER}
            <span className="mt-1 block text-zinc-400">
              新カテゴリは保存・公開できません。ゲームは既存フローへ戻れます。
            </span>
          </p>
        </header>

        <Section title="1. カテゴリ">
          <div className="grid gap-2 sm:grid-cols-2">
            {WORK_CATEGORY_SUBMIT_OPTIONS.map((option) => {
              const active = category === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-violet-500/50 bg-violet-500/15"
                      : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{option.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">{option.hint}</p>
                </button>
              );
            })}
          </div>
          {!category ? (
            <p className="text-xs text-zinc-500">カテゴリを選ぶと、下に項目の違いが出ます。</p>
          ) : null}
        </Section>

        {category === "game" ? (
          <Section title="ゲーム — 既存フローへ">
            <p className="text-sm text-zinc-300">
              ゲームは現行の投稿画面をそのまま使います（validation / 保存は変更していません）。
            </p>
            <Link
              href="/studio/submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500"
            >
              既存のゲーム投稿へ進む
            </Link>
          </Section>
        ) : null}

        {category && category !== "game" ? (
          <>
            <Section title="2. 全カテゴリ共通">
              {COMMON_FIELDS.map((field) => (
                <ProtoField key={field.id} field={field} />
              ))}
            </Section>

            <Section title="3. カテゴリ固有">
              {categoryFields.map((field) => (
                <ProtoField key={field.id} field={field} />
              ))}
            </Section>

            <Section title="4. FBしてほしい内容">
              <ProtoField
                field={{
                  id: "authorFocusDup",
                  label: "作者が今確認したいこと",
                  placeholder: "共通項目と重複して見えるか確認用",
                }}
              />
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-300">FBの活用目的</p>
                <div className="flex flex-wrap gap-2">
                  {FB_PURPOSE_OPTIONS.map((option) => {
                    const active = fbPurposes.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => togglePurpose(option)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                          active
                            ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            <Section title="5. 公開先・公開設定">
              <ProtoField
                field={{
                  id: "visibility",
                  label: "公開設定",
                  placeholder: "公開 / 非公開（仮）",
                }}
              />
              <button
                type="button"
                disabled
                className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-zinc-800 px-4 text-sm font-semibold text-zinc-500"
              >
                投稿する（未接続）
              </button>
            </Section>
          </>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/home" className="text-violet-300 hover:underline">
            Exploreホーム
          </Link>
          <Link href="/studio/submit" className="text-zinc-400 hover:underline">
            既存投稿に戻る
          </Link>
          <Link href="/prototype" className="text-zinc-400 hover:underline">
            比較ハブ
          </Link>
        </div>
      </div>
    </StudioShell>
  );
}
