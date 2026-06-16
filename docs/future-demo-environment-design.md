# 将来像デモ環境 — 設計案

**ステータス**: 設計レビュー待ち（**実装 GO 前**）  
**日付**: 2026-06-16  
**優先度**: 最優先（UI 全面レビューの前提）

**前提**

- Witness W1–W4 + Tier T1/T2 完了
- migration 014 本番適用済み
- `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false` 維持
- ChatGPT 判断: UI 全面レビューは**先に将来像デモ** → その後 UI レビュー

**Out（本フェーズ）**

- 本番 UX 変更、新ルート、ランキング、通知追加、Adoption プレイヤー表示、新ゲーミフィケーション
- PLAYER_VISIBLE=true
- 実装（本 doc GO 後）

---

## 1. 目的

Forge が**育った未来**を、実データに近い密度で体験できる環境を作る。

見る人（オーナー / ChatGPT / Cursor）が

「なるほど、Forge ってこう育つのか」

と理解できること。プレイヤーサイクル・開発者ループの**両方**が目で追えること。

**PLAYER_VISIBLE 機能追加ではない。** 既存画面 + Supabase デモデータのみ。

---

## 2. なぜ今やるか

現状の Forge（本番・staging とも）はデータ量が少なく、以下が薄い:

- プレイ履歴タイムライン
- Devlog の連なり
- 見届け人 / tier
- 正式版到達 / release_reopened
- Voice の蓄積
- 開発の歩み（Studio / Devlog）

この状態で UI 全面レビューしても**空状態・1件状態の判断**に偏り、将来像の情報設計を評価できない。

---

## 3. 設計原則

| 原則 | 内容 |
|------|------|
| 本番機能を増やさない | 新 UI・新 API・新テーブルなし |
| デモデータだけで成立 | 既存 hook / 画面がそのまま読む |
| 小さい実装で大きい価値 | CLI Seeder + 固定ペルソナ + 手順書 |
| 原典整合 | 件数競争・ランキング・通知増殖なし |
| 共有データは Supabase | localStorage は UI 補助のみ（原典どおり） |

---

## 4. 推奨アーキテクチャ

### 4.1 結論

**staging Supabase + service-role CLI Seeder + 固定デモ専用 auth ユーザー**

| 項目 | 方針 |
|------|------|
| 環境 | **staging 正**（本番 DB 汚染を避ける） |
| 投入 | `npm run seed:future-demo:staging`（新規 script） |
| ユーザー | **Demo 専用 8 アカウント**（Player A–D + Developer A–D） |
| 作品 | **Demo 専用 5–6 プロジェクト**（`[future-demo]` 接頭辞） |
| 画面 | **既存 URL のみ**（`/mypage`, `/games/[id]`, Studio 等） |
| 切替 | **ログイン切替**（impersonation UI は作らない） |

### 4.2 採用理由

- `witness-sandbox` と同型 — 014 grants・release trigger の検証実績あり
- `/demo` 現行は**ログイン中 1 開発者**向け 3 作品のみ — 8 ペルソナ横断には不向き
- 組み込み mock 18 作品は DB 非連動 — プレイ履歴・見届け人・正式版は**実 DB が必要**
- 本番 UX 変更なし — ルート追加・バナー・モード切替 UI 不要

### 4.3 他案（不採用）

| 案 | 不採用理由 |
|----|------------|
| `/demo` 拡張のみ | マルチペルソナ・横断プレイ履歴を再現不可 |
| mock 18 + LS 合成 | witness / release / sessions が DB 連動しない |
| UI フィクスチャ層 | 新機能相当、本番 UX に影響 |
| 本番 DB に直接 seed | リスク大、クリーンアップ困難 |
| ペルソナ impersonation UI | 新機能、スコープ外 |

---

## 5. 再現したい 3 体験 → データマップ

### 体験1 — プレイヤー: 発見 → プレイ → 声 → Devlog → 再プレイ

**主役**: Player D × Developer B の作品

| 画面 | 見せたいもの |
|------|--------------|
| `/` or 一覧 | 作品発見 |
| `/games/[id]` | プレイ導線、Voice 導線 |
| `/mypage#play-history` | play / voice / devlog タイムライン |
| Devlog 一覧 | 声を反映した更新の連なり |

**必要データ**: sessions（複数版）, voice_responses, devlogs（`published_version` あり）, watches（任意）

---

### 体験2 — プレイヤー: 複数版 → 見届け人 → 正式版 → 履歴

**主役**: Player B / C × Developer C + D の Released 作品

| 画面 | 見せたいもの |
|------|--------------|
| `/mypage#official-release` | 見届け人 teal カード + tier バッジ |
| `/mypage#play-history` | release イベント、「正式版到達を見届けた」 |
| `/games/[id]` | 作品詳細に witness **出さない**（原典維持） |

**必要データ**: sessions（初回 Released 前）, voice or watch or multi_version 条件, `project_release_events`, `project_witness_grants`（trigger 付与）

---

### 体験3 — 開発者: Voice 集まる → Devlog → プレイヤーが戻る

**主役**: Developer D × Player D（+ 他プレイヤー少数）

