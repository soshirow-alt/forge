# 正式リリース初期版 — 配線修正プラン

**ステータス**: オーナー GO（2026-06-26）— **補正 GO**（REL-0-00 先行・REL-0-01 分割・RUN 判断追記）  
**ブランチ作業**: `preview/landing-01`（実装は本 doc の Issue 単位で進める）  
**停止中**: production deploy / main merge / `PLAYER_VISIBLE=true` / migration 適用（別 GO）

**関連**: `docs/forge-principles.md`（学習ループ・FB 公開方針）、`docs/out-of-scope.md`、`docs/preview-v0-gaps.md`、`docs/migration-015-020-pre-apply-review.md`

---

## 0. RUN 判断（オーナー 2026-06-26）

### [A] Run推奨 — Phase 0〜1 のコード修正（条件付き）

| 条件 | 内容 |
|------|------|
| ブランチ | `preview/landing-01` のみ |
| migration | **なし**（015〜020 はまだ Dashboard 適用しない） |
| main merge | **なし** |
| production deploy | **なし** |
| PLAYER_VISIBLE | **true 禁止**（false 明示維持） |
| **最初に** | **REL-0-00** 本番モード判定ヘルパー |
| mock 除去 | **本番モードのみ**。Preview 確認用 mock は残してよい |
| Coming Soon | mock データをコードに残してもよいが、**本番画面には出さない** |

### [C] 追加確認必須 — migration 015〜020

Dashboard 適用 GO は **まだ出さない**。適用前レビュー: `docs/migration-015-020-pre-apply-review.md`

### [D] まだ禁止

- production deploy  
- main merge  
- `PLAYER_VISIBLE=true`  

**解禁条件**: Phase 0〜1 が Preview で通過し、E2E 確認後（別 GO）。あわせて **REL-PRE-01**（lint 棚卸し）を production GO 前に実施。

---

## 1. オーナー GO — 初期版の表示・用語・外部リンク

### 1.1 「みんなの FB」タブ（旧: みんなの声）

| 項目 | 決定 |
|------|------|
| 初期版 | **非表示（中身を隠す）** — タブ項目は残してよい |
| UI | 各タブ内を **「追って機能追加予定」** 等のワッペン／プレースホルダで覆う（削除ではない） |
| 実作品 | 実集計・AI 集約・傾向・件数ができるまで **中身を出さない** |
| mock | 本番ビルドでは **mock FB 一覧を出さない** |
| 原典 | 個別 FB は公開しない。公開するなら集計・傾向・件数（→ レビューサイト化を避ける） |

**実装メモ**: `/games/[id]` の `voices` タブ（ラベルは既に「みんなのフィードバック」寄り）。`?tab=voices` 直リンク時も同じプレースホルダへ。

### 1.2 月間影響度ランキング

| 項目 | 決定 |
|------|------|
| 初期版 | **みんなの FB と同様** — サイドバー・URL は残し、**中身を隠す** |
| UI | 「追って機能追加予定」ワッペン。mock 順位表・「実データ集計」表示は本番で出さない |
| 後続 | migration 019 適用 + 実データ蓄積後に中身を開放（別 GO） |

### 1.3 用語 — 「声」→「FB」

| 項目 | 決定 |
|------|------|
| 方針 | 画面・ドキュメントを **徐々に FB に寄せる**（一括置換はしない） |
| 優先 | 触る Issue ごとにユーザー向け文言を FB に統一 |
| 残す | 原典・設計 doc 内の「初声」等の **概念名** は原典優先（UI copy とは分離） |

### 1.4 外部リンク — 優先度（Cursor 棚卸しの補正）

**必須寄り（初期版）**

1. Steam  
2. itch.io  
3. Discord  
4. **X**（GitHub より上）  
5. 公式サイト / 自由 URL  

**あるとよい**

6. **YouTube** — 専用アイコン推奨。最悪は自由 URL で代替可  
7. **GitHub** — OSS・技術系向け。一般ゲーム開発者では X より下  

**初期版で不要（out）**

- 各種 API 連携、OAuth 追加、キー配布、自動投稿  

**現状ギャップ**

