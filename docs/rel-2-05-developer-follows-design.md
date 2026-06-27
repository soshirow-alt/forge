# REL-2-05 — 開発者フォロー Supabase 化（設計）

**ステータス**: 設計 GO 待ち — **migration 023 Dashboard 適用・実装は別 GO**  
**SQL 草案**: `supabase/migrations/023_developer_follows.sql`  
**migration 番号**: **023**（021・022 使用済み。024 は不要）

**スコープ外（本 Issue と分離）**

- **REL-2-06** — コミュニティ完全 Supabase 化（018 + 020）
- **REL-2-07** — 通報導線

本番 deploy / main merge / `PLAYER_VISIBLE=true` は引き続き禁止。

---

## GO の区別

| GO 種別 | 状態 | 意味 |
|---------|------|------|
| **設計 GO** | ✅ 2026-06-27（RLS 修正反映） |
| **migration 023 適用 GO** | ❌ 未 | Dashboard で SQL を流す許可 |
| **実装 GO** | ❌ 未 | 適用確認後にアプリ配線 |

---

## 目的

本番で止めている以下を **Supabase 正本**で復活する。

| 現状（REL-1-06） | 2-05 後 |
|------------------|---------|
| `CreatorFollowButton` — 「追って機能追加予定」 | フォロー / 解除トグル |
| `CreatorProfileRealView` — 本番でフォロー UI 非表示 | フォロー + フォロワー数 |
| `/games/[id]` — 本番で開発者フォロー非表示 | 実作品で owner 向けフォロー |
| `/mypage` フォロー中タブ — Coming Soon | フォロー中開発者一覧（実データ） |
| `localStorage` `forge-following-creators` | **本番・実 UUID では不使用** |

---

## 背景

- `games-provider` が `followedCreators` / `followerCounts` を **localStorage** で管理
- `followCreator` は INSERT 相当のみ（解除なし）。カウントはローカル加算で**嘘になりうる**
- `/creators/[id]` は REL-2-03 で実データ化済み。`routeId` は `creator_id` / user UUID / `dev-{uuid}` を許容
- 作品詳細の `game.developer.id` は実作品では **`ownerId`（user UUID）**

---

## テーブル設計 — `developer_follows`

| 列 | 型 | 説明 |
|----|-----|------|
| `follower_id` | `uuid` PK¹ | フォローするプレイヤー（`auth.users.id`） |
| `developer_user_id` | `uuid` PK¹ | **フォローされる開発者**（`auth.users.id` = `developer_profiles.user_id`） |
| `created_at` | `timestamptz` | フォロー開始時刻 |

¹ 複合主キー `(follower_id, developer_user_id)`

制約:

- `CHECK (follower_id <> developer_user_id)` — 自己フォロー禁止
- 重複フォローは PK で防止（= **unique(follower_id, developer_user_id)**）

インデックス:

- `developer_user_id` — フォロワー数集計・フォロワー一覧
- `follower_id` — マイページ「フォロー中」一覧

### `developer_id` に何を入れるか（結論）

| 案 | 採用 |
|----|------|
| `developer_profiles.creator_id`（`dev-{uuid}` 等） | ❌ ルート表現。変更・別名解決が増える |
| `developer_profiles` の surrogate `id` | ❌ 存在しない（PK は `user_id`） |
| **`developer_user_id` = 開発者の `auth.users.id`** | ✅ **正本** |

**理由**

- `developer_profiles.user_id` が開発者の安定 ID
- `/creators/[id]` の `useCreatorProfile` は必ず `userId` を解決する
- 実作品の `ownerId` と一致し、作品詳細 → フォローにそのまま使える
- `creator_id` は表示・URL 用。DB には保存前に **`resolveDeveloperUserIdForFollow()`** で UUID に正規化

```typescript
// 実装時 lib/developer-follows.ts（案）
export function resolveDeveloperUserIdForFollow(
  routeOrDeveloperKey: string,
  profiles: DeveloperProfile[],
): string | null;
// 1. UUID → そのまま（developer_profiles にいれば確実、いなくても owner 作品があれば可）
// 2. dev-{uuid} → uuid
// 3. creator_id 文字列 → findDeveloperProfileByCreatorId → userId
// 4. 解決不能 → null（フォロー不可）
```

**フォールバック**: localStorage の旧 `creatorId` 文字列は **サーバー移行しない**。

---

## `/creators/[id]` 解決ロジックとの整合

| 入力 `routeId` | 保存する `developer_user_id` |
|----------------|------------------------------|
| `creator_id`（`developer_profiles.creator_id`） | 対応する `user_id` |
| user UUID | その UUID |
| `dev-{uuid}` | `{uuid}` |
| mock 専用 ID（非 UUID） | DB フォロー**対象外**（Preview mock のみ従来 UI） |

