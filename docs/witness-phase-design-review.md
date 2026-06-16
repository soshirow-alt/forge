# 見届け人 Phase — 設計レビュー

**ステータス**: W1 判定 lib 完了（2026-06-16）— **W2 migration 014 は verify 結果確認後**  
**日付**: 2026-06-16  
**前提**: 正式版 Phase 1 staging GO（`013` 適用済み）

### オーナー確定（2026-06-16）

- **D（OR）GO** — A / B / C' のいずれか
- **C 不採用** — 1 プレイ + watch のみは軽すぎる
- **C' 採用** — watch + play session ≥ 2
- **W2** — W1 verify 後

### W1 成果物

| 項目 | 正本 |
|------|------|
| 判定 lib | `lib/witness-eligibility.ts` |
| staging verify | `npm run verify:witness:staging` |

### W2 成果物（草案 2026-06-16）

| 項目 | 正本 |
|------|------|
| migration | `supabase/migrations/014_project_witness_grants.sql` |
| 設計 doc | `docs/witness-phase-w2-migration.md` |

**状態**: **014 staging 適用済み** — W3 grant verify PASS

### W3 成果物

| 項目 | 正本 |
|------|------|
| grant verify | `npm run verify:witness:grants:staging` |
| sandbox seed | `npm run seed:witness:sandbox -- --fresh` |
| 検証 doc | `docs/witness-phase-w3-verification.md` |

**Out of scope（本 Phase でも触らない）**

- PLAYER_VISIBLE=true
- adoption 表示 ON
- 見届け人ランキング / 件数競争 UI
- 通知強化（バッジ獲得通知は Phase 4 で慎重に）

---

## 1. 見届け人の目的整理

### 1.1 何を証明するか

見届け人は **「この作品が正式版に到達するまで、開発中から関わっていた」** という **育成履歴上の事実** を、プレイヤー自身に静かに返すラベル。

Forge の narrative:

> **俺が育てたゲームが正式版になった**

正式版 Phase 1 で土台になったもの:

- `project_release_events` — 初回 `Released` の時刻が **終点**
- プレイ履歴サマリ — 「正式版到達を見届けた」（**付与前のプレビュー**、バッジではない）

見届け人バッジは、そのサマリ行を **条件付きで昇格** させるイメージ。

### 1.2 何を証明しないか

| NG | 理由 |
|----|------|
| 正式版当日にたまたま 1 回触った | 5 秒起動でも `wasActiveBeforeFirstRelease` は true になりうる |
| 声の質・採用率が高い人 | 件数競争・レビュー職人化（`docs/player-badges-design-review.md`） |
| 開発者本人 | 付与対象外（`actor_user_id` ≠ `user_id`） |
| Reopen 後の再 Released | **初回 Released のみ付与**、Reopen でも **剥奪しない**（確定） |

### 1.3 原典との接続

| 原典 | 見届け人 |
|------|----------|
| プレイヤーサイクル — 発見→プレイ→声→変化→再プレイ | 「開発中から関わった」= サイクルの **いずれか複数** が初回 Released 前に存在 |
| Discord は会話、Forge は版ごとの記録 | watch / 複数版プレイ / voice は **Forge 上に残る行為** |
| 件数競争 NG | 作品詳細「見届け人 N 人」ランキングは **Out** |

### 1.4 付与タイミング（確定済み）

- **トリガー**: 初回 `Released` イベント INSERT 時（または直後バッチ）
- **スナップショット**: 判定はすべて **`firstReleasedAt` 以前** の行のみ
- **Release Reopened**: 付与・剥奪ともに触らない
- **再 Released**: 二重付与しない（初回のみ）

---

## 2. 共通前提（全候補）

すべての案で **必須**:

1. **初回 Released より前** に関与（`firstReleasedAt` 以前のタイムスタンプで判定）
2. **開発者本人でない**（`projects.owner_id` 除外）
3. **最低 1 回プレイ**（`project_plays` または `project_play_sessions`）— ただし **これ単体では付与しない**（オーナー方針）

既存関数 `wasActiveBeforeFirstRelease` は **必要条件** のみ。見届け人には **追加条件** が要る。

---

## 3. 条件候補の比較

### 候補 A — 初回 Released 前に **2 バージョン以上プレイ**

**判定**: `project_play_sessions`（または plays + sessions）で `version_key` の **distinct count ≥ 2**、かつ各 session の `played_at ≤ firstReleasedAt`

