"use client";

import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
  studioPanelSingleLineInputClassName,
} from "@/components/studio-panel-edit-shell";
import { CollapsibleFormSection } from "@/components/collapsible-form-section";
import { FORGE_GENRE_OPTIONS, type ForgeGenreOption } from "@/lib/forge-genre-options";
import {
  FORGE_FEATURE_TAG_OPTIONS,
  MAX_PROJECT_FEATURE_TAGS,
  toggleForgeFeatureTag,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import { PROJECT_INTRO_HINT } from "@/lib/project-form-copy";
import {
  MAX_PROJECT_GENRES,
  sanitizeProjectGenresForSave,
  toggleForgeGenre,
} from "@/lib/project-genres";
import { PROJECT_VISIBILITY_FORM_OPTIONS, type ProjectVisibility } from "@/lib/project-visibility";
import { PROJECT_VISIBILITY_SECTION_HINT } from "@/lib/project-form-copy";
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import type { ProjectExternalLinksInput } from "@/lib/game-links";

type SubmitEditPanelProps = {
  draft: SubmitDraftState;
  onApply: (patch: Partial<SubmitDraftState>) => void;
  onCancel: () => void;
};

export function StudioSubmitBasicInfoEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="基本情報"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <div>
        <label htmlFor="submit-title" className="text-xs font-medium text-zinc-500">
          タイトル
        </label>
        <input
          id="submit-title"
          type="text"
          value={draft.title}
          onChange={(event) => onApply({ title: event.target.value })}
          className={studioPanelInputClassName}
          placeholder="ゲームのタイトル"
        />
      </div>
      <div>
        <label htmlFor="submit-lead" className="text-xs font-medium text-zinc-500">
          1行説明
        </label>
        <input
          id="submit-lead"
          type="text"
          value={draft.description}
          onChange={(event) => onApply({ description: event.target.value })}
          className={studioPanelSingleLineInputClassName}
          placeholder="ヒーローに表示される短い説明"
        />
      </div>
      <ProjectPhaseFormFields
        value={draft.phase}
        onChange={(phase) => onApply({ phase })}
        radioName="submit-phase"
        required={false}
      />
    </StudioPanelEditShell>
  );
}

export function StudioSubmitGenresTagsEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="ジャンル・タグ"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <CollapsibleFormSection
        title="ジャンル"
        summary={
          draft.genres.length > 0
            ? draft.genres.join("・")
            : "未選択"
        }
      >
        <p className="text-xs text-zinc-600">最大 {MAX_PROJECT_GENRES} つまで。</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {FORGE_GENRE_OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-xs transition-colors ${
                draft.genres.includes(option)
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={draft.genres.includes(option)}
                onChange={() =>
                  onApply({
                    genres: toggleForgeGenre(draft.genres, option) as ForgeGenreOption[],
                  })
                }
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title="特徴タグ"
        summary={draft.featureTags.length > 0 ? draft.featureTags.join("・") : "なし（任意）"}
      >
        <p className="text-xs text-zinc-600">任意・最大 {MAX_PROJECT_FEATURE_TAGS} つ。</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FORGE_FEATURE_TAG_OPTIONS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1.5"
            >
              <input
                type="checkbox"
                checked={draft.featureTags.includes(tag)}
                onChange={() =>
                  onApply({
                    featureTags: toggleForgeFeatureTag(
                      draft.featureTags,
                      tag,
                    ) as ForgeFeatureTagOption[],
                  })
                }
                className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-xs text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      </CollapsibleFormSection>
    </StudioPanelEditShell>
  );
}

export function StudioSubmitIntroductionEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="作品紹介"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <p className="text-xs text-zinc-600">{PROJECT_INTRO_HINT}</p>
      <textarea
        value={draft.introduction}
        onChange={(event) => onApply({ introduction: event.target.value })}
        rows={8}
        className={`${studioPanelInputClassName} resize-y`}
        placeholder="世界観・遊び方・この作品の魅力を紹介してください"
      />
    </StudioPanelEditShell>
  );
}

export function StudioSubmitImagesEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  const primaryGenre = sanitizeProjectGenresForSave(draft.genres)[0] ?? "その他";

  return (
    <StudioPanelEditShell
      title="画像"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <ProjectThumbnailFields
        inputId="submit-draft-thumbnails"
        thumbnails={draft.thumbnailUrls}
        onChange={(thumbnailUrls) => onApply({ thumbnailUrls })}
        posterFallback={{
          projectId: "submit-preview",
          title: draft.title.trim() || "タイトル未入力",
          genre: primaryGenre,
          phase: draft.phase,
        }}
      />
    </StudioPanelEditShell>
  );
}

export function StudioSubmitPlayInfoEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  function setExternalLinkField(field: keyof ProjectExternalLinksInput, value: string) {
    onApply({ [field]: value } as Partial<SubmitDraftState>);
  }

  return (
    <StudioPanelEditShell
      title="プレイ情報・公開先"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <ProjectEstimatedPlayTimeField
        value={draft.estimatedPlayTime}
        onChange={(estimatedPlayTime) => onApply({ estimatedPlayTime })}
        inputClassName={studioPanelInputClassName}
        inputId="submit-estimated-play-time"
      />

      <ProjectAccessEnvironmentFields
        playEnvironment={draft.playEnvironment}
        onPlayEnvironmentChange={(playEnvironment) => onApply({ playEnvironment })}
        playUrl={draft.playUrl}
        onPlayUrlChange={(playUrl) => onApply({ playUrl })}
        inputClassName={studioPanelInputClassName}
        playUrlInputId="submit-play-url"
        distributionRadioName="submit-distribution"
      />

      <ExternalLinksFormFields
        formKey="submit-external"
        values={{
          steamUrl: draft.steamUrl,
          itchUrl: draft.itchUrl,
          discordUrl: draft.discordUrl,
          xUrl: draft.xUrl,
          officialUrl: draft.officialUrl,
          youtubeUrl: draft.youtubeUrl,
          githubUrl: draft.githubUrl,
        }}
        onChange={setExternalLinkField}
        inputClassName={studioPanelInputClassName}
      />
    </StudioPanelEditShell>
  );
}

export function StudioSubmitVisibilityEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="公開設定"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <p className="text-xs text-zinc-600">{PROJECT_VISIBILITY_SECTION_HINT}</p>
      <div className="space-y-2">
        {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
              draft.visibility === option.value
                ? "border-orange-500/40 bg-orange-500/5"
                : "border-zinc-800 bg-zinc-950/50"
            }`}
          >
            <input
              type="radio"
              name="submit-visibility"
              checked={draft.visibility === option.value}
              onChange={() => onApply({ visibility: option.value as ProjectVisibility })}
              className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-300">{option.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </StudioPanelEditShell>
  );
}
