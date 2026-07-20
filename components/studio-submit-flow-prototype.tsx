"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AppWindow,
  Gamepad2,
  Music2,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import { StudioShell } from "@/components/studio-shell";
import { ProjectOneLineDescriptionField } from "@/components/project-one-line-description-field";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import { ProjectTitleField } from "@/components/project-title-field";
import {
  studioPanelInputClassName,
} from "@/components/studio-panel-edit-shell";
import {
  studioOperationPanelAsideClassName,
  studioOperationPanelGuidanceClassName,
  studioOperationPanelHeaderAccentClassName,
  studioOperationPanelOuterClassName,
  studioOperationPanelScrollBodyClassName,
  studioOperationPanelScrollClassName,
  studioOperationPrimaryButtonClassName,
} from "@/lib/studio-operation-panel-styles";
import {
  PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS,
} from "@/lib/project-one-line-description";
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import type { WorkCategoryId } from "@/lib/prototype/domain-expansion";
import {
  MUSIC_KIND_OPTIONS,
  MUSIC_STATUS_OPTIONS,
  SERVICE_DEVICE_OPTIONS,
  SERVICE_FREE_OPTIONS,
  SERVICE_SIGNUP_OPTIONS,
  SUBMIT_FLOW_CATEGORIES,
  SUBMIT_FLOW_FEEDBACK_USES,
  SUBMIT_FLOW_STEPS,
  TOOL_ENV_OPTIONS,
  TOOL_INSTALL_OPTIONS,
  createEmptySubmitFlowDraft,
  type SubmitFlowDraft,
  type SubmitFlowStep,
} from "@/lib/prototype/studio-submit-flow";

