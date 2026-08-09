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
| Schema prereq | `supabase/migrations/076`–`081`, `085`（five-category Search filters — player_counts / attr フィルタ） |
| Tag | `forge-ia-seed-v1` |
| Title prefix | `[IA Seed]` |

**Production では実行しない。** `supabase/migrations/` に置かない。

---

## seed 間の参照構造（重要）

### 基本 seed の owner

40 作品の `owner_id` は次の式で決まる（行ごとに dedicated slot 1–20 を割当）:

```sql
COALESCE(
  (SELECT id FROM auth.users WHERE id = '<a1a1…slot>'::uuid),
  '<hero OWNER_A or OWNER_B>'::uuid
)
```

| 状況 | 実際の owner |
|---|---|
| **auth seed 済み**（専用 20 ユーザー存在） | `a1a1a1a1-a1a1-41a1-81a1-…0001`–`…0020` |
| **auth seed なし** | hero `dddddddd-…0001` / `…0002` にフォールバック |

FB 投稿者は常に既存 hero players（`…0101`–`…0110`）。既存 profile の公開情報は UPDATE しない。

### 専用 20 プロフィールとの結びつき

- `search_public_catalog` の developer / activity_tags ヒットは **公開作品を ≥1 所有**が条件（079）
- そのため専用プロフィールは **孤立させず**、40 作品を slot 1–20 へ割当（各 ≥1 件）
- 複数カテゴリ制作者:
  - `ia-seed-dev-16` → game + audio + asset
  - `ia-seed-dev-17` → game + dev-tool + service-app

### 推奨実行順

1. migrations 076→081  
2. **auth/profile 拡張**（service role・任意だが推奨）  
3. **基本 seed**（SQL）— 専用ユーザーがいれば所有を結ぶ  
4. validate  
5. Preview 確認  

**auth を後から足す場合:** 基本 seed を再実行すれば `ON CONFLICT` で `owner_id` が専用ユーザーへ付け替わる。

### auth 省略時でも基本 seed は成立するか

**成立する。** hero owners / players が FK として存在する前提（hero-carousel seed 済み Staging）。

### auth 省略で確認不能になる項目

- 専用 20 プロフィール / `activity_tags`（配信者・複数活動タグ）
- 開発者検索・グローバル検索の **developer ヒット**としての専用プロフィール
- 専用プロフィールページでの複数カテゴリ作品一覧（auth 時のみ dedicated owners）
- 長い制作者 **プロフィール名**（作品側の長い creator 表示は基本 seed でもあり）

auth 省略でも確認できる:

- 40 作品・カテゴリ・使用関係・お知らせ・FB・更新・属性/配信条件
- 作品詳細（owner は hero A/B。A/B は全カテゴリに作品を持つ）
- プロジェクト側タグ検索（ローグライク / Unity / 配信者 等）

---

## Cleanup 順

1. `player-ia-staging-seed-cleanup.sql`（作品など seed 行削除）  
2. `player-ia-auth-seed-cleanup.ts --execute`（専用ユーザー削除）  

**逆順禁止:** `projects.owner_id → auth.users ON DELETE CASCADE` のため、先に auth を消すと seed 作品も消える。

---

## なぜ A（SQL）と B（Auth）を分けるか

| 方式 | 内容 |
|---|---|
| **A. 基本 seed（SQL）** | 作品・FB・更新・使用関係・お知らせ。owner は dedicated 優先 / hero フォールバック |
| **B. Auth 拡張（service role）** | Admin API で専用 20 ユーザー + `developer_profiles`（`activity_tags`） |

既存 profile を UPDATE しない。`auth.users` 生 INSERT しない。Production ref 停止。credentials 無しは B を SKIP。

---

## 識別子