| 画面 | 見せたいもの |
|------|--------------|
| `/projects/[id]/studio` | Voice 受信、開発状況 |
| Devlog 編集 / 一覧 | 複数 Devlog、版公開 |
| `/my-projects` | 長期開発の並び |
| Release パネル | Released 状態（Dev C は reopen も） |

**必要データ**: 多数 voice, 多数 devlogs, version_prompts, release_events, grants（**人数は UI に出さない**）

---

## 6. ペルソナ定義

### 6.1 プレイヤー

| ID | 表示名（案） | tier | 再現内容 | 主な確認 URL |
|----|--------------|------|----------|--------------|
| **Player A** | （新規） | なし | 履歴空、見届け人なし、正式版空 | `/mypage` 全体 |
| **Player B** | 見届け人 | 見届け人（1） | 1 作品 witness grant | `#official-release`, `#play-history` |
| **Player C** | 見届け人 Silver | Silver（3） | 3 作品 witness grant | `#official-release` tier バッジ |
| **Player D** | 熱心なプレイヤー | 任意（1+） | 多数 play / voice / devlog タイムライン | `#play-history` 中心 |

**Player D の tier**: 3+ grants でもよいが、**ペルソナの主目的は履歴の厚み**。tier 強調は Player C に任せる。

---

### 6.2 開発者

| ID | 表示名（案） | 再現内容 | 主な確認 URL |
|----|--------------|----------|--------------|
| **Developer A** | 投稿直後 | 1 作品、Devlog 1、Voice 少 / なし、未 Released | `/my-projects`, Studio |
| **Developer B** | 改善が見える | Devlog 5+、Voice→反映 Devlog、版 0.1→0.2 | Studio, Devlog, 作品詳細 |
| **Developer C** | 正式版サイクル | `released` + `release_reopened` 両方 | Studio Release パネル, 履歴 |
| **Developer D** | 長期開発 | Devlog 多数、Voice 多数、witness grants 多数（**人数 UI なし**） | Studio, `/my-projects` |

---

## 7. Demo 専用プロジェクト案（5–6 本）

接頭辞: **`[future-demo]`**（cleanup / verify 用。witness-sandbox と同型）

| # | タイトル（案） | オーナー | visibility | 役割 |
|---|----------------|----------|------------|------|
| P1 | `[future-demo] 初灯の試作` | Dev A | public | 投稿直後 |
| P2 | `[future-demo] 星灯の旅路` | Dev B | public | 体験1 — Voice↔Devlog |
| P3 | `[future-demo] 潮音の記録` | Dev C | public | 体験2 — Released + Reopened |
| P4 | `[future-demo] 深淵ノート` | Dev D | public | 体験3 — 長期 flagship |
| P5 | `[future-demo] 霧港の余白` | Dev D | public | Player C 2 件目 witness |
| P6 | `[future-demo] 砂上の盟約` | Dev B | public | Player C 3 件目 witness（Released） |

**版キー例**: `0.1`, `0.2`, `0.3` — `playable_version` と sessions / devlogs を整合

**Release 順序（重要）**

1. 先に engagement（plays, sessions, voice, watches）を **初回 Released より前** に seed
2. 初回 `released` イベント insert → 014 trigger で grants 付与
3. Dev C のみ `release_reopened` を追加 insert（再 Released は grant 増殖しない — 既存 verify どおり）

---

## 8. 必要データ一覧（Supabase）

### 8.1 テーブル別

| テーブル | 用途 | Seeder |
|----------|------|--------|
| `auth.users` | 8 ペルソナ | admin.createUser |
| `developer_profiles` | 開発者表示名 | insert |
| `projects` | 5–6 作品 | insert |
| `project_devlogs` | 開発の歩み | insert（`published_version` 付き複数） |
| `project_version_prompts` | Voice プロンプト | insert |
| `project_plays` | プレイ済みフラグ | insert |
| `project_play_sessions` | 履歴・multi_version 判定 | insert |
| `project_voice_responses` | 声を届ける | insert |
| `project_watches` | watch 条件（C'） | insert（必要ユーザー only） |
| `project_release_events` | 正式版 / 再調整 | insert（013） |
| `project_witness_grants` | 見届け人 | **trigger 任せ**（手 insert しない） |
| `voice_adoptions` | 影データ | **任意・最小**（PLAYER_VISIBLE=false のため UI 非表示） |

### 8.2 付与しない / 最小

| データ | 方針 |
|--------|------|
| 通知行 | **増やさない**（通知追加禁止） |
| ランキング用集計 | 作らない |
| Adoption プレイヤー UI 用 seed | 不要（shadow のみ将来） |
| `project_feedback` | MVP 外なら省略可 |

### 8.3 localStorage（最小）

| キー | 用途 |
|------|------|
| 原則 **書かない** | デモは Supabase 正 |
| 例外 | テスター応募数など既存 `/demo` 互換が必要なら Dev A のみ最小 |

---

## 9. 既存機能マトリクス（使う / 使わない）

### 使う（変更なし）

