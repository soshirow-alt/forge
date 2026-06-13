■ 現在の状態

本番 forge-flame-gamma。Supabase migration 001/002/003 適用済み。コア engagement 本番確認済み。マイページ最小版（/mypage）実装・build 成功。push/deploy 実施予定。

■ 今回実装したこと

/mypage：応援中・更新を追う・あとで見る・投稿した作品の4セクション。DB の project_supports / project_watches / project_bookmarks / projects のみ参照。新規テーブルなし。ヘッダーにマイページリンク。

■ 設計整理（実装前）

■ マイページの画面構成案
/mypage — 4セクション縦並び（応援=橙 / 追跡=amber / 保存=灰 / 投稿=灰）。各セクションに意味の説明文。投稿作品はコンパクト行+ダッシュボードへの導線。

■ 必要なDB参照
project_supports, project_watches, project_bookmarks（fetchUserEngagement 済み）, projects（owner_id）。

■ 現在のDBで実現可能か
はい。追加 migration 不要。

■ 新規テーブルが必要か
不要。

■ Cursor推奨案
既存 games-provider の engagement state をそのまま使い、/my-projects（開発者ダッシュボード）とは URL を分離。

■ 推奨理由
DB・UI ともに追加コスト最小。プレイヤー視点と開発者管理を混ぜない。

■ 懸念点
/bookmarks と内容が重複。将来統合 or リダイレクト検討可。

■ ユーザー目線の変化

「応援した」「追跡している」「保存した」「投稿した」がマイページで一覧できる。

■ 本番で確認済みのもの

- 応援・追跡・保存・devlog の DB 保存（別ブラウザ OK）

■ まだ localStorage に残っているもの

- forge-notifications, forge-applicant-counts, follow 系, forge-game-extras, forge-demo-project-ids

■ 次にマイページへ進める状態か

実装完了。本番 /mypage の画面確認が次。

■ オーナーが画面で確認すべきこと

1. ログイン → ヘッダー「マイページ」
2. 応援・追跡・保存した作品が各セクションに表示
3. 投稿作品が「自分が投稿した作品」に表示
4. 空セクションの説明文が分かりやすいか

■ 今すぐ私がやるべきこと

本番 /mypage を開いて上記 1〜4 を確認。

■ Cursorだけで完了できること

- /bookmarks と /mypage の統合検討
- extras DB 化（低優先）

■ 次に検討すべきこと

1. マイページ本番確認
2. extras カラム
3. オーナー通知 DB 化

■ ChatGPTに相談したい論点

/bookmarks を /mypage#bookmarks に統合するか、両方残すか。

■ 運用メモ（Cursor 自身への指示）

返答末尾に必ず text ブロック。省略禁止。
