■ 現在の状態
- ブランチ preview/landing-01。本番 prod deploy は保留
- Player v0 01–18 mock 完成済み。Studio S-20 ホーム v0 を今回追加
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- DB migration 変更なし

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- Studio ホームは開発者の「育成サイクル」を一望する入口。Steamworks 型管理画面ではなく Player v0 と同一 Forge 内 UI

■ 今回実装したこと
- StudioShell 新規 — PlayerShell と同一 v0 トークン（#0a0a0a 背景、zinc ボーダー、violet アクセント、rounded-xl カード）
- Sidebar 正本（オーナー指定）: ホーム / プロジェクト一覧 / ランキング ── マイページ ── 設定 / はじめてガイド
- トップバー: 検索 / 通知 / プロフィール / ログアウト or ログイン / Player 切替（紫アクセント）
- S-20 /studio — 添付モック準拠の5セクション mock
  - あなたの作品（横スクロールカード + 新規投稿 dashed カード）
  - 最近の動き（声・見届け・Devlog・初声）
  - 今週のスタジオサマリー（5 KPI + 育成サイクル進行度リング）
  - Forgeで起きていること（正式版 / 伸びている / 新規投稿 3列）
  - 開発のヒント（3カード）
- stub ルート: /studio/projects, /studio/projects/[id], /studio/settings, /studio/getting-started
- PlayerShell Studio ボタン — stub から /studio リンクに変更
- mock データ: lib/studio-home-v0-mock-data.ts

■ 今回変更した画面
- 画面名: Studio ホーム（S-20）
- URL: /studio
- 画面位置: Studio Shell メイン。Sidebar「ホーム」active
- 変更前: 未実装（Player トップバー Studio は stub ボタン）
- 変更後: 作品カード一覧 + 動き + 週次サマリー + コミュニティ3列 + ヒント3列
- プレイヤー視点: Player トップバー Studio → /studio へ遷移可能
- 開発者視点: 自分の作品の KPI と最近の動きを一覧。カードから /studio/projects/[id] stub へ
- 確認手順: preview で /studio を開く → 5セクション表示 → Sidebar 各項目 → Player ボタンで /home へ戻る

■ ユーザー目線の変化
- 開発者が Forge 内で Player と同じ質感の Studio に入れる
- 作品0件相当でも「新しい作品を投稿」カードで /submit へ誘導
- ランキング・マイページは既存 Player ルートへ（Shell は Player に切替）

■ なぜこの設計
- 添付モックの情報量を v0 ダークテーマで写経。別デザイン言語は作らない
- S-20 と S-21 の差別化は次フェーズ（今回 S-21 は一覧 stub のみ）

■ 他案不採用
- 旧 /my-projects + /projects/[id]/studio UI をそのまま流用 — Player v0 トーン不一致のため不採用
- サイドバーに Playerへ戻る — オーナー指定どおりトップバーのみ

■ In / Out
- In: Studio Shell, S-20 ホーム mock, 関連 stub, Player↔Studio リンク
- Out: S-22 プロジェクト詳細タブ、S-23 通知専用、検索フィルタ本実装、Supabase 連携

■ 注意事項
- すべて mock データ。本番 DB 未接続
- /rankings/influence / /mypage は PlayerShell のまま（Studio Shell 外）
- /studio/projects/[id] は stub 文言のみ

■ 今すぐ私がやるべきこと
- preview URL で /studio を目視確認（カード密度・紫アクセント・Player 切替）
- 問題なければ次は S-21 一覧本実装 or S-22 タブの優先を ChatGPT と決める

■ Cursorだけで完了できること
- S-21 検索・フィルタ UI mock
- S-22 プロジェクト詳細 6タブ stub
- Studio ランキングを StudioShell 内で表示（Player コンポーネント再利用）
- forge-screen-definition.md への S-20 正本追記

■ 次に検討すべきこと
- S-20 vs S-21 の役割固定（ダッシュボード vs フルリスト）
- Studio 通知を /studio/notifications にするか Player P-18 共用か

■ ChatGPTに相談したい論点
- S-22 6タブ実装の優先順（概要 vs 声を見る vs バージョン）
- Studio ランキングを Player 同一画面にするか Studio 専用にするか
