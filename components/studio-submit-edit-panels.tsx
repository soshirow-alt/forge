"use client";

import { useEffect, useState } from "react";
import { AgeRatingR18ConfirmModal } from "@/components/age-rating-r18-confirm-modal";
import { ProjectDeviceEnvironmentFields } from "@/components/project-device-environment-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectAlreadyReleasedFormFields } from "@/components/project-already-released-form-fields";
import { ProjectPlayAccessFormFields } from "@/components/project-play-access-form-fields";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import { PublishDestinationsFormFields } from "@/components/publish-destinations-form-fields";
import { RelatedLinksFormFields } from "@/components/related-links-form-fields";
import { ProjectOneLineDescriptionField } from "@/components/project-one-line-description-field";
import { ProjectTitleField } from "@/components/project-title-field";
import {
  StudioPanelEditShell,
  studioPanelInputClassName,
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
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import { SUBMIT_DRAFT_PREVIEW_ID } from "@/lib/studio-submit-draft";
import { STUDIO_FIELD_IDS } from "@/lib/studio-preview-edit-targets";
import type { StudioFieldId } from "@/lib/studio-preview-edit-targets";
import { syncLegacyFieldsFromPublishLinks } from "@/lib/project-publish-links";
import { normalizeAgeRating, type AgeRating } from "@/lib/age-rating";
import {
  MUSIC_GENRE_OPTIONS,
  SERVICE_ENVIRONMENT_OPTIONS,
  SUBMIT_PROTOTYPE_PUBLISH_KINDS,
  SUBMIT_PROTOTYPE_USAGE_PANEL_TITLE,
  TOOL_ENVIRONMENT_OPTIONS,
  TOOL_USAGE_METHOD_OPTIONS,
  createEmptyPrototypePublishDestination,
  kindOptionsForCategory,
  prototypePublishOpenLabel,
  type PrototypePublishDestination,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

type SubmitEditPanelProps = {
  draft: SubmitDraftState;
  onThumbnailsBusyChange?: (busy: boolean) => void;
  onApply: (patch: Partial<SubmitDraftState>) => void;
  onCancel: () => void;
  highlightFieldId?: StudioFieldId | null;
};

type SubmitBasicInfoEditPanelProps = SubmitEditPanelProps & {
  /** Defaults to formal game copy. Prototype may pass 作品のタイトル. */
  titlePlaceholder?: string;
};

export function StudioSubmitBasicInfoEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
  titlePlaceholder = "ゲームのタイトル",
}: SubmitBasicInfoEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="基本情報"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.title}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.title}
      >
        <ProjectTitleField
          id="submit-title"
          value={draft.title}
          onChange={(title) => onApply({ title })}
          inputClassName={studioPanelInputClassName}
          placeholder={titlePlaceholder}
        />
      </StudioFieldAnchor>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.catchCopy}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.catchCopy}
      >
        <ProjectOneLineDescriptionField
          id="submit-lead"
          value={draft.description}
          onChange={(description) => onApply({ description })}
          inputClassName={studioPanelInputClassName}
        />
      </StudioFieldAnchor>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.phase}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.phase}
      >
        <ProjectPhaseFormFields
          value={draft.phase}
          onChange={(phase) => onApply({ phase })}
          radioName="submit-phase"
          required={false}
        />
      </StudioFieldAnchor>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.alreadyReleased}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.alreadyReleased}
      >
        <ProjectAlreadyReleasedFormFields
          scheduled={draft.declareAlreadyReleased}
          onSchedule={() => onApply({ declareAlreadyReleased: true })}
          onCancelSchedule={() => onApply({ declareAlreadyReleased: false })}
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}

/**
 * Local panel buffer — genres / tags / ageRating apply to parent draft only on 「反映する」.
 */
export function StudioSubmitGenresTagsEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
}: SubmitEditPanelProps) {
  const [genres, setGenres] = useState<ForgeGenreOption[]>(() => [...draft.genres]);
  const [featureTags, setFeatureTags] = useState<ForgeFeatureTagOption[]>(() => [
    ...draft.featureTags,
  ]);
  const [ageRating, setAgeRating] = useState<AgeRating>(() =>
    normalizeAgeRating(draft.ageRating),
  );
  const [confirmR18Open, setConfirmR18Open] = useState(false);

  useEffect(() => {
    setGenres([...draft.genres]);
    setFeatureTags([...draft.featureTags]);
    setAgeRating(normalizeAgeRating(draft.ageRating));
  }, [draft.genres, draft.featureTags, draft.ageRating]);

  function handleAgeCheckboxChange(checked: boolean) {
    if (checked && ageRating !== "r18") {
      setConfirmR18Open(true);
      return;
    }
    setAgeRating(checked ? "r18" : "general");
  }

  return (
    <>
      <StudioPanelEditShell
        title="ジャンル・タグ"
        backLabel="← 投稿内容に戻る"
        onCancel={onCancel}
        onSave={() => {
          onApply({
            genres: sanitizeProjectGenresForSave(genres),
            featureTags,
            ageRating,
          });
          onCancel();
        }}
        saveLabel="反映する"
      >
        <StudioFieldAnchor
          fieldId={STUDIO_FIELD_IDS.genres}
          highlight={highlightFieldId === STUDIO_FIELD_IDS.genres}
        >
          <CollapsibleFormSection
            title="ジャンル"
            summary={genres.length > 0 ? genres.join("・") : "未選択"}
          >
            <p className="text-xs text-zinc-600">最大 {MAX_PROJECT_GENRES} つまで。</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {FORGE_GENRE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-xs transition-colors ${
                    genres.includes(option)
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={genres.includes(option)}
                    onChange={() =>
                      setGenres(toggleForgeGenre(genres, option) as ForgeGenreOption[])
                    }
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </CollapsibleFormSection>
        </StudioFieldAnchor>

        <CollapsibleFormSection
          title="特徴タグ"
          summary={featureTags.length > 0 ? featureTags.join("・") : "なし（任意）"}
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
                  checked={featureTags.includes(tag)}
                  onChange={() =>
                    setFeatureTags(
                      toggleForgeFeatureTag(featureTags, tag) as ForgeFeatureTagOption[],
                    )
                  }
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
                />
                <span className="text-xs text-zinc-300">{tag}</span>
              </label>
            ))}
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title="年齢制限"
          summary={ageRating === "r18" ? "R18" : "なし"}
        >
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={ageRating === "r18"}
              onChange={(event) => handleAgeCheckboxChange(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
            />
            <span>
              <span className="block text-xs font-medium text-zinc-200">
                R18作品として設定する
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
                18歳未満の方はプレイできない作品に設定します。
              </span>
            </span>
          </label>
        </CollapsibleFormSection>
      </StudioPanelEditShell>

      {confirmR18Open ? (
        <AgeRatingR18ConfirmModal
          onCancel={() => setConfirmR18Open(false)}
          onConfirm={() => {
            setAgeRating("r18");
            setConfirmR18Open(false);
          }}
        />
      ) : null}
    </>
  );
}

export function StudioSubmitIntroductionEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
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
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.introduction}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.introduction}
      >
        <textarea
          value={draft.introduction}
          onChange={(event) => onApply({ introduction: event.target.value })}
          rows={8}
          className={`${studioPanelInputClassName} resize-y`}
          placeholder="世界観・遊び方・この作品の魅力を紹介してください"
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}

