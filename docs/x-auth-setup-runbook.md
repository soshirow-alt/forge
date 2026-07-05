# X アカウント連携 — セットアップ Runbook

X OAuth ログイン / 連携の **オーナー手動設定**手順。Cursor 実装はコード・migration ファイルのみ。Dashboard / X Developer Console の変更はオーナー GO 後に実施する。

---

## 実現方式（概要）

| レイヤ | 内容 |
|---|---|
| 認証 | Supabase Auth **X provider**（`provider: 'x'`）+ PKCE |
| ログイン | ログイン / 新規登録画面の「Xでログイン」→ `/auth/callback` |
| 既存ユーザー連携 | 設定画面「Xで連携」→ `linkIdentity({ provider: 'x' })`（Manual linking 要） |
| 保存 | `user_x_profiles` テーブル（OAuth token は保存しない） |
| 公開表示 | `@handle` / 表示名 / アイコン（RPC + 既存 API enrich） |

**Supabase Auth X provider で足りる情報**

OAuth 2.0 コールバック後、`auth.users` / `identities` の metadata から以下を取得:

- `sub` → `x_user_id`
- `preferred_username` → `x_username`（@handle）
- `name` → `x_display_name`
- `picture` / `avatar_url` → `x_avatar_url`

投稿・DM・フォロー取得用 scope は **要求しない**。

---

## Cursor 実装済み / オーナー作業

### Cursor 実装済み（Preview ブランチ）

- ログイン / 登録画面: 「Xでログイン」
- 設定: Xアカウント連携セクション
- OAuth callback 後の `user_x_profiles` 同期 + 表示名/アバター初期値（未設定時のみ）
- 公開FBカード / 開発者プロフィール / 作品作者表示での `@handle`
- `supabase/migrations/042_user_x_profiles.sql`（**ファイルのみ**）

### オーナー作業（本番反映前に必須）

1. **042 migration を Supabase Dashboard SQL で適用**（`docs/supabase-dashboard-migration-guide.md`）
2. **X Developer Console** で OAuth 2.0 アプリ作成
3. **Supabase Dashboard → Authentication → Providers → X** を有効化
4. **Manual linking** を有効化（Identity linking）
5. Preview URL で X ログイン / 連携 / 表示を確認
6. 問題なければ main merge + 本番 deploy（別 GO）

---

## 1. X Developer Console

1. [developer.x.com](https://developer.x.com/) → Project / App
2. **User authentication settings** を有効化
3. **OAuth 2.0** / **Confidential client**（Web app）
4. **Callback URL**（Supabase Auth が受ける URL）:

   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   例: `https://bpnisgzxuwdxelhnduuf.supabase.co/auth/v1/callback`

5. **Website URL**（Forge）:
   - Preview: `https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app`
   - Production: 本番 Forge URL

6. **App permissions**: 最小（Sign in with X に必要な read 系のみ。**Write 不要**）
7. **Client ID** / **Client Secret** を控える

---

## 2. Supabase Dashboard — Auth Provider

**Authentication → Providers → X (Twitter)**

| 項目 | 値 |
|---|---|
| Enable X | ON |
| Client ID | X Developer の Client ID |
| Client Secret | X Developer の Client Secret |
| Redirect URL（参考） | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |

**Authentication → URL Configuration**

| 項目 | Preview / Production |
|---|---|
| Site URL | 各環境の Forge 起点 URL |
| Redirect URLs | `https://<preview-host>/auth/callback`、本番同様、`http://localhost:3000/auth/callback`（ローカル） |

**Authentication → Settings（Identity linking）**

- **Manual linking**: **ON**（設定画面からの `linkIdentity` に必須）

---

## 3. 環境変数（Forge / Vercel）

Cursor が参照する既存変数（変更不要）:

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー enrich（既存） |
| `NEXT_PUBLIC_SITE_URL` | OAuth `redirectTo` 生成（未設定時は `window.location.origin`） |

**X Client Secret は Forge 側に置かない**（Supabase Dashboard のみ）。

---

## 4. OAuth フローと callback

```
Forge /login → signInWithOAuth('x')
  → X 同意画面
  → Supabase /auth/v1/callback
  → Forge /auth/callback?code=...&next=...
  → exchangeCodeForSession
  → upsert_own_x_profile RPC
  → next へ redirect
```

連携導線（ログイン済み）:

```
/settings → linkIdentity({ provider: 'x' })
  → 同上 callback
  → /settings?x=linked
```

---

## 5. DB（042 migration）

**テーブル `user_x_profiles`**

| 列 | 説明 |
|---|---|
| `user_id` | PK, `auth.users` |
| `x_user_id` | X 側 subject（UNIQUE） |
| `x_username` | @handle（`@` なし保存） |
| `x_display_name` | 表示名 |
| `x_avatar_url` | アイコン URL |
| `x_connected_at` | 初回連携 |
| `x_last_synced_at` | 最終同期 |

**RPC**

- `upsert_own_x_profile` — 本人のみ（callback / 連携後）
- 公開 X 表示は **user_id キーの RPC を使わない**
  - FB カード: `get_public_feedback_cards.author_x_username`
  - 作品作者: `GET /api/projects/[projectId]/public-author-x`（service_role、返却は `xUsername` のみ）
  - 開発者プロフィール: `GET /api/creators/[routeId]/public-x`（service_role、返却は `xUsername` のみ）

**RLS**: 本人 SELECT のみ。書き込みは SECURITY DEFINER RPC。

**退会**: `anonymize_own_account_data` が `user_x_profiles` も DELETE。

**公開FB**: `get_public_feedback_cards` に `author_x_username` 列追加（042 適用後）。

---

## 6. 衝突・制限

| ケース | 挙動 |
|---|---|
| 同一 X が別 Forge ユーザーに既連携 | `upsert_own_x_profile` → `x_account_already_linked` → 設定画面にエラー |
| メールユーザーが X 連携 | `linkIdentity`（Manual linking ON 必須） |
| X のみで新規登録 | 通常 OAuth  signup。表示名/アバターは X 初期値（後から Forge で上書き可） |
| OAuth token | **保存しない** |

---

## 7. Preview 確認ポイント

1. `/login` — 「Xでログイン」表示。メール / ゲスト導線は従来通り
2. X ログイン成功 → セッション確立 → `user_x_profiles` 行が作成（042 適用後）
3. `/settings` — 連携状態・「Xで連携」
4. 公開FBカード — 登録ユーザー + X 連携時 `@handle` バッジ
5. `/creators/...` — X 連携済みなら `@handle`
6. 作品詳細 — 作者名横に `@handle`
7. Provider 未有効時 — 「このログイン方法は現在利用できません」

---

## 8. コスト試算（目安）

| 項目 | 試算 |
|---|---|
| X Developer API | OAuth ログインのみ → **Basic 無料枠内**（Sign in with X は通常 read 系 scope のみ。Write / 投稿 API 未使用） |
| Supabase Auth MAU | 既存プランに含まれる OAuth ログイン（追加従量はプラン依存。小規模 Preview 検証は **実質 ¥0 増**） |
| Supabase DB | `user_x_profiles` 1 ユーザー 1 行 → **無視できる増分** |
| Vercel | UI 変更のみ → **追加コストなし** |

**まとめ**: 今回スコープ（ログイン + プロフィール metadata 保存 + 表示）なら **月額追加はほぼ ¥0**。X API の有料 tier が将来必要になるのは投稿/DM/分析などを追加した場合。

---

## 9. 未実施（明示）

- Supabase Dashboard 設定変更
- X Developer Console 設定変更
- 042 migration の Dashboard 適用
- main 反映 / production deploy
