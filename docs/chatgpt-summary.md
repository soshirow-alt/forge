■ 現在の状態
- 見届け人 W1–W4 — main 反映完了（commit 771dfe6）
- Vercel deploy — GitHub commit status success（2026-06-16T14:43–14:44Z）
- 本番 URL https://forge-flame-gamma.vercel.app — 200 OK
- migration 014 — staging 適用済み、本番 Dashboard 適用は別 Run
- PLAYER_VISIBLE=false 維持
- tier — 設計レビュー草案のみ（docs/witness-tier-design-review.md）、実装 GO 前

■ 今回実装・反映したこと
- オーナー W4 UI レビュー GO 後、未 push だった witness Phase 一式を main に commit + push
- commit 771dfe6 — Add witness grants from eligibility through mypage UI
- 22 files — eligibility lib、014 SQL、verify/seed scripts、W4 mypage UI、witness docs、tier 草案
- push: 97aeb8f..771dfe6 on main
- Vercel 連動 deploy 完了を GitHub statuses API で確認

■ main反映結果
- branch: main
- commit: 771dfe6bfc2d8aadd401519f228f1a762160d555
- 前 commit: 97aeb8f（正式版 staging verify のみ）
- 含む: W1 eligibility、W2 migration 014 草案、W3 sandbox verify、W4 OfficialReleaseSection 見届け人カード
- 含まない: .tmp-chunk.js 等の一時ファイル

■ Vercel deploy確認
- GitHub statuses — state success、description Deployment has completed
- context: Vercel – forge-app / Vercel – forge（両方 success）
- 本番トップ curl — HTTP 200、Server Vercel
- /mypage — 未ログイン時は /login へ（原典どおり）

■ 今回変更した画面
- 画面: マイページ — 正式版到達セクション
- URL: /mypage#official-release
- 画面位置: マイページ本文内、正式版到達一覧（OfficialReleaseSection）
- 変更前: 正式版到達のみ emerald カード
- 変更後: grant 保持作品は teal 枠「正式版まで見届けました」+ バッジ「見届け人」+ 関わり方（grant_path）+ 付与日
- grant_path ラベル: multi_version=複数の版を遊んだ / voice=声を届けた / watch=更新を追っていた
- プレイヤー視点: 自分が正式版まで関わった証拠を自分だけのマイページで見られる
- 開発者視点: 作品詳細・人数・ランキング・通知は出さない（Out 維持）
- 確認手順: grant 保持ユーザーでログイン → #official-release へ → teal 見届け人カード
- 本番注意: 014 未適用なら grants 空 → 見届け人カードなし（従来 emerald のみ）— 想定どおり

■ /mypage#official-release 表示確認
- コード本番反映済み（771dfe6 deploy success）
- 本番 DB に 014 未適用のため、現時点の本番目視では見届け人カードは出ない可能性が高い
- staging では verify:witness:ui:staging PASS 済み
- 014 本番適用 + grant 保持アカウントで再目視が次の確認ポイント

■ tier設計案（次テーマ・実装前に設計 GO）
- 正本: docs/witness-tier-design-review.md
- 暫定閾値: grant 1 / 3 / 10 作品（distinct project_id、剥奪なし累計）
- 暫定名称: 見届け人 / 見届け人 Silver / 見届け人 Gold — 名称は再検討（件数競争・実績ゲーム感を避ける）
- 代替案: 見届け人 / 見届け人・なじみ / 見届け人・古参、または tier バッジなしで「N 作品を見届けました」テキストのみ
- 表示 In: マイページ・プロフィール（自分のみ）、静かな一文
- 表示 Out: 作品詳細人数、リーダーボード、獲得通知
- Phase 1 tier 推奨: 014 grant 行の実行時集計のみ（追加 migration 不要案）
- 文言例: 1作品=正式版まで見届けた作品があります / 3=複数の作品の正式版を見届けてきました / 10=多くの作品の育ちに関わってきました

■ ユーザー目線の変化
- main + deploy 後、本番 UI コードは見届け人表示対応済み
- 014 本番適用後、条件を満たしたプレイヤーはマイページだけで「正式版まで見届けました」を自分の記録として見られる
- 他人の人数・ランキングは見えない — 「自分が関わった証拠」の設計維持

■ 注意事項
- migration 014 本番 Dashboard 適用は別 Run（staging のみ適用済み）
- tier 実装、作品詳細表示、見届け人数、ランキング、通知、PLAYER_VISIBLE=true、adoption 表示 ON — すべて Out
- W4 GO 方針どおり: 表示は /mypage#official-release のみ

■ 今すぐ私がやるべきこと
1. tier 名称・文言 — docs/witness-tier-design-review.md §7 を読んで GO（Silver/Gold 採用か日本語のみか）
2. 014 本番適用 GO 時 — Supabase Dashboard SQL（docs/witness-phase-w2-migration.md 参照）
3. 014 本番適用後 — grant 保持アカウントで本番 /mypage#official-release 目視

■ Cursorだけで完了できること
- tier T0/T1 — 設計 GO 後 lib/witness-tier.ts + マイページ一行
- 本番 014 適用手順の再掲・verify スクリプト調整（Dashboard 適用はオーナー）

■ 次に検討すべきこと
- tier 表示 — バッジアイコン vs テキスト一行
- 014 本番 — W4 UI 先行済み、migration 適用タイミング
- tier T1 GO タイミング — main 反映後すぐ検討可（設計レビュー挟む）

■ In / Out
- In: main 反映、Vercel deploy 確認、tier 草案共有、W4 方針維持
- Out: tier 実装、014 本番（未 GO）、作品詳細、人数、ランキング、通知、PLAYER_VISIBLE

■ ChatGPTに相談したい論点
- tier 名称 — Silver/Gold を捨てて日本語のみにするか
- 014 本番 — 正式版 013 本番状況と合わせて一括適用するか witness 単独か

■ オーナーが確認する手順
1. GitHub commit 771dfe6 — Vercel status success
2. https://forge-flame-gamma.vercel.app 表示
3. docs/witness-tier-design-review.md — tier GO 判断
4. 014 本番 GO 後 — grant ユーザーで /mypage#official-release 目視
