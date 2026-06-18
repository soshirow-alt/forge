/**
 * 01 LP — モック基準アートボード（参照幅 1920）
 *
 * 固定 px 再現が目的ではない。
 * モック PNG から読み取った位置関係・余白感・各要素比率を参照幅上に固定し、
 * LandingPageScaler が viewport に対して均一 scale する。
 *
 * NG: viewport に合わせて Hero / CTA / カードを個別伸縮
 * OK: このアートボード全体を 1 枚として max-fit scale
 */
export const LP_REF_WIDTH = 1920;

/** モック: 左右マージン込みの中央コンテンツ幅 (~58%) */
export const LP_CONTENT_WIDTH = 1120;

/** ヒーロー左右カラム — モック ~59% / ~41% */
export const LP_HERO_COL_LEFT = "1.18fr";
export const LP_HERO_COL_RIGHT = "0.82fr";

export const LP_HEADER_HEIGHT = 52;
export const LP_HERO_TOP = 24;
export const LP_HERO_BOTTOM = 48;
export const LP_HERO_GRID_GAP = 24;
export const LP_HERO_GRID_TOP = 20;

export const LP_H1_SIZE = 34;
export const LP_LEAD_SIZE = 14;
export const LP_VALUE_TITLE = 13;
export const LP_VALUE_BODY = 11;
export const LP_VALUE_GAP = 14;
export const LP_VALUE_ICON = 32;

/** モック CTA カード — 幅は右カラム半分、高さは固定比率（個別 stretch なし） */
export const LP_CTA_HEIGHT = 236;
export const LP_CTA_GAP = 12;
export const LP_CTA_ICON = 48;

/** モック注目カード — サムネ横長 */
export const LP_THUMB_ASPECT = "16 / 10" as const;
export const LP_FEATURED_GAP = 10;
export const LP_FEATURED_SECTION_Y = 20;

export const LP_NEWS_SECTION_Y = 12;
export const LP_FOOTER_Y = 12;