表示 URL は従来どおり `profile.routeId` / `creatorId` を維持。フォロー API は常に **`developer_user_id`**。

---

## RLS（確定 — 2026-06-27 修正）

**方針**: フォロー関係の**行そのものは公開しない**。本人（`follower_id`）だけが自分の行を読める。フォロワー**数**だけ RPC で公開。

| 操作 | ポリシー | 意図 |
|------|----------|------|
| SELECT | `auth.uid() = follower_id` | **本人のフォロー行のみ**（/mypage、フォロー済み判定） |
| INSERT | `auth.uid() = follower_id` | 自分のフォローのみ作成 |
| DELETE | `auth.uid() = follower_id` | 自分のフォローのみ解除 |
| UPDATE | **なし** | 行は不変 |

**禁止**: `developer_follows` の public SELECT — 「誰が誰をフォローしているか」が漏れるため。

### フォロワー数（公開集計）

行を読まず **SECURITY DEFINER RPC** で件数のみ返す:

| RPC | 用途 |
|-----|------|
| `count_developer_followers(uuid)` | `/creators/[id]` 等・単一開発者 |
| `count_developer_followers_batch(uuid[])` | 一覧で N 件まとめて（関係行は返さない） |

`GRANT EXECUTE` → `anon`, `authenticated`

### アプリでの読み取りパターン

| 画面 | 方法 |
|------|------|
| `/mypage` フォロー中 | `SELECT` where `follower_id = auth.uid()`（RLS） |
| `/creators/[id]` フォロー済み | 同上 + `developer_user_id = targetDeveloperUserId` |
| `/creators/[id]` フォロワー数 | `count_developer_followers(targetDeveloperUserId)` |
| フォロワー一覧タブ | **初期版: 件数のみ or Coming Soon** |

---

## 旧版 023 を誤適用した場合

Dashboard で新版 023 全文を再 RUN すると `policy ... already exists` になる。

**対処**: `supabase/migrations/023_developer_follows_rls_fixup.sql` **のみ**を Dashboard で実行（テーブル・データは保持、RLS + RPC を新版に揃える）。

適用後確認:

```sql
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'developer_follows';

SELECT public.count_developer_followers('00000000-0000-0000-0000-000000000000'::uuid);
```

期待: SELECT ポリシーは `Users can read own developer follows` のみ（public read なし）。RPC は 0 を返す。

---

新規: `lib/supabase/developer-follows-db.ts`

```typescript
// Read — 本人の follow 行のみ（RLS 経由）
fetchFollowingDeveloperUserIds(supabase, followerId): Promise<string[]>
isFollowingDeveloper(supabase, followerId, developerUserId): Promise<boolean>
// 件数 — RPC（行内容非公開）
countDeveloperFollowers(supabase, developerUserId): Promise<number>
countDeveloperFollowersBatch(supabase, developerUserIds: string[]): Promise<Record<string, number>>

// Write
followDeveloper(supabase, followerId, developerUserId): Promise<void>   // INSERT, conflict ignore
unfollowDeveloper(supabase, followerId, developerUserId): Promise<void> // DELETE
```

`games-provider` 変更案:

- ログイン時に `fetchFollowingDeveloperUserIds` を user engagement と同様にロード
- `isFollowing(routeKey)` — 内部で userId 正規化して Set 照合
- `followCreator` / `unfollowCreator` — async、Supabase 正本
- `getFollowerCount(developerKey)` — DB 集計（初期は per-page fetch 可。N+1 注意でバッチ API 推奨）
- **本番 + 実 UUID**: `localStorage` の `forge-following-creators` / `forge-follower-counts` を**読まない・書かない**
- **Preview + mock ID**: mock 開発者のみ従来 localStorage 可（最終的に削除）

---

## フォロワー数の集計

```sql
SELECT count(*)::int
FROM public.developer_follows
WHERE developer_user_id = $1;
```

- **正本**: 行数（1 follower = 1 行）。localStorage 加算は廃止
- **0 のとき**: UI は「フォロワー 0人」表示可（mock 数字と違い **嘘の大きな数は出さない**）
- **キャッシュ**: 初期版はリクエスト毎集計で可。作品一覧で大量に必要なら `fetchFollowerCountsByDeveloperUserIds` で一括

---

## UI 配線（実装タスク）

