■ 現在の状態
- P0 Phase A 404 修正完了。build 成功。push 予定
- 原因: mock ID を Supabase 実データ studio に渡して notFound()

■ 404 の原因（調査結果）
1. /studio/projects のカード ID は studioProjectsAll の mock（例 hoshino-kioku）
2. Phase A で /projects/{mockId}/studio に飛ばすと ProjectStudioPage が getSubmittedGameById で未検出 → notFound()
3. /projects/[id]/studio ルート自体は preview に存在する
4. redirect は動いていたが、先の正本ページが 404
5. 旧 studio route は削除されていない（app/projects/[id]/studio/page.tsx 存続）
6. mock 用 StudioProjectDetailPage も存続（studio-project-detail-page.tsx）

■ 修正内容
- isStudioMockProjectId() で mock / 実データを分岐
- mock: /studio/projects/{id} で v0 詳細（ログイン不要）
- 実データ: /projects/{id}/studio で growth-state + 上位3課題（ログイン要）

■ preview で確認できる URL
【mock — ログイン不要】
- /studio/projects/hoshino-kioku（星の記憶）
- /studio/projects/seito-no-tabiji（星灯の旅路）
- /studio/projects/roshin-no-zanko（炉心の残光）
- 一覧: /studio/projects

【実データ — ログイン + オーナー必須】
- /projects/{Supabaseのproject id}/studio
- 取得: /my-projects または /submit 完了後の作品 ID
- 上位3課題カードはこちらのみ（mock 詳細には未表示）

■ 変更ファイル
- lib/studio-projects-v0-mock-data.ts
- app/studio/projects/[id]/page.tsx
- app/projects/[id]/studio/page.tsx
- lib/studio-notifications-v0-mock-data.ts

■ migration 015
- 引き続き保留

■ 今すぐ私がやるべきこと
- preview で /studio/projects/hoshino-kioku が開くか確認
- 実データ検証は staging + 自分の作品 ID で /projects/{id}/studio

■ Runしてよいか
- preview push: 可
- migration 015: 保留
