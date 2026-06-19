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

**Studio 20–25**: preview スコープ外（未着手）

---

## 動かない / stub ボタン一覧

### 全画面共通（Player Shell）
- **Sidebar 正本（2026-06-19）**: ホーム / 作品を探す / 開発者を探す / ランキング ── マイページ ── 設定 / はじめてガイド
- **マイページ sub-nav** — サイドバーではなくメイン内タブ（見届け中〜フォロー中開発者）
- **開発者を探す** — サイドバー「作品を探す」の直下（/search/creators）
- **通知一覧** — サイドバーから削除（ヘッダー 🔔 のみ）
- **Studio** — リンクなし
- **はじめてガイド** — stub（サイドバー下部。遷移なし）
- **ログアウト** — トップバー（ログイン時のみ表示）→ /login

### P-04 /home
- カルーセル自動送り以外の細かいフィルタ — mock のみ
- ジャンルから探す — 削除（作品を探す経由）

### P-05 /search
- グリッド表示切替 — 見た目のみ
- **ソート** — おすすめ順 / 見届けが多い順 / 声が多い順（URL `?sort=` 連動）
- **ページネーション** — `?page=` 連動（5件/ページ）
- プレイ環境チェック — 未連動（UI 削除）

### P-05-2 /search/creators
- **フォロー** — 未ログイン→`/login?return=...`、ログイン後 toggle（mock state）
- ソート — 未連動

### P-06 /games/[id]
- **見届ける / フォロー / あとで遊ぶ** — 未ログイン→login、ログイン後 toggle（mock state）
- **プレイ** — login 後 play stub モーダル（実ゲーム URL なし）
- **FB** — mock モーダル（Supabase 保存なし）

### P-07 /creators/[id]
- **フォロー** — 未ログイン→login、ログイン後 toggle（mock state）
- 完成品カード — 詳細リンクなし（demo id）
- 開発ログタブ — mock 3件のみ

### P-09 /settings
- **変更**（メール/パスワード）— stub
- トグル — UI のみ（保存なし）

### P-18 /rankings/influence
- 月 ◀▶ — 未連動
- **もっと見る** — stub

### マイページ各タブ
- フィルタ・ソート・ページネーション — 多くが UI のみ

---

## 実装前に整理すべき論点

1. **入口 URL** — preview のみ `/` → `/home` リダイレクト（middleware）。prod 反映時に要裁定
2. **Sidebar 正本** — 04/05/05-2/18 で項目差（#19 オーナー裁定）
3. **マイページ IA** — tabs（現状）vs sidebar 独立 URL（モック）
4. **17 設定** — プレイヤー `/settings` vs Studio 設定（別 URL 確定要）
5. **ログイン後プレイ再開** — return のみ。自動で play stub を開くか（原典: redirect 複雑化しない）
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
