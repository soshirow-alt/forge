# 見届け人 tier — 設計確定 + T1/T2 実装

**ステータス**: **設計 GO** / T1–T2 実装完了（2026-06-16）  
**前提**: W4 マイページ UI main 反映済み、014 staging 適用済み、014 本番 **GO**（Dashboard 適用はオーナー Run）

**Out**: 作品詳細、見届け人数、ランキング、通知、獲得通知、プロフィール tier（T3）、PLAYER_VISIBLE

---

## 1. 確定 tier（ChatGPT レビュー GO 2026-06-16）

| level | 閾値（grant 累計） | 名称 |
|-------|-------------------|------|
| 0 | 1 作品 | 見届け人 |
| 1 | 3 作品 | 見届け人 Silver |
| 2 | 10 作品 | 見届け人 Gold |

**カウント**: `project_witness_grants` の行数 = distinct project（UNIQUE 制約）。剥奪なし。

**名称方針**: Silver / Gold を当面採用。将来 UI レビューで差し替え可。ランキング・人数表示は Out のため件数競争リスクは限定的。

---

## 2. 表示（T2 — マイページのみ）

**位置**: `/mypage#official-release` セクション見出し直下（grant ≥1 時のみ）

| 要素 | 内容 |
|------|------|
| バッジ | tier 名称（見届け人 / Silver / Gold） |
| 補足一行 | tier ごとの summary 文言 |

**summary 文言**

- 1+: 正式版まで見届けた作品があります
- 3+: 複数の作品の正式版を見届けてきました
- 10+: 多くの作品の育ちに関わってきました

---

## 3. 実装

| ファイル | 役割 |
|----------|------|
| `lib/witness-tier.ts` | 閾値 + `resolveWitnessTier()` |
| `components/official-release-section.tsx` | tier バッジ + summary |
| `scripts/witness-tier-verify.ts` | 純粋ロジック verify |

**DB**: 追加 migration なし — grant 行数の実行時集計。

---

## 4. verify

```bash
npm run verify:witness:tier
npm run verify:witness:ui:staging
```

---

## 5. 014 本番適用（GO）

オーナー Dashboard で `supabase/migrations/014_project_witness_grants.sql` を Run。

- 手順: `docs/supabase-dashboard-migration-guide.md`
- 詳細: `docs/witness-phase-w2-migration.md` §8–9
- 適用後: grant 保持ユーザーで本番 `/mypage#official-release` 目視

**注意**: 014 適用前に初回 Released 済み作品は遡及付与しない（バックフィルなし）。

---

## 6. 将来（T3 Out）

- プロフィールへの tier 一行
- UI 全面レビュー — 将来像デモ環境確認後

---

## 7. 関連

- `docs/witness-phase-w4-ui.md`
- `docs/witness-phase-w2-migration.md`
- `docs/player-badges-design-review.md`