| リンク | submit/edit | DB | 作品詳細表示 |
|--------|-------------|-----|--------------|
| Steam / itch / Discord / GitHub / 公式 | ✅ | ✅ | ✅ |
| X（作品） | ❌ | ❌ | ❌ |
| X（開発者） | onboarding のみ | `developer_profiles.x_account` | `/creators/[id]` は mock |
| YouTube | ❌ | ❌ | ❌ |

---

## 2. 分類の正本（4 段）

| 段 | 意味 | 本プランでの扱い |
|----|------|------------------|
| **①** | コア学習ループ必須 | Phase 1 中心 |
| **②** | 作品・開発者ページの信用 | Phase 2 中心 |
| **③** | 初期版に含むが順序は後 | Phase 3 |
| **④** | 明確に後回し | 本 doc では実装 Issue 化しない |

**RUN 方針（オーナー 2026-06-26）**: 本プラン確定後、**Supabase 永続化が必要な Issue を除き** ①② を順次 RUN 可。

---

## 3. フェーズ全体像

```
Phase 0 — リリース blocker・嘘表示の封じ（②法務 + 初期版 GO の非表示）
Phase 1 — コア学習ループ配線（①）
Phase 2 — 作品・開発者の信用（②）※ Supabase 新規 migration 含む項目あり
Phase 3 — 初期版周辺（③）※ 通報・共感・実績・ランキング本開放など
```

---

## Phase 0 — Issue 一覧（RUN 可・migration 不要）

> **実装順の正本**: **REL-0-00 を最初**。0-02〜0-07 はすべて本番モード判定に依存する。

### REL-0-00 本番モード判定ヘルパー（Phase 0 の土台） — ✅ 2026-06-27

| | |
|--|--|
| **旧 ID** | REL-1-01（Phase 1 から繰り上げ） |
| **分類** | ① 基盤 |
| **Supabase** | 不要 |
| **概要** | `isProductionReleaseMode()` 等 — **preview / local / production** の3態。REL-0-02〜0-07・Phase 1 以降の分岐正本 |
| **受け入れ** | 判定条件が doc 化されている。preview デプロイでは mock 挙動維持、本番モードでは mock 露出 off |
| **主なファイル** | `lib/production-mode.ts`（新規）, `lib/preview-v0.ts` |
| **依存** | なし（**最初に実装**） |
| **RUN** | ✅ **[A] 最優先** |

### REL-0-01 利用規約・プライバシーポリシー — 導線のみ

| | |
|--|--|
| **分類** | ② |
| **Supabase** | 不要 |
| **概要** | `/terms` `/privacy` ページ、登録・LP・auth フッターのリンク |
| **受け入れ（技術）** | 404 なし。登録 checkbox から遷移可 |
| **条文** | **確定済み**（2026-06-27 版）— 利用規約・プライバシーポリシーとも `components/*-document.tsx` |
| **本番公開** | 法務ページ本文は確定済み（REL-0-01 技術＋条文完了） |
| **主なファイル** | `app/terms/page.tsx`, `app/privacy/page.tsx`, `components/register-page.tsx`, `components/landing-page.tsx`, `components/auth-layout.tsx` |
| **RUN** | ✅ **[A] 技術のみ**（条文確定はオーナー） |

### REL-0-02 本番で preview 専用挙動を無効化

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | 本番モードで Studio ログインバイパス・`/`→`/home` を無効。preview では従来どおり |
| **受け入れ** | 本番モード: Studio 未ログイン → `/login`。preview: バイパス可 |
| **主なファイル** | `lib/preview-v0.ts`, `middleware.ts`, `components/studio-entry-gate-provider.tsx` |
| **依存** | **REL-0-00** |

### REL-0-03 本番で発見 mock 作品を混ぜない

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | 本番モードのみ `/home` `/search` の mock merge をスキップ。preview は mock 併用可 |
| **受け入れ** | 本番モード: mock ID のカードなし。実作品 0 件は空状態 |
| **主なファイル** | `components/discovery-home-page.tsx`, `components/works-search-page.tsx`, `lib/discovery-public-games.ts` |
| **依存** | **REL-0-00** |

### REL-0-04 PLAYER_VISIBLE=false の本番明示

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | 本番モードで採用 UI を出さない（未設定デフォルトを本番安全側に） |
| **依存** | **REL-0-00** |