export function StudioSubmitImagesEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
  onThumbnailsBusyChange,
  imageLabel,
  imageHint,
  imageCountHelper,
}: SubmitEditPanelProps & {
  imageLabel?: string;
  imageHint?: string;
  imageCountHelper?: (count: number) => string;
}) {
  const primaryGenre = sanitizeProjectGenresForSave(draft.genres)[0] ?? "その他";

  return (
    <StudioPanelEditShell
      title="画像"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.thumbnail}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.thumbnail}
      >
        <ProjectThumbnailFields
          inputId="submit-draft-thumbnails"
          thumbnails={draft.thumbnailUrls}
          onChange={(thumbnailUrls) => onApply({ thumbnailUrls })}
          onBusyChange={onThumbnailsBusyChange}
          label={imageLabel}
          hint={imageHint}
          countHelper={imageCountHelper}
          posterFallback={{
            projectId: SUBMIT_DRAFT_PREVIEW_ID,
            title: draft.title.trim() || "タイトル未入力",
            genre: primaryGenre,
            phase: draft.phase,
            styleSeed: SUBMIT_DRAFT_PREVIEW_ID,
          }}
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}

export function StudioSubmitPlayInfoEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="プレイ情報"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playAccess}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playAccess}
      >
        <ProjectPlayAccessFormFields
          value={draft.playAccessType}
          onChange={(playAccessType) => onApply({ playAccessType })}
          radioName="submit-play-access-type"
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playInfo}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playInfo}
        scrollOnHighlight={false}
      >
        <ProjectEstimatedPlayTimeField
          value={draft.estimatedPlayTime}
          onChange={(estimatedPlayTime) => onApply({ estimatedPlayTime })}
          inputClassName={studioPanelInputClassName}
          inputId="submit-estimated-play-time"
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.distribution}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.distribution}
      >
        <ProjectDeviceEnvironmentFields
          playEnvironment={draft.playEnvironment}
          onPlayEnvironmentChange={(playEnvironment) => onApply({ playEnvironment })}
        />
      </StudioFieldAnchor>
    </StudioPanelEditShell>
  );
}

export function StudioSubmitPublicationEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
}: SubmitEditPanelProps) {
  function applyPublishLinks(
    publishDestinations: SubmitDraftState["publishDestinations"],
    relatedLinks: SubmitDraftState["relatedLinks"],
  ) {
    const legacy = syncLegacyFieldsFromPublishLinks(publishDestinations, relatedLinks);
    onApply({
      publishDestinations,
      relatedLinks,
      playUrl: legacy.playUrl,
      steamUrl: legacy.steamUrl ?? "",
      itchUrl: legacy.itchUrl ?? "",
      githubUrl: legacy.githubUrl ?? "",
      discordUrl: legacy.discordUrl ?? "",
      officialUrl: legacy.officialUrl ?? "",
      xUrl: legacy.xUrl ?? "",
      youtubeUrl: legacy.youtubeUrl ?? "",
    });
  }

  return (
    <StudioPanelEditShell
      title="公開先・公開設定"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.publication}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.publication}
        scrollOnHighlight={false}
      >
        <div className="space-y-4">
          <PublishDestinationsFormFields
            value={draft.publishDestinations}
            onChange={(publishDestinations) =>
              applyPublishLinks(publishDestinations, draft.relatedLinks)
            }
            inputClassName={studioPanelInputClassName}
            formKey="submit-publish"
          />
          <RelatedLinksFormFields
            value={draft.relatedLinks}
            onChange={(relatedLinks) =>
              applyPublishLinks(draft.publishDestinations, relatedLinks)
            }
            inputClassName={studioPanelInputClassName}
            formKey="submit-related"
          />
        </div>
      </StudioFieldAnchor>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <div className="space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                draft.visibility === option.value
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name="submit-visibility"
                checked={draft.visibility === option.value}
                onChange={() => onApply({ visibility: option.value as ProjectVisibility })}
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-300">{option.label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </StudioPanelEditShell>
  );
}

export function StudioSubmitVisibilityEditPanel({
  draft,
  onApply,
  onCancel,
}: SubmitEditPanelProps) {
  return (
    <StudioSubmitPublicationEditPanel
      draft={draft}
      onApply={onApply}
      onCancel={onCancel}
    />
  );
}

