# Forge P0 — 改善ループ検証 実装計画

**版**: 2026-06-16（事業 North Star 整合）  
**ステータス**: **GO**（オーナー承認済み）  
**目的**: 価値仮説「感想収集」ではなく **版ごとの学習ループ**（初声 → 次に直すこと → 改善 → 次版）を、開発者が実感できる最小体験で検証する。再プレイは **増幅指標** として副次に測る。

**判断の正本**:

- Studio は **旧 `/projects/[id]/studio` + `project-growth-state`** を軸に一本化する
- 新 `/studio/projects/[id]` v0 mock の拡張は **P0 では行わない**（リンク切替・リダイレクトのみ）
- 課金・ランキング・KPI ダッシュボード・BYOP・外部連携は **保留**
- 事業仮説・North Star: `docs/forge-business-hypothesis.md`

---

## 1. 検証したい仮説

| # | 仮説 | P0 で測ること | 事業指標 |
|---|------|----------------|----------|
| H1 | 開発者は「感想」ではなく **次に直すこと** を得られる | 7日以内に直す項目を1件以上言語化 / Studio 上で上位課題を採用 | **M3** |
| H2 | 直した後、プレイヤーが **戻ってくる**（増幅） | 版公開後、当該版の再プレイ人数（または再訪人数）が 1 以上 | 副次（North Star 非必須） |

**H2 の体験設計（2026-06）**: 単なる再プレイ通知ではなく **確認依頼 / 変化チェック**（任意入力・対象者選択）。正本は `docs/change-check-confirmation-loop.md`。

Forge の学習ループ（開発者側・コア）:

```
声を受け取る（初声）→ 次に直すことを決める → 改善・版公開・Devlog → 次版
```

再プレイ・変化を見るは **増幅**。H2 失敗でも H1/M1 が成立すれば P0 一部成功ありうる。

---

## 1.5 事業版 North Star（P0 との関係）

**正本**: `docs/forge-business-hypothesis.md`

P0 は **プロダクト実装の直近検証**。無料期間全体（半年〜1年）を P0 だけで測るものではない。  
P0 で作る Studio・初声・上位3課題は、事業 North Star の **M1・M3 の先行計測** になる。

### 事業 North Star（一文）

プレイしたプレイヤーのうち、十分な割合が「版に紐づく初声」を残し、  
その声が開発者の優先順位決定に使われるか。

### 分解指標と P0 の対応

| ID | 指標 | P0 での扱い | P0 での測り方 |
|----|------|-------------|---------------|
| **M1** | プレイ→初声率 | **主要** | `project_play_sessions` × 初声完了。staging 手動集計可 |
| **M2** | 初声→参考になった率 | **Out（P1）** | 開発者 FB 評価 UI は初期版対象だが P0 実装外 |
| **M3** | 初声→次に直すこと決定率 | **主要（=H1）** | 上位3表示 + 7日以内言語化インタビュー |
| **M4** | 決定→実改善率 | **定性** | 次版公開・devlog をシナリオで確認（P0-3） |
| **H2** | 再プレイ人数 | **副次・増幅** | P0-4 / migration 015。North Star 失敗でも学習ループ単体の価値は残りうる |

### Good レビューとの関係

P0 の主眼は **初声と意思決定（M1/M3）**。Good レビュー（開発者に有益な1回の声）は M2 + 定性で判定。  
スーパーレビュアー指標は P0・無料期の主 KPI にしない。

### 無料期間との接続

リリース後 半年〜1年の無料期間は、売上放棄ではなく **M1〜M4 の因果証明期間**。  
P0 完了後も同じ North Star で計測を継続する（ダッシュボード化は P1 以降）。

---

## 2. P0 スコープ（In / Out）

### In（この計画の唯一の実装範囲）

| # | 項目 | 完了の定義 |
|---|------|------------|
| P0-1 | **Studio 一本化** | 開発者の「1作品の作業画面」が growth-state 実装1本に集約される |
| P0-2 | **上位3課題** | 現行版向けに、根拠付きで最大3件の「次に直すこと」が Studio に表示される |
| P0-3 | **Devlog / 版公開** | 既存フローが Studio 正本画面から完結する（新規 mock 不要） |
| P0-4 | **版単位の再プレイ（または再訪）人数** | 版公開後、開発者が Studio で人数を確認できる（精度不要） |