| 長所 | 短所 |
|------|------|
| 「版を追った」= 伴走者 narrative と一致 | 開発者が版を出さないと誰も取れない |
| 1 回 5 秒プレイだけでは **原則不可**（2 版必要） | 開発者が細かく bump すると **形式上** 2 版は取りやすい |
| voice / watch 不要 — **追いかけ専門** を拾える | 1 版だけで深く関わった人（声多め）は **A だけでは不可** |

**Forge 整合**: ◎ — 再プレイ・変化を見るサイクルに直結

---

### 候補 B — 初回 Released 前に **1 プレイ以上 + 声 1 件以上**

**判定**: `project_voice_responses` で `created_at ≤ firstReleasedAt` が 1 件以上 + プレイあり

| 長所 | 短所 |
|------|------|
| 「共創参加」= 原典の **声を届ける** | **声を届けた人限定**になりうる — オーナー NG 方向 |
| 問いへの回答は 5 秒起動より摩擦大 | yes/no 1 タップでも **形式上** 1 声は可能 |
| DB 確定容易（006 済み） | watch のみで追っていた人は **対象外** |

**Forge 整合**: △ — 強いが **入口が狭い**

---

### 候補 C — 初回 Released 前に **1 プレイ以上 + watch**

**判定**: `project_watches.created_at ≤ firstReleasedAt` + プレイあり

| 長所 | 短所 |
|------|------|
| **追いかけ専門** を明示的に拾う | watch は **1 クリック** — 5 秒プレイ + watch でも成立 |
| 声が苦手な人も path あり | bookmark との差 — **watch のみ** が正（bookmark は「あとで」） |
| 002 migration 済み | 正式版直前の watch だけ — **関わりが浅い** |

**Forge 整合**: ○ — ただし **悪用耐性が最弱**

**実装時の強化案（C'）**: C に **プレイ session 2 回以上** を追加（同一 version でも可）→ 5 秒 1 回 + watch を弾く

---

### 候補 D — **A / B / C を OR で統合**

**判定**: `(A) OR (B) OR (C)` — いずれか 1  path 成立で付与

| 長所 | 短所 |
|------|------|
| オーナー意図 **両立** — 声なし追従 / watch 追従 / 版追従 | path ごとに **難易度が違う** — 最弱 path に寄る可能性 |
| 1 回プレイのみは **どの path でも不可**（A は 2 版、B/C は追加行為） | 条件説明が UI でやや長い |
| 将来 path 追加しやすい | 監査時「なぜ付与？」の説明用に **grant_reason** 列が欲しい |

**Forge 整合**: ◎ — **推奨**

---

### 比較サマリ

| 候補 | 追いかけ層 | 共創層 | 版追従 | 5 秒起動対策 | 実装 |
|------|-----------|--------|--------|-------------|------|
| A | △ | △ | ◎ | ◎ | ◎ |
| B | × | ◎ | △ | ○ | ◎ |
| C | ◎ | × | △ | △ | ◎ |
| **D** | **◎** | **◎** | **◎** | **○〜◎** | **◎** |

---

## 4. 想定ユーザー例

**作品**: だもんでとなもんでの冒険  
**初回 Released**: 2026-06-16T12:35:40Z

| ユーザー | 行動 | A | B | C | D | コメント |
|----------|------|---|---|---|---|----------|
| **太郎** | v0.1・v0.2 プレイ、声なし、watch なし | ✓ | ✗ | ✗ | ✓ | 版を追った典型 |
| **花子** | v0.2 のみ 1 回プレイ + 初声 1 件 | ✗ | ✓ | ✗* | ✓ | *watch なしなら C 不可 |
| **次郎** | v0.1 プレイ + 1 週間前から watch、声なし | ✗ | ✗ | ✓ | ✓ | 追いかけ型。C' なら session 2 回要検討 |
| **三郎** | 正式版当日、初めて 5 秒プレイのみ | ✗ | ✗ | ✗ | ✗ | **付与しない**（オーナー意図どおり） |
| **開発者** | 自分の作品 Released | ✗ | ✗ | ✗ | ✗ | owner 除外 |
| **四郎** | v0.1 プレイ + Reopen 後に v0.3 プレイ（初回 Released 前は v0.1 のみ） | ✗ | ✗ | △ | △ | **スナップショット** — 初回 Released 前の行だけ数える |
| **五郎** | watch のみ、プレイなし | ✗ | ✗ | ✗ | ✗ | プレイ必須で除外 |

