# migration 015〜020 — 適用前レビュー

**ステータス**: レビュー用（**[C] 追加確認必須** — Dashboard 適用 GO 前に読む）  
**適用方法**: Supabase Dashboard SQL（`docs/supabase-dashboard-migration-guide.md`）  
**適用後**: `docs/supabase-post-migration-checklist.md`

**RUN 判断**: 本 doc 読了 + オーナー明示 GO まで **適用しない**。

---

## 適用順（全体）

```
015 → 016 → 017 → 018 → 020 → 019
```

| 順 | 理由 |
|----|------|
| 015 | `confirmation_requests` 本体 |
| 016 | `developer_feedback_helpful_marks`（017/019 と独立だが先に可） |
| 017 | 015 に列追加 + 通知型 + `get_confirmation_notify_recipients` v1 |
| 018 | コミュニティ表 + `get_confirmation_notify_recipients` v2（community 追加） |
| 020 | 018 の `community_posts` に `title` 列（018 直後） |
| 019 | RPC が 016・018・012 等を参照。**最後**が安全 |

> **注意**: 019 の prerequisite コメントは 018 を含む。018 未適用でも 019 は動くが、community 系 CTE は空になる。

---

## 015 を再 RUN したとき（policy already exists）

**症状**: `policy "Confirmation requests are publicly readable" for table "confirmation_requests" already exists`

**意味**: **015 は既に適用済み**。テーブルと RLS ポリシーが Dashboard に存在する。再 RUN は不要。

**やること**

1. **015 はスキップ** — 016 以降だけ未適用分を順に RUN
2. 下の「適用状況確認 SQL」でどこまで入っているか確認
3. どうしても 015 を再実行したい場合 — リポジトリ最新の `015_confirmation_requests.sql`（`DROP POLICY IF EXISTS` 付き）を使えば再 RUN 可（テーブルは `IF NOT EXISTS` のまま）

### 適用状況確認 SQL（Dashboard で一括実行）

```sql
SELECT '015 confirmation_requests' AS check_item,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'confirmation_requests'
  ) AS ok;

SELECT '016 helpful_marks' AS check_item,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'developer_feedback_helpful_marks'
  ) AS ok;

SELECT '017 notify_audience column' AS check_item,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'confirmation_requests'
      AND column_name = 'notify_audience'
  ) AS ok;

SELECT '018 developer_communities' AS check_item,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'developer_communities'
  ) AS ok;

SELECT '020 community_posts.title' AS check_item,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts'
      AND column_name = 'title'
  ) AS ok;

SELECT '019 influence RPC' AS check_item,
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_monthly_player_influence_ranking'
  ) AS ok;
```

| `ok = true` | 次に RUN するファイル |
|-------------|----------------------|
| 015 のみ | `016_developer_feedback_helpful_marks.sql` |
| 016 まで | `017_confirmation_request_targeting.sql` |
| 017 まで | `018_communities_and_confirmation_quotes.sql` |
| 018 まで | `020_community_post_title.sql` |
| 020 まで | `019_player_influence_ranking.sql` |

---

## 015 — confirmation_requests

**ファイル**: `supabase/migrations/015_confirmation_requests.sql`  
**前提**: 001 `projects`, 003 `project_devlogs`

### 作るもの

| 種別 | 名前 |
|------|------|
| テーブル | `public.confirmation_requests` |
| インデックス | `confirmation_requests_project_id_idx` |

### 列（要点）

- `devlog_id` — UNIQUE, FK → `project_devlogs` ON DELETE CASCADE  
- `project_id` text  
- `changes_summary`, `ask_summary`, `estimated_duration` — 任意テキスト  
- `notify_enabled` boolean default true  

### RLS

| 操作 | ポリシー |
|------|----------|
| SELECT | 全員可（公開読み取り） |
| INSERT | 作品オーナーかつ devlog 作者のみ |

UPDATE / DELETE ポリシー **なし**（現状は insert のみ想定）。

### 既存データへの影響

- **破壊的変更なし**（新規テーブルのみ）
- 既存 devlog に自動行は作られない

### Rollback 方針

