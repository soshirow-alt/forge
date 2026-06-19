■ 現在の状態
- ブランチ preview/landing-01。Studio S-20〜S-27 v0 mock 実装完了。push 予定
- Player v0 01–18 + Studio 全画面 mock（Supabase 未接続）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app

■ Forge原典コアループ（判断の基準）
- 開発者: 投稿 → 声を受け取る → 改善する → 開発ログ公開 → 再プレイ獲得
- Studio は Player v0 と同一 Forge UI。管理画面化・Steamworks 化なし

■ 今回実装したこと
- Studio 全画面 v0 mock（S-20〜S-27）
  - S-20 /studio — 作品5件・最近の動き・ランキング抜粋・Forgeで起きていること・開発ヒント
  - S-21 /studio/projects — 検索・フェーズフィルタ・ソート・カード一覧・新規投稿
  - S-22 /studio/projects/[id] — 6タブ（概要/声を見る/みんなの声/Devlog/バージョン/正式版）
  - S-23 /studio/rankings — 見届け/声/成長/正式版到達タブ
  - S-24 /studio/profile — プロフィール・到達記録・代表作品・活動・フォロワー
  - S-25 /studio/notifications — 開発者通知カード・deep link 対応
  - S-26 /studio/settings — アカウント・公開設定 + 共通通知フォーム
  - S-27 /studio/guide — 育成サイクル6ステップ
- StudioShell 更新 — 通知 Sidebar、/studio/rankings、/studio/profile、/studio/guide
- ForgeSettingsForm — Player/Studio 通知を1画面内2セクション。/settings と /studio/settings 双方からアクセス
- /studio/getting-started → /studio/guide リダイレクト

■ 今回変更した画面
- Studio 全8画面 + Player 設定（通知セクション統合）
- 画面位置: C-04 Studio Shell 配下
- 変更前: S-20 のみ mock、他 stub
- 変更後: ドラフト S-20〜S-27 準拠の v0 mock 一式
- 確認手順: /studio → Sidebar 全項目 → 作品カード → 6タブ → Player 切替 → /settings で通知2セクション確認

■ ユーザー目線の変化
- 開発者が Studio 内で作品育成の全導線を mock で体験できる
- 通知設定は Player/Studio を同じ画面で分けて管理（URL は /settings か /studio/settings）

■ なぜこの設計
- オーナー判断: 通知設定は1か所（共通フォーム）だが Player/Studio は画面内で分離
- Player v0 コンポーネント踏襲（Shell、タブ、カード、トグル）

■ 他案不採用
- Player/Studio で別々の通知設定データ — 共通 ForgeSettingsForm に統一（v0 は各ページ session state）

■ In / Out
- In: Studio 8画面 mock、共通設定、Shell、mock データ、getting-started リダイレクト
- Out: Supabase 連携、通知設定の永続化、投稿フロー本実装

■ 注意事項
- mock のみ。ForgeSettingsForm の Player/Studio トグルはページ間で状態共有しない（v0 限界）
- 旧 /projects/[id]/studio は未削除（レガシー）

■ 今すぐ私がやるべきこと
- preview で Studio 全導線を目視確認
- 6タブ・通知 deep link の動作確認

■ Cursorだけで完了できること
- 通知設定を localStorage で Player/Studio 間共有
- forge-screen-definition ドラフトの GO 反映
- 旧 /projects/[id]/studio から新 URL へリダイレクト

■ 次に検討すべきこと
- 投稿完了後の着地 URL
- 通知設定永続化（Supabase）

■ ChatGPTに相談したい論点
- v0 の通知設定状態を localStorage 共有するか、実装フェーズまで待つか
