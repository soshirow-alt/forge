# 正式版 Phase 1 — 検証手順

**前提**: migration `013_project_release_events.sql` を Supabase Dashboard で適用済み  
**Out of scope**: 見届け人 / バッジ / PLAYER_VISIBLE / 通知強化 / ランキング

---

## 1. migration 013

Dashboard SQL: `supabase/migrations/013_project_release_events.sql`

確認:

```sql
select release_status from public.projects limit 1;
select * from public.project_release_events limit 1;
```

---

## 2. Studio — 正式版パネル

URL: `/projects/[id]/studio` → `#official-release`

| 状態 | 表示 |
|------|------|
| 開発中 | 現在: 開発中。Released ボタン有効（条件 OK 時） |
| 正式版 | 現在: 正式版。Release Reopened ボタン有効 |
| 正式版再調整中 | 現在: 正式版再調整中。Released 再宣言可 |

**Released 条件**

- devlog 1 件以上
- playable_version あり
- 品質審査なし（Forge は判定しない）

**Release Reopened**

- 現在が `released` のときのみ
- イベント追記 + `release_status` → `release_reopened`
- **履歴行は削除しない**

手順:

1. オーナーで Studio 開く
2. devlog 未投稿 → Released 不可メッセージ確認
3. devlog 投稿後 → Released → `project_release_events` に `released` 行
4. Release Reopened → `release_reopened` 行追加
5. 再 Released → 2 件目の `released` 行

---

## 3. マイページ — プレイヤー

URL: `/mypage` → `#official-release`

- プレイした作品のうち **一度でも Released された作品** を一覧
- 初回 Released 日時、現在状態（正式版 / 正式版再調整中）
- Reopened 後も一覧に残る（到達事实は消えない）

---

## 4. プレイ履歴連携

URL: `/mypage` → `#play-history`

- タイムラインに `release` イベント行
  - Released: 「正式版に到達 — 開発者が Released を宣言」
  - Reopened: 「正式版を再調整 — Release Reopened」
- 初回 Released **以前** にプレイしていればサマリに「正式版到達を見届けた」
- 見届け人判定用: `wasActiveBeforeFirstRelease(firstPlayedAt, firstReleasedAt)` in `lib/project-release-state.ts`

---

## 5. build

```bash
npm run build
```

2026-06-16 Phase 1: **PASS**

---

## 6. staging 確認チェックリスト

**自動（013 + DB フロー）**

```bash
npm run verify:official-release:staging
npm run verify:official-release:staging:flow
```

**手動（UI）**

- [ ] Studio `#official-release` — Released / Reopened ボタン
- [ ] `/mypage` `#official-release` — プレイ済み正式版作品
- [ ] `/mypage` `#play-history` — release 行 + 「正式版到達を見届けた」

**013 未適用時**: 最初のコマンドが exit 2 + Dashboard 手順を表示
