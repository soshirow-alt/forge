"use client";

import { PlayEnvironmentFormFields } from "@/components/play-environment-form-fields";
import { PROJECT_ACCESS_SECTION_TITLE } from "@/lib/project-form-copy";
import { getAccessUrlField } from "@/lib/project-access-form";
import type { PlayEnvironmentFormState } from "@/lib/play-environment";

type ProjectAccessEnvironmentFieldsProps = {
  playEnvironment: PlayEnvironmentFormState;
  onPlayEnvironmentChange: (value: PlayEnvironmentFormState) => void;
  playUrl: string;
  onPlayUrlChange: (value: string) => void;
  inputClassName: string;
  playUrlInputId?: string;
  distributionRadioName?: string;
};

export function ProjectAccessEnvironmentFields({
  playEnvironment,
  onPlayEnvironmentChange,
  playUrl,
  onPlayUrlChange,
  inputClassName,
  playUrlInputId = "play-url",
  distributionRadioName = "distribution",
}: ProjectAccessEnvironmentFieldsProps) {
  const accessUrlField = getAccessUrlField(playEnvironment.distribution);

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <p className="text-sm font-medium text-zinc-400">{PROJECT_ACCESS_SECTION_TITLE}</p>
      <PlayEnvironmentFormFields
        value={playEnvironment}
        onChange={onPlayEnvironmentChange}
        distributionRadioName={distributionRadioName}
        distributionRequired
      />
      {accessUrlField ? (
        <div>
          <label htmlFor={playUrlInputId} className="text-sm font-medium text-zinc-400">
            {accessUrlField.label}
          </label>
          <input
            id={playUrlInputId}
            type="url"
            required
            value={playUrl}
            onChange={(event) => onPlayUrlChange(event.target.value)}
            className={inputClassName}
            placeholder={accessUrlField.placeholder}
          />
        </div>
      ) : null}
    </div>
  );
}
