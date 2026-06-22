# Preview v0 — ナビゲーション・未実装整理

**ブランチ**: `preview/landing-01`  
**更新**: 2026-06-19（UX fix batch）

---

## プレイヤー v0 完成状況（01–18）

| # | 画面 | URL | v0 |
|---|------|-----|-----|
| 01 | LP | `/landing` | ✅ |
| 02 | ログイン | `/login` | ✅ |
| 03 | 登録 | `/register` | ✅ |
| 04 | 発見ホーム | `/home` | ✅ |
| 05 | 作品検索 | `/search` | ✅ |
| 05-2 | 開発者検索 | `/search/creators` | ✅ |
| 06 | ゲーム詳細 | `/games/[id]` | ✅ |
| 07 | 開発者プロフィール | `/creators/[id]` | ✅ mock |
| 08 | FB送信 | P-06 モーダル | ✅ stub |
| 09 | プロフィール | `/mypage/profile` | ✅ |
| 10–15 | マイページ各タブ | `/mypage?tab=` | ✅ |
| 16 | 通知 | `/notifications` | ✅ |
| 17 | 設定（プレイヤー） | `/settings` | ✅ mock |
| 18 | 月間影響度 | `/rankings/influence` | ✅ mock |

**Studio 20–25**: preview スコープ — **正本** `/projects/…/studio`（あなたの作品）。mock `/studio` 以下は **UI サンプル専用**（2026-06-19 整理済）

---

## 動かない / stub ボタン一覧

### 全画面共通（Player Shell）
- **Sidebar 正本**: ホーム / 作品を探す / 開発者を探す / ランキング ── **マイページ**（子: マイプロフィール）── 設定 / はじめてガイド
- **マイページ sub-nav** — メイン内タブ（見届け中〜フォロー中開発者）。サイドバーはマイページ／マイプロフィールの2段
- **ヘッダー 👤** — `/mypage/profile`（マイプロフィール）へ直リンク
- **開発者を探す** — サイドバー「作品を探す」の直下（/search/creators）
- **通知一覧** — ヘッダー 🔔 のみ（`/notifications`）。preview は middleware 未保護
- **Studio** — ヘッダーリンク
- **はじめてガイド** — `/guide`
- **ログアウト** — ログイン時のみトップバー

### Preview 認証の暫定挙動（本番前に要修正）
- **未ログインでも Player 画面の大半を閲覧可能**（UI 確認用）。右上に「ログイン」が出るが、マイページ・ゲーム詳細の mock アクション等は動く
- **本番 GO 時**: middleware の保護ルート見直し（`/notifications` 等）、プレイ・FB・フォロー等は `requireAuth` + Supabase セッション必須に統一
- **過去の不具合**: `/notifications` が middleware で保護され未ログイン時 `/login` へ飛ばされていた → preview では保護解除済み

### P-04 /home
- カルーセル自動送り以外の細かいフィルタ — mock のみ
- ジャンルから探す — 削除（作品を探す経由）

### P-05 /search
- **グリッド表示切替** — `?view=grid` / リストと切替（URL 連動）
- **ソート** — おすすめ順 / 見届けが多い順 / FBが多い順（URL `?sort=` 連動）
- **ジャンル絞り込み** — チェック即時反映（`?genre=`）。Fantasy↔ファンタジー等を正規化
- **特徴タグ絞り込み** — `?tag=` 連動（投稿フォームと同じ12タグ）
- **キーワード** — 未指定時は全件（デフォルト「ファンタジー」廃止）
- **ページネーション** — `?page=` 連動（5件/ページ）
- プレイ環境チェック — 未連動（UI 削除）

### P-05-2 /search/creators
- **フォロー** — 未ログイン→`/login?return=...`、ログイン後 toggle（mock state）
- **ソート** — `?sort=` 連動（おすすめ / フォロワー / 作品数）。新規のみ `?new=1`

### P-06 /games/[id]
- **見届ける / フォロー / あとで遊ぶ** — 未ログイン→login、ログイン後 toggle（mock state）
- **プレイ / FB** — login 必須。mock モーダル（Supabase 保存なし）
- **FB 一覧** — 初回5件 +「もっと見る」で全件展開（mock）
- ~~体験デモ~~ — 削除（将来作り込み）

### P-07 /creators/[id]
- **フォロー** — 未ログイン→login、ログイン後 toggle（mock state）
- **完成品カード** — ゲーム詳細 `/games/[id]` へリンク
- **開発ログタブ** — 各項目から作品詳細 `?tab=devlog` へ（mock 抜粋付き）

### P-09 /settings
- **変更**（メール/パスワード）— モーダルで mock 更新
- トグル — UI のみ（保存なし）

### P-09 /mypage/profile
- **プロフィールを編集** — 表示名・ジャンル25種・アイコン50候補+アップロード（mock）

### P-18 /rankings/influence
- 月 ◀▶ — `?month=` で3ヶ月切替
- **もっと見る** — 11位以降（1〜10位は初回から。1〜3位は top3 カード）

### マイページ各タブ
- フィルタ・ソート — 動作（mock データ内）
- プレイ履歴 — ページネーション・更新内容・⋯メニュー配線済
- 見届け中 — 「今すぐ遊ぶ」→ ゲーム詳細
- FB履歴 — ページネーション・詳細リンク配線済
- 実績 — カテゴリ絞り込み・すべて見る（スクロール）
- フォロー中 — フィルタ・プロフィール・さらに読み込む・開発者を探す

---

## 実装前に整理すべき論点

1. **入口 URL** — preview のみ `/` → `/home` リダイレクト（middleware）。prod 反映時に要裁定
2. **Sidebar 正本** — 04/05/05-2/18 で項目差（#19 オーナー裁定）
3. **マイページ IA** — tabs（現状）vs sidebar 独立 URL（モック）
4. **17 設定** — プレイヤー `/settings` vs Studio 設定（別 URL 確定要）
5. **ログイン後プレイ再開** — return は `/games/{id}` のみ（体験デモ ?play= は廃止）
6. **09 活動タイムライン vs 11/12/16** — MECE 裁定（#36）
7. **Studio 20–25** — Player preview 完了後の次フェーズ
8. **mock → Supabase** — いつ切替するか（preview は mock 継続方針）
9. **PLAYER_VISIBLE / prod deploy** — 本番反映 GO 条件

---

## Preview 内 v0 連携マップ（主要）

```
/landing → /login /register → /home
/ (preview only) → /home
/home ↔ /search ↔ /search/creators ↔ /rankings/influence
/home → /games/[id] ↔ /creators/[id]
/mypage/* ↔ /mypage/profile ↔ /settings
/notifications
```

旧 UI に落ちる例: `/`（トップ）、`/bookmarks`、`/submit`、Studio 系
