■ 現在の状態
- ブランチ preview/landing-01、P-06 ゲーム詳細 v0 mock 実装完了（build/tsc OK）
- push 実施予定（本タスク RUN）
- Player Shell（サイドバー・トップバー）は未変更。メインコンテンツのみ v0 写経
- `/` 発見ホーム（旧 HomePage）は未変更
- `/games/[id]` は preview 上 v0 UI に差し替え（旧 GameDetailPageClient はファイル残存）

■ Forge原典コアループ（判断の基準）
- 発見 → プレイ → 声 → 変化 → 再プレイ
- 今回は「発見→詳細」の断絶を解消。詳細は Forge 最重要画面（P-06）

■ 今回実装したこと
- components/game-detail-v0-page.tsx — v0 モック06参考（星灯の旅路正本）
  - パンくず: ホーム > 作品を探す > 作品名
  - ヒーロー: キービジュアル + タグ + タイトル + リード + 開発者 + 統計4種
  - CTA: プレイする / 見届け中 / フォロー中 / あとで遊ぶ（mock 状態表示）
  - タブ: 概要（実装）/ 開発ログ / みんなの声 / 版の履歴（stub）
  - 概要: 作品紹介 + 特徴4カード + 開発者の悩み + 現在ほしい声
  - 右サイド: 開発者カード / 関連タグ / 関連作品3件
- lib/game-detail-v0-mock-data.ts — mock + id エイリアス（home/search card id → 詳細 id）
- app/games/[id]/page.tsx — GameDetailV0Page に差し替え
- リンク接続: discovery-home-page / works-search-page / mypage-page → /games/[id]

■ 今回変更した画面
- P-06 ゲーム詳細 /games/[id]（v0 差し替え）
  - 画面位置: Player Shell 内メイン（サイドバー・トップバーは既存 C-03 のまま）
  - 変更前: ForgeHeader + 旧2カラム詳細（GameDetailPageClient）
  - 変更後: v0 ヒーロー + タブ + 右メタ。CTA・FB は stub（プレイ/声モーダルは次 GO）
  - プレイヤー視点: home/search/mypage から作品名・カードで詳細に入れる
  - 確認手順: /home → カードクリック → /games/seikat-no-tabiji。タブ切替・CTA 表示確認
- 触っていない: player-shell.tsx（サイドバー・トップバー）、/ （旧発見）

■ ユーザー目線の変化
- v0 発見ルート（/home /search /mypage）からゲーム詳細に遷移できる
- 詳細も Player Shell 内で UI が揃う（ヘッダー二重化が解消）
- プレイ・FB 送信はまだ stub — ループは「発見→詳細」まで preview で完走可能

■ なぜこの設計
- Player Shell を変えずメインのみ写経 — オーナー指示どおりサイドバー/トップバー固定
- route を /games/[id] に置く — カードリンクの自然な URL。旧 client はファイル温存で将来統合可
- 非概要タブは stub — 写経フェーズでレイアウト優先。Devlog/声/版は次 GO

■ 他案不採用
- 別 URL（/games-v0/[id]）— カード href が二重化する
- 旧 UI と feature flag — preview ブランチでは v0 一本で十分
- Player Shell 改修 — 今回スコープ外

■ In / Out
- In: P-06 v0 UI、mock データ、発見→詳細リンク、route 差し替え
- Out: プレイ実接続、P-19 FB モーダル、Devlog/声/版タブ中身、本番データ、Player Shell 変更

■ リスク
- preview ブランチ merge 時に /games/[id] が旧機能から v0 mock に変わる — merge 前に GO 判断
- 旧 GameDetailPageClient の Supabase 連携は route から外れた — preview では mock 想定

■ Preview URL（push 後）
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/games/seikat-no-tabiji
- 導線: /home → 星灯の旅路カード / /search → 1件目

■ 今すぐ私がやるべきこと
- Preview /games/seikat-no-tabiji 目視（添付モックとの差分確認）
- OK なら P-19 FB モーダル or プレイ stub の GO

■ Cursorだけで完了できること
- P-19 初声/深いFB v0 モーダル
- Devlog / みんなの声 / 版の履歴タブ mock
- 旧 GameDetailPageClient との feature 統合（別 GO）

■ 次に検討すべきこと
- プレイ→FB モーダル（ループ完走）
- P-18 通知 Player Shell 統合
- merge 時に旧詳細を戻すか v0 に機能を載せるか

■ ChatGPTに相談したい論点
- preview で P-06 mock まで揃った後、旧詳細の Supabase 機能を v0 に載せる順序
