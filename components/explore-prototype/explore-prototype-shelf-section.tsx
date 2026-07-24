"use client";

import { ExplorePrototypeDiscoveryCard } from "@/components/explore-prototype/explore-prototype-discovery-card";
import {
  ExplorePrototypeSectionHeader,
  ExplorePrototypeShelfPager,
} from "@/components/explore-prototype/explore-prototype-shelf-pager";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";

/**
 * Client shelf section — keeps pager render callbacks out of Server Components.
 */
export function ExplorePrototypeShelfSection({
  title,
  headingId,
  works,
  seeAllHref,
  seeAllLabel,
  keyPrefix,
}: {
  title: string;
  headingId: string;
  works: ExplorePrototypeWork[];
  seeAllHref?: string;
  seeAllLabel?: string;
  keyPrefix: string;
}) {
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <ExplorePrototypeSectionHeader
        title={title}
        headingId={headingId}
        seeAllHref={seeAllHref}
        seeAllLabel={seeAllLabel}
      />
      <div className="px-2">
        <ExplorePrototypeShelfPager
          items={works}
          getKey={(work) => `${keyPrefix}-${work.id}`}
          pageSize={4}
          renderItem={(work) => <ExplorePrototypeDiscoveryCard work={work} />}
        />
      </div>
    </section>
  );
}
