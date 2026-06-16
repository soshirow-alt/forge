# 見届け人 W4 — マイページ UI

**ステータス**: 実装完了（2026-06-16）  
**URL**: `/mypage` → `#official-release`

**Out**: 作品詳細、見届け人数、ランキング、通知、PLAYER_VISIBLE

**tier**: `#official-release` 見出し下 — `docs/witness-phase-t1-tier.md`

---

## 1. 表示位置

**`#official-release` セクション内** — 正式版到達作品一覧と同一リスト

- 見届け人付与あり → 先頭に teal 枠カード（見届け人バッジ）
- 付与なし → 従来の emerald 正式版カード

新セクションは増やしていない。

---

## 2. 表示文言

| 要素 | 文言 |
|------|------|
| 見出し（カード内） | 正式版まで見届けました |
| バッジ | 見届け人 |
| 補足（grants あり時） | 正式版になる前にプレイし、声を届ける・複数版を遊ぶ・更新を追う、いずれかで関わった作品です。 |

---

## 3. 表示情報

| 項目 | ソース |
|------|--------|
| 作品名 | games provider |
| 初回 Released | `first_released_at` |
| 関わり方 | `grant_path` → 表示名 |
| 付与日 | `granted_at` |

### grant_path 表示名

| grant_path | 表示 |
|------------|------|
| multi_version | 複数の版を遊んだ |
| voice | 声を届けた |
| watch | 更新を追っていた |

---

## 4. 実装ファイル

| ファイル | 役割 |
|----------|------|
| `lib/supabase/witness-grants-db.ts` | fetch grants |
| `lib/witness-grants-display.ts` | 文言・ラベル |
| `hooks/use-player-witness-grants.ts` | マイページ hook |
| `components/official-release-section.tsx` | UI |

---

## 5. staging 確認

```bash
npm run verify:witness:ui:staging
```

- DB grants + 表示ラベル — PASS
- 目視: ログイン済みユーザーで `/mypage#official-release`（grant 保持ユーザー）

sandbox テストユーザーは auth 専用 — 目視は staging grant 保持アカウントで実施。

---

## 6. 関連

- `docs/witness-phase-w3-verification.md`
- `lib/witness-eligibility.ts`
