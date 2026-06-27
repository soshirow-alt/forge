# REL-2-07 — 最低限の通報導線（設計）

**ステータス**: 設計 GO — **migration 024 Dashboard 適用はオーナー GO 後**  
**SQL 正本**: `supabase/migrations/024_content_reports.sql`

**根拠**: 利用規約 第12条（通報）

---

## 目的

本番でユーザーが **運営者へ通報を送れる最小導線** を Supabase に蓄積する。  
**運営者 UI・自動モデレーション・通報者への結果通知はスコープ外**（Dashboard で確認）。

| 対象（初期） | 画面 |
|--------------|------|
| 作品（project） | `/games/[id]` 実作品 |
| コミュニティ投稿 | `/studio/community` / `/mypage/community` |
| 開発者プロフィール | `/creators/[id]` 実プロフィール |

コミュニティ返信・FB 個別は **Phase 2 最小では post / project / developer のみ**（返信は post 通報で足りる想定）。

---

## テーブル — `content_reports`

| 列 | 型 | 説明 |
|----|-----|------|
| `id` | uuid PK | |
| `reporter_id` | uuid FK → auth.users | 通報者 |
| `target_type` | text | `project` / `community_post` / `developer` |
| `target_id` | text | 対象 ID（project UUID、post UUID、developer user UUID） |
| `reason_code` | text | `spam` / `harassment` / `rights` / `unsafe_link` / `other` |
| `details` | text ≤500 | 任意補足 |
| `context_label` | text | 表示用ラベル（作品名等） |
| `created_at` | timestamptz | |

### RLS

- **INSERT** — `auth.uid() = reporter_id`
- **SELECT** — 通報者本人のみ（アプリ UI では未使用。運営は Dashboard）
- UPDATE / DELETE — なし

---

## UI

- `ContentReportButton` — 「通報」リンク → モーダル（理由選択 + 補足）
- **ログイン必須**（`/login` へ。モーダルで阻まない）
- 本番モード（`shouldHideV0MockContent()`）かつ **実 ID（UUID）** のみ表示
- 送信後 — 「通報を受け付けました」+ 閉じる

---

## 確認手順

1. migration 024 Dashboard 適用
2. ログイン → 実作品 `/games/[id]` から通報 → `content_reports` に 1 行
3. コミュニティ投稿から通報
4. 開発者プロフィールから通報
5. 未ログイン時 — 通報ボタン → `/login`

---

## rollback

```sql
DROP TABLE IF EXISTS public.content_reports CASCADE;
```

024 は単独 rollback 可。
