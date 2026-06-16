# プレイ履歴 — 設計（正本）

**ステータス**: Phase 1 実装（2026-06-16）  
**セクション名**: **プレイ履歴**（オーナー確定。「育てた記録」にはしない）

---

## 0. なぜ今か

labeled 60 / shadow A/B / matcher 本番 GO / Phase3 完了までで **「声 → 変化 → 確かめる」骨格** はできた。

次のボトルネックは精度検証ではなく **開発速度**。Forge が残すべき価値は:

> **俺がこのゲームを育てた**

を後から辿れること。これは **見届け人・伴走者・育成者・正式版** の共通正本になる。

---

## 1. コンセプト

### 1.1 プレイ履歴は「回数カウンタ」ではない

| NG（避ける） | OK（目指す） |
|--------------|--------------|
| プレイ回数 12 | **いつ** 版 0.3 を遊んだか |
| 作品名のフラット一覧のみ | **どんな声** を届けたか |
| Steam 的プレイ時間 | **どんな変更** を見届けたか |
| ランキング・比較 | **自分だけ** の育成の軌跡 |

### 1.2 「俺がこのゲームを育てた」の可視化

プレイヤーがマイページ（または作品別詳細）で見るのは **時系列の育成ログ**:

```text
2026-06-10  版 0.2 をプレイ
2026-06-11  「テンポが悪い」と声を届けた
2026-06-15  開発者が devlog を公開（序盤調整）
2026-06-16  版 0.3 をプレイ — 変化を確かめに行った
2026-06-16  「UI説明が分かりにくい」→ 今回の更新に反映（PLAYER_VISIBLE ON 後）
```

**中心メタファー**: 日記 / 育成ログ — ゲームごとの **自分の章**.

### 1.3 原典との対応

| 原典（プレイヤーサイクル） | 履歴での表現 |
|---------------------------|--------------|
| 発見 | 初回プレイ or 初回 watch（任意・後追い） |
| プレイ | **play_session** イベント |
| 声を届ける | **voice_response** イベント（版紐づけ） |
| 変化を見る | **devlog_published** / **version_bump** 認知 |
| 再プレイ | 新版での **play_session** |
| 声が反映された | **voice_adoption** イベント（表示 GO 後） |

原典 §プレイヤーサイクル — Forge は **版ごとの問い・育成の記録** を Discord と差別化する。履歴はその **正本 UI**。

### 1.4 非ゴール（MVP Out）

- プレイ時間・セッション長
- 他プレイヤーとの比較
- 開発者 Studio の「あなたのプレイ回数」
- ランキング・バッジ付与（バッジは別テーマ・履歴がデータ正本）

---

## 2. 現状ギャップ

### 2.1 `project_plays`（002）

```sql
primary key (user_id, project_id)  -- 1 作品 1 行のみ
created_at                          -- 初回プレイ日時のみ
-- version_key なし
```

- `recordPlay` は **upsert** — 再プレイ・新版プレイが **上書きされない／記録されない**
- `hasPlayedGame` は boolean 相当 — **履歴として使えない**
- マイページ「最近プレイした」= 作品 ID リスト（**日時・版なし**）

### 2.2 既に存在するが履歴に未接続

| データ | テーブル | 版 |
|--------|----------|-----|
| 声 | `project_voice_responses` | `version_key` あり |
| 深い FB | `project_feedback` | `version_key` あり |
| 採用 | `voice_adoptions` | `voice_version_key`, `published_version` |
| 更新 | `project_devlogs` | `published_version` |
| 追跡 | `project_watches` | 開始日のみ |

**課題**: 横断タイムラインがない → **イベント合成** がプレイ履歴の核心。

---

## 3. DB 設計

### 3.1 方針

