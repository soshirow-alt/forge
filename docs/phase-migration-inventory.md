# projects.phase 移行棚卸し

> **ステータス**：移行準備ドキュメント（未実施）  
> **最終更新**：2026-06-13  
> 本番 DB の一括 UPDATE は**まだ不要**。UX は `normalizePhase` で担保済み。

---

## 1. 現状

| 項目 | 状態 |
|------|------|
| 正規4名称 | 試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中 |
| 投稿フォーム | 新4名称のみ保存（ラジオ必須） |
| 表示 | `displayPhase` / `normalizePhase` で旧文字列を正規化 |
| 発見フィルタ | 新4チップ + legacy fuzzy マッチ（`discovery-filters.ts`） |
| DB `projects.phase` | `text not null`、制約なし（001 migration） |
| DB `projects.status` | phase と別列。テスター募集時は「テスター募集中」、それ以外は phase と同値で保存 |

**技術的負債**：DB に旧文字列が残ると、将来 fuzzy 削除・CHECK 追加・分析クエリ時に混乱する。表示は問題ない。

---

## 2. phase 値一覧

### 2-A. mock 18作品（コード上・移行済み）

| phase 値 | 件数 |
|----------|------|
| 試作版 | 6 |
| プレイ可能版 | 7 |
| 通しプレイ版 | 6 |
| **合計** | **18**（すべて正規値） |

mock に **公開準備中** のサンプル作品は現時点なし。

### 2-B. demo-setup（Supabase デモ3作品の投入定義）

| 作品 | phase |
|------|-------|
| 星詠みの廃都 | 試作版 |
| ネオン・アーカイブ | 試作版 |
| 群青の境界 | プレイ可能版 |

※ `/demo` を**再実行していない**本番 DB には、旧コード時代の `プロトタイプ` / `α版` が残っている可能性あり。

### 2-C. コードが想定する legacy 値（過去 mock / 旧投稿フォーム / 手動）

| 旧値（例） | 出所 |
|------------|------|
| プロトタイプ | 旧投稿フォーム4択 |
| 開発中 | 旧投稿フォーム4択 |
| テスト版 | 旧投稿フォーム4択 |
| 公開準備 | 旧投稿フォーム4択（「中」なし） |
| α版 / クローズドα版 / オープンα版 | 旧 mock・業界語 |
| β版 | 旧 mock・業界語 |
| 試作版 | 旧 mock（正規値と同一） |
| 企画段階 | 旧 mock |
| 初期開発 | 旧 mock |
| 公開間近 | fuzzy マッチのみ（mock 未使用） |
| Early Access / alpha / beta | 英語表記（normalize 対応、DB 未確認） |

### 2-D. 本番 Supabase `projects.phase`（要オーナー確認）

Cursor から本番 DB は参照できない。**実施前に Dashboard で以下を実行**：

```sql
SELECT phase, COUNT(*) AS cnt
FROM public.projects
GROUP BY phase
ORDER BY cnt DESC, phase;

SELECT id, title, phase, status, created_at
FROM public.projects
WHERE phase NOT IN (
  '試作版', 'プレイ可能版', '通しプレイ版', '公開準備中'
)
ORDER BY created_at DESC;

SELECT status, COUNT(*) AS cnt
FROM public.projects
GROUP BY status
ORDER BY cnt DESC;
```

---

## 3. 推奨マッピング表

`normalizePhase` と整合。SQL UPDATE はこの順序で適用する。

| 旧 phase 値 | 新 phase 値 | 備考 |
|-------------|-------------|------|
| 試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中 | 同左 | 変更不要 |
| プロトタイプ | 試作版 | 旧フォーム |
| 企画段階 | 試作版 | 旧 mock |
| 初期開発 | 試作版 | 旧 mock |
| 開発中 | プレイ可能版 | 旧フォーム |
| α版 / クローズドα版 / オープンα版 | プレイ可能版 | |
| Early Access | プレイ可能版 | |
| テスト版 | 通しプレイ版 | 旧フォーム |
| β版 | 通しプレイ版 | |
| 公開準備 | 公開準備中 | 「中」なし |
| 公開間近 | 公開準備中 | |