| 対象 | 識別 |
|---|---|
| projects | UUID `eeeeeeee-eeee-4eee-8eee-*` / tag `forge-ia-seed-v1` / title `[IA Seed]%` |
| usage | UUID `ffffffff-ffff-4fff-8fff-*` / `relation_type='used'` |
| announcements | UUID `aaaaaaaa-aaaa-4aaa-8aaa-*` / slug `ia-seed-%` |
| registered FB | UUID `99999999-9999-4999-8999-*` |
| guest FB | UUID `bbbbbbbb-bbbb-4bbb-8bbb-*` |
| empathies / replies / devlogs / release | `8888…` / `7777…` / `6666…` / `5555…` |
| auth users (B) | UUID `a1a1a1a1-a1a1-41a1-81a1-*` / `creator_id` `ia-seed-dev-*` |

---

## 基本 seed 件数（静的 coverage）

再生成: `node scripts/staging-only/generate-player-ia-staging-seed.mjs`  
正本: `player-ia-staging-seed-coverage.json`

| 種類 | 件数 |
|---|---:|
| projects | **40**（各カテゴリ 8） |
| usage relations | **12** |
| announcements published / draft | **6 / 2** |
| registered FB / guest FB | **31 / 7** |
| empathy rows / replies | **72 / 13** |
| devlogs / release events | **45 / 8** |

配信: ok 9 / conditional 9 / no 7 / unset 15  
属性: quick_try 17 / looking_for_testers 9 / usable_for_creation 25（hidden filter 用の既存分布は維持。UI 確認用の追加 seed はしない）

**5カテゴリ Preview E2E（2026-08-09）**

| 領域 | 内容 |
|---|---|
| game genre/tag | 公式 option のみ。OR 複数ヒット / AND ヒット / AND 0 件（`ローグライク`∧`協力プレイ`）を coverage で固定 |
| asset | Studio 構造化欄: `asset_kinds`（canonical label, dedicated column）+ `category_attributes.formats/tastes/tools`。キャラクター kind は 2D/3D 両方を coverage |
| audio / dev-tool / service-app | Studio `category_attributes`（kinds[] canonical + 一部 legacy 単数 `kind` 読み込み互換 / music* / moods / purposes / tool* / features / service*） |
| play info | game に `estimated_play_time` + `play_access_type` + `tags` の play-env（PC対応等）+ `player_counts`（085 専用列、一部行のみ populate）。asset は play-access=`free`・play-time なし |
| publish | `publish_destinations` jsonb（self_site）を seed 固定 UUID 行へ |
| audit | `audit-player-ia-five-category-search.sql`（read-only） |
| 目視 | `player-ia-five-category-preview-e2e-checklist.md` |

検索 0 件用: `zzz-ia-seed-nohit-999`

**085 five-category Search filters（2026-08-09 追加）**

seed は `085_catalog_five_category_filters.sql` の全フィルタを exercise する:

| フィルタ | seed 上の coverage |
|---|---|
| `p_play_times` | game `estimated_play_time` 全 8 行に値あり |
| `p_play_envs` | game `tags` に PC対応/スマホ対応/ブラウザ対応 を分散 |
| `p_player_counts` | game `player_counts`（085 専用列）を 5/8 行のみ populate（残り 3 行は空で「未設定」分岐を確認） |
| `p_attr_kinds` | audio/dev-tool/service-app `kinds[]` canonical。audio 1 行・service-app 1 行は legacy 単数 `kind` のみ（read-fallback）。`効果音・ジングル` legacy 値は SEキット基礎 行で固定 |
| `p_attr_music_genres` / `p_attr_moods` / `p_attr_purposes` | audio 全 8 行に moods/purposes を分散。BGM+バトル+激しい（戦闘ループ音源）が cross-axis AND ケース |
| `p_duration_buckets` | audio `musicDuration` が 5 バケット全て（`0:08`〜`10:00`）をカバー |
| `p_attr_formats` / `p_attr_tastes` / `p_attr_tools` | asset 全 8 行。キャラクター kind が 2D（Aseprite）と 3D（Blender/Maya）に分散 |
| `p_attr_environments` | dev-tool `toolEnvironments`（Webブラウザ含む）、service-app `serviceEnvironments`（canonical `Web` と legacy `Webブラウザ` を両方 seed） |
| `p_attr_features` | dev-tool / service-app の一部行のみ populate（未設定分岐あり） |
| `p_asset_kind` / `p_asset_kinds` | asset `asset_kinds` 列（dedicated column）。8 種類の canonical label に分散 |

