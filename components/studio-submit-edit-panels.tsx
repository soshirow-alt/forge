"use client";

import { useState } from "react";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { ProjectEstimatedPlayTimeField } from "@/components/project-estimated-play-time-field";
import { ProjectPhaseFormFields } from "@/components/project-phase-form-fields";
import { ProjectAlreadyReleasedFormFields } from "@/components/project-already-released-form-fields";
import { ProjectPlayAccessFormFields } from "@/components/project-play-access-form-fields";
import { StudioFieldAnchor } from "@/components/studio-field-anchor";
import { ProjectThumbnailFields } from "@/components/project-thumbnail-fields";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
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
  toggleForgeGenre,
} from "@/lib/project-genres";
import { PROJECT_VISIBILITY_FORM_OPTIONS, type ProjectVisibility } from "@/lib/project-visibility";
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import { STUDIO_FIELD_IDS } from "@/lib/studio-preview-edit-targets";
import type { StudioFieldId } from "@/lib/studio-preview-edit-targets";
import type { ProjectExternalLinksInput } from "@/lib/game-links";
import type { PlayEnvironmentFormState } from "@/lib/play-environment";
import type { SubmitPlayAccessType } from "@/lib/play-access-type";

type SubmitEditPanelProps = {
  draft: SubmitDraftState;
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
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [phase, setPhase] = useState(draft.phase);
  const [declareAlreadyReleased, setDeclareAlreadyReleased] = useState(
    draft.declareAlreadyReleased,
  );

  function handleApply() {
    onApply({ title, description, phase, declareAlreadyReleased });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="基本情報"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.title}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.title}
      >
        <ProjectTitleField
          id="submit-title"
          value={title}
          onChange={setTitle}
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
          value={description}
          onChange={setDescription}
          inputClassName={studioPanelInputClassName}
        />
      </StudioFieldAnchor>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.phase}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.phase}
      >
        <ProjectPhaseFormFields
          value={phase}
          onChange={setPhase}
          radioName="submit-phase"
          required={false}
        />
      </StudioFieldAnchor>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.alreadyReleased}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.alreadyReleased}
      >
        <ProjectAlreadyReleasedFormFields
          scheduled={declareAlreadyReleased}
          onSchedule={() => setDeclareAlreadyReleased(true)}
          onCancelSchedule={() => setDeclareAlreadyReleased(false)}
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
  const [genres, setGenres] = useState(draft.genres);
  const [featureTags, setFeatureTags] = useState(draft.featureTags);

  function handleApply() {
    onApply({ genres, featureTags });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="ジャンル・タグ"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
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
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
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
  highlightFieldId = null,
}: SubmitEditPanelProps) {
  const [introduction, setIntroduction] = useState(draft.introduction);

  function handleApply() {
    onApply({ introduction });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="作品紹介"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
      saveLabel="反映する"
    >
      <p className="text-xs text-zinc-600">{PROJECT_INTRO_HINT}</p>
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.introduction}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.introduction}
      >
        <textarea
          value={introduction}
          onChange={(event) => setIntroduction(event.target.value)}
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
}: SubmitEditPanelProps) {
  const [thumbnailUrls, setThumbnailUrls] = useState(draft.thumbnailUrls);

  function handleApply() {
    onApply({ thumbnailUrls });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="サムネイル"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.thumbnail}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.thumbnail}
      >
        <ProjectThumbnailFields
          inputId="submit-draft-thumbnails"
          thumbnails={thumbnailUrls}
          onChange={setThumbnailUrls}
          required
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
  const [playAccessType, setPlayAccessType] = useState(draft.playAccessType);
  const [estimatedPlayTime, setEstimatedPlayTime] = useState(draft.estimatedPlayTime);
  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    draft.playEnvironment,
  );
  const [playUrl, setPlayUrl] = useState(draft.playUrl);

  function handleApply() {
    onApply({
      playAccessType,
      estimatedPlayTime,
      playEnvironment,
      playUrl,
    });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="プレイ情報"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playAccess}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playAccess}
      >
        <ProjectPlayAccessFormFields
          value={playAccessType}
          onChange={(value: SubmitPlayAccessType) => setPlayAccessType(value)}
          radioName="submit-play-access-type"
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.playInfo}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.playInfo}
        scrollOnHighlight={false}
      >
        <ProjectEstimatedPlayTimeField
          value={estimatedPlayTime}
          onChange={setEstimatedPlayTime}
          inputClassName={studioPanelInputClassName}
          inputId="submit-estimated-play-time"
        />
      </StudioFieldAnchor>

      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.distribution}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.distribution}
      >
        <ProjectAccessEnvironmentFields
          playEnvironment={playEnvironment}
          onPlayEnvironmentChange={setPlayEnvironment}
          playUrl={playUrl}
          onPlayUrlChange={setPlayUrl}
          inputClassName={studioPanelInputClassName}
          playUrlInputId="submit-play-url"
          distributionRadioName="submit-distribution"
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
  const [links, setLinks] = useState({
    steamUrl: draft.steamUrl,
    itchUrl: draft.itchUrl,
    discordUrl: draft.discordUrl,
    xUrl: draft.xUrl,
    officialUrl: draft.officialUrl,
    youtubeUrl: draft.youtubeUrl,
    githubUrl: draft.githubUrl,
  });
  const [visibility, setVisibility] = useState(draft.visibility);

  function setExternalLinkField(field: keyof ProjectExternalLinksInput, value: string) {
    setLinks((current) => ({ ...current, [field]: value }));
  }

  function handleApply() {
    onApply({ ...links, visibility });
    onCancel();
  }

  return (
    <StudioPanelEditShell
      title="公開先・関連リンク"
      backLabel="← 投稿内容に戻る"
      onCancel={onCancel}
      onSave={handleApply}
      saveLabel="反映する"
    >
      <StudioFieldAnchor
        fieldId={STUDIO_FIELD_IDS.publication}
        highlight={highlightFieldId === STUDIO_FIELD_IDS.publication}
        scrollOnHighlight={false}
      >
        <ExternalLinksFormFields
          formKey="submit-external"
          values={links}
          onChange={setExternalLinkField}
          inputClassName={studioPanelInputClassName}
        />
      </StudioFieldAnchor>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400">公開設定</p>
        <div className="space-y-2">
          {PROJECT_VISIBILITY_FORM_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                visibility === option.value
                  ? "border-orange-500/40 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <input
                type="radio"
                name="submit-visibility"
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value as ProjectVisibility)}
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
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
