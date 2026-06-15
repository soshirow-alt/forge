Forge ChatGPT 用サマリ — studio / mypage 更新 / メンテ一括 deploy

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（push 後 Vercel 自動 deploy）
- 今回: メンテ（用語統一 + 死コード削除）+ IA 一括（studio / my-projects 整理 / 詳細 owner 導線 / mypage 更新 / 通知 deep link / nurture リンク共通化）
- migration: なし（008 は未適用のまま）
- オーナー GO: メンテ + まとめて IA 実装 + commit/push/deploy

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 開発者: 投稿 → 育成（studio）→ 回答確認 → 改善 → 再公開
- プレイヤー: 発見 → プレイ → 回答 → 更新を見る → 再プレイ

■ 今回実装したこと
1. メンテ（前回 GO 分）
   - 用語統一: 回答/詳しい感想/届いた回答。FB/フィードバック/改善材料/返事排除
   - 削除: game-feedback.tsx, game-community-voices-section, developer-feedback-inbox, developer-next-actions-panel, developer-next-actions.ts, project-growth-card.tsx
2. /projects/{id}/studio 新規
   - GameGrowthCycle + ProjectNurtureActions + 作品ヘッダ + Primary CTA
   - #feedback で届いた回答パネルへスクロール
   - オーナーのみ。非オーナーは /games/{id} へ
3. /my-projects 整理
   - ProjectListCard（状態サマリ + 「この作品を育てる」→ studio）
   - ?focus= → studio へ replace リダイレクト
4. /games/{id} 所有者 sidebar
   - 「この作品を育てる」→ studio のみ。edit/devlog 直リンク撤去
5. /mypage#updates
   - MyPageUpdatesSection: 追跡中の devlog/新版、開発の歩み・再プレイリンク
6. /notifications
   - devlog → /games/{id}#game-project-history
   - version_published → #new-playable-version-banner
7. lib/project-nurture-links.ts
   - PROJECT_NURTURE_ACTIONS, section id, notificationTargetHref 等を一元化
8. middleware: /projects/ をログイン必須に追加

■ 今回変更した画面
--- 作品育成ページ（新規） ---
画面名: 作品育成
URL: /projects/{id}/studio
画面位置: 全ページ（ヘッダ下）
内容: 作品名/版/サイクル、次にやること Hero、Primary CTA、届いた回答（GameGrowthCycle）、やること一覧 5 リンク
確認: ログイン → 自分作品 → my-projects「この作品を育てる」

--- 開発マイページ ---
URL: /my-projects
変更前: 各作品に GameGrowthCycle フル表示 + ?focus=
変更後: コンパクト一覧 + studio へ。育成詳細は studio のみ
確認: 作品が複数あっても一覧が短く、CTA が studio へ

--- 作品詳細（所有者） ---
URL: /games/{id}
変更前: sidebar に 5 直リンク + my-projects?focus=
変更後: 「この作品を育てる」→ studio + テストプレイのみ
確認: 自分作品を開く → プレビューバッジ + studio 1 ボタン

--- マイページ ---
URL: /mypage#updates
変更前: 更新を追う = 作品リストのみ
変更後: 「更新を見る」セクション（devlog/新版 + 開発の歩み・再プレイ）
確認: 追跡中作品あり → 更新カード表示

--- 通知 ---
URL: /notifications
変更: devlog/新版カードが #game-project-history / #new-playable-version-banner へ
確認: 開発日誌通知タップ → 詳細の開発の歩みへスクロール

■ ユーザー目線の変化
- 開発者: 「次に何をするか」が studio 1 URL。my-projects は入口一覧
- プレイヤー: 追跡作品の変化が mypage で見える。通知から開発の歩みへ直行
- 詳細: 所有者はプレイヤー体験プレビューに専念、作業は studio

■ build / lint / deploy
- npm run build: 成功（/projects/[id]/studio 追加）
- migration: なし
- deploy: push → Vercel prod（オーナー依頼どおり）

■ 今すぐ私がやるべきこと（本番確認 5 分）
1. /my-projects →「この作品を育てる」→ studio 表示（Primary CTA / 回答 / やること）
2. 自分作品 /games/{id} → sidebar studio のみ（直リンクなし）
3. /mypage →「更新を見る」セクション（追跡作品で devlog または新版）
4. /notifications → devlog 通知 → #game-project-history へ
5. 旧 URL /my-projects?focus={id} → studio へリダイレクト

■ Cursorだけで完了できること
- 008 migration 本番適用手順の SQL レビュー
- nurture 読了 Supabase 化
- voice / 詳しい感想 統合設計

■ 残リスク
- nurture 読了は localStorage のまま（端末跨ぎ不可）
- voice / structured feedback 二重構造は未整理
- mypage 更新は通知 + 最新 devlog ベース（「前回プレイ以降」差分 UI なし）
- project-growth-card 削除済み。studio が育成 UI の唯一の詳細画面

■ 次に検討すべきこと
- migration 008 本番適用
- voice / 詳しい感想 DB 統合方針
- nurture 読了 Supabase 化
- RLS 監査

■ ChatGPTに相談したい論点
- mypage 更新を通知依存のまま育てるか、プレイ記録ベース diff を先にするか
- studio から devlog/edit への Primary CTA 順序は現状の project-growth-state でよいか
