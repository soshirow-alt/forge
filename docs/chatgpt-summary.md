■ 現在の状態
- P-05 作品検索 `/search` を v0 写経 mock UI で新規追加（ローカル build 成功）
- Player Shell 共通 — マイページ・作品検索で activeNav 対応
- preview push 済 commit 5d1583c（P-05 作品検索 /search）

■ 今回実装したこと
- /search — 作品を探す（P-05）。?q= クエリ対応（未指定時「ファンタジー」）
- レイアウト: Player Shell + メインリスト + 右絞り込みパネル（マイページ・プレイ履歴と同型）
- モック05参考:
  - パンくず ホーム（発見）› 検索結果
  - H1「{query}」の検索結果 + 1,248件
  - おすすめ順 + リスト/グリッド切替
  - 作品カード8件（サムネ・説明・タグ・開発者✓・更新・❤️💬・PF）
  - ページネーション 1–8 / 25ページ stub
  - 右: キーワード・ステータス・ジャンル・プレイ環境・その他 + この条件で検索
- PlayerShell 拡張: activeNav（作品を探すハイライト）、headerSearchDefault
- サイドバー「作品を探す」→ /search にリンク

■ 今回変更した画面
- P-05 作品検索 /search（新規）
  - 画面位置: Player Shell。左ナビ「作品を探す」active、中央リスト+右FF
  - 確認: /search または /search?q=ファンタジー
- 既存: /mypage — activeNav=mypage に更新（見た目は従来どおり）

■ 変更ファイル
- app/search/page.tsx（新規）
- components/works-search-page.tsx（新規）
- lib/search-v0-mock-data.ts（新規）
- components/player-shell.tsx
- components/mypage-page.tsx

■ 注意事項
- mock データのみ。フィルタ・検索ボタンは UI stub
- `/` 発見ホームは未変更
- prod deploy 禁止 — preview push は GO 待ち

■ 今すぐ私がやるべきこと
- /search 目視確認。OK なら push GO

■ Preview URL（push 後）
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/search
