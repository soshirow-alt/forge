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

1. ~~**042 migration**~~ / ~~**043 権限補正**~~ — Dashboard 適用済み（post-check 最終 PASS）
2. **X Developer Console** で OAuth 2.0 アプリ作成
3. **Supabase Dashboard → Authentication → Providers → X** を有効化
4. **Manual linking** を有効化（Identity linking）
5. Preview URL で X ログイン / 連携 / 表示を確認（対象: 設定 / 公開FB / 作品詳細 / `/creators/...`。プレイヤープロフィールは別TODO）
6. 問題なければ main merge + 本番 deploy（別 GO）

---

## 1. X Developer Console

1. [developer.x.com](https://developer.x.com/) → Project / App
2. **User authentication settings** を有効化
3. **OAuth 2.0** / **Confidential client**（Web app）
4. **Callback URL**（Supabase Auth が受ける URL。**Forge の `/auth/callback` ではない**）:

   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   正本: `https://bpnisgzxuwdxelhnduuf.supabase.co/auth/v1/callback`

5. **Website URL**（Forge・参考）:
   - Preview 検証: `https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app`
   - Production: `https://forge-flame-gamma.vercel.app`

6. **App permissions**: 最小（Sign in with X に必要な read 系のみ。**Write 不要**）
7. **App name（表示名）**: 同意画面に出る名称。**`Forge game`** に設定する（`Forge` 単体は取得不可だったため。Client ID や内部 App name がそのまま出ると数字付きで怪しく見える）
8. **Request email from users**: X Developer 側は **OFF 推奨**（Forge は X メールを使わない）— ただし **Supabase Auth が `users.email` scope を固定要求**するため、同意画面に *Your email address* が出続ける可能性あり（後述 §4.1）
9. **Client ID** / **Client Secret** を控える（Secret は **Supabase Dashboard のみ**。Forge `.env` / Vercel env には置かない）

**課金・クレジット（2026-07-06 方針）**

| 項目 | 状態 |
|---|---|
| X API 課金モデル | pay-per-use / クレジット制（OAuth 同意・token 交換は通常無課金。`/2/users/me` 等の read は metered の可能性） |
| 購入クレジット | **$5 購入済み** |
| 自動チャージ（Auto recharge） | **OFF**（ON にしない） |
| Premium+ / xAI 連携 / 追加自動課金 | **未設定** |

**運用ルール**

- OAuth E2E 中は Developer Console で **残高推移を軽く確認**
- **想定外に大きく減る**場合は E2E を停止し、呼び出し元（Supabase Auth callback / Forge）を切り分け
- 残高不足エラー（ユーザー情報取得失敗）が出た場合のみ **最小限の追加購入**を検討。自動チャージは使わない
- Forge は X 投稿 / DM / API 大量利用をしない前提

---

## 2. Supabase Dashboard — Auth Provider

**Authentication → Providers → X (Twitter)**

| 項目 | 値 |
|---|---|
| Enable X | ON |
| Client ID | X Developer の Client ID |
| Client Secret | X Developer の Client Secret（**Supabase Dashboard のみ**。Forge / Vercel には置かない） |
| Redirect URL（参考） | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |

**Authentication → URL Configuration**

| 項目 | 値 |
|---|---|
| **Site URL** | `https://forge-flame-gamma.vercel.app` **維持**（Preview 検証中も変更しない） |
| **Redirect URLs**（追加） | 以下 3 件を allowlist に含める |

```
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/auth/callback
https://forge-flame-gamma.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**Site URL を Preview に変えない理由**: `bpnisgzxuwdxelhnduuf` は Preview / 本番共通。Site URL を Preview にすると本番のメール認証・パスワードリセット・デフォルトリダイレクトに影響しうる。X OAuth はコード側 `getOAuthRedirectUrl()` = **開始したページの origin** + `/auth/callback` で Preview / 本番を分離するため、**Redirect URLs allowlist 追加が必須**。

**Redirect URL 未登録時の挙動（2026-07-06 E2E FAIL 原因）**

- Supabase は `redirectTo` が allowlist に **完全一致しない**と **Site URL（本番 LP）へフォールバック**する
- 症状: Preview `/settings` → X 許可 → **本番 LP**（`forge-flame-gamma.vercel.app`）へ飛ぶ
- 対処: Dashboard → Authentication → URL Configuration → Redirect URLs に **Preview host を正確に追加**（末尾スラッシュなし）
- 推奨（将来の Preview host 変更に強い）: `https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/auth/callback` に加え、必要なら `https://*.vercel.app/auth/callback` を検討（セキュリティと運用のトレードオフ — オーナー判断）

**E2E 前チェック（オーナー）**

1. Redirect URLs に上記 3 件（Preview / 本番 / localhost）が **すべて** 入っている
2. Preview `/settings` → Xで連携 → X 同意 URL の `redirect_uri` は Supabase（`…supabase.co/auth/v1/callback`）であること
3. X 許可後、ブラウザが **Preview host** の `/auth/callback?flow=x_link&next=/settings` を経由すること（本番 host なら NG）

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
| `NEXT_PUBLIC_SITE_URL` | メタデータ OGP 等。**OAuth `redirectTo` には使わない**（ブラウザ `window.location.origin` を使用） |
| `NEXT_PUBLIC_X_AUTH_ENABLED` | **`true`** — 本番含め全環境 ON。**`false`** — 本番/local OFF（Preview branch デプロイは **常に ON** — E2E 用）。**未設定** — local ON、本番 release OFF |

**X Client Secret は Forge 側に置かない**（Supabase Dashboard のみ。Vercel env にも追加しない）。

**`NEXT_PUBLIC_X_AUTH_ENABLED` 運用**

1. **Preview branch（`preview/landing-01`）** — ホスト名 / git ref で判定。**環境変数に関係なく** X ボタン **表示**（`NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` でも可）
2. **local（未設定）** — X ボタン **表示**
3. **本番 release mode** — **`true` 明示まで非表示**。本番 GO 前に Vercel で `NEXT_PUBLIC_X_AUTH_ENABLED=true`
4. **明示 `false`** — local 等で一時的に X 導線を止める（Preview branch には効かない）

---

## 4. OAuth フローと callback

### 4.1 Scope（2026-07-06 調査 — 本番 GO 前の確認事項）

**Forge 方針**: X の `@handle` 表示のみ。投稿/DM なし。OAuth token 非保存。

#### Forge コードが渡している scope

`components/auth-provider.tsx` の `signInWithOAuth` / `linkOAuthIdentity` は **`options.scopes` 未指定**（`redirectTo` のみ）。

#### 実測: X 同意 URL の `scope=`（Supabase `bpnisgzxuwdxelhnduuf` / 2026-07-06）

`scripts/tmp-inspect-x-oauth-scopes.mjs` が `/auth/v1/authorize?provider=x` の 302 Location を解析:

| ケース | Supabase に渡した scopes | X URL の `scope=` 実値 |
|---|---|---|
| **現行 Forge 同等（未指定）** | なし | `users.email tweet.read users.read offline.access` |
| **`options.scopes: "tweet.read users.read"` 試験** | `tweet.read users.read` | `users.email tweet.read users.read offline.access tweet.read users.read`（**削減不可・重複 append**） |

- **write / DM 系 scope**: 実測 URL に **なし**
- **`users.email`**: 実測 URL に **あり** → 同意画面 *Your email address* の直接原因
- **`offline.access`**: 実測 URL に **あり** → Supabase Auth セッション用 refresh token。Forge DB には保存しない
- **`tweet.read` + `users.read`**: 実測 URL に **あり** → GPT 見立ての最小候補。ただし **Supabase 托管 Auth ではこの 2 つだけには絞れない**

根拠（コード）: [supabase/auth `internal/api/provider/x.go`](https://github.com/supabase/auth/blob/master/internal/api/provider/x.go) — デフォルト 4 scope を常に付与。`options.scopes` は **append** のみ（置換不可）。

#### なぜ Request email OFF でも *Your email address* が出るか

1. **同意画面の表示** — X URL に `users.email` scope が含まれるため（上記実測）。これは **X Developer の Request email from users 設定とは独立**して scope パラメータに載る
2. **Supabase の API 呼び出し** — GoTrue が `/2/users/me?user.fields=...,confirmed_email` を叩く設計
3. **Request email OFF の効果** — 同意画面に email が出ても、API 応答の `confirmed_email` は空になりうる（Forge は X メールを使わない）

#### `users.read` のみで `/2/users/me` が通るか

- X API v2 の OAuth 2.0 user context では **`tweet.read` + `users.read` がセットで必要**とされる（Supabase コメント・コミュニティ実装例と一致）
- **`users.read` 単体** — Supabase 托管 Auth では未検証（4 scope 固定のため）。独自 OAuth 実装なら実験対象

#### 本番 GO 前の対応案（優先順）

1. **オーナー**: X Developer の **App 表示名を `Forge game` に設定**（同意画面 E2E で確認）
2. **オーナー**: 同意画面スクショを残し、利用規約/プライバシーで「要求 scope と Forge 実利用の差」を明記するか検討
3. **Cursor / 将来**: Supabase へ X provider scope 最小化 feature request（`tweet.read users.read` のみ + `offline.access`/`users.email` オプトアウト）

**`signInWithOAuth` / `linkIdentity` で scope 指定**（現状 Forge 未使用）:

```typescript
await supabase.auth.signInWithOAuth({
  provider: "x",
  options: { scopes: "tweet.read users.read" }, // 追加のみ。4 固定 scope は消えない
});
```

### 4.2 同意画面の言語（日本語化）

- X OAuth 2.0 公式 authorize パラメータ: `response_type` / `client_id` / `redirect_uri` / `scope` / `state` / `code_challenge` 等
- **実測 X URL** に `lang=ja` / `ui_locales=ja` **なし**（Supabase 経由フロー）
- Forge / Supabase クライアントから **同意画面を確実に日本語化する公式手段は未確認**
- ブラウザ言語・X アカウント表示言語に依存する可能性あり。`queryParams` での実験は **公式保証なし**

### 4.3 フロー図

```
Forge /login → signInWithOAuth('x')
  → X 同意画面
  → Supabase /auth/v1/callback
  → Forge /auth/callback?code=...&flow=x_login&next=...
  → exchangeCodeForSession
  → upsert_own_x_profile RPC
  → next へ redirect（同一 origin 内）
```

連携導線（ログイン済み）:

```
/settings → linkIdentity('x')
  → X 同意画面
  → Supabase /auth/v1/callback
  → Forge /auth/callback?code=...&flow=x_link&next=/settings
  → exchangeCodeForSession
  → upsert_own_x_profile RPC
  → /settings?x=linked（同一 origin 内）
```

**禁止**: Preview で開始した OAuth が `forge-flame-gamma.vercel.app` の `/auth/callback` または本番 LP へ戻ること。

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

## 7. Preview OAuth E2E（テスト用 X アカウント）

**前提**: テスト用 X アカウントで実施。Forge 運営 X は紐づけない。

| # | 確認項目 | 期待結果 |
|---|---|---|
| 1 | `/settings` → **Xで連携** | X 同意画面へ遷移 |
| 2 | X 同意画面 | アプリ名 **Forge game** 表示。scope 表示は runbook §4.1 参照 |
| 3 | callback 後 | `/settings?x=linked`（または next 指定先） |
| 4 | DB | `user_x_profiles` 行が作成（`x_username` 等） |
| 5 | UI | `/settings` 連携済み `@handle` 表示 |
| 6 | 公開表示 | 公開FB / 作品詳細作者 / `/creators/...` に `@handle`（連携後） |
| 7 | 衝突 | **同一 X** を別 Forge アカウントで連携 → 拒否（`already_linked` メッセージ） |

**Phase A UI**（OAuth なし）— **PASS**（2026-07-06 オーナー確認済み）

**その他 Preview 確認**

1. `/login` — 「Xでログイン」表示。メール → X → ゲストの順
2. `/studio/settings` / `/studio/profile` — X 誘導カード（OAuth 本体は `/settings`）
3. Provider 未有効時 — 汎用エラー（生 JSON なし）

**プレイヤープロフィール（`/players/[handle]`）** — X `@handle` 表示は **未実装**（v0 mock ページのみ。実プロフィール公開と別 TODO）。今回 E2E 対象外。

---

## 8. コスト（2026-07-06 更新）

| 項目 | 試算 / 現状 |
|---|---|
| X Developer API | **pay-per-use / クレジット制**。OAuth ログイン + `/2/users/me`（Supabase Auth 経由）程度なら **$5 クレジットで Preview E2E 可能**想定 |
| 購入済み | **$5**（2026-07-06）。自動チャージ **OFF** |
| 監視 | E2E 中に残高推移を確認。想定外の減少時は停止して切り分け |
| Supabase Auth MAU | 既存プランに含まれる OAuth ログイン |
| Supabase DB | `user_x_profiles` 1 ユーザー 1 行 → 無視できる増分 |
| Vercel | UI 変更のみ → 追加コストなし |

**まとめ**: Forge は投稿/DM/大量 API を使わない。$5 + 自動チャージ OFF で Preview E2E を進め、不足時のみ最小追加購入。

---

## 9. 本番 deploy GO 条件（E2E 後）

**041 migration** — `bpnisgzxuwdxelhnduuf`（Preview / 本番共通 DB）に **適用済み**（2026-07-05 Dashboard 適用 + 2026-07-06 post-check 再確認 PASS: FB 4 テーブル / `optional_comment` / `moderation_status` / `feedback_reports` / `get_public_feedback_cards`）

**042 / 043** — Dashboard 適用済み + post-check PASS（別途 changelog 参照）

**本番 Vercel env（deploy GO 直前に必須）**

| 変数 | 値 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_X_AUTH_ENABLED` | **`true`** | 未設定のまま deploy すると本番で X ボタン非表示 |
| X Client Secret | **設定しない** | Supabase Dashboard のみ |

**X Developer App 表示名** — **`Forge game`**（同意画面 E2E で確認）

**オーナー GO 後の手順** — main fast-forward merge → push（本番 deploy）→ `preview/landing-01` を main に同期 push → 本番 smoke（/login, /settings, メールログイン, ゲスト, 作品詳細, 公開FB, creators）

---

## 10. 未実施（明示）

- Preview OAuth E2E（テスト用 X）— **実施中**（§7 チェックリスト）
- main 反映 / production deploy
- 本番 Vercel `NEXT_PUBLIC_X_AUTH_ENABLED=true`（§9 deploy GO 直前）
