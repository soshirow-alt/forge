# Phase3「変化を確かめる」— 実装計画

**ステータス**: **実装完了**（2026-06-16）— PLAYER_VISIBLE=false のまま merge 可  
**日付**: 2026-06-16  
**設計正本**: `docs/phase3-adoption-verify-ux-design.md`

**オーナー方針（2026-06-16）**

- 目的は **通知ではない**
- プレイヤーが **「自分の声が反映されたから確かめに行く」** 体験
- Primary CTA: **「変化を確かめる」**
- **`NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false` 維持** — Phase3 コードは入るがプレイヤー UI は Phase2/3 表示 GO まで非公開

---

## 1. 優先順位（確定）

1. matcher 本番運用（Vercel env + deploy）— **オーナー Dashboard 作業**
2. **Phase3 実装**（本 doc）
3. プレイ履歴
4. 正式版まわり
5. バッジ

---

## 2. Phase3 MVP スコープ

### In

- Phase2 adoption カード CTA → **「変化を確かめる」** + personal URL
- 作品詳細 **AdoptionVerifyBanner**（`?adoption=` + `#adoption-verify`）
- **PlayLaunchDialog** contextual copy（adoption 経由時のみ）
- invalid / 他人 / suppressed adoptionId → **静かに無視**
- post-play voice 前置き 1 行（軽微）

### Out

- voice_adopted 通知
- ゲーム内ハイライト / SDK
- レジャー / バッジ
- `{update_summary}を確かめる` 自動文言（Phase3+）
- analytics

---

## 3. 画面設計案（実装前ワイヤー）

PLAYER_VISIBLE=false 中は本番で見えない。**fixture または staging で PLAYER_VISIBLE=true 時に目視**。

### 3.1 マイページ adoption カード（Phase2 → Phase3）

```
┌─────────────────────────────────────────────┐
│ あなたの回答から変わったこと                    │
├─────────────────────────────────────────────┤
│ あなたは「テンポが悪い」と回答しました            │
│                    ↓                         │
│ 今回の更新で「序盤の待ち時間を30%短縮」されました  │
│                                              │
│  [ 変化を確かめる ]     この関連は違う          │
│                                              │
│  ※ ForgeはAIで…（disclaimer 既存）            │
└─────────────────────────────────────────────┘
```

**変更点**: 「もう一度プレイする」→ **「変化を確かめる」**  
**href**: `/games/{id}?adoption={adoptionId}#adoption-verify`

### 3.2 作品詳細 — AdoptionVerifyBanner（新規）

**位置**: 概要下、NewPlayableVersionBanner **の上**

```
┌─────────────────────────────────────────────┐
│ あなたの声が、今回の更新に届いています          │
│                                              │
│ あなたは「テンポが悪い」と答えました。          │
│ 今回の更新で「序盤の待ち時間を30%短縮」されました。│
│                                              │
│ 版 0.6 で、変わったか確かめに行きましょう。     │
│                                              │
│  [ プレイして確認する ]                        │
└─────────────────────────────────────────────┘
         ↓（その下に汎用 NewPlayableVersionBanner）
```

### 3.3 PlayLaunchDialog（adoption コンテキスト）

```
┌─────────────────────────────────────────────┐
│ 版 0.6 をプレイ                               │
│                                              │
│ 「テンポが悪い」と答えた点について、            │
│ 「序盤の待ち時間を30%短縮」が本当に変わっているか│
│ 確かめましょう。                               │
│                                              │
│  [ プレイする ]  [ キャンセル ]                │
└─────────────────────────────────────────────┘
```

---

## 4. 実装タスク（順序固定）

| # | タスク | ファイル | 完了条件 |
|---|--------|----------|----------|
| 1 | `adoptionVerifyHref()` | `lib/project-nurture-links.ts` | UUID + projectId → URL |
| 2 | adoption query パース | `lib/adoption-verify-context.ts`（新規） | 無効 UUID 無視 |
| 3 | hook: 自分の active adoption のみ | `hooks/use-adoption-verify-context.ts`（新規） | RLS + user match |
| 4 | AdoptionVerifyBanner | `components/adoption-verify-banner.tsx`（新規） | 条件付き表示 |
| 5 | game-detail 配線 | `game-detail-page-client.tsx` | `?adoption=` + バナー配置 |
| 6 | Phase2 CTA 差替 | `voice-adoptions-section.tsx` | 文言 + href |
| 7 | PlayLaunchDialog copy | `play-launch-dialog.tsx` | adoption context 分岐 |
| 8 | post-play voice 1 行 | voice フロー関連 | 軽微 copy |
| 9 | build + 手動確認 doc | `docs/phase3-player-visible-off-verification.md` | **done** |

**見積**: 1 Cursor テーマ（通知・バッジより先）

---

## 5. PLAYER_VISIBLE=false との関係

| 作業 | PLAYER_VISIBLE=false 中 |
|------|-------------------------|
| Phase3 コード merge | **可** |
| プレイヤー本番目視 | **不可**（セクション自体非表示） |
| 開発者の確認 | fixture `true` **ローカルのみ** または SQL + 将来 visible GO |

**Phase2/3 プレイヤー表示 GO** は matcher 本番安定 + Phase3 実装完了後の **別 Run**（`PLAYER_VISIBLE=true`）。

---

## 6. 成功指標（実装後プレイテスト）

- 10 秒以内に CTA 意図を言語化できる
- 「もう一度プレイ」と「変化を確かめる」の意味差が伝わる
- バナー quote/summary が Phase2 カードと **DB 同一行**
- dispute 率が Phase2 単独より上がらない

---

## 7. リスク

| リスク | 対策 |
|--------|------|
| ゲーム内で変化が分からない | copy「devlog の説明と照らし合わせて」 |
| 偽陽性で「変わってない」 | matcher precision GO 維持 + dispute |
| CTA 二重 | personal バナーを汎用より上 |

---

## 8. 関連 doc

- `docs/phase3-adoption-verify-ux-design.md` — UX 詳細
- `docs/voice-adoptions-matcher-prod-go.md` — matcher 本番
- `lib/voice-adoption/constants.ts` — `ADOPTION_VERIFY_CTA_DEFAULT`
