"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ExternalLinksFormFields } from "@/components/external-links-form-fields";
import { ProjectAccessEnvironmentFields } from "@/components/project-access-environment-fields";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  getDeveloperSocialLinkDefaults,
  mergeSocialLinkDefaults,
} from "@/lib/developer-external-link-defaults";
import { pickFeatureTagsFromGameTags, sanitizeFeatureTagsForSave } from "@/lib/forge-feature-tag-options";
import { validatePlayAccess } from "@/lib/project-access-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  emptyExternalLinkFormValues,
  type ExternalLinkFormValues,
} from "@/lib/game-links";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPublicGameTags,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type ProjectDistributionLinksModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function ProjectDistributionLinksModal({
  projectId,
  open,
  onClose,
}: ProjectDistributionLinksModalProps) {
  const { user } = useAuth();
  const {
    getSubmittedGameById,
    updateProjectDetails,
    getDeveloperProfileByUserId,
    getOwnedProjects,
    dataReady,
  } = useGames();
  const game = getSubmittedGameById(projectId);

  const [playEnvironment, setPlayEnvironment] = useState<PlayEnvironmentFormState>(
    EMPTY_PLAY_ENVIRONMENT_FORM,
  );
  const [playUrl, setPlayUrl] = useState("");
  const [externalUrls, setExternalUrls] = useState<ExternalLinkFormValues>(
    emptyExternalLinkFormValues(),
  );
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      setSaveError(null);
      return;
    }

    if (!game) {
      return;
    }

    setPlayEnvironment(parsePlayEnvironmentFromTags(game.tags ?? []));
    setPlayUrl(game.playUrl ?? "");
    const loadedUrls = {
      steamUrl: game.steamUrl ?? "",
      itchUrl: game.itchUrl ?? "",
      discordUrl: game.discordUrl ?? "",
      xUrl: game.xUrl ?? "",
      officialUrl: game.officialUrl ?? "",
      youtubeUrl: game.youtubeUrl ?? "",
      githubUrl: game.githubUrl ?? "",
    };
    const profile = user ? getDeveloperProfileByUserId(user.id) : undefined;
    const ownedProjects = user ? getOwnedProjects(user.id) : [];
    const defaults = getDeveloperSocialLinkDefaults(profile, ownedProjects, projectId);
    setExternalUrls(mergeSocialLinkDefaults(loadedUrls, defaults));
    setLoaded(true);
  }, [open, game, getDeveloperProfileByUserId, getOwnedProjects, projectId, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game) {
      return;
    }

    const accessError = validatePlayAccess(playEnvironment, playUrl);
    if (accessError) {
      setSaveError(accessError);
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const featureTags = sanitizeFeatureTagsForSave(
        pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
      );
      await updateProjectDetails(projectId, {
        ...buildProjectEditFormDataFromGame(game),
        playUrl: playUrl.trim(),
        tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
        steamUrl: externalUrls.steamUrl || undefined,
        itchUrl: externalUrls.itchUrl || undefined,
        discordUrl: externalUrls.discordUrl || undefined,
        xUrl: externalUrls.xUrl || undefined,
        officialUrl: externalUrls.officialUrl || undefined,
        youtubeUrl: externalUrls.youtubeUrl || undefined,
        githubUrl: externalUrls.githubUrl || undefined,
      });
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!open || !dataReady || !game || !loaded) {
    return null;
  }

  return (
    <V0SimpleModal
      title="配布・リンク"
      subtitle="プレイヤーのアクセス方法・対応環境・作品ページのリンク"
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProjectAccessEnvironmentFields
          playEnvironment={playEnvironment}
          onPlayEnvironmentChange={setPlayEnvironment}
          playUrl={playUrl}
          onPlayUrlChange={setPlayUrl}
          inputClassName={inputClassName}
          playUrlInputId={`play-url-${projectId}`}
          distributionRadioName={`distribution-${projectId}`}
        />
        <ExternalLinksFormFields
          formKey={projectId}
          values={externalUrls}
          onChange={(field, value) =>
            setExternalUrls((current) => ({ ...current, [field]: value }))
          }
          inputClassName={inputClassName}
        />

        {saveError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {saveError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </V0SimpleModal>
  );
}