### Out（明示的に保留）

- S-20 polish、S-23、Player/Studio ランキング
- KPI ダッシュボード、分析画面
- 課金、Validation Pack、BYOP
- Discord / Steam Playtest 連携
- S-22 v0 5タブの新規実装、T03 フル AI ダッシュボード
- voice_adoptions 本番自動化（P1）
- 採用候補の永続 DB（P1 で検討）

---

## 3. 現状資産（再利用するもの）

| 資産 | パス / テーブル | P0 での役割 |
|------|-----------------|-------------|
| 育成スナップショット | `lib/project-growth-state.ts` | ループ状態・CTA・フェーズ表示 |
| Studio 正本 UI | `components/project-studio-page.tsx` | **P0 の画面本体** |
| 育成サイクル UI | `components/game-growth-cycle.tsx` | 声を見る / 修正 / devlog / 公開 |
| 版・正式版パネル | `components/project-release-studio-panel.tsx` | 版公開・Released（既存） |
| 声集計 | `fetchOwnerVoiceAggregates` + `lib/voice-aggregates.ts` | 上位3課題の入力 |
| 深い FB | `project_feedback` | バグ・懸念の課題抽出 |
| プレイセッション | `project_play_sessions`（migration 012） | 版単位プレイ記録 |
| プレイ記録 | `games-provider.recordPlay` | `context: new_version` 付与済み |

### 現状ギャップ（P0 で埋める）

| ギャップ | 影響 |
|----------|------|
| `/studio/projects/[id]` が mock の6タブ | 開発者が仮説検証できない |
| 上位課題の明示 UI がない | H1 未検証 |
| **オーナーが他ユーザーの play_sessions を読めない**（RLS） | H2 未検証 |
| `/games/[id]` が v0 mock プレイ | preview では `recordPlay` が走らない可能性 |

---

## 4. 実装ワークストリーム（推奨順）

### WS1 — Studio 一本化（P0-1）

**方針**: 実装の正は **`/projects/[id]/studio`**。新 Studio のプロジェクト詳細は **リダイレクトまたは薄い委譲**のみ。

| タスク | 内容 |
|--------|------|
| 1.1 | `app/studio/projects/[id]/page.tsx` → `redirect(/projects/[id]/studio)` |
| 1.2 | `lib/studio-projects-v0-mock-data.ts` の `href`、S-21 カード、`studio-home` の「開く」→ `/projects/{id}/studio` |
| 1.3 | 通知 deep link（`lib/project-nurture-links.ts` / `user_notifications` 遷移先）が studio 正本に向くことを確認 |
| 1.4 | `components/player-shell.tsx` の Studio ボタンは `/studio` ホームのまま可。作品作業は常に旧 studio |
| 1.5 | S-20 `/studio` に **帯表示**（任意）: 「作品の改善ループは作品 Studio から」+ 未処理声がある作品へのリンク |

**触らない**: `studio-project-detail-page.tsx` の大規模改修（凍結）。

**受け入れ基準**:

- 開発者が S-21 / S-20 から作品を開くと **`/projects/[id]/studio`** に着地する
- growth-state・GameGrowthCycle・既存 devlog/版 UI がそのまま使える

---

### WS2 — 上位3課題（P0-2）

**方針**: **AI なし・ルールベース**。既存集計 RPC と深い FB から抽出。T03 フルダッシュボードは P1。

#### 2.1 抽出ロジック（新規 `lib/top-priorities.ts`）

優先度付きキュー（最大3件）:

| 順位 | ソース | ルール例 |
|------|--------|----------|
| 1 | `project_feedback.bugs` あり | 件数降順。ラベル「バグ報告」 |
| 2 | `project_feedback.concerns` あり | 件数降順。ラベル「気になる点」 |
| 3 | voice 集計 `scale_3` / `choice` | ネガティブ回答比率が高いプロンプト（`interpretVoiceAggregate` 再利用） |
| 4 | voice 集計 全体 | `totalResponses` 最大プロンプトの最多バケット |
| 5 | 未読声 | `pendingFeedbackCount > 0` 時のみフォールバック「新しい回答を確認する」 |

