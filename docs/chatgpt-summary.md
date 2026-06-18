■ 現在の状態
- 01 `/landing` preview — branch `preview/landing-01`
- v0 正本: https://landing-page-recreation-psi.vercel.app/
- **実装完了（ローカル）**: canvas/scaler/mock-layout 廃止 → v0 responsive LP 置換
- prod deploy / `/` 反映 — **禁止維持**
- build: npm run build 成功（2026-06-18）
- preview push — **本返答後に実施予定**（オーナー Run 判断用メモ参照）

■ 今回実装したこと
- `components/landing-page.tsx` 全面書き換え（v0 構造写経）
- 削除: landing-page-canvas.tsx, landing-page-scaler.tsx, landing-mock-layout.ts, landing-overlay-tool.tsx
- `/landing/overlay` → 終了案内ページ（座標 overlay 廃止）
- アセット追加: public/images/landing/hero-bg.png, game-1〜5.png（v0 から取得）
- 依存: lucide-react 追加
- 方針反映: 白 primary CTA、自然スクロール、LP 専用注目カード、Studio/お知らせ一覧は準備中

■ 今回変更した画面
- **01 ランディング** — URL `/landing` — 全画面（preview 専用）
- **画面位置**: 未ログイン LP 確認用。ヘッダー → Hero（左コピー+3価値 / 右CTA2枚）→ 注目5列 → お知らせ card → フッター
- **変更前**: 1024px artboard + 全体 scale、H1 27px、グラデ placeholder カード、SP stub
- **変更後**: max-w-1320 responsive、H1 text-4xl/5xl、hero-bg + PNG カード hover、SP 同一ツリー
- **プレイヤー視点**: Hero 迫力・白「ゲームを探す」・注目サムネが見やすい → `/` へ
- **開発者視点**: 緑 Studio CTA（準備中 span）、新規登録は白ボタン
- **確認手順**: preview deploy 後 `/landing` を 1920/375 幅で目視。v0 Publish と並べて 5 軸（Hero/CTA/余白/発見/完成度）

■ ユーザー目線の変化
- LP が「縮小配置図」から「普通の LP」体感に
- CTA・注目作品がクリック可能・hover あり（発見への橋渡し）
- モバイルでも CTA と注目まで縦スクロールで到達

■ 触らない（維持）
- `/` 本番発見ホーム
- prod deploy
- Supabase / 認証

■ 注意事項
- 法務リンク・お知らせ一覧・Studio は準備中（v0 同様の未接続）
- overlay ルートは案内のみ — fb505643 比較は不可
- 注目カード説明文は v0 文案（01 旧モック文案と一部異なる — オーナー GO 済み v0 正本）

■ 変更ファイル一覧
- 新規/更新: components/landing-page.tsx, app/landing/overlay/page.tsx
- 削除: components/landing-page-canvas.tsx, landing-page-scaler.tsx, landing-mock-layout.ts, landing-overlay-tool.tsx
- 新規: public/images/landing/* (6 PNG)
- 依存: package.json, package-lock.json (lucide-react)
- docs: forge-changelog.md, ui-mocks/01-landing.md, chatgpt-summary.md, forge-handoff.md

■ 今すぐ私がやるべきこと
- preview push 後 `/landing` を v0 Publish と並べて目視確認
- OK なら Walkthrough / Phase1-B まで `/landing` 維持

■ Cursorだけで完了できること
- preview 目視差分の微調整（余白・タイポのみ、座標 overlay 禁止）
- 法務リンク接続（別タスク）

■ 次に検討すべきこと
- `/` LP 化タイミング（Phase1-B）
- 注目カード API 接続時に ForgeGameCard 再検討

■ ChatGPTに相談したい論点
- preview 目視で v0 との残差分があれば、写経修正 vs 意図的 Forge 差（紫アクcent）の線引き

■ Forge原典コアループ
- LP 印象再現は発見→プレイ入口強化。overlay 座標合わせは終了

■ Cursorの推奨案
- preview/landing-01 push → Vercel preview で `/landing` 確認

■ 推奨理由
- 実装・build 済。preview のみで prod/`/` 非触

■ 懸念点
- v0 写経のため CSS 微差の可能性 — 目視で 5 軸確認推奨