### REL-0-05 実作品「みんなの FB」タブ — 中身を隠す

| | |
|--|--|
| **分類** | ②（GO 1.1） |
| **Supabase** | 不要 |
| **概要** | 本番モードで Coming Soon。mock コンポーネントは preview 用に残してよい |
| **依存** | **REL-0-00** |

### REL-0-06 月間影響度ランキング — 中身を隠す

| | |
|--|--|
| **分類** | ②（GO 1.2） |
| **Supabase** | 不要 |
| **概要** | 本番モードで Coming Soon。サイドバー項目は残す |
| **依存** | **REL-0-00** |

### REL-0-07 本番で mock 作品詳細プレイ導線を封じる

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | 本番モードで非 UUID `/games/[id]` を 404 等 |
| **依存** | **REL-0-00** |

---

## Phase 1 — Issue 一覧

> REL-1-01 は **REL-0-00 に統合済み**。Phase 1 は 1-02 から。

### REL-1-02 Studio 開発者導線の一本化

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | `/studio/mypage` の作品一覧を **実 owned projects**（`/studio` ホームと同ソース）に差し替え。mock `/studio/projects/[mockId]` は本番で非露出（404 or redirect） |
| **受け入れ** | ログイン開発者が自分の UUID 作品 → `/projects/[id]/studio` に到達。mock 作品カードが本番にない |
| **主なファイル** | `components/studio-projects-page.tsx`, `app/studio/projects/[id]/page.tsx`, `components/studio-owned-projects-section.tsx` |
| **RUN** | ✅ |

### REL-1-03 実作品詳細 — 統計の嘘をやめる（非表示）

| | |
|--|--|
| **分類** | ②（Phase 1 先行: 数字を出さない） |
| **Supabase** | 不要（集計実装は Phase 2-04 へ） |
| **概要** | `gameToDetailV0` の `witnessCount: 0` / `voiceCount: 0` を **UI に出さない**（「0」表示禁止） |
| **受け入れ** | 実作品サイドバーに嘘の 0 が並ばない。未実装はラベルごと非表示 |
| **主なファイル** | `lib/submitted-game-v0-adapter.ts`, `components/game-detail-v0-page.tsx` |
| **RUN** | ✅ |

### REL-1-04 実作品 — タグ由来「特徴」プレースホルダを出さない

| | |
|--|--|
| **分類** | ② |
| **Supabase** | 不要（永続化は REL-2-02） |
| **概要** | `features: tags.map(...「の特徴のひとつ」)` を実作品では **空 → セクション非表示** |
| **受け入れ** | 実作品概要にダミー特徴カードがない |
| **主なファイル** | `lib/submitted-game-v0-adapter.ts`, `components/game-detail-overview-v0-tab.tsx` |
| **RUN** | ✅ |

### REL-1-05 関連作品 — 空ならセクション非表示

| | |
|--|--|
| **分類** | ② |
| **Supabase** | 不要 |
| **概要** | 実作品 `relatedGames: []` のとき関連作品 UI を出さない。mock 関連は本番で到達不可（REL-0-07） |
| **受け入れ** | 空の関連作品グリッドが出ない |
| **主なファイル** | `components/game-detail-v0-page.tsx` |
| **RUN** | ✅ |

### REL-1-06 開発者フォロー — 本番で嘘トグルを出さない

| | |
|--|--|
| **分類** | ② |
| **Supabase** | **要（REL-2-05）まで UI 非表示 or disabled + 説明** |
| **概要** | 本番では localStorage フォローを **押せない**（「追って機能追加予定」or ボタン非表示）。preview は mock 可 |
| **受け入れ** | 本番でフォロー押下 → 永続しない状態が残らない |
| **主なファイル** | `components/game-detail-v0-page.tsx`, `components/creator-follow-button.tsx` |
| **RUN** | ✅（非表示のみ。永続化は REL-2-05） |

### REL-1-07 マイページ mock タブの整理

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 不要 |
| **概要** | 本番で **FB 履歴・実績・フォロー中** タブを Coming Soon 化、またはナビから外す（見届け・プレイ履歴・保存は実データのまま） |
| **受け入れ** | mock 数字・mock 開発者名が本番に出ない。コアループタブは生きている |
| **主なファイル** | `components/mypage-page.tsx`, `components/mypage-v0-extra-tabs.tsx` |
| **RUN** | ✅ |

