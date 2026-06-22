■ 現在の状態
- ブランチ preview/landing-01。Player 残 stub 3件を実装して push 予定
- Preview: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- Studio UI 大改修（S-22 5タブ等）はオーナー GO 待ち。Studio ルート整理第1波は前 RUN 済

■ 今回実装したこと
- P-07 /creators/[id] — 完成品カードを gameDetailHref リンク化。開発ログ（概要・タブ）を ?tab=devlog 付き作品詳細へ。mock に gameId・excerpt 追加
- P-05-2 /search/creators — 装飾 SortDropdown 廃止。?sort=recommended|followers|works URL 連動。新規のみ ?new=1
- /search — 特徴タグ ?tag= 絞り込み（forge-feature-tag-options 12種）。ジャンル直下にサイドバー UI

■ なぜこの設計
- preview v0 は mock だが dead リンクを減らし、発見→詳細→devlog の導線を通す
- 開発者検索ソートは作品検索と同様 URL 連動（共有パターン）
- 投稿フォームで分離した特徴タグを検索でも使えるように横展開

■ 他案不採用
- Studio mock 6タブ改修 — オーナー GO 前は触らない
- 特徴タグを開発者検索にも — スコープ外

■ スコープ In / Out
- In: developer-profile-v0-page, developer-search-v0-page, works-search-page, mock data, docs
- Out: Supabase、本番 deploy、Studio polish

■ 今回変更した画面
- 開発者プロフィール /creators/sora-games — 完成品クリックで /games/seikat-no-tabiji。開発ログ→?tab=devlog
- 開発者検索 /search/creators — 上部3ソートボタン。例 ?sort=followers
- 作品検索 /search — サイドバー「特徴タグ」。例 ?tag=癒し系,協力プレイ

■ ユーザー目線の変化
- 開発者ページから作品・devlog に飛べる
- 開発者をフォロワー数等で並べ替え可能
- 癒し系など特徴で作品を絞れる

■ 注意事項
- mock データのみ。全開発者 ID で同じ2 devlog テンプレになるフォールバックあり
- ゲーム詳細 ?tab=devlog は初回表示のみ（タブ切替は URL 非連動 — 既存仕様）

■ オーナー確認手順
1. /creators/sora-games — 完成品→ゲーム詳細、開発ログタブのリンク
2. /search/creators?sort=followers — 並び替え
3. /search?tag=癒し系 — 夏の向こう側等が残ること
4. （別途）Studio ルート整理の実機レビュー

■ 今すぐ私がやるべきこと
- Preview 反映後 1〜3 を確認。Studio は別途レビュー

■ Cursorだけで完了できること
- Studio レビュー指摘反映、S-22（GO 後）

■ 次に検討すべきこと
- Studio S-22 5タブ化（オーナー GO）
- preview 認証 middleware（本番前）

■ ChatGPTに相談したい論点
- 特になし
