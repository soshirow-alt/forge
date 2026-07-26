# Player IA Staging seed（Staging 専用・Preview 評価用）

| 項目 | 値 |
|---|---|
| Target | `vuqpwvjvgyxffmvpfrxo` only |
| Forbidden | Production `bpnisgzxuwdxelhnduuf` |
| Basic seed | `player-ia-staging-seed.sql` |
| Cleanup | `player-ia-staging-seed-cleanup.sql` |
| Validate SQL | `player-ia-staging-seed-validate.sql` |
| Coverage (static) | `player-ia-staging-seed-coverage.json` |
| Generator | `generate-player-ia-staging-seed.mjs` |
| Auth extension | `player-ia-auth-seed.ts` / `player-ia-auth-seed-cleanup.ts` |
| Schema prereq | `supabase/migrations/076`–`081` |
| Tag | `forge-ia-seed-v1` |
| Title prefix | `[IA Seed]` |

**Production では実行しない。** `supabase/migrations/` に置かない。

---

## なぜ A（SQL）と B（Auth）を分けるか

| 方式 | 内容 | いつ使う |
|---|---|---|
| **A. 基本 seed（SQL）** | 既存 Staging テストユーザー（hero-carousel owners / players）を **FK 参照のみ**。作品・FB・更新・使用関係・お知らせを作成 | Dashboard SQL だけで Preview カテゴリ横断を評価したいとき |
| **B. Auth/profile 拡張（service role）** | Admin API で専用ユーザー 20 人 + `developer_profiles`（`activity_tags` 含む）を作成 | プロフィール検索・活動タグ・配信者フィルタを評価したいとき |

**採用理由**

1. 既存 `developer_profiles` を UPDATE すると cleanup で完全復元できない（前回 seed の問題）。
2. `auth.users` への生 INSERT は避け、専用ユーザーは Admin API のみ。
3. service role が無い環境でも A だけで作品カタログ評価が可能。
4. B は credentials 無しなら **実行しない（SKIP）**。Production ref では必ず停止。

---

## 識別子

| 対象 | 識別 |
|---|---|
| projects | UUID `eeeeeeee-eeee-4eee-8eee-*` / tag `forge-ia-seed-v1` / title `[IA Seed]%` |
| usage | UUID `ffffffff-ffff-4fff-8fff-*` / `relation_type='used'` |
| announcements | UUID `aaaaaaaa-aaaa-4aaa-8aaa-*` / slug `ia-seed-%` |
| registered FB | UUID `99999999-9999-4999-8999-*` |
| guest FB | UUID `bbbbbbbb-bbbb-4bbb-8bbb-*` |
| empathies | UUID `88888888-8888-4888-8888-*` |
| replies | UUID `77777777-7777-4777-8777-*` |
| devlogs | UUID `66666666-6666-4666-8666-*` |
| release events | UUID `55555555-5555-4555-8555-*` |
| auth users (B) | UUID `a1a1a1a1-a1a1-41a1-81a1-*` / email `ia-seed-dev-*@forge-ia-seed.local` / `creator_id` `ia-seed-dev-*` |

FK owners（変更しない）: `dddddddd-…0001` / `…0002`  
FK players（変更しない）: `dddddddd-…0101`–`…0110`

---

## 基本 seed 件数（静的 coverage）

再生成: `node scripts/staging-only/generate-player-ia-staging-seed.mjs`  
正本数値: `player-ia-staging-seed-coverage.json`

| 種類 | 件数 |
|---|---:|
| projects | **40**（各カテゴリ 8） |
| usage relations（使用した） | **12** |
| announcements published / draft | **6 / 2** |
| registered FB | **31** |
| guest FB | **7** |
| empathy rows | **72** |
| replies | **13** |
| devlogs | **45** |
| release events | **8** |

### カテゴリ別作品

`game` 8 / `audio` 8 / `asset` 8 / `dev-tool` 8 / `service-app` 8

### 配信条件（stream_policy）

`ok` 9 / `conditional` 9 / `no` 7 / `unset` 15

### 目的別属性

`quick_try` 17 / `looking_for_testers` 9 / `usable_for_creation` 25

### エッジケース（少数）

画像なし 2 / タグなし（marker のみ） 2 / 長いタイトル 1 / 長い制作者名 1 / 長い説明 2 / FBなし 2 / 更新なし 3 / 使用関係なし多数（通常） / 外部リンクなし 3 / Discord あり 5 / 複数関連リンク 6 / 長い配信条件 1

検索 0 件用クエリ（作品側に埋め込まない）: `zzz-ia-seed-nohit-999`

---

## Auth 拡張件数

| 種類 | 件数 |
|---|---:|
| dedicated auth users + profiles | **20** |
| うち streamer_creator | 4 |
| 複数 activity_tags | 15 |

---

## 静的 validation 結果

`coverage.json` → `validation.pass: true`（生成時に強制）

確認項目:

- category 別 ≥8 / projects ≥40
- UUID / slug 重複なし
- usage 自己参照なし・欠損参照なし・向きは source=使用側 → target=素材側
- announcements published≥6 / draft≥1
- stream_policy 4 値すべて ≥1
- 検索語 12 種が作品側に自然分散（全語 ≥1 hit）
- `existingProfileMutation: false`
- zero-hit 語の作品リークなし

DB 適用後は `player-ia-staging-seed-validate.sql` で件数確認。

---

## 画像

- 既存 Smoke A の `thumbnail_url` を参照再利用（Storage 書き込みなし）
- 一部 `NULL` で fallback 確認
- Staging Storage 書き込みが必要な場合は **別手順**（本パッケージでは実行しない）
- Production Storage へは書かない
- ローカル `public/` を Production コードパスが参照する方式には戻さない

---

## 適用順（DB 書き込みはオーナー指示後）

1. migrations 076→081  
2. migration 確認  
3. **基本 seed** `player-ia-staging-seed.sql`  
4. 必要な場合のみ **auth seed** `npx tsx scripts/staging-only/player-ia-auth-seed.ts --execute`  
5. `player-ia-staging-seed-validate.sql`  
6. Preview 確認  
7. cleanup: SQL cleanup →（auth を使った場合）auth cleanup

### Cleanup で完全削除できる根拠

- 基本 seed は固定 UUID namespace + tag + title prefix のみを DELETE
- 既存 profile / Smoke A / hero 行は UPDATE しないため復元不要
- auth seed は専用 `creator_id` / 固定 UUID / marker のみ削除
- cleanup 後 validate で seed 系 count = 0 を確認

---

## Runbook

正本: `docs/player-ia-staging-apply-runbook.md`
