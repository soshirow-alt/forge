export type WitnessTierLevel = 0 | 1 | 2;

export type WitnessTier = {
  level: WitnessTierLevel;
  /** 累計 grant 数（distinct project）の下限 */
  minProjects: number;
  label: string;
  summary: string;
};

/** 昇順。resolveWitnessTier は最大到達 tier を返す。 */
export const WITNESS_TIER_DEFINITIONS: readonly WitnessTier[] = [
  {
    level: 0,
    minProjects: 1,
    label: "見届け人",
    summary: "正式verまで見届けた作品があります",
  },
  {
    level: 1,
    minProjects: 3,
    label: "見届け人 Silver",
    summary: "複数の作品の正式verを見届けてきました",
  },
  {
    level: 2,
    minProjects: 10,
    label: "見届け人 Gold",
    summary: "多くの作品の育ちに関わってきました",
  },
] as const;

/** grant 件数（project_witness_grants の distinct project 数）から tier を解決。0 件は null。 */
export function resolveWitnessTier(grantCount: number): WitnessTier | null {
  if (!Number.isFinite(grantCount) || grantCount < 1) {
    return null;
  }

  let matched: WitnessTier | null = null;

  for (const tier of WITNESS_TIER_DEFINITIONS) {
    if (grantCount >= tier.minProjects) {
      matched = tier;
    }
  }

  return matched;
}