### REL-1-08 通知 — コミュニティ join の localStorage 混在を本番で切る

| | |
|--|--|
| **分類** | ① |
| **Supabase** | 部分的（018 まで完全解消は REL-2-07） |
| **概要** | 本番通知一覧に **localStorage 由来の偽通知**をマージしない |
| **受け入れ** | 本番 `/notifications` は Supabase のみ（空なら空） |
| **主なファイル** | `components/notifications-v0-page.tsx` |
| **RUN** | ✅ |

---

## Phase 2 — Issue 一覧（①②の残り・多くが Supabase 要）

### REL-2-01 外部リンク — X / YouTube / 優先度整理

| | |
|--|--|
| **分類** | ② |
| **Supabase** | **要** — `projects` に `x_url`, `youtube_url`（migration 021 案） |
| **概要** | submit / edit / 表示で **Steam → itch → Discord → X → 公式 → YouTube → GitHub** の順。未設定は非表示。GitHub は後方 |
| **受け入れ** | 全経路で保存・表示一貫。ダミー URL を出さない |
| **主なファイル** | `components/submit-page.tsx`, `components/project-edit-page.tsx`, `lib/game-links.ts`, `components/game-external-links.tsx`, `lib/supabase/projects.ts` |
| **RUN** | ❌ migration GO 後 |

### REL-2-02 作品概要・見どころの Supabase 永続化

| | |
|--|--|
| **分類** | ② |
| **Supabase** | **要** — migration **022** 案（`projects.overview_introduction`, `projects.overview_features jsonb`） |
| **概要** | `description` は既存 `projects.description` のまま。localStorage `project-overview-v0-store` の **introduction + features** を DB 正本化。未設定は非表示 |
| **スコープ外** | `developerWorry` / `wantedVoices`（版ごと devlog 側） |
| **設計** | `docs/rel-2-02-project-overview-design.md` + `supabase/migrations/022_project_overview.sql`（草案） |
| **RUN** | ✅ アプリ実装済み（2026-06-27） |

### REL-2-03 開発者プロフィール `/creators/[id]` 実データ化

| | |
|--|--|
| **分類** | ② |
| **Supabase** | 不要（`developer_profiles` 既存） |
| **概要** | `CreatorPageClient` または同等をルートに接続。X・website リンク表示 |
| **主なファイル** | `app/creators/[id]/page.tsx`, `components/creator-page-client.tsx` |
| **RUN** | ✅ |

### REL-2-04 作品詳細統計の実数表示

| | |
|--|--|
| **分類** | ② |
| **Supabase** | 不要（集計クエリ既存テーブル） |
| **概要** | 見届け人・**FBした人**・devlog 更新を実集計。0 は非表示（REL-1-03） |
| **集計定義** | 見届け = `project_witness_grants` 件数（人数）。FB = `project_voice_responses` ∪ `project_feedback` の **distinct user_id**（投稿件数ではない）→ UI ラベル **「FBした人」** |
| **RUN** | ✅（集計のみ） |

### REL-2-05 開発者フォロー Supabase 化

| | |
|--|--|
| **分類** | ② |
| **Supabase** | **要** — `creator_follows` 等（migration 案） |
| **概要** | localStorage `followedCreators` 廃止 |
| **RUN** | ❌ |

### REL-2-06 コミュニティ完全 Supabase 化

| | |
|--|--|
| **分類** | ② |
| **Supabase** | **要** — **018 + 020** |
| **概要** | 参加・承認・コミュニティ名・投稿を DB 正本。localStorage join store は本番無効 |
| **RUN** | ❌ migration GO 後 |

### REL-2-07 最低限の通報導線

| | |
|--|--|
| **分類** | ③（初期版には含めるが Phase 2 末でも可） |
| **Supabase** | 要（`reports` テーブル案）or 外部フォーム |
| **RUN** | ❌ 設計 GO 後 |

---

## Pre-release — production GO 前 blocker 候補

### REL-PRE-01 ESLint 既存エラー棚卸し

