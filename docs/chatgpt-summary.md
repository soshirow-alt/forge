■ 今回のテーマ
「新版公開 → 再プレイ → 新FB」ループ接続。コード実装完了。build成功。commit/push済み想定。本番 migration 005 + deploy は未実施（GPT判断用メモ後にオーナー操作）。

■ 設計判断（確認事項への回答）

user_notificationsで対応可能か: 可能。003の通知基盤を拡張。

migration必要か: 必要（005）。type CHECKがdevlogのみ、RLSもdevlogのみのため。005でversion_published追加、published_version列、RLS更新。

新通知type: version_publishedを追加。版bump時はversion_publishedのみ（devlog通知と二重送信しない）。版bumpなしdevlogは従来devlog通知。

追跡中ユーザー判定: project_watches（002）。isWatching(gameId)、通知はfetchWatcherUserIds。

バナー表示条件: ログイン + watch中 + 現行playable_version向けFB未投稿 + 過去に別version_key向けFBあり（初回プレイヤーには出さない）。

通知重複対策: 1 devlog投稿=1 insert。版bump時devlog通知は送らない。0.2→0.3は版ごとに新通知（意図どおり）。

既存FB編集: 変更なし。同版UPDATE、新版は新規INSERT。バナーは旧版FBあり+現行版FBなし。

実装難易度: 中（低〜中）。新pageなし。005+通知分岐+バナー1コンポーネント。

リスク: 005前deployで通知insert失敗（005→deploy順で回避）。mock作品は通知対象外。

■ なぜこの設計にしたか

Forge原典ループの最後「再プレイ→新FB」が未接続だった。004で版bumpは技術成立、watchもあるがプレイヤーに伝わらない。

version_publishedをdevlogと別typeにした理由: オーナー判断「新しいプレイ可能版公開はコアループ直結で概念的に別」。将来通知一覧フィルタ・UX整理が容易。版bump時にdevlog+version二重通知はノイズになるため版bump時はversionのみ。

バナー条件に「旧版FBあり」を入れた理由: 初回プレイヤーに「新版」と誤表示しない。FB version_keyで新版判定可能で追加migration不要。

■ 他案を採用しなかった理由

devlog通知メッセージだけ変更: type分離できず将来整理困難。
版bump時devlog+version二重通知: ノイズ。
LSに新版フラグ: 端末間非共有、原典違反。
playsテーブルに版記録: migration増、FB version_keyで足りる。

■ In / Out

In: 版bump時watch通知(version_published)、通知→作品詳細(#バナー)、追跡中向け新版バナー、再プレイ+新FB案内文。

Out: ホームタブ再設計、作品dashboard新設、extras DB化、AI、Realtime、Push、旧版FB履歴UI（オーナー指定どおり）。

■ 実装内容

migration 005_version_published_notifications.sql
lib/notifications.ts: version_published type、createVersionPublishedMessage
user-notifications-db: insertVersionPublishedNotifications
games-provider: addDevlogで版bump時version通知、getNewPlayableVersionBannerState
components/new-playable-version-banner.tsx
game-detail-page-client: バナー配置
notifications-page: version_publishedは#new-playable-version-bannerへリンク

■ 本番手順（必須順）

1. Supabase Dashboardで005 SQL Run
2. 確認: user_notificationsにpublished_version列、typeにversion_published可
3. Vercel本番deploy
4. オーナー5分確認（下記）

■ オーナーが確認する手順（5分・2アカウント推奨）

前提: 005適用 + deploy済み

アカウントB（プレイヤー）: 作品を「更新を追う」→ プレイ → 版0.1向けFB投稿
アカウントA（開発者）: devlog投稿 + 「新しいプレイ可能版として公開」ON → 版0.2
アカウントB: 通知に「新しいプレイ可能版」→ タップ → 作品詳細にオレンジ色バナー
B: 再プレイ → FBフォームが空（0.2向け）→ 投稿 → バナー消える

1アカウントのみ: 開発者が版bumpまで確認 → B確認は後日可

■ Cursor推奨案
[B] 事前確認推奨 — Dashboardで005 → 確認 → deploy

■ 推奨理由
005は小さなALTER+RLS。004と同パターン。deploy先行は通知insert失敗で版bump体験が壊れる。

■ 懸念点
005未適用でdeployすると版bump時watch通知が失敗（devlog自体は成功）。同一メンテ窓推奨。

■ 今すぐ私（オーナー）がやるべきこと
GPT判断用メモをChatGPTに貼る → 承認後 Dashboardで005 → deploy GO → 5分確認

■ Cursorだけで完了できること
005適用・deploy GO後の本番deploy実行（指示後）

■ 次候補（今回やらない）
extras DB化（focus_notes等）。ホームタブ統合。旧版FBプレイヤー表示。

■ 詳細ドキュメント
docs/version-published-loop-design.md
docs/supabase-dashboard-migration-guide.md §005
supabase/migrations/005_version_published_notifications.sql

■ Cursor連携
GPTには本ブロックのCopyを使用。粒度標準: docs/chatgpt-summary-format.md
