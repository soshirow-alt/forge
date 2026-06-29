"use client";

import { InputHintBadge } from "@/components/input-hint-badge";
import {
  DISTRIBUTION_TYPE_LABELS,
  DISTRIBUTION_TYPE_TOOLTIPS,
  type DistributionType,
} from "@/lib/play-environment";

export function DistributionTypeHelp({
  type,
}: {
  type: Exclude<DistributionType, "">;
}) {
  return (
    <InputHintBadge
      label="?"
      ariaLabel={`${DISTRIBUTION_TYPE_LABELS[type]}の説明`}
    >
      {DISTRIBUTION_TYPE_TOOLTIPS[type]}
    </InputHintBadge>
  );
}
