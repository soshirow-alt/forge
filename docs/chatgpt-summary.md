■ 現在の状態

本番 bffe4ff + Supabase migration 001/002/003 適用済み。devlog は本番確認済み。localStorage Step 2（デッドコード削除）を実装・build 成功。push/deploy 待ち or 実施中。

■ 今回実装・確認したこと

DB保存のコード調査：応援・更新を追う・あとで見る・FB・プレイ・devlog・devlog通知はすべて Supabase のみ（LS フォールバックなし）。Step 2 削除：play-session.ts、feedback LS、loadDeveloperProfiles、demo support/feedback seed。

■ ユーザー目線の変化

画面の見え方は変わらない。裏側の dead code のみ整理。

■ 本番で確認済みのもの

- 開発ログ投稿 → ゲスト別ブラウザ表示 OK
- Vercel 本番 = commit bffe4ff Ready

■ まだ localStorage に残っているもの

- forge-notifications（応援/FB/テスター通知・オーナー向け・端末ローカル）
- forge-applicant-counts（テスター応募数）
- forge-follower-counts / forge-following-creators
- forge-game-extras（プレイ時間・観点）
- forge-demo-project-ids（デモ用）

■ 次にマイページへ進める状態か

ほぼ YES。コアデータは DB 一本化済み。オーナーが応援・追跡・保存の別ブラウザ再現を確認すればマイページ着手 OK。

■ オーナーが画面で確認すべきこと

1. ログイン → 応援 → 別ブラウザ（同アカウント）で「応援中」維持
2. 更新を追う → 別ブラウザで「更新を追跡中」維持
3. あとで見る → /bookmarks に表示、別ブラウザでも維持
4. （任意）プレイ → FB 送信 → プレイヤーの声に反映
5. （2アカウント）watch → devlog → /notifications

■ 今すぐ私がやるべきこと

上記 1〜3 を本番で確認。「本番OK」でマイページへ。

■ Cursorだけで完了できること

- マイページ最小版実装
- push/deploy 後の不具合調査

■ 次に検討すべきこと

1. コア engagement 別ブラウザ確認（オーナー）
2. マイページ最小版
3. extras / オーナー通知の DB 化（低〜中優先）

■ ChatGPTに相談したい論点

マイページ最小版に最初から載せる項目（応援中・追跡中・保存・自分の作品・自分のFB）。

■ 運用メモ（Cursor 自身への指示）

返答末尾に必ず text ブロック。省略禁止。

■ localStorage 分類（要約）

削除済み：play-session、feedback LS、developer profile LS、demo support/feedback seed。
残す：notifications（非devlog）、applicant、follow、extras、demo-ids。
DB移行後回し：応援通知、extras、follow、applicant。
