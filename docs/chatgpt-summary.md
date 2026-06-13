■ 現在の状態

開発ログと devlog 通知を Supabase 化した。投稿 → watches 参照 → 通知 bulk insert の流れで実装済み。本番には migration 002 + 003 の適用が必要。

■ 今回実装したこと

project_devlogs / user_notifications テーブル（003）と CRUD。開発ログの localStorage 保存を廃止。devlog 投稿成功後に watch ユーザーへ通知を一括作成。通知一覧は DB + 従来 LS（応援等）をマージ表示。

■ ユーザー目線の変化

開発ログが他端末・他ユーザーから見える。更新を追っている作品に開発ログが付くと、通知一覧に出る（ページを開いたタイミングで反映）。

■ 注意事項

migration 002/003 未適用だと保存・通知が動かない。Realtime・プッシュはなし。応援/FB 通知はまだ localStorage。

■ 次に検討すべきこと

本番 DB 適用と watch→devlog 通知の手動確認。LS 残骸削除。projects extras カラム追加。

■ ChatGPTに相談したい論点

（今回実装済み — 下記「設計判断」参照）

--- 設計判断：devlog 通知の実装経路 ---

■ Cursorの推奨案
devlog 投稿成功後、アプリ側で project_watches を読み、watch ユーザー分を user_notifications に bulk insert（採用済み）

■ 推奨理由
作成経路が1つの MVP では処理が追いやすく、trigger や Realtime なしで「通知一覧に出る」最低限を満たせる。

■ 懸念点
devlog 作成経路が増えたら trigger や共通関数への移行を検討。通知はページ表示時 fetch のため、即時バッジ更新はしない。