1. **追記のみ**（Append-only）— 育成履歴は消さない（正式版 Reopen と同じ思想）
2. **既存テーブルは活かす** — voice / adoption / devlog はそのまま正本
3. **新規は「プレイセッション」** — 今の `project_plays` を拡張せず **sessions テーブル** を追加
4. **タイムラインはビュー or アプリ合成** — MVP はアプリ側 JOIN（migration 1 本に抑える）

### 3.2 新規: `project_play_sessions`（migration 012 案）

```sql
create table public.project_play_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  version_key text not null,           -- プレイ時点の playable_version
  played_at timestamptz not null default now(),
  context text not null default 'general'
    check (context in ('general', 'adoption_verify', 'new_version')),
  adoption_id uuid null references public.voice_adoptions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_play_sessions_user_project_idx
  on public.project_play_sessions (user_id, project_id, played_at desc);

create index project_play_sessions_user_played_idx
  on public.project_play_sessions (user_id, played_at desc);
```

| 列 | 意味 |
|----|------|
| `version_key` | **どの版を遊んだか**（記録時点の `projects.playable_version`） |
| `context` | 通常 / Phase3 adoption 経由 / 新版バナー経由 |
| `adoption_id` | Phase3「変化を確かめる」経由時（nullable） |

**RLS**: SELECT/INSERT 自分のみ（既存 engagement と同型）。

### 3.3 `project_plays` の扱い

| 案 | 採用 |
|----|------|
| A. 削除 | × 既存 hasPlayedGame 依存 |
| B. **残す + sessions 追加** | **◎ MVP** |

- `recordPlay` → **`project_play_sessions` に INSERT** + `project_plays` upsert（後方互換）
- `hasPlayedGame` → 当面 `project_plays` のまま（後で EXISTS sessions に移行可）

### 3.4 タイムラインイベント型（アプリ層）

DB 新規テーブルは **play_sessions のみ**。他は既存行をイベントにマップ:

| event_type | ソース | 表示ラベル例 |
|------------|--------|--------------|
| `play` | `project_play_sessions` | 版 {v} をプレイ |
| `voice` | `project_voice_responses` | 「{quote}」と声を届けた |
| `adoption` | `voice_adoptions` active | 「{summary}」が反映された（visible GO 後） |
| `devlog` | `project_devlogs` where published_version not null | devlog タイトル / 新版公開 |
| `feedback` | `project_feedback` | 深い感想を送った（任意・MVP 後半） |

**合成ルール**

- 同一 `project_id` 内で `occurred_at` 降順
- `voice` は `created_at`、`play` は `played_at`、`devlog` は `published_at ?? created_at`
- adoption は `PLAYER_VISIBLE=false` 中は **UI に出さない**（データは DB にあっても履歴 UI から除外）

### 3.4.1 「◯回更新を見届けた」の現行定義（Phase 1 実装）

**現状は A でも B でもない。**

| 案 | 意味 | Phase 1 |
|----|------|---------|
| A | プレイ後に devlog が公開された | ×（プレイ前後は見ない） |
| B | devlog 公開後に再プレイした | ×（再プレイは見ない） |
| **現行** | プレイした作品について `published_version` あり devlog の **件数** | **◎** |

実装: `lib/player-play-timeline.ts` — `updateWatchCount = devlogs.filter(publishedVersion).length`

- ユーザーの再プレイ・版一致は **未判定**
- タイムラインの devlog 行も同じ（公開イベントをそのまま表示）
- 原典の「変化を見る → 再プレイ」に近づけるなら **将来 B へ寄せる** 論点（Phase 2 以降）

### 3.5 将来拡張（012 に含めない）

- `project_release_events`（正式版）— `docs/official-release-design.md`
- バッジ獲得イベント — バッジテーブルから JOIN
- `first_discovered_at` — watch / 初回 play から導出

---

## 4. UI 案

### 4.1 配置（MVP）

**主**: `/mypage` — セクション **「プレイ履歴」**（`#play-history`）

- 既存「最近プレイした」カードは **段階的に置換**（または統合）
- 作品単位に折りたたみ **タイムライン**