各項目に付与:

- `title`（短い課題文）
- `reason`（例: 「同趣旨の報告 4件」）
- `href` または `action`（`#feedback` パネルへ）

#### 2.2 UI 配置

| 場所 | コンポーネント |
|------|----------------|
| Studio ヘッダー直下 | 新規 `components/studio-top-priorities-card.tsx` |
| または GameGrowthCycle 上 | `project-studio-page.tsx` に挿入 |

表示例:

```
次に直すこと（上位3）
1. チュートリアルが長い — 初声で同趣旨 5件
2. 分岐で進行不能 — バグ報告 2件
3. マップが分かりにくい — 「気になる点」3件
```

**受け入れ基準**:

- 声が0件のときは空状態（「回答を待っています」）
- 声があるとき、開発者インタビューで「次に何を直すか」を **画面を見ずに言える** 粒度

---

### WS3 — Devlog / 版公開（P0-3）

**方針**: **新規実装なし**。WS1 で正本画面に集約されたうえで、既存導線の **E2E 確認と欠けの修繕のみ**。

| タスク | 内容 |
|--------|------|
| 3.1 | GameGrowthCycle 内 devlog 作成・公開が動くこと（staging） |
| 3.2 | 版公開（playableVersion 更新 + `version_published` 通知）が動くこと |
| 3.3 | プレイヤー P-06（または legacy 詳細）で devlog / 新版バナーが見えること |
| 3.4 | 通知 `voice_received` → studio `#feedback`、版公開通知 → ゲーム詳細 |

**受け入れ基準**:

- 1サイクル: 声受領 → devlog 下書き → 版公開 → プレイヤー側で変化が見える

---

### WS4 — 版単位の再プレイ人数（P0-4）

**方針**: まず **再プレイ人数** を採用（`project_play_sessions` の `context` と版履歴から算出）。再訪は P1。

#### 4.1 指標定義（P0）

**再プレイ人数（採用）**:

> 当該 `version_key` でプレイしたユニークユーザー数のうち、**同一 `project_id` でより古い `version_key` のセッションを過去に持つ**ユーザー数

補助表示（任意）:

- **この版のプレイ人数**: 当該版の `COUNT(DISTINCT user_id)`（再訪の近似）

#### 4.2 DB（migration 015 — 要 Dashboard 手動適用）

新規 RPC（SECURITY DEFINER）:

```sql
-- 案: get_owner_version_play_stats(p_project_id text)
-- 返却: version_key, total_players, replay_players, published_after (nullable)
-- 条件: projects.owner_id = auth.uid()
```

- RLS: 現行 `project_play_sessions` は本人 SELECT のみ → **オーナー集計は RPC 必須**
- `docs/supabase-dashboard-migration-guide.md` 手順に従う

#### 4.3 アプリ

| ファイル | 変更 |
|----------|------|
| `lib/supabase/play-sessions-db.ts` | `fetchOwnerVersionPlayStats` 追加 |
| `hooks/use-owner-version-play-stats.ts` | 新規 |
| `components/studio-version-replay-stats.tsx` | 新規 — 現行版 + 直近1〜2版の再プレイ人数 |
| `project-studio-page.tsx` | 版公開ステップ付近に配置 |

表示例:

```
v0.4.0（公開後）
再プレイ 3人 / この版のプレイ 5人
```

#### 4.4 プレイ記録の接続（検証環境）

| 環境 | 対応 |
|------|------|
| staging / future-demo | 既存 `game-detail-page-client` + `recordPlay` — 確認のみ |
| preview v0 | **P0 検証時は staging を正**とする。または v0 プレイ stub から `recordPlay` を呼ぶ最小配線（1タスク） |

**受け入れ基準**:

- 版公開後、テスター2人以上が再プレイすると Studio に **再プレイ ≥1** が表示される
- 精度・ユニーク判定の厳密さは問わない

