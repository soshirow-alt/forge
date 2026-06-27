# REL-2-06 — コミュニティ完全 Supabase 化（設計）

**ステータス**: 設計 GO — **migration 018 + 020 Dashboard 適用はオーナー GO 後**  
**SQL 正本**: `supabase/migrations/018_communities_and_confirmation_quotes.sql`, `020_community_post_title.sql`

**スコープ外**: REL-2-07（通報）、コミュニティ外の通知永続化

---

## 目的

本番で localStorage / mock 正本をやめ、**018 + 020** のテーブルを正本にする。

| 現状 | 2-06 後 |
|------|---------|
| `forge-v0-community-join` localStorage | `community_memberships` |
| `forge-v0-developer-communities` localStorage | `developer_communities` |
| mock 掲示板フォールバック | `community_posts` / `community_replies`（空なら空表示） |
| mock 参加コミュニティ一覧 | 承認済み membership + community JOIN |

---

## 正本キー

- **コミュニティ ID** — `developer_communities.id`（text）。新規開設時は `communityIdFromUser(ownerId, handle)` で生成し DB に upsert
- **開発者** — `developer_communities.owner_id` = `auth.users.id`（1 開発者 1 コミュニティ UNIQUE）
- **参加** — `community_memberships (community_id, user_id)` + `status` pending / approved / rejected

---

## RLS（018 適用済み前提）

- `developer_communities` — SELECT 公開。INSERT/UPDATE は owner のみ
- `community_memberships` — 本人 SELECT、owner SELECT、approved 同士 SELECT。INSERT は本人 pending のみ。UPDATE status は owner のみ
- `community_posts` — approved member + owner SELECT。INSERT は owner（developer 投稿）のみ
- `community_replies` — post と同じ read。INSERT は approved member

プレイヤーは **返信のみ**（現 UI 維持）。

---

## アプリ配線

| 画面 | 本番 |
|------|------|
| `/studio/community` | owner の community を DB 取得/ensure。pending/members/posts を Supabase |
| `/mypage/community` | 承認済み参加一覧 + 選択 community の board |
| `/creators/[id]`（実プロフィール） | community 存在時に参加申請（`applyCommunityMembership`） |
| Studio オンボーディング承諾 | `ensureDeveloperCommunity`（localStorage open は preview のみ） |
| `useCommunityBoard` | 本番は mock フォールバック禁止 |

---

## migration 適用順

015 → 016 → 017 → **018** → **020** → 019（019 は community 通知 RPC。018 未適用でも空 CTE）

020 未適用時は `insertCommunityPost` が title 列なしフォールバック（既存）。

---

## 確認手順（Preview E2E）

1. 開発者 — Studio オンボーディング → `/studio/community` で community 行が `developer_communities` にある
2. プレイヤー — `/creators/[id]` から参加申請 → pending
3. 開発者 — 参加者タブで承認 → プレイヤー `/mypage/community` に表示
4. 開発者 — スレッド作成 → プレイヤーが返信
5. localStorage `forge-v0-community-join` / `forge-v0-developer-communities` が本番モードで増えない

---

## rollback

018 逆順 drop（019 の RPC 影響に注意）。アプリは `isCommunitiesTableMissingError` で graceful degrade 維持。