```sql
DROP TABLE IF EXISTS public.confirmation_requests CASCADE;
```

- 依存: 017 以降で `confirmation_request_id` FK が付くため、**015 単独 rollback は 017+ 未適用時のみ**

### 適用後確認

```sql
SELECT count(*) FROM public.confirmation_requests;
-- Studio で devlog + 確認依頼投稿 → 1 行 INSERT
```

アプリ: `/games/[id]` 変化チェック、`/mypage` 更新セクションに確認依頼が出るか。

---

## 016 — developer_feedback_helpful_marks

**ファイル**: `supabase/migrations/016_developer_feedback_helpful_marks.sql`  
**前提**: 001, 002 `project_feedback`, 006 `project_voice_responses`

### 作るもの

| 種別 | 名前 |
|------|------|
| テーブル | `public.developer_feedback_helpful_marks` |
| 制約 | UNIQUE `(developer_id, source_type, source_id)` |

### RLS

| 操作 | ポリシー |
|------|----------|
| SELECT | 開発者本人のみ |
| INSERT / DELETE | 作品オーナー（developer_id = auth.uid()） |

### 既存データへの影響

- 新規テーブルのみ。既存 FB にマークは付かない

### Rollback

```sql
DROP TABLE IF EXISTS public.developer_feedback_helpful_marks CASCADE;
```

- 019 RPC が参照するため、019 適用後は 019 を先に DROP

### 適用後確認

```sql
SELECT count(*) FROM public.developer_feedback_helpful_marks;
```

アプリ: `/projects/[id]/studio` → プレイヤーの声で「開発に役立った」トグル。

---

## 017 — confirmation targeting + notifications

**ファイル**: `supabase/migrations/017_confirmation_request_targeting.sql`  
**前提**: 015, 009 `user_notifications`

### 作るもの

| 種別 | 名前 |
|------|------|
| ALTER | `confirmation_requests.notify_audience`, `linked_priorities` (jsonb) |
| ALTER | `user_notifications.confirmation_request_id` FK |
| ALTER | `user_notifications_type_check` — `confirmation_request` 型追加 |
| 関数 | `get_confirmation_notify_recipients(...)` SECURITY DEFINER |
| ポリシー更新 | `user_notifications` INSERT — `confirmation_request` 型許可 |

### RLS / セキュリティ

- 関数は **作品オーナーのみ** 実行可（`auth.uid() = owner_id` ガード）
- `GRANT EXECUTE` → `authenticated` のみ

### 既存データへの影響

- 既存 `user_notifications` 行はそのまま
- 制約 DROP/ADD — 既存 `type` 値が devlog / version_published / voice_received のみなら安全

### Rollback（概略）

```sql
DROP FUNCTION IF EXISTS public.get_confirmation_notify_recipients(text, jsonb, text, jsonb);
ALTER TABLE public.user_notifications DROP COLUMN IF EXISTS confirmation_request_id;
ALTER TABLE public.confirmation_requests
  DROP COLUMN IF EXISTS notify_audience,
  DROP COLUMN IF EXISTS linked_priorities;
-- type check を旧定義に戻す（009 時点の定義を要確認）
```

### 適用後確認

- devlog + 確認依頼 + 通知 ON → 対象プレイヤーに `confirmation_request` 通知  
- `SELECT * FROM public.user_notifications WHERE type = 'confirmation_request' LIMIT 5;`

---

## 018 — communities + posts + replies

**ファイル**: `supabase/migrations/018_communities_and_confirmation_quotes.sql`  
**前提**: 001, 015, 017

### 作るもの

| 種別 | 名前 |
|------|------|
| テーブル | `developer_communities`, `community_memberships`, `community_posts`, `community_replies` |
| 関数 | `get_confirmation_notify_recipients` **上書き**（`community_members` オーディエンス追加） |

### RLS（要点）

| テーブル | 読取 | 書込 |
|----------|------|------|
| `developer_communities` | 公開 | オーナー insert/update |
| `community_memberships` | 本人 / オーナー / 同コミュニティ approved | ユーザー apply(pending)、オーナー approve |
| `community_posts` | approved メンバー or オーナー | オーナーのみ insert（開発者投稿） |
| `community_replies` | post と同条件 | approved メンバー insert |