### status 列（任意・同タイミング推奨）

| 条件 | 推奨 |
|------|------|
| `looking_for_testers = true` | 「テスター募集中」のまま |
| それ以外で status が旧 phase | UPDATE 後の phase に揃える |

---

## 4. 想定外データ有無

| 区分 | 評価 |
|------|------|
| mock / demo-setup 定義 | 想定外なし |
| 本番 DB | **未確認** — §2-D の SELECT 必須 |
| 想定外になりうる値 | 空文字、typo、マッピング外カスタム |
| normalize 不能 | マッピング外は原文表示のまま |

---

## 5. migration 004 と一緒に移行できるか

**できる。同一メンテナンス窓で同梱推奨。**

- phase UPDATE と `playable_version` 追加は独立（順不同可）
- 004 のみ先出し、phase のみ先出し、どちらも可能
- 同梱すると Dashboard 適用が1回で済む

---

## 6. 将来実施する場合の SQL 案

```sql
BEGIN;

UPDATE public.projects SET phase = '公開準備中'
WHERE phase IN ('公開準備', '公開間近')
   OR phase ILIKE '%公開準備%' OR phase ILIKE '%公開間近%';

UPDATE public.projects SET phase = '通しプレイ版'
WHERE phase IN ('テスト版', 'β版')
   OR phase ILIKE '%β%' OR phase ILIKE '%beta%' OR phase ILIKE '%通し%';

UPDATE public.projects SET phase = 'プレイ可能版'
WHERE phase IN ('開発中', 'α版', 'Early Access')
   OR phase ILIKE '%α%' OR phase ILIKE '%alpha%' OR phase ILIKE '%early access%';

UPDATE public.projects SET phase = '試作版'
WHERE phase NOT IN ('試作版','プレイ可能版','通しプレイ版','公開準備中')
  AND (phase IN ('プロトタイプ','企画段階','初期開発')
    OR phase ILIKE '%プロトタイプ%' OR phase ILIKE '%企画%'
    OR phase ILIKE '%初期開発%'
    OR (phase ILIKE '%試作%' AND phase <> '試作版'));

UPDATE public.projects SET status = phase
WHERE looking_for_testers = false
  AND status NOT IN ('テスター募集中','試作版','プレイ可能版','通しプレイ版','公開準備中');

COMMIT;

-- 任意（UPDATE 確認後）:
-- ALTER TABLE public.projects ADD CONSTRAINT projects_phase_check
--   CHECK (phase IN ('試作版','プレイ可能版','通しプレイ版','公開準備中'));
```

---

## 7. リスク

- マッピング誤り → UPDATE 前に id 一覧エクスポート
- CHECK 追加時に legacy 残存 → SELECT で 0 件確認後
- status だけ古い → status 同期 UPDATE を同梱
- デモ3作品が旧 phase → `/demo` 再実行 or 個別 UPDATE

---

## 8. 推奨実施タイミング

| いつ | 何を |
|------|------|
| 今 | Dashboard SELECT 棚卸し |
| migration 004 時 | phase UPDATE 同梱 |
| 004 後 | legacy fuzzy 削除、（任意）CHECK |

---

## 9. オーナー判断が必要な点

1. 本番 SELECT 結果の共有
2. 企画段階行 → 試作版でよいか
3. status 同時 UPDATE か
4. CHECK 制約のタイミング
5. デモ3作品：SQL vs `/demo` 再実行

---

## 10. migration 004 への影響

- `playable_version` / `version_key` は phase に非依存
- 同一 migration ファイル推奨：`004_feedback_versions_and_phase_cleanup.sql`
- phase 棚卸し完了 → 次は FB 版管理の設計整理へ