---

## 画像

Smoke A の `thumbnail_url` 再利用、または `NULL`。Storage 書き込みなし（必要なら別手順）。

Staging Home 目視用の表示整えは **別 SQL**（seed 本体ではない）:

| ファイル | 役割 |
|---|---|
| `beautify-player-ia-seed-display.sql` | Staging 専用。seed の title / announcement 自然表示文 / thumbnail を整え。**Production 禁止**。Cursor/Codex は適用しない（オーナーが SQL Editor で手動） |
| `audit-player-ia-home-v0-state.sql` | read-only 監査（件数・thumb 整合・immutable 未更新・RPC 存在） |
| `local-sql-gate-player-ia-home.mjs` | PGlite ローカル全文ゲート（`npm run verify:player-ia-home-sql-gate`） |

### thumbnail / no-image ルール（実 schema 035 + アプリ）

- 画像あり: `thumbnail_url` と `thumbnail_urls[1]` を一致。path は `/images/staging-only/player-ia/*` のみ
- no-image 2件（`…0004` / `…0021`）: `thumbnail_url IS NULL` かつ `thumbnail_urls = '{}'`（**NULL 配列は不可** — `thumbnail_urls text[] NOT NULL DEFAULT '{}'`）
- published devlog / release note は **DB 更新しない**（immutable）。Preview Home 表示では `stripPlayerIaSeedDisplayPrefix` が先頭 `[IA Seed]` のみ除去
- seed project の description はカテゴリ別の自然文へ置換（`Staging専用` 残さない）
- seed project の `creator` / `owner_name` を架空スタジオ名へ（hero HC profile は更新しない）
- dedicated `ia-seed-dev-%` profile がある場合のみ `public_name` を同名へ更新


### PGlite gate の保証範囲

- 保証する: 083 DROP+CREATE、beautify 初回/再実行、audit 全文、件数 inventory、thumb 整合、Production guard、不完全 seed の fail-closed、rollback、immutable 非更新
- 保証しない: 実 Staging RLS / Storage / auth / ライブ schema 差分のない完全一致。**PGlite PASS ≠ Staging 適用成功の保証**

### オーナー手動実行順（Staging SQL Editor）— 5カテゴリ seed 更新時

UUID / 件数 inventory は不変のため **cleanup 不要**（再適用 = `ON CONFLICT` upsert）。auth を触らない。

1. Dashboard ref が **`vuqpwvjvgyxffmvpfrxo`** であること（Production `bpnisgzxuwdxelhnduuf` では実行しない）
2. **`supabase/migrations/085_catalog_five_category_filters.sql` 全文**（BEGIN〜COMMIT）— seed 側が `player_counts` 列の存在を前提に abort guard を持つため、seed より先に必須
3. （任意・未実施なら）auth seed — 専用 owner を結びたいときのみ
4. **`player-ia-staging-seed.sql` 全文**（BEGIN〜COMMIT）
5. **`beautify-player-ia-seed-display.sql` 全文** — seed 再適用で `[IA Seed]` / Smoke thumb に戻るため **必須**
6. **`audit-player-ia-home-v0-state.sql` 全文** — inventory / thumb / immutable
7. **`audit-player-ia-five-category-search.sql` 全文** — カテゴリ件数・genre/tag・asset kinds/formats・085 フィルタ coverage
8. Preview で `player-ia-five-category-preview-e2e-checklist.md` を目視
9. **cleanup は実行しない**（今回は upsert のみ）

失敗したら次の SQL に進まない。Cursor / Codex は Staging へ write しない。

---

## Runbook

正本: `docs/player-ia-staging-apply-runbook.md`