### 既存データへの影響

- 新規テーブルのみ
- **017 の関数定義を置換** — 017 適用済みが前提

### Rollback（概略）

```sql
DROP TABLE IF EXISTS public.community_replies CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_memberships CASCADE;
DROP TABLE IF EXISTS public.developer_communities CASCADE;
-- get_confirmation_notify_recipients を 017 版に戻す（017 SQL 再実行）
```

### 適用後確認

- 開発者: `/studio/community` でコミュニティ作成・スレッド投稿  
- プレイヤー: 参加申請 → 承認 → スレッド閲覧・返信  
- localStorage フォールバックが切れた環境で投稿が他ブラウザから見えるか

---

## 020 — community_posts.title

**ファイル**: `supabase/migrations/020_community_post_title.sql`  
**前提**: 018

### 作るもの

| 種別 | 名前 |
|------|------|
| ALTER | `community_posts.title text NOT NULL DEFAULT ''` |

### 既存データへの影響

- 既存 post 行は `title = ''` で埋まる
- アプリは 020 未適用時フォールバックあり（`community-db.ts`）

### Rollback

```sql
ALTER TABLE public.community_posts DROP COLUMN IF EXISTS title;
```

### 適用後確認

- スレッド作成でタイトル保存 → 一覧に見出し表示

---

## 019 — get_monthly_player_influence_ranking

**ファイル**: `supabase/migrations/019_player_influence_ranking.sql`  
**前提**: 006, 011, 012, **016**, **018**（コメント上）

### 作るもの

| 種別 | 名前 |
|------|------|
| 関数 | `get_monthly_player_influence_ranking(year, month, limit)` SECURITY DEFINER |

### 参照テーブル

- `developer_feedback_helpful_marks` (016)  
- `voice_adoptions` (011)  
- `project_play_sessions` (012)  
- `confirmation_requests` (015)  
- `project_watches`, `project_voice_responses`, `project_feedback`  
- `auth.users`（display_name / handle）

### RLS

- SECURITY DEFINER — 集計用。`GRANT EXECUTE` → `authenticated`, `anon`

### 既存データへの影響

- データ変更なし。データ少ない月は **空結果**（正常）

### Rollback

```sql
DROP FUNCTION IF EXISTS public.get_monthly_player_influence_ranking(int, int, int);
```

### 適用後確認

```sql
SELECT * FROM public.get_monthly_player_influence_ranking(
  EXTRACT(YEAR FROM now())::int,
  EXTRACT(MONTH FROM now())::int,
  10
);
```

アプリ: `/rankings/influence` — **初期版は Coming Soon のため RPC 結果は本番 UI に出さない**（REL-0-06）。staging で `source === "live"` になるかだけ確認。

---

## 一括適用時のリスクまとめ

| リスク | 深刻度 | 対策 |
|--------|--------|------|
| 017/018 で関数が上書きされる | 中 | 順序厳守。018 後に 017 だけ再適用しない |
| 015 rollback が 017+ 後は困難 | 中 | CASCADE 影響を Dashboard で確認してから |
| 019 が空を返す | 低 | データ不足は正常。mock フォールバックは本番で使わない（REL-0-06） |
| RLS によりコミュニティ投稿が読めない | 中 | membership `approved` フローを E2E 確認 |
| `user_notifications` 制約変更 | 低 | 既存 type 値の事前 SELECT |

---

## オーナー GO チェックリスト（適用前）

- [ ] 001〜014 が staging / 本番に適用済みであることを確認  
- [ ] 本 doc の適用順を理解した  
- [ ] staging で 015→020 を順に適用した  
- [ ] 各 migration の「適用後確認」を実行した  
- [ ] アプリ側 REL-0-06 によりランキング UI は閉じたまま  
- [ ] rollback が必要な場合は **逆順**（019→020→018→…）で検討  

**適用 GO 後**: `docs/forge-changelog.md` に migration 適用を記録（節目扱いなら handoff 更新を検討）。