function SubmitPrototypeChipGroup({
  label,
  options,
  value,
  onSelect,
  required = false,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (next: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-zinc-600">（必須）</span> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                active
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubmitPrototypeMultiChipGroup({
  label,
  options,
  values,
  onChange,
  required = false,
}: {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-zinc-600">（必須）</span> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(
                  active
                    ? values.filter((item) => item !== option)
                    : [...values, option],
                );
              }}
              className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                active
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Preview: classification row (genres-tags slot). */
export function StudioSubmitPrototypeClassificationEditPanel({
  category,
  fields,
  draft,
  onFieldsChange,
  onDraftChange,
  onCancel,
}: {
  category: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  draft: SubmitDraftState;
  onFieldsChange: (patch: Partial<SubmitPrototypeCategoryFields>) => void;
  onDraftChange: (patch: Partial<SubmitDraftState>) => void;
  onCancel: () => void;
}) {
  const panelTitle =
    category === "music" ? "ジャンル・タグ" : "種類・タグ";

  return (
    <StudioPanelEditShell
      title={panelTitle}
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <SubmitPrototypeChipGroup
        label="種類"
        options={kindOptionsForCategory(category)}
        value={fields.kind}
        onSelect={(kind) => onFieldsChange({ kind })}
        required
      />

      {category === "music" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">
            ジャンル <span className="font-normal text-zinc-600">（任意）</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRE_OPTIONS.map((option) => {
              const active = fields.musicGenres.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onFieldsChange({
                      musicGenres: active
                        ? fields.musicGenres.filter((item) => item !== option)
                        : [...fields.musicGenres, option],
                    });
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <CollapsibleFormSection
        title="特徴タグ"
        summary={
          draft.featureTags.length > 0
            ? draft.featureTags.join("・")
            : "なし（任意）"
        }
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
                  onDraftChange({
                    featureTags: toggleForgeFeatureTag(
                      draft.featureTags,
                      tag,
                    ) as ForgeFeatureTagOption[],
                  })
                }
                className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-xs text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      </CollapsibleFormSection>
    </StudioPanelEditShell>
  );
}

/** Preview: play-info row → 音源情報 / 利用情報. */
export function StudioSubmitPrototypeUsageEditPanel({
  category,
  fields,
  onChange,
  onCancel,
}: {
  category: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  onChange: (patch: Partial<SubmitPrototypeCategoryFields>) => void;
  onCancel: () => void;
}) {
  return (
    <StudioPanelEditShell
      title={SUBMIT_PROTOTYPE_USAGE_PANEL_TITLE[category]}
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      {category === "music" ? (
        <div className="space-y-2">
          <label htmlFor="proto-music-duration" className="text-sm font-medium text-zinc-400">
            再生時間 <span className="font-normal text-zinc-600">（任意）</span>
          </label>
          <input
            id="proto-music-duration"
            value={fields.musicDuration}
            onChange={(event) => onChange({ musicDuration: event.target.value })}
            placeholder="例: 0:12 / 3:24 / 1:05:00"
            className={studioPanelInputClassName}
          />
          <p className="text-xs text-zinc-600">
            数秒の効果音から長時間の音声作品まで、分・秒で入力できます。
          </p>
        </div>
      ) : null}

      {category === "dev_tool" ? (
        <div className="space-y-4">
          <SubmitPrototypeMultiChipGroup
            label="対応環境"
            options={TOOL_ENVIRONMENT_OPTIONS}
            values={fields.toolEnvironments}
            onChange={(toolEnvironments) => onChange({ toolEnvironments })}
            required
          />
          <SubmitPrototypeChipGroup
            label="利用方法"
            options={TOOL_USAGE_METHOD_OPTIONS}
            value={fields.toolUsageMethod}
            onSelect={(toolUsageMethod) => onChange({ toolUsageMethod })}
            required
          />
        </div>
      ) : null}

      {category === "web_service" ? (
        <SubmitPrototypeMultiChipGroup
          label="対応環境"
          options={SERVICE_ENVIRONMENT_OPTIONS}
          values={fields.serviceEnvironments}
          onChange={(serviceEnvironments) => onChange({ serviceEnvironments })}
          required
        />
      ) : null}
    </StudioPanelEditShell>
  );
}

function normalizePrototypePublishDestinations(
  items: PrototypePublishDestination[],
): PrototypePublishDestination[] {
  if (items.length === 0) {
    return [createEmptyPrototypePublishDestination({ isPrimary: true })];
  }
  const hasPrimary = items.some((item) => item.isPrimary);
  if (hasPrimary) return items;
  return items.map((item, index) => ({ ...item, isPrimary: index === 0 }));
}

/** Preview publication: prototype destination kinds + formal related links / visibility. */
export function StudioSubmitPrototypePublicationEditPanel({
  category,
  draft,
  fields,
  onDraftChange,
  onFieldsChange,
  onCancel,
}: {
  category: SubmitPrototypeCategory;
  draft: SubmitDraftState;
  fields: SubmitPrototypeCategoryFields;
  onDraftChange: (patch: Partial<SubmitDraftState>) => void;
  onFieldsChange: (patch: Partial<SubmitPrototypeCategoryFields>) => void;
  onCancel: () => void;
}) {
  const kinds = SUBMIT_PROTOTYPE_PUBLISH_KINDS[category];
  const items = normalizePrototypePublishDestinations(fields.publishDestinations);

  function updateAt(index: number, patch: Partial<PrototypePublishDestination>) {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onFieldsChange({ publishDestinations: normalizePrototypePublishDestinations(next) });
  }

  return (
    <StudioPanelEditShell
      title="公開先・公開設定"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="text-sm font-medium text-zinc-400">
          公開先 <span className="font-normal text-zinc-600">（メイン必須）</span>
        </p>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFieldsChange({
                      publishDestinations: items.map((row, i) => ({
                        ...row,
                        isPrimary: i === index,
                      })),
                    });
                  }}
                  className={`text-xs ${
                    item.isPrimary ? "text-violet-300" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {item.isPrimary ? "メイン公開先" : "メインにする"}
                </button>
                <span className="text-[11px] text-zinc-600">
                  {item.kind
                    ? prototypePublishOpenLabel(item.kind)
                    : "種類を選ぶと「○○で開く」"}
                </span>
              </div>
              <select
                value={item.kind}
                onChange={(event) => updateAt(index, { kind: event.target.value })}
                className={studioPanelInputClassName}
              >
                <option value="">種類を選択</option>
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <input
                value={item.url}
                onChange={(event) => updateAt(index, { url: event.target.value })}
                placeholder="https://"
                className={studioPanelInputClassName}
              />
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    onFieldsChange({
                      publishDestinations: normalizePrototypePublishDestinations(
                        items.filter((_, i) => i !== index),
                      ),
                    });
                  }}
                  className="text-xs text-zinc-500 hover:text-red-300"
                >
                  削除
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            onFieldsChange({
              publishDestinations: [
                ...items,
                createEmptyPrototypePublishDestination({ isPrimary: false }),
              ],
            });
          }}
          className="text-xs text-violet-300 hover:text-violet-200"
        >
          ＋ 公開先を追加
        </button>
      </div>

      <RelatedLinksFormFields
        value={draft.relatedLinks}
        onChange={(relatedLinks) => onDraftChange({ relatedLinks })}
        inputClassName={studioPanelInputClassName}
        formKey="submit-proto-related"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <div className="space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                draft.visibility === option.value
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name="submit-proto-visibility"
                checked={draft.visibility === option.value}
                onChange={() =>
                  onDraftChange({ visibility: option.value as ProjectVisibility })
                }
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-300">
                  {option.label}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </StudioPanelEditShell>
  );
}