**staging 実データ**: user `d05c457b-…` は `wasActiveBeforeFirstRelease` true（サマリ表示済み）— **D のどの path かは session / voice / watch 行を要確認**（付与 GO 前に witness 理由をログ出し推奨）。

---

## 5. 悪用パターン

| パターン | 成立しうる path | 深刻度 | 対策案 |
|----------|----------------|--------|--------|
| 5 秒起動 × 2 版（開発者が即 bump） | A, D | 中 | 版 bump は devlog 必須の既存文化に依存。将来 **session 時間** は Out（計測なし） |
| 5 秒起動 + watch クリック | C, D | 中〜高 | **C'**: session ≥ 2。または watch 開始から Released まで **≥ N 日**（例: 1 日） |
| 初声 yes/no 1 タップ + 5 秒プレイ | B, D | 低〜中 | 許容 — 初声完了は原典上コア。質で競わせない |
| サブ垢で witness 量産 | D | 低 | 1 user 1 project 1 grant。ランキングなし |
| 開発者と共謀で Released 前に bump 連打 | A | 低 | Forge 品質審査なし — **行為記録の信頼** で足りる |
| 正式版直前に watch 開始 | C | 中 | watch `created_at` が Released **直前 1 時間以内** は C 不可 — **過剰** なら Phase 2 で |
| Release Reopened で剥奪期待 | — | — | **剥奪しない**（確定）— 悪用ではない |

---

## 6. DB で判定可能か

**結論: 可能。** 追加 migration は **付与記録テーブル** が主。判定用データは揃っている。

### 6.1 正本タイムスタンプ

```sql
-- firstReleasedAt
SELECT created_at FROM project_release_events
WHERE project_id = $1 AND event_type = 'released'
ORDER BY created_at ASC LIMIT 1;
```

### 6.2 各 path のクエリ方針

| path | テーブル | 条件 |
|------|----------|------|
| プレイ存在 | `project_play_sessions` / `project_plays` | `played_at` or `created_at` ≤ firstReleasedAt |
| A: 2 版 | `project_play_sessions` | `COUNT(DISTINCT version_key)` where `played_at` ≤ firstReleasedAt ≥ 2 |
| B: 声 | `project_voice_responses` | `created_at` ≤ firstReleasedAt |
| C: watch | `project_watches` | `created_at` ≤ firstReleasedAt |

**注意**

- `project_plays` は upsert 1 行 — **版数は sessions 必須**
- voice は `prompt_id` 単位 unique — 1 版 1 初声が典型
- watch / bookmark 別物 — **witness に bookmark は含めない**

### 6.3 付与記録（新規 migration 014 案）

```text
project_witness_grants
  id uuid PK
  user_id uuid FK
  project_id text
  release_event_id uuid FK → project_release_events（初回 released 行）
  granted_at timestamptz
  grant_path text CHECK IN ('multi_version', 'voice', 'watch', 'manual')
  UNIQUE (user_id, project_id)  -- 初回のみ
```

- append-only（剥奪なし = DELETE しない）
- `grant_path` — 監査・UI「なぜ見届け人？」説明用
- 付与処理: **DB function on insert released** または **Edge / server action**（初回 released 判定後）

### 6.4 判定関数（コード案）

`lib/witness-eligibility.ts`（新規）:

- `getFirstReleasedEvent` — 既存
- `evaluateWitnessEligibility({ userId, projectId, firstReleasedAt, sessions, voices, watchCreatedAt, ownerId })`
- 返却: `{ eligible: boolean; path: 'multi_version' | 'voice' | 'watch' | null }`

---

## 7. バッジ実装まで含めたロードマップ

| Phase | 内容 | 依存 | オーナー Run |
|-------|------|------|--------------|
| **W0 設計** | 本 doc + 条件確定 | 正式版 GO | 条件 GO のみ |
| **W1 判定 lib** | `witness-eligibility.ts` + unit 的 verify スクリプト | W0 | 不要 |
| **W2 migration 014** | `project_witness_grants` + RLS + 付与 trigger | W1 | **Dashboard SQL** |
| **W3 付与ジョブ** | 初回 Released INSERT 時に eligible users を grant | W2 staging | staging verify |
| **W4 表示** | マイページ / プロフィールに「見届け人」バッジ（作品単位） | W3 | 目視 |
| **W5 横断 tier** | 見届け人 1/3/10 作品 — Bronze/Silver/Gold（`player-badges-design-review.md`） | W4 | 別判断 |
| **W6 作品詳細** | 「見届け人がいます」静的表示 — **人数ランキングなし** | W5 | 慎重 |