> **migration 015 は H2（再プレイ）用。事業 North Star の必須条件ではない。**  
> M1/M3 の検証が進んでから GO してもよい（オーナー×GPT 判断）。

---

## 5. 実装フェーズと工数目安

| フェーズ | 内容 | 目安 | 依存 |
|----------|------|------|------|
| **Phase A** | WS1 Studio 一本化 | 0.5〜1日 | なし | **完了** |
| **Phase B** | WS2 上位3課題 | 1〜1.5日 | Phase A | **完了** |
| **Phase C** | WS4 RPC + UI（migration 015） | 1〜1.5日 | Phase A | **GO 待ち** — SQL 案: `docs/forge-p0-migration-015-draft.sql` |
| **Phase D** | WS3 E2E 修繕 + プレイ記録接続 | 0.5〜1日 | A〜C |
| **Phase E** | staging 検証 + 3〜5人開発者テスト | 1週間（並行） | D |

**合計実装**: 約 **3〜5 Cursor セッション**（UI 新規はカード2枚 + リダイレクト中心）

---

## 6. 検証手順（オーナー / 開発者テスト）

### 6.1 準備

- staging 環境 + migration 012 済み + **015 適用**
- テスト用作品 1つ、テスター 2〜3人（Discord 等で URL 共有 — BYOP ではなく手動配布で可）

### 6.2 シナリオ（1サイクル）

1. テスターが版 v0.3 をプレイ → 声（初声 + 深いFB）を送る  
2. 開発者が `/projects/{id}/studio` を開く → **上位3課題**を確認 → 直すことを決める  
3. 開発者が修正（ゲーム外）→ Devlog 下書き → **版 v0.4 公開**  
4. テスターに新版 URL を共有 → 再プレイ  
5. 開発者が Studio で **再プレイ人数** を確認  

### 6.3 KPI

| KPI | 目標（仮） | 種別 |
|-----|------------|------|
| M1 プレイ→初声率 | パイロット作品で **≥20%**（仮・後置き） | 事業 North Star |
| M3 課題言語化率 | 参加開発者の 2/3 以上が 7日以内に「次に直すこと」を1件以上言える | = M3 |
| H2 再プレイ発生率 | 版公開後、少なくとも1作品で再プレイ人数 ≥1 | 副次・増幅 |
| M2 参考になった率 | P0 対象外 | P1 |
| ループ完走 | 3人中1人以上が 1サイクル完走 | 統合シナリオ |

### 6.4 インタビュー質問（短）

- 上位3は「決めやすかったか」／「外れていたか」
- Discord だけより優先順位が付けやすかったか
- 再プレイ人数を見て「戻ってきた」と感じたか

---

## 7. リスクと切り戻し

| リスク | 緩和 |
|--------|------|
| migration 015 が本番未適用 | staging のみで検証。RPC なし時は UI に「データ準備中」 |
| v0 プレイが記録されない | **検証は staging + legacy 詳細を正**と明記 |
| 上位3が外れる | P1 で採用候補マーク。P0 はルールベースで許容 |
| 旧 studio の UI が Player v0 と乖離 | P0 では見た目統一しない。機能検証優先 |

---

## 8. 完了後のドキュメント更新

- `docs/forge-screen-definition.md` — S-22 P0 正本 URL を `/projects/[id]/studio` と明記
- `docs/forge-changelog.md` — P0 完了エントリ
- `docs/forge-handoff.md` — P0 完了 → P1 へ
- `docs/player-play-history-design.md` §1.4 非ゴール — **P0 検証期間のみ**オーナー向け再プレイ人数を例外と注記

---

## 9. P1 への接続（参考・今回やらない）

- S-22 v0 を P-06 編集モードとして再実装（見た目統一）
- T02 採用候補の DB 化
- voice_adoptions 本番接続
- 版間比較グラフ
- Player v0 プレイ → `recordPlay` 本番接続

---

**本計画が P0 実装の正本である。** Cursor は Phase A から順に着手する。migration 015 適用前に Run 判断用メモを出す。