const CATEGORY_ICONS = {
  game: Gamepad2,
  music: Music2,
  dev_tool: Wrench,
  web_service: AppWindow,
} as const;

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
        selected
          ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
          : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function StepRail({
  step,
  category,
}: {
  step: SubmitFlowStep;
  category: WorkCategoryId | null;
}) {
  const visible =
    category === "game"
      ? SUBMIT_FLOW_STEPS.filter((item) => item.id === "category")
      : SUBMIT_FLOW_STEPS;

  return (
    <ol className="flex flex-wrap gap-1.5">
      {visible.map((item, index) => {
        const active = item.id === step;
        const reached =
          SUBMIT_FLOW_STEPS.findIndex((entry) => entry.id === step) >= index;
        return (
          <li
            key={item.id}
            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
              active
                ? "bg-violet-600/25 text-violet-100 ring-1 ring-violet-500/40"
                : reached
                  ? "text-zinc-400"
                  : "text-zinc-600"
            }`}
          >
            {index + 1}. {item.label}
          </li>
        );
      })}
    </ol>
  );
}

function PreviewPane({
  category,
  draft,
}: {
  category: Exclude<WorkCategoryId, "game">;
  draft: SubmitFlowDraft;
}) {
  const categoryLabel =
    SUBMIT_FLOW_CATEGORIES.find((item) => item.id === category)?.title ?? "";
  const title = draft.title.trim() || "タイトル未入力";
  const lead = draft.lead.trim() || "一行説明がここに表示されます";
  const thumb = draft.thumbnailUrls[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative aspect-video bg-zinc-800 lg:aspect-auto lg:min-h-[220px]">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full min-h-[180px] flex-col justify-end p-5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Preview
              </span>
              <p className="mt-2 text-sm text-zinc-400">代表画像を追加するとここに表示されます</p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <span className="inline-flex w-fit rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-300">
            {categoryLabel}
          </span>
          <h2 className={`mt-3 text-white ${PROJECT_TITLE_HERO_CLASS}`}>{title}</h2>
          <p className={`mt-2 text-zinc-400 ${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS}`}>
            {lead}
          </p>
          {draft.introduction.trim() ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-500">
              {draft.introduction.trim()}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PanelChrome({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <aside aria-label="Studioパネル" className={studioOperationPanelAsideClassName}>
      <div
        className={`${studioOperationPanelOuterClassName} ${studioOperationPanelScrollClassName}`}
      >
        <div className={studioOperationPanelScrollBodyClassName}>
          <div className="w-full min-w-0 max-w-full space-y-4">
            <div className={studioOperationPanelHeaderAccentClassName}>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-4 w-0.5 shrink-0 rounded-full bg-violet-500/80"
                  aria-hidden="true"
                />
                <SlidersHorizontal
                  className="size-3.5 shrink-0 text-violet-400/90"
                  aria-hidden="true"
                />
                <h2 className="min-w-0 text-sm font-semibold tracking-tight text-zinc-100">
                  {title}
                </h2>
              </div>
            </div>
            {children}
          </div>
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-zinc-800/80 pt-3">{footer}</div>
        ) : null}
      </div>
    </aside>
  );
}

/**
 * Preview-only multi-category submit flow.
 * Reuses Studio layout / field components. Does not call formal save APIs.
 * Selecting game hands off to formal `/studio/submit`.
 */
export function StudioSubmitFlowPrototype() {
  const router = useRouter();
  const [step, setStep] = useState<SubmitFlowStep>("category");
  const [picked, setPicked] = useState<WorkCategoryId | null>(null);
  const [category, setCategory] = useState<WorkCategoryId | null>(null);
  const [draft, setDraft] = useState<SubmitFlowDraft>(() => createEmptySubmitFlowDraft());

  const nonGameCategory =
    category && category !== "game" ? category : null;

  function patchDraft(patch: Partial<SubmitFlowDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function resetToCategoryPick() {
    setStep("category");
    setPicked(null);
    setCategory(null);
    setDraft(createEmptySubmitFlowDraft());
  }

  function startWithCategory() {
    if (!picked) {
      return;
    }
    if (picked === "game") {
      router.push("/studio/submit");
      return;
    }
    setCategory(picked);
    setStep("basics");
  }

  const primaryLabel = useMemo(() => {
    if (step === "category") {
      return picked === "game"
        ? "既存のゲーム投稿へ進む"
        : "このカテゴリで投稿を始める";
    }
    if (step === "basics") return "次へ：作品情報";
    if (step === "details") return "次へ：フィードバック";
    return null;
  }, [step, picked]);

  return (
    <StudioShell activeNav="mypage">
      <div className="space-y-4">
        <header className="border-b border-zinc-800/80 pb-3">
          <StudioMypageBackLink />
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">作品を投稿する</p>
              <p className="mt-1 text-[11px] text-zinc-500">
                プロトタイプ（保存・公開には接続していません）
              </p>
            </div>
            <StepRail step={step} category={category} />
          </div>
        </header>

        {step === "category" ? (
          <div className="mx-auto max-w-2xl space-y-5">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                投稿するカテゴリを選ぶ
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                カテゴリに合わせて、このあとの入力が変わります
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUBMIT_FLOW_CATEGORIES.map((option) => {
                const Icon = CATEGORY_ICONS[option.id];
                const active = picked === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPicked(option.id)}
                    className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      active
                        ? "border-violet-500/50 bg-violet-500/15"
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <Icon
                        className={`mt-0.5 size-5 shrink-0 ${
                          active ? "text-violet-300" : "text-zinc-500"
                        }`}
                        aria-hidden
                      />
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-400">
                          {option.hint}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!picked}
              onClick={startWithCategory}
              className={studioOperationPrimaryButtonClassName}
            >
              {primaryLabel}
            </button>
            <p className="text-xs text-zinc-500">
              ゲームを選ぶと、正式な投稿画面へ進みます。
            </p>
            <Link href="/studio/submit" className="text-sm text-zinc-400 hover:text-zinc-200">
              正式なゲーム投稿へ直接行く
            </Link>
          </div>
        ) : null}

        {nonGameCategory && step !== "category" ? (
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
            <div className="min-w-0 flex-1 space-y-3">
              <PreviewPane category={nonGameCategory} draft={draft} />
            </div>

            {step === "basics" ? (
              <PanelChrome
                title="基本情報"
                footer={
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className={studioOperationPrimaryButtonClassName}
                    >
                      {primaryLabel}
                    </button>
                    <button
                      type="button"
                      onClick={resetToCategoryPick}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      カテゴリを選び直す
                    </button>
                  </div>
                }
              >
                <ProjectTitleField
                  id="proto-submit-title"
                  value={draft.title}
                  onChange={(title) => patchDraft({ title })}
                  inputClassName={studioPanelInputClassName}
                  placeholder="作品のタイトル"
                />
                <ProjectOneLineDescriptionField
                  id="proto-submit-lead"
                  value={draft.lead}
                  onChange={(lead) => patchDraft({ lead })}
                  inputClassName={studioPanelInputClassName}
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-300">詳細説明</span>
                  <textarea
                    value={draft.introduction}
                    onChange={(event) =>
                      patchDraft({ introduction: event.target.value })
                    }
                    rows={5}
                    className={`${studioPanelInputClassName} min-h-[7rem] resize-y`}
                    placeholder="何ができるか、どんな体験か"
                  />
                </label>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">代表画像</p>
                  <ProjectThumbnailFields
                    thumbnails={draft.thumbnailUrls}
                    onChange={(thumbnailUrls) => patchDraft({ thumbnailUrls })}
                    inputId="proto-submit-thumbs"
                    posterFallback={{
                      projectId: "submit-flow-proto",
                      title: draft.title || "作品",
                      genre:
                        SUBMIT_FLOW_CATEGORIES.find((item) => item.id === nonGameCategory)
                          ?.title ?? "",
                    }}
                  />
                </div>
              </PanelChrome>
            ) : null}

            {step === "details" ? (
              <PanelChrome
                title="作品情報"
                footer={
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("feedback")}
                      className={studioOperationPrimaryButtonClassName}
                    >
                      {primaryLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("basics")}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      ← 基本情報に戻る
                    </button>
                  </div>
                }
              >
                {nonGameCategory === "music" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">種類</p>
                      <div className="flex flex-wrap gap-2">
                        {MUSIC_KIND_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.musicKind === option}
                            onClick={() => patchDraft({ musicKind: option })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">制作状況</p>
                      <div className="flex flex-wrap gap-2">
                        {MUSIC_STATUS_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.musicStatus === option}
                            onClick={() => patchDraft({ musicStatus: option })}
                          />
                        ))}
                      </div>
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-300">再生時間</span>
                      <input
                        value={draft.musicDuration}
                        onChange={(event) =>
                          patchDraft({ musicDuration: event.target.value })
                        }
                        className={studioPanelInputClassName}
                        placeholder="例: 1:20 / ループ"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-300">想定用途</span>
                      <input
                        value={draft.musicUse}
                        onChange={(event) =>
                          patchDraft({ musicUse: event.target.value })
                        }
                        className={studioPanelInputClassName}
                        placeholder="例: 探索BGM、効果音パック"
                      />
                    </label>
                  </div>
                ) : null}

                {nonGameCategory === "dev_tool" ? (
                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-300">
                        どんな作業を助けるか
                      </span>
                      <textarea
                        value={draft.toolHelps}
                        onChange={(event) =>
                          patchDraft({ toolHelps: event.target.value })
                        }
                        rows={3}
                        className={`${studioPanelInputClassName} resize-y`}
                        placeholder="例: Unityでフォント組み合わせを試す"
                      />
                    </label>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">対応環境</p>
                      <div className="flex flex-wrap gap-2">
                        {TOOL_ENV_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.toolEnv === option}
                            onClick={() => patchDraft({ toolEnv: option })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">導入方法</p>
                      <div className="flex flex-wrap gap-2">
                        {TOOL_INSTALL_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.toolInstall === option}
                            onClick={() => patchDraft({ toolInstall: option })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {nonGameCategory === "web_service" ? (
                  <div className="space-y-4">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-300">
                        どんな課題を解決するか
                      </span>
                      <textarea
                        value={draft.serviceProblem}
                        onChange={(event) =>
                          patchDraft({ serviceProblem: event.target.value })
                        }
                        rows={3}
                        className={`${studioPanelInputClassName} resize-y`}
                        placeholder="例: 届いたFBをテーマ別に整理する"
                      />
                    </label>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">対応端末</p>
                      <div className="flex flex-wrap gap-2">
                        {SERVICE_DEVICE_OPTIONS.map((option) => {
                          const selected = draft.serviceDevices.includes(option);
                          return (
                            <ChipButton
                              key={option}
                              label={option}
                              selected={selected}
                              onClick={() =>
                                patchDraft({
                                  serviceDevices: selected
                                    ? draft.serviceDevices.filter((item) => item !== option)
                                    : [...draft.serviceDevices, option],
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">登録の要否</p>
                      <div className="flex flex-wrap gap-2">
                        {SERVICE_SIGNUP_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.serviceSignup === option}
                            onClick={() => patchDraft({ serviceSignup: option })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-300">
                        無料で試せる範囲
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SERVICE_FREE_OPTIONS.map((option) => (
                          <ChipButton
                            key={option}
                            label={option}
                            selected={draft.serviceFree === option}
                            onClick={() => patchDraft({ serviceFree: option })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </PanelChrome>
            ) : null}

            {step === "feedback" ? (
              <PanelChrome
                title="フィードバックしてほしいこと"
                footer={
                  <div className="space-y-2">
                    <p className={`${studioOperationPanelGuidanceClassName}`}>
                      このプロトタイプでは保存・公開されません
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      ← 作品情報に戻る
                    </button>
                    <button
                      type="button"
                      onClick={resetToCategoryPick}
                      className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      カテゴリを選び直す
                    </button>
                  </div>
                }
              >
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-300">
                    今、特に確かめたいこと
                  </span>
                  <textarea
                    value={draft.authorFocus}
                    onChange={(event) =>
                      patchDraft({ authorFocus: event.target.value })
                    }
                    rows={4}
                    className={`${studioPanelInputClassName} resize-y`}
                    placeholder="例: ループの継ぎ目、導入の分かりやすさ"
                  />
                  <span className="block text-[11px] text-zinc-500">
                    既存の「作者の問い」につながる想定の入力です
                  </span>
                </label>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">
                    届いたフィードバックをどう活かしたいですか
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUBMIT_FLOW_FEEDBACK_USES.map((option) => {
                      const selected = draft.feedbackUses.includes(option);
                      return (
                        <ChipButton
                          key={option}
                          label={option}
                          selected={selected}
                          onClick={() =>
                            patchDraft({
                              feedbackUses: selected
                                ? draft.feedbackUses.filter((item) => item !== option)
                                : [...draft.feedbackUses, option],
                            })
                          }
                        />
                      );
                    })}
                  </div>
                  <span className="block text-[11px] text-zinc-500">
                    仮案: 複数選択可
                  </span>
                </div>
              </PanelChrome>
            ) : null}
          </div>
        ) : null}
      </div>
    </StudioShell>
  );
}
