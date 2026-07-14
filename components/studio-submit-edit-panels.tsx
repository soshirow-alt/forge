"use client";

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

type SubmitEditPanelProps = {
  draft: SubmitDraftState;
  onThumbnailsBusyChange?: (busy: boolean) => void;
  onApply: (patch: Partial<SubmitDraftState>) => void;
  onCancel: () => void;
  highlightFieldId?: StudioFieldId | null;
};

export function StudioSubmitBasicInfoEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
}: SubmitEditPanelProps) {
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
          placeholder="ゲームのタイトル"
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

export function StudioSubmitGenresTagsEditPanel({
  draft,
  onApply,
  onCancel,
  highlightFieldId = null,
}: SubmitEditPanelProps) {
  return (
    <StudioPanelEditShell
      title="ジャンル・タグ"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={onCancel}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.genres}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.genres}
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
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
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
      </StudioFieldAnchor>

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
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.thumbnail}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.thumbnail}
      >
        <ProjectThumbnailFields
          inputId="submit-draft-thumbnails"
          thumbnails={draft.thumbnailUrls}
          onChange={(thumbnailUrls) => onApply({ thumbnailUrls })}
          onBusyChange={onThumbnailsBusyChange}
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