| # | 画面 / コンポーネント | 変更 |
|---|----------------------|------|
| 1 | `components/creator-follow-button.tsx` | 本番でも表示。フォロー / **解除**。`creatorId` → userId 解決 |
| 2 | `components/creator-profile-real-view.tsx` | `hideV0Mock` 分岐削除。`CreatorFollowButton` または共有フック接続。フォロワー数 |
| 3 | `components/game-detail-v0-page.tsx` | **実作品**で開発者フォロー復活（`submittedGame.ownerId`） |
| 4 | `components/mypage-page.tsx` | 本番「フォロー中」タブ — `FollowingTabPanel` 実データ版 or 新 `FollowingDevelopersPanel` |
| 5 | `components/games-provider.tsx` | Supabase 読み書き。localStorage 本番無効 |
| 6 | `hooks/use-developer-follow.ts`（任意） | フォロー状態 + 件数の薄いフック |

### `/mypage` フォロー中（初期版）

- `developer_follows` where `follower_id = auth.uid()`
- `developer_profiles` / 公開作品と JOIN してカード表示（名前・アイコン・`/creators/{routeId}`）
- プロフィール未登録だが作品がある開発者は `dev-{userId}` でリンク
- 空なら「フォロー中の開発者はいません」

### フォロワータブ（`/creators/[id]`）

- 初期版: **件数のみ**ヘッダー表示（「フォロワー N人」）
- フォロワー**一覧**（誰がフォローしたか）はプライバシー・スコープのため **Phase 2-05 では Coming Soon のまま**でも可

---

## localStorage 方針

| 環境 | 挙動 |
|------|------|
| 本番 | `forge-following-creators` / `forge-follower-counts` **無効** |
| Preview・実 UUID 開発者 | **DB のみ** |
| Preview・mock 開発者 | 従来 mock 可（任意。混乱避けなら全面 DB 化でも可） |

---

## 既存データへの影響

- 新規テーブルのみ。**非破壊**
- ブラウザ localStorage のフォロー履歴は移行しない

---

## Rollback 方針

023 は **単独 rollback 可**（021/022 非依存）。

```sql
BEGIN;
REVOKE ALL ON FUNCTION public.count_developer_followers_batch(uuid[]) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.count_developer_followers(uuid) FROM anon, authenticated;
DROP FUNCTION IF EXISTS public.count_developer_followers_batch(uuid[]);
DROP FUNCTION IF EXISTS public.count_developer_followers(uuid);
DROP TABLE IF EXISTS public.developer_follows CASCADE;
COMMIT;
```

- アプリが RPC / テーブルを参照している場合は **アプリ rollback と同時**
- 失われるデータ: `developer_follows` 行のみ

---

## 確認観点

### migration 適用直後

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'developer_follows';

\d public.developer_follows
```

### アプリ（実装後）

- [ ] ログイン後 `/creators/{id}` でフォロー → 再訪で「フォロー中」
- [ ] 解除 → フォロー中解除・件数減少
- [ ] フォロワー数が localStorage と無関係に他端末で一致
- [ ] 自己フォロー不可
- [ ] 未ログイン → `/login` 誘導（既存 `requireAuth`）
- [ ] `/mypage` フォロー中にフォローした開発者が出る
- [ ] 実作品 `/games/[id]` から開発者フォロー可（owner 自身は不可が自然）
- [ ] 本番モードで localStorage フォローが効かない
- [ ] RLS: 他ユーザーの名義で INSERT / DELETE 不可

---

## 配線一覧（ファイル）

| ファイル | 変更 |
|---------|------|
| `supabase/migrations/023_developer_follows.sql` | 新規（Dashboard 適用） |
| `lib/supabase/developer-follows-db.ts` | 新規 |
| `lib/developer-follows.ts` | `resolveDeveloperUserIdForFollow` |
| `lib/supabase/schema.ts` | `DeveloperFollowRow` 型 |
| `components/games-provider.tsx` | 正本化 |
| `components/creator-follow-button.tsx` | 本番復活 + unfollow |
| `components/creator-profile-real-view.tsx` | 本番フォロー UI |
| `components/game-detail-v0-page.tsx` | 実作品フォロー |
| `components/mypage-page.tsx` + 新パネル | フォロー中実データ |

---

## オーナー判断（確定 2026-06-27）

1. **`developer_user_id` 正本** — ✅ GO
2. **RLS SELECT は本人のみ** + フォロワー数は RPC — ✅ GO
3. **フォロー解除トグル** — ✅ GO
4. **フォロワー一覧タブ** — 件数のみ or Coming Soon — ✅ GO
5. **migration 023 Dashboard 適用 GO** — SQL レビュー後（**未**）

---

## 関連 Issue

- REL-1-06 — 本番フォロー UI 非表示（2-05 で解除）
- REL-2-03 — `/creators/[id]` 実データ（フォロー対象の解決に利用）
- REL-2-06 / 2-07 — **別マイルストーン**
