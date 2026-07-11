"use client";

import { PlayEnvironmentFormFields } from "@/components/play-environment-form-fields";
import type { PlayEnvironmentFormState } from "@/lib/play-environment";

type ProjectDeviceEnvironmentFieldsProps = {
  playEnvironment: PlayEnvironmentFormState;
  onPlayEnvironmentChange: (value: PlayEnvironmentFormState) => void;
};

/** 対応環境のみ（公開先・利用方法は別フォーム）。 */
export function ProjectDeviceEnvironmentFields({
  playEnvironment,
  onPlayEnvironmentChange,
}: ProjectDeviceEnvironmentFieldsProps) {
  return (
    <PlayEnvironmentFormFields
      value={playEnvironment}
      onChange={onPlayEnvironmentChange}
      showDistribution={false}
    />
  );
}
