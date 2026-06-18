/**
 * 01 LP — モック PNG/JPEG オーバーレイ計測値（1024×496）
 *
 * 基準: public/images/landing-mock-reference.jpg
 * 計測方法: モック原寸に HTML を重ね、要素境界を合わせて確定
 *
 * 画像素材: ヒーロー背景はモック原画像を使用。
 * 注目カードサムネはモック切り出し不可のため CSS グラデ近似（完全一致不可を doc に明記）
 */
export const MOCK_W = 1024;
export const MOCK_H = 496;

/** コンテンツ左右余白 62px / コンテンツ幅 900px */
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

/** ヒーロー背景クリップ高（注目セクション上端まで） */
export const MOCK_HERO_BG_H = 322;

export const MOCK_FEATURED = {
  y: 322,
  titleY: 334,
  cardsY: 352,
  cardW: 172,
  thumbH: 64,
  metaPad: 8,
  metaH: 38,
  gap: 8,
  titleSize: 11,
  bodySize: 9,
} as const;

export const MOCK_NEWS = { y: 418, h: 34, padX: 62, titleSize: 10, bodySize: 10 } as const;
export const MOCK_FOOTER = { y: 454, h: 42, padX: 62, size: 9 } as const;

/** 旧 LP_REF_WIDTH 互換 */
export const LP_REF_WIDTH = MOCK_W;
