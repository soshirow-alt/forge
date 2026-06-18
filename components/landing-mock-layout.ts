/**
 * 01 LP — モック JPEG オーバーレイ計測値（基準幅 1024）
 *
 * 優先順位: ① 作品カードサイズ（モック基準）→ ② お知らせ Y → ③ フッター Y
 * アートボード高 MOCK_H はフッター下端から算出（カードを縮めない）
 */
export const MOCK_W = 1024;

export const MOCK_CONTENT_X = 62;
export const MOCK_CONTENT_W = 900;

export const MOCK_HEADER_H = 42;

export const MOCK_LOGO = { x: 62, y: 11 } as const;
export const MOCK_LOGIN = { x: 776, y: 8, w: 74, h: 28 } as const;
export const MOCK_SIGNUP = { x: 858, y: 8, w: 84, h: 28 } as const;

export const MOCK_H1 = { x: 62, y: 50, size: 27, lineHeight: 32 } as const;
export const MOCK_LEAD = { x: 62, y: 90, w: 408, size: 11, lineHeight: 17 } as const;

export const MOCK_VALUES = {
  x: 62,
  y: 128,
  icon: 26,
  rowGap: 9,
  titleSize: 12,
  bodySize: 10,
  bodyLineHeight: 14,
} as const;

export const MOCK_CTA = {
  y: 92,
  leftX: 558,
  rightX: 776,
  w: 204,
  h: 218,
  pad: 14,
  icon: 44,
  titleSize: 14,
  bodySize: 10,
  btnH: 32,
} as const;

export const MOCK_HERO_BG_H = 322;

export const MOCK_FEATURED = {
  y: 322,
  titleY: 334,
  cardsY: 352,
  cardW: 172,
  /** モック基準 — サムネ主役（圧縮前の計測値に復帰） */
  thumbH: 64,
  metaPad: 8,
  metaBodyMinH: 38,
  gap: 8,
  titleSize: 11,
  bodySize: 9,
  statsSize: 8,
  /** 作品カード列下端 → お知らせ上端 */
  gapBeforeNews: 12,
} as const;

/** 1枚の注目カード高 = thumb + meta（padding 込み） */
export const MOCK_FEATURED_CARD_H =
  MOCK_FEATURED.thumbH + MOCK_FEATURED.metaPad * 2 + MOCK_FEATURED.metaBodyMinH;

/** 作品カード列の下端 Y */
export const MOCK_FEATURED_CARDS_BOTTOM = MOCK_FEATURED.cardsY + MOCK_FEATURED_CARD_H;

export const MOCK_NEWS = {
  y: MOCK_FEATURED_CARDS_BOTTOM + MOCK_FEATURED.gapBeforeNews,
  h: 34,
  padX: 62,
  titleSize: 10,
  bodySize: 10,
} as const;

export const MOCK_FOOTER = {
  y: MOCK_NEWS.y + MOCK_NEWS.h,
  h: 42,
  padX: 62,
  size: 9,
} as const;

/** 実コンテンツ高（カードサイズ維持のため 496 固定は使わない） */
export const MOCK_H = MOCK_FOOTER.y + MOCK_FOOTER.h;

export const LP_REF_WIDTH = MOCK_W;

/** モック JPEG 原寸（overlay 比較用参照画像の高さ） */
export const MOCK_REF_IMAGE_H = 496;
