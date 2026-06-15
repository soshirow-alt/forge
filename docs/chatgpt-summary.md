Forge ChatGPT 用サマリ — MVP完成向け一括 deploy

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（deploy 後 commit を報告）
- 前回: d7443b3 voice 中心化
- 今回: MVP P1/P2 一括（用語・更新導線・studio・通知・所有者プレビュー）
- DB migration: なし

■ Forge原典コアループ
- 発見 → プレイ → 回答 → 改善 → 更新を見る → 再プレイ
- 今回はループ後半（更新を見る・studio 導線・用語統一）を完成寄せ

■ 今回実装したこと
P1-① 用語掃除
- 詳しい材料 → 詳しい感想（game-deep-feedback-form）
- フィードバック → 回答/コミュニティ用（devlogs, demo-setup, submit-page, project-activity）
- 視覚的フィードバック（ゲーム内演出）は維持

P1-② 更新を見る導線
- mypage-updates-section: 「前回遊んだあとに変わった点」コピー、変更要点サマリ、新版/ devlog の action 文言
- notifications-page: mypage#updates リンク、getNotificationActionHint で種別ごと次アクション
- game-project-history-section: プレイヤー向け「前回プレイ後の変化」コピー
- lib/notifications.ts: devlog/新版メッセージを「何が起きたか」明示

P1-③ studio 磨き込み
- project-nurture-actions: studio では「届いた回答を見る」「プレイヤー向けプレビュー」を非表示（Hero と重複削除）
- project-studio-page: フッタープレビュー削除、ヘッダーにプレビュー1本
- lib/project-nurture-links: getProjectNurtureActions(context)

P1-④ 所有者プレビュー
- game-detail-sidebar: テストプレイ（任意）→ 確認用にプレイ
- new-playable-version-banner: sidebar 表記修正
- /games/{id} 開発者プレビューは既存（voice UI 非表示）維持

P2-⑤ nurture 読了
- Supabase 化は見送り（migration 009 必要、工数対効果）
- 理由: voice 版単位 localStorage は studio pending と整合。DB 化は端末跨ぎ・複数開発者共有が必要になってから

P2-⑥ 通知整理
- feedback 通知 href → studio 回答パネル
- プレイヤー voice/詳しい感想送信時の addNotification 削除（自己通知バグ解消）
- 開発者への「回答届いた」は studio growth state（my-projects バッジ）で代替（DB 通知は後続）

■ 今回変更した画面
- /mypage#updates — 更新カードに変更要点、通知相互リンク
- /notifications — action hint、マイページ更新リンク
- /projects/{id}/studio — CTA 整理、ヘッダープレビュー
- /games/{id} — 開発の歩みコピー、所有者 sidebar、新版バナー
- 詳しい感想フォーム — ボタン/読込文言

■ build / lint
- npm run build: 成功
- npm run lint: 66 errors / 489 warnings（既存 react-hooks 等、今回新規致命なし）

■ migration
- なし

■ 本番確認手順
1. /mypage#updates — 追跡作品の devlog/新版、変更要点、リンク
2. /notifications — 種別ごと action hint、マイページ更新リンク
3. /projects/{id}/studio — Hero 1本、その他のやること、ヘッダープレビュー
4. /games/{id} 所有者 — 確認用にプレイ、voice UI なし
5. プレイヤー回答送信後 — 自分に「回答が届きました」通知が出ないこと
6. 用語 — 詳しい感想、プレイヤーの回答（レガシー FB/材料なし）

■ MVP完成までの残タスク（優先順位）
【最重要】
1. 開発者向け「回答届いた」通知 DB 化 — 現状 studio/my-projects の growth のみ。別端末・非 studio 利用時の取りこぼし
2. nurture 読了 Supabase 化（009）— localStorage は端末限定
3. 本番 E2E 確認チェックリスト固定化 — オーナー/テスター向け手順書

【中】
4. 更新を見る — 新版公開時の priorVersion バナーと mypage 更新の整合テスト（edge case）
5. 非公開/下書き作品の studio・プレビュー導線
6. プレイヤー「変化を見る」 — 開発の歩みと新版バナーの初回表示 UX（localStorage 版管理の明確化）

【後回し OK（原典 Out）】
7. AI 集約 / SDK / Discord / ランキング / レコメンド
8. voice + feedback DB 統合
9. RLS 大改修（現状維持で MVP 可、再確認は別タスク）

■ 残課題（今回許容）
- nurture 読了 localStorage
- voice vs devlog 日時 edge case
- lint 既存エラー
- 開発者回答通知は studio 成長状態依存

■ 今回やらないこと（継続 Out）
- AI / SDK / DB統合 / RLS大改修

■ 変更ファイル一覧
- components/game-deep-feedback-form.tsx
- components/game-detail-sidebar.tsx
- components/new-playable-version-banner.tsx
- components/mypage-updates-section.tsx
- components/notifications-page.tsx
- components/project-nurture-actions.tsx
- components/project-studio-page.tsx
- components/game-project-history-section.tsx
- components/games-provider.tsx
- components/submit-page.tsx
- lib/notifications.ts
- lib/project-nurture-links.ts
- lib/devlogs.ts
- lib/demo-setup.ts
- lib/project-activity.ts
- docs/forge-changelog.md
- docs/forge-handoff.md
- docs/chatgpt-summary.md
