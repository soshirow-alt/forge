"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Compass, ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";
import type { GameDetailFeature, GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import {
  MAX_PROJECT_OVERVIEW_FEATURES,
  prepareOverviewFeaturesForSave,
} from "@/lib/project-overview";
import {
  OVERVIEW_FEATURE_CUSTOM_TITLE_MAX,
  OVERVIEW_FEATURE_DESCRIPTION_MAX,
  OVERVIEW_FEATURE_OTHER,
  OVERVIEW_FEATURE_PRESET_OPTIONS,
  resolveFeatureTitleForSave,
  splitFeatureTitleForEdit,
  type OverviewFeaturePreset,
} from "@/lib/overview-feature-presets";
import {
  emptyFeatureDraft,
  MAX_PROJECT_FEATURES,
} from "@/lib/project-overview-v0-store";
import type {
  GameDetailOverviewActivity,
  GameDetailPlayerMeta,
} from "@/lib/game-detail-player-meta";
import type { ExternalLink } from "@/lib/game-links";
import { GameDetailPlayerOverview } from "@/components/game-detail-player-overview";

function validateFeatureDrafts(
  features: GameDetailFeature[],
): { ok: true } | { ok: false; error: string } {
  for (const feature of features) {
    const description = feature.description.trim();
    const { preset, customTitle } = splitFeatureTitleForEdit(feature.title);
    const title = resolveFeatureTitleForSave(preset, customTitle);

    if (!title && !description) {
      continue;
    }
    if (!preset) {
      return { ok: false, error: "作品の特徴の種類を選んでください。" };
    }
    if (preset === OVERVIEW_FEATURE_OTHER && !customTitle.trim()) {
      return { ok: false, error: "「その他」の見出しを入力してください。" };
    }
    if (!description) {
      return { ok: false, error: "特徴の説明を入力してください。" };
    }
    if (description.length > OVERVIEW_FEATURE_DESCRIPTION_MAX) {
      return {
        ok: false,
        error: `特徴の説明は${OVERVIEW_FEATURE_DESCRIPTION_MAX}字以内にしてください。`,
      };
    }
  }
  return { ok: true };
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none";

export type GameOverviewSavePayload = {
  introduction: string;
  features: GameDetailFeature[];
};

export type GameOverviewEditorHandle = {
  validateAndGetPayload: () =>
    | { ok: true; payload: GameOverviewSavePayload }
    | { ok: false; error: string };
};

export const GameDetailOverviewV0Tab = forwardRef<
  GameOverviewEditorHandle,
  {
  game: GameDetailV0;
  editable?: boolean;
  /** 質問は ver ごとの開発ログ / 版問いで設定 */
  hideVersionQuestions?: boolean;
  /** 親フォームに埋め込み — 単体保存ボタンを隠す */
  embeddedInForm?: boolean;
  /** 作品の特徴カード編集を隠す（特徴タグに統一した編集フォーム向け） */
  hideFeatures?: boolean;
  /** 見出し・枠なしで作品紹介テキストエリアのみ */
  compactIntroduction?: boolean;
  onSave?: (payload: GameOverviewSavePayload) => void;
  onFeedback?: () => void;
  feedbackCtaLabel?: string;
  /** 編集時 — DB の overview_introduction（未設定は空。description フォールバックは含めない） */
  editIntroduction?: string;
  /** プレイヤー向け概要タブのメタ情報（フェーズ・プレイ時間・対応環境など） */
  playerMeta?: GameDetailPlayerMeta | null;
  /** プレイヤー向け — 開発ログ・声の状況など */
  overviewActivity?: GameDetailOverviewActivity | null;
  gameId?: string;
  heroLead?: string;
  externalLinks?: ExternalLink[];
  watching?: boolean;
  onWatch?: () => void;
  onOpenDevlog?: () => void;
  onOpenVoices?: () => void;
}
>(function GameDetailOverviewV0Tab(
  {
  game,
  editable = false,
  hideVersionQuestions = true,
  embeddedInForm = false,
  hideFeatures = false,
  compactIntroduction = false,
  onSave,
  onFeedback,
  feedbackCtaLabel = "フィードバックする",
  editIntroduction,
  playerMeta = null,
  overviewActivity = null,
  gameId,
  heroLead,
  externalLinks = [],
  watching = false,
  onWatch,
  onOpenDevlog,
  onOpenVoices,
},
  ref,
) {
  const [introExpanded, setIntroExpanded] = useState(false);
  const [introduction, setIntroduction] = useState(
    editable ? (editIntroduction ?? "") : game.introduction,
  );
  const [features, setFeatures] = useState<GameDetailFeature[]>(game.features);
  const [developerWorry, setDeveloperWorry] = useState(game.developerWorry);
  const [wantedVoices, setWantedVoices] = useState(game.wantedVoices.join("\n"));
  const [saveValidationError, setSaveValidationError] = useState<string | null>(null);

  useEffect(() => {
    setIntroduction(editable ? (editIntroduction ?? "") : game.introduction);
    setFeatures(
      game.features.length > 0
        ? game.features.map((feature) => ({ ...feature }))
        : [emptyFeatureDraft()],
    );
  }, [game.id, game.introduction, game.features, editable, editIntroduction]);

  const isPlayerOverview =
    !editable && Boolean(playerMeta) && Boolean(overviewActivity) && Boolean(gameId);
  const introPreview =
    introduction.length <= 120 || introExpanded
      ? introduction
      : `${introduction.slice(0, 120)}…`;

  const showVersionQuestions = !hideVersionQuestions;
  const visibleFeatures = features.filter(
    (feature) => feature.title.trim() || feature.description.trim(),
  );
  const displayFeatures =
    visibleFeatures.length > 0 ? visibleFeatures : game.features;
  const showFeaturesSection =
    !hideFeatures && (editable || displayFeatures.length > 0);
  const showIntroSection =
    editable || introduction.trim().length > 0 || compactIntroduction;

  function updateFeature(index: number, patch: Partial<GameDetailFeature>) {
    setFeatures((current) =>
      current.map((feature, i) => (i === index ? { ...feature, ...patch } : feature)),
    );
  }

  function addFeature() {
    if (features.length >= MAX_PROJECT_FEATURES) {
      return;
    }
    setFeatures((current) => [...current, emptyFeatureDraft()]);
  }

  function removeFeature(index: number) {
    setFeatures((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyFeatureDraft()];
    });
  }

  function handleSave() {
    const featureDraftCheck = validateFeatureDrafts(features);
    if (!featureDraftCheck.ok) {
      setSaveValidationError(featureDraftCheck.error);
      return;
    }

    const featureResult = prepareOverviewFeaturesForSave(features);
    if (!featureResult.ok) {
      setSaveValidationError(featureResult.error);
      return;
    }

    if (!introduction.trim()) {
      setSaveValidationError("作品紹介を入力してください。");
      return;
    }

    setSaveValidationError(null);
    onSave?.({
      introduction,
      features: featureResult.features,
    });
  }

  useImperativeHandle(ref, () => ({
    validateAndGetPayload: () => {
      if (!introduction.trim()) {
        return { ok: false, error: "作品紹介を入力してください。" };
      }
      if (hideFeatures) {
        return {
          ok: true,
          payload: {
            introduction,
            features: [],
          },
        };
      }
      const featureDraftCheck = validateFeatureDrafts(features);
      if (!featureDraftCheck.ok) {
        return featureDraftCheck;
      }
      const featureResult = prepareOverviewFeaturesForSave(features);
      if (!featureResult.ok) {
        return { ok: false, error: featureResult.error };
      }
      return {
        ok: true,
        payload: {
          introduction,
          features: featureResult.features,
        },
      };
    },
  }));

  if (isPlayerOverview && playerMeta && overviewActivity && gameId) {
    return (
      <GameDetailPlayerOverview
        gameId={gameId}
        game={game}
        heroLead={heroLead ?? game.lead}
        playerMeta={playerMeta}
        activity={overviewActivity}
        externalLinks={externalLinks}
        watching={watching}
        onOpenDevlog={onOpenDevlog}
        onOpenVoices={onOpenVoices}
        onWatch={onWatch}
      />
    );
  }

  return (
    <div
      className={
        showVersionQuestions ? "grid gap-6 lg:grid-cols-2" : "mx-auto max-w-3xl space-y-6"
      }
    >
      <div className="space-y-6">
        {showIntroSection ? (
        compactIntroduction && editable ? (
          <textarea
            value={introduction}
            onChange={(event) => setIntroduction(event.target.value)}
            rows={6}
            className={`${fieldClassName} resize-y`}
            placeholder="世界観・遊び方・この作品の魅力を紹介してください"
          />
        ) : (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">作品紹介</h2>
          {editable ? (
            <textarea
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              rows={6}
              className={`${fieldClassName} mt-3 resize-y`}
              placeholder="世界観・遊び方・この作品の魅力を紹介してください"
            />
          ) : (
            <>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{introPreview}</p>
              {introduction.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIntroExpanded((value) => !value)}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
                >
                  {introExpanded ? "閉じる" : "もっと見る"}
                  <ChevronDown
                    className={`size-4 transition-transform ${introExpanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </>
          )}
        </section>
        )
        ) : null}

        {showFeaturesSection ? (
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">作品の特徴</h2>
            {editable && (
              <p className="text-xs text-zinc-600">最大 {MAX_PROJECT_FEATURES} 件</p>
            )}
          </div>
          {editable ? (
            <div className="mt-4 space-y-4">
              {features.map((feature, index) => {
                const { preset, customTitle } = splitFeatureTitleForEdit(feature.title);

                return (
                <div
                  key={`feature-${index}`}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-xs font-medium text-zinc-500">
                      特徴 {index + 1}
                    </label>
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-zinc-600 transition-colors hover:text-red-400"
                        aria-label={`特徴 ${index + 1} を削除`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <select
                    value={preset}
                    onChange={(event) => {
                      const nextPreset = event.target.value as OverviewFeaturePreset | "";
                      if (!nextPreset) {
                        updateFeature(index, { title: "" });
                        return;
                      }
                      if (nextPreset === OVERVIEW_FEATURE_OTHER) {
                        updateFeature(index, { title: customTitle });
                        return;
                      }
                      updateFeature(index, { title: nextPreset });
                    }}
                    className={fieldClassName}
                  >
                    <option value="">種類を選ぶ</option>
                    {OVERVIEW_FEATURE_PRESET_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {preset === OVERVIEW_FEATURE_OTHER ? (
                    <input
                      type="text"
                      value={customTitle}
                      maxLength={OVERVIEW_FEATURE_CUSTOM_TITLE_MAX}
                      onChange={(event) =>
                        updateFeature(index, { title: event.target.value })
                      }
                      className={fieldClassName}
                      placeholder={`見出し（${OVERVIEW_FEATURE_CUSTOM_TITLE_MAX}字以内）`}
                    />
                  ) : null}
                  <textarea
                    value={feature.description}
                    maxLength={OVERVIEW_FEATURE_DESCRIPTION_MAX}
                    onChange={(event) =>
                      updateFeature(index, { description: event.target.value })
                    }
                    rows={2}
                    className={`${fieldClassName} resize-y`}
                    placeholder="例: ランタンの光で照らしながら、森の奥へ進む探索体験"
                  />
                  <p className="mt-1 text-right text-[10px] text-zinc-600">
                    {feature.description.length}/{OVERVIEW_FEATURE_DESCRIPTION_MAX}
                  </p>
                </div>
              );
              })}
              {features.length < MAX_PROJECT_FEATURES && (
                <button
                  type="button"
                  onClick={addFeature}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-300"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  特徴を追加
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {displayFeatures.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          )}
        </section>
        ) : null}

        {saveValidationError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {saveValidationError}
          </p>
        ) : null}

        {editable && !embeddedInForm && (
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            概要を保存
          </button>
        )}
      </div>

      {showVersionQuestions && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">開発者が聞きたいこと</h2>
            {editable ? (
              <textarea
                value={developerWorry}
                onChange={(event) => setDeveloperWorry(event.target.value)}
                rows={3}
                className={`${fieldClassName} mt-3`}
              />
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {game.developerWorry}
              </p>
            )}
            <h3 className="mt-5 text-sm font-medium text-zinc-300">回答してほしい項目</h3>
            {editable ? (
              <textarea
                value={wantedVoices}
                onChange={(event) => setWantedVoices(event.target.value)}
                rows={5}
                placeholder="1行に1項目"
                className={`${fieldClassName} mt-3`}
              />
            ) : (
              <ul className="mt-3 space-y-3">
                {game.wantedVoices.map((voice) => (
                  <li
                    key={voice}
                    className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300"
                  >
                    <Compass
                      className="mt-0.5 size-4 shrink-0 text-violet-400"
                      aria-hidden="true"
                    />
                    {voice}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!editable && onFeedback && (
            <button
              type="button"
              onClick={onFeedback}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              {feedbackCtaLabel}
            </button>
          )}

          {editable && !embeddedInForm && (
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              概要を保存
            </button>
          )}
        </div>
      )}
    </div>
  );
});