**副**: `/games/[id]` — ログイン本人のみ **「あなたとこの作品」** コンパクト（任意・Phase 1b）

### 4.2 マイページ — 作品単位カード（ワイヤー）

```text
┌─────────────────────────────────────────────────┐
│ 育てた記録                                        │
├─────────────────────────────────────────────────┤
│ ▼ 消えるかな？                                    │
│   2026-06-16  版 0.6 をプレイ                     │
│   2026-06-15  「UI説明が…」と声を届けた（v0.5）    │
│   2026-06-14  新版 0.6 が公開 — shadow-b 序盤調整  │
│   2026-06-10  版 0.4 をプレイ（はじめて）          │
│   [ 作品を見る → ]                                │
├─────────────────────────────────────────────────┤
│ ▶ 別の作品…                                       │
└─────────────────────────────────────────────────┘
```

**コピー原則**

- プレイヤー語彙: 「育てた」「声を届けた」「変化を見た」
- 開発者語彙「FB」「devlog」は補助表示のみ
- adoption 行は **PLAYER_VISIBLE=true 以降** のみ

### 4.3 「俺が育てた」の強調

作品カード上部に **1 行サマリ**（自動生成・LLM 禁止）:

```text
3回プレイ
2回声を届けた
1回更新を見届けた
最初のプレイから42日
```

- 数値は **事実のみ**（sessions / voices / devlogs count）
- 「反映 ○ 回」は visible GO 後に追加

### 4.4 Empty state

```text
まだ育てた記録がありません。
作品を見つけて、プレイして、声を届けましょう。
[ 作品を探す ]
```

---

## 5. 実装フェーズ

### Phase 1（Cursor 次スプリント）

1. migration 012 `project_play_sessions`
2. `recordProjectPlaySession()` + `recordPlay` 改修（INSERT session + upsert plays）
3. `fetchPlaySessionsForUser` / タイムライン合成 lib
4. マイページ **育てた記録** セクション（play + voice + devlog。adoption は visible gate）
5. build + `docs/player-play-history-verification.md`

### Phase 1b

- 作品詳細「あなたとこの作品」
- `context` / `adoption_id` on session（Phase3 連携）
- 深い FB をタイムラインに

### Phase 2

- 正式版イベント統合
- バッジデータソース接続

**matcher 本番確認を待たない** — sessions INSERT は play ボタンだけで独立。

---

## 6. Forge 原典整合チェック

| 原典 | 整合 |
|------|------|
| コアループ強化 | ◎ 育成の記録が残る |
| 送客サイトにならない | ◎ Forge 上にプレイ・声・版が残る |
| localStorage 禁止 | ◎ Supabase のみ |
| ランキング NG | ◎ 自分の履歴のみ |
| バッジ MVP Out | ◎ 履歴はバッジの前提データのみ |
| PLAYER_VISIBLE 分離 | ◎ adoption 行は gate |

---

## 7. リスク

| リスク | 対策 |
|--------|------|
| イベント重複表示 | 型ごとに 1 ソース。同一秒の play+voice は両方出す（事実） |
| `project_plays` 二重管理 | MVP は upsert 維持。将来 sessions のみ |
| 履歴が空 | 既存ユーザーは **次回プレイから** session 蓄積。過去は voice/devlog のみ表示 |
| adoption 非表示中に履歴が薄い | 想定内。visible GO で adoption 行追加 |

---

## 8. オーナー確認論点

1. セクション名 **「プレイ履歴」** — **確定**（シンプルさ優先）
2. 過去プレイのバックフィル — **しない** — **確定**
3. devlog 行 — **プレイした作品のみ** — **確定**
4. 作品詳細コンパクト履歴 — **Phase 1b** — **確定**

---

## 9. 関連 doc

- `docs/forge-principles.md` §プレイヤーサイクル
- `docs/official-release-design.md`
- `docs/player-badges-design-review.md`
- `docs/voice-adoptions-matcher-prod-go.md`