- 発見: `/`, 一覧フィルタ, `games-provider`
- 作品詳細: `/games/[id]`
- Voice 投稿フロー（既存）
- プレイ履歴: `use-player-play-history`, `#play-history`
- 正式版 + 見届け人: `#official-release`, `use-player-witness-grants`, tier
- Studio: Release パネル, Voice 一覧
- Devlog: 公開 / 一覧
- Witness eligibility + 014 trigger（本番ロジックそのまま）

### 使わない / 触らない

- mock 18 作品をデモ宇宙の正本にしない（混在はレビュー時に混乱）
- voice_adoption プレイヤー表示
- 通知センター増強
- ランキング・ witness 人数・作品詳細 witness

---

## 10. Seeder 設計

### 10.1 ファイル構成（案）

```
scripts/future-demo-lib.ts      # 定数、ユーザー解決、marker JSON
scripts/future-demo-seed.ts     # メイン seed
scripts/future-demo-verify.ts   # ペルソナ断言 + 件数チェック
```

npm scripts:

```
seed:future-demo:staging
verify:future-demo:staging
```

### 10.2 パターン（witness-sandbox 流用）

- `FUTURE_DEMO_TITLE_PREFIX = "[future-demo]"`
- `FUTURE_DEMO_MARKER` in `projects.description` — 全 userId / projectId JSON
- `--fresh`: 同名 prefix 作品を grants **前**のみ削除可能
- `--cleanup`: 可能範囲の teardown（grants append-only 注意）
- env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- 任意: `FUTURE_DEMO_*_USER_ID` で既存 UUID 再利用

### 10.3 認証情報（案）

メール: `{persona}@forge-future-demo.local`  
例: `player-b@forge-future-demo.local`, `developer-c@forge-future-demo.local`

パスワード: seed 実行時ログ出力 + `docs/future-demo-walkthrough.md` に固定記載（staging のみ）

**Demo 専用ユーザー: はい（8 人）**  
**Demo 専用プロジェクト: はい（5–6 本）**  
**Seeder: はい（CLI、service role）**

---

## 11. オーナー / レビュアー手順（実装後）

1. staging に seed 実行
2. `verify:future-demo:staging` PASS
3. ペルソナ表に従いログイン切替
4. 3 体験を下記順で目視
   - Player A → 空状態確認
   - Player B / C → tier + witness
   - Player D → プレイ履歴の厚み
   - Developer A → 投稿直後
   - Developer B → Devlog 連鎖
   - Developer C → release + reopen
   - Developer D → 長期開発
5. **UI 全面レビュー GO**（別フェーズ）

---

## 12. 実装フェーズとコスト見積もり

| Phase | 内容 | 工数（目安） |
|-------|------|--------------|
| **F0** | 本 doc GO + walkthrough 骨子 | 0.5 日 |
| **F1** | lib + 8 users + 6 projects 骨格 | 1–1.5 日 |
| **F2** | engagement seed（sessions, voice, devlogs） | 1.5–2 日 |
| **F3** | release events → grants 整合 + verify | 1 日 |
| **F4** | walkthrough doc + staging 目視 | 0.5–1 日 |

**合計: 4.5–6 日**（Cursor 一気通貫想定）

**MVP 短縮（3 日）**: Player B/C + Dev C + P2/P3/P5/P6 のみ — 体験2 優先。Player A 空状態 + Dev A は F1 で同時。

---

## 13. リスクと対策

| リスク | 対策 |
|--------|------|
| grants append-only で cleanup 困難 | prefix 作品は grants 前に `--fresh`。一度 grant 後は作品ごと残置 |
| seed 順序ミスで witness 不付与 | verify が A/B/C 件数 + grant_path を断言 |
| mock 18 と混在でレビュー混乱 | walkthrough に「デモ作品タイトル prefix で識別」と明記 |
| 本番誤 seed | **staging のみ** npm script 名に `:staging` 固定 |
| PLAYER_VISIBLE | adoption seed しても UI に出ない — 期待値を walkthrough に記載 |

---

## 14. In / Out（本テーマ）

**In**

- staging 将来像デモ
- 8 ペルソナ + 5–6 作品
- CLI seeder + verify
- 既存画面のみでの体験再現
- UI 全面レビューの前提

**Out**

- 本番 UX 変更、新ルート
- ランキング、通知追加、Adoption 表示
- PLAYER_VISIBLE=true
- 本番 DB seed（別判断）

---

## 15. オーナー判断依頼（GO 前）

1. **環境**: staging のみでよいか（本番デモアカウント要否）
2. **MVP 範囲**: 6 作品フル vs 4 作品短縮
3. **作品タイトル**: 上記案でよいか（世界観統一）
4. **mock 18**: レビュー時に非表示 / 混在許容のどちらか
5. **F0 GO** → 実装開始

---

## 16. 関連

- `scripts/witness-sandbox-lib.ts` — seeder パターン正本
- `lib/demo-setup.ts` — 現行 `/demo`（開発者 1 人 × 3 作品）
- `docs/player-play-history-design.md`
- `docs/witness-phase-w3-verification.md`
- `docs/official-release-design.md`
- `docs/forge-principles.md` — コアループ