**プレイ履歴との関係**

- サマリ「正式版到達を見届けた」— **wasActiveBeforeFirstRelease** のみ（現状維持）
- バッジ付与後 — 同じ行に **見届け人** バッジアイコン or 文言追加（W4）

**Out（ロードマップ外）**

- 見届け人ランキング
- 剥奪 / 再付与
- PLAYER_VISIBLE

---

## 8. Cursor の推奨案

### 推奨: **候補 D（OR）+ C の軽い強化**

**付与条件（確定案として提案）**

初回 `Released` 時点で、開発者以外かつ **初回 Released 前に 1 回以上プレイ** があり、かつ **以下いずれか**:

| path | 条件 | grant_path |
|------|------|------------|
| **A** | distinct `version_key` ≥ 2（sessions, played_at ≤ firstReleasedAt） | `multi_version` |
| **B** | `project_voice_responses` ≥ 1（created_at ≤ firstReleasedAt） | `voice` |
| **C'** | `project_watches` あり（created_at ≤ firstReleasedAt）**かつ** play sessions ≥ 2 | `watch` |

**推奨理由**

1. オーナー NG の **1 回プレイのみ** を全 path で排除
2. **声だけ** / **watch だけ** も排除 — プレイは共通入口
3. A・B で **共創型・版追従型** をカバー
4. C' で **追いかけ型** を拾いつつ、5 秒 + watch 1 回を緩和
5. OR なので **Forge の幅広いプレイヤー** に合う
6. 既存 DB のみで判定可能 — 新規は grant テーブルのみ

**C を C' にしない場合**

- 実装は早いが、**最弱 path が C** になり、オーナー懸念（5 秒起動）に最も近い
- それでも B/A があるため **全面緩い** わけではない

### 推奨理由（原典）

- 「開発中ゲームを追いかける人」→ C' / A
- 「声を届ける人」→ B（必須化はしない）
- 「件数競争」→ 作品ごと 1 回付与、ランキング Out

### 懸念点

- path 難易度差 — UI で「見届け人の意味」を短文説明する必要
- 1 版しか出ない作品 — A 不可 → B or C' に依存
- staging witness ユーザー — path 別ログで事前確認推奨

---

## 9. オーナー判断（確定 2026-06-16）

1. **D（OR）GO**
2. **C 不採用** / **C' 採用**（watch + session ≥ 2）
3. **W2 migration 014** — W1 verify 後

---

## 10. W1 判定仕様（確定）

**正本コード**: `lib/witness-eligibility.ts`

### 最低条件

- 開発者本人でない
- 初回 `Released` イベントが存在
- `wasActiveBeforeFirstRelease` — 初回 Released **以前** にプレイ

### OR path（いずれか 1 つ以上）

| grant_path | 条件 | データ |
|------------|------|--------|
| `multi_version` | distinct `version_key` ≥ 2 | `project_play_sessions`（played_at ≤ cutoff） |
| `voice` | voice ≥ 1 | `project_voice_responses`（created_at ≤ cutoff） |
| `watch` | watch あり **かつ** session ≥ 2 | `project_watches` + `project_play_sessions` |

**複数 path 成立時**: primary = `multi_version` > `voice` > `watch`

**Out**: `project_plays` 単独行は path A/C' の session カウントに **含めない**（012 以降 sessions 正本）

### staging verify 結果（2026-06-16）

- 作品: だもんでとなもんでの冒険 — eligible **0**
- witness 候補 `d05c457b` — **不成立**（plays のみ、sessions=0、voice=0、watch=0）
- サマリ「正式版到達を見届けた」と witness 付与条件は **別**

---

## 11. 関連 doc

- `docs/official-release-design.md` — 付与タイミング・剥奪なし
- `docs/player-badges-design-review.md` — バッジ全体・tier
- `docs/player-play-history-design.md` — sessions 正本
- `docs/forge-principles.md` — プレイヤーサイクル
- `lib/project-release-state.ts` — `wasActiveBeforeFirstRelease`