| | |
|--|--|
| **分類** | リリース品質（コード変更必須ではないが GO 前に要対応） |
| **現状** | `npm run lint` — **71 errors**（2026-06-27 時点。直近 Feature 差分起因ではない） |
| **build** | `npm run build` は PASS — **開発続行は可** |
| **方針** | production GO 前にエラー一覧を分類（重大 / 警告扱い / ルール調整）。少なくとも **React hooks 規則違反・render 中 impure** 等の重大項は潰す |
| **確認** | `npm run lint` の error 件数を 0 に近づけるか、許容リストをオーナー GO |
| **RUN** | ❌ **production GO 前必須**（今すぐ全件修正は不要） |

---

## Phase 3 — 概要のみ（今回 Issue 化しない）

- みんなの FB タブ **本開放**（集計・AI 集約）
- 月間影響度ランキング **本開放**（019 + mock フォールバック削除）
- 共感・実績・FB 履歴タブ実データ化
- Studio 分析ダッシュボード・Studio 通知実装
- 公開範囲拡張（ログインのみ・招待・NDA）

---

## 4. Supabase migration 015〜020

**RUN 判断**: **[C] 追加確認必須** — Dashboard 適用 GO はまだ出さない。  
**レビュー正本**: `docs/migration-015-020-pre-apply-review.md`（テーブル / RLS / 影響 / 順序 / rollback / 確認手順）

| # | 内容 | 初期版での位置づけ | Phase 2 関連 Issue |
|---|------|-------------------|-------------------|
| **015** | `confirmation_requests` | ① 変化チェック | （既存実装あり・適用で本番有効化） |
| **016** | `developer_feedback_helpful_marks` | ③ / Studio 既存 | ランキング本開放時 |
| **017** | 確認依頼 targeting・通知型 | ① | 通知・変化チェック |
| **018** | communities / posts / memberships | ② | REL-2-06 |
| **019** | 影響度 RPC | ③（中身隠し中は未使用） | Phase 3 |
| **020** | `community_posts.title` | ② | REL-2-06 |

**新規 migration 案（Phase 2）**: 021 外部リンク（`x_url`, `youtube_url`）、**022 作品概要（GO 済・設計後 SQL 化）**、023 フォロー — 021 は migration GO 待ち。

---

## 5. RUN 順序（正本）

**[A] Phase 0〜1** — `preview/landing-01` のみ。migration / main / prod deploy なし。

```
REL-0-00  ← 最初（土台）
REL-0-02 → 0-03 → 0-04 → 0-05 → 0-06 → 0-07
REL-0-01  ← 0-00 と並行可（導線のみ・条文はオーナー）
REL-1-02 → 1-03 → 1-04 → 1-05 → 1-06 → 1-07 → 1-08
```

**並行可**: 0-01 と 0-00。0-05 と 0-06（Coming Soon 共通コンポーネント）。0-03 と 0-07。

**[A] Phase 2 のうち migration 不要**

```
REL-2-03 → 2-04  （Phase 0〜1 完了・Preview E2E 後でも可）
```

**[C] migration 015〜020** — レビュー読了 → オーナー適用 GO → Dashboard

**[D] 禁止中**: production deploy / main merge / PLAYER_VISIBLE=true

---

## 6. 完了の定義（Phase 0–1）

- [ ] **REL-0-00** 本番モード判定が全 Phase 0 Issue で一貫利用されている  
- [ ] 本番モードで mock 作品・mock FB・mock ランキング・嘘の 0 が見えない（preview では mock 確認可）  
- [ ] `/terms` `/privacy` 導線が動く（条文確定はオーナー別タスク）  
- [ ] preview バイパスが本番モードで無効  
- [ ] 開発者が実 UUID 作品の Studio に迷わず入れる  
- [ ] Preview 上で E2E 確認済み（[D] 解禁の前提）  
- [ ] コアループが実データ作品で一通り可能（確認依頼は 015+017 適用済み環境で別確認）  

---

## 7. オーナーアクション

| 誰 | こと |
|----|------|
| **オーナー** | 利用規約・プライバシー**条文確定**（REL-0-01 技術完了後・本番公開前必須） |
| **オーナー** | migration 015〜020 — `migration-015-020-pre-apply-review.md` 読了後に適用 GO |
| **Cursor** | **[A]** REL-0-00 先行 → Phase 0〜1 を `preview/landing-01` で実装 |
