■ 現在の状態
- ブランチ preview/landing-01。P0 実データ Studio で「次に直すこと」カードが常時見えるよう修正済み（build 成功、push 予定）
- migration 015 / Phase C は引き続き保留（オーナー GO まで DB 変更なし）
- オーナー報告: 実データ Studio を開いたつもりが、タブ付き旧 v0 画面（概要/声を見る/…/正式版）のみで P0 カードが見えない

■ 原因（調査結果）
- スクショの UI は StudioProjectDetailPage（mock v0）の特徴。ForgeHeader ではなく StudioShell、6 タブ、概要編集フォーム
- 正本の ProjectStudioPage は ForgeHeader、「改善ループ Studio · 実データ」ラベル、GameGrowthCycle、「次に直すこと」カード（data-forge-p0=top-priorities）
- よくある誤り: /studio/projects 一覧のサンプルカード → /studio/projects/hoshino-kioku 等（mock、P0 カードなし）
- 正しい URL: /projects/{Supabase UUID}/studio（ログイン + オーナー）。マイページ作品管理・投稿完了・新設の「あなたの作品 — 改善ループ」からも同 URL

■ 今回実装・修正したこと
1. app/projects/[id]/studio/page.tsx — 常に ProjectStudioPage のみ（mock フォールバック削除。正本 URL は実データ専用）
2. components/project-studio-page.tsx — ヘッダー直下に StudioTopPrioritiesPanel を維持。読み込みゲートを緩和（feedback/voice 待ちでページ全体をブロックしない）。ヘッダーに「改善ループ Studio · 実データ」と /projects/{id}/studio を表示
3. components/studio-top-priorities-panel.tsx — 空でもカード表示。「まだ次に直すことはありません」「声が届くとここに表示されます」。data-forge-p0=top-priorities
4. components/studio-owned-projects-section.tsx — 新規。ログインオーナーの Supabase 作品を /projects/{id}/studio へ直リンク
5. components/studio-home-page.tsx / studio-projects-page.tsx — 実データリンクを最上部に配置。mock 一覧は「サンプル作品（プレビュー）」と明示

■ 今回変更した画面
【実データ Studio】URL /projects/{作品ID}/studio
- 画面位置: ログイン後、ForgeHeader 下。作品サムネ+タイトルヘッダーの直下
- 変更前: 404 や mock 混在の可能性、カードが見えない報告
- 変更後: オレンジ枠「次に直すこと」がヘッダー直下に常時表示（中身ゼロでも空状態コピー）
- 開発者視点: 声・FB 未着でも「次に何を直すか」の場所が常にある
- 確認手順: ログイン → マイページ作品管理の Studio リンク、または /studio/projects 上部「あなたの作品 — 改善ループ」→ オレンジカードと data-forge-p0 属性を確認

【Studio ホーム / プロジェクト一覧】/studio / /studio/projects
- 変更前: mock カードのみで実データ Studio への導線が弱い
- 変更後: 上部に実データ作品リンク、下に「サンプル作品（プレビュー）」注記
- 確認: mock カードを開くと従来タブ UI（P0 対象外）。実データリンクで P0 カード

■ ユーザー目線の変化
- /studio から mock を開いても「これが Studio 全部」と誤解しにくくなった
- 自分の作品は明示的に /projects/.../studio に誘導され、P0「次に直すこと」を検証できる
- 声がまだなくても空状態メッセージで「ここが優先候補の場所」と分かる

■ 注意事項
- mock（/studio/projects/{slug}）には P0 カードは意図的に未実装。正式版タブも P0 では触らない
- /projects/ 配下は middleware でログイン必須。未ログインは /login
- 実データ Studio はオーナーのみ（非オーナーは /games/{id} へ）

■ 今すぐ私がやるべきこと
- preview デプロイ後、自分の Supabase 作品 ID で /projects/{id}/studio を直接開く
- ヘッダー直下の「次に直すこと」と「改善ループ Studio · 実データ」ラベルを確認
- mock（例 hoshino-kioku）と実データ URL の見た目差を一度比較し、以降は実データ URL のみ P0 検証に使う

■ Cursorだけで完了できること
- push 後の preview URL 共有
- マイページ・通知・submit 完了導線の studio リンクがすべて projectStudioPath か再点検
- Phase C（migration 015）草案の GO 待ち整理

■ 次に検討すべきこと
- mock Studio を P0 検証から完全に外すか、バナーで「プレビューのみ」と全画面表示するか
- S-22 5 タブ化は P0 後。現状 mock 6 タブはそのまま

■ ChatGPTに相談したい論点
- P0 検証期間中、/studio/projects の mock カードを非表示 or 折りたたみにするか（混乱防止 vs デモ需要）
