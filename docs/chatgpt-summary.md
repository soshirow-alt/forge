Forge ChatGPT 用サマリ — 009/010 + deploy + マイページ IA

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（deploy 前 commit a5ce6dd 系）
- migration 009/010: オーナーが Dashboard Run 予定 → 完了後 push/deploy
- 適用順（確定）: 009 → 010 → deploy（009/010 両方先、deploy 後に studio 読了失敗を避ける）
- build: npm run build 成功
- E2E 正本: docs/mvp-production-e2e-checklist.md（§6b マイページ IA 追加）

■ Forge原典コアループ
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 今回: voice 通知 DB 化 + 読了 Supabase + マイページ IA で開発者/プレイヤー導線を整理

■ 今回実装したこと（DB / 通知 / 読了）
- migration 009: voice_received, version_key, trigger, 未読集約
- migration 010: project_voice_reads + owner RLS
- アプリ: 通知 type/href、useNurtureVoiceRead Supabase 化、読了時 voice_received 既読
- docs/migration-009-010-apply.md, docs/mvp-production-e2e-checklist.md

■ 今回実装したこと（マイページ IA）
- ヘッダー「マイページ」1本化
- /mypage タブ: プレイヤー活動 / 作品管理（採用名称。候補は下記）
- プレイヤー: 2×2 ダッシュボード、3用語の定義ボックス、投稿作品をプレイヤー側から削除
- 作品管理: my-projects 内容をタブ化、2col グリッド、検索、要対応フィルタ
- /my-projects → /mypage?tab=developer リダイレクト（旧 URL 互換）
- getPlayedGames 追加（最近プレイしたカード用）

■ 名称案（採用と候補）
- 採用 — プレイヤー側タブ: 「プレイヤー活動」
  候補: 遊んだゲーム / あなたのゲーム活動 / 参加中 / プレイヤーとして
- 採用 — 開発者側タブ: 「作品管理」
  候補: 開発中の作品 / 開発者メニュー
- 理由: 行動ベースで短く、初見でも「何が見えるか」が伝わる

■ 3リストの定義（オーナー案をページ内に反映）
- 応援中: 好き・期待している作品（投げ銭ではない励まし）
- 更新を追っている: 開発ログ・新版の通知を受け取るリスト
- 更新を見る: 追跡中作品の devlog/新版の変更要点を確認する場所
- 整理: 「追う」= 通知設定、「見る」= 内容確認。役割分担で OK

■ 今回変更した画面
- ヘッダー: マイページ1リンクのみ（全ページ）
- /mypage: タブ UI + プレイヤーダッシュボード / 作品管理
  変更前: 縦長1ページ + ヘッダーに開発マイページ別リンク
  変更後: max-w-7xl、2×2 カード、タブ切替
  確認: ログイン → マイページ → 両タブ、/my-projects がリダイレクト
- /projects/{id}/studio: 戻りリンク「マイページ（作品管理）」
- /notifications: voice_received 表示（009 適用 + deploy 後）

■ ユーザー目線の変化
- 開発者: マイページ1か所。作品管理タブで studio へ
- プレイヤー: カード形式で一覧が短く。用語の違いがページ内で説明される
- voice 通知・読了: 009/010 適用後に studio 読了が DB 永続

■ なぜこの設計
- 009→010→deploy: 読了 UI が project_voice_reads 必須のため中間 deploy 回避
- マイページ統合: ヘッダー2リンク問題をタブで解消（新ルート増やさず query tab）
- DB 変更なし IA: 既存 engagement データのみ

■ 他案不採用
- /player / /developer 新ルート: スコープ外（query tab で十分）
- localStorage 読了移行: Out

■ In / Out
- In: 009/010 SQL、アプリ、E2E、マイページ IA
- Out: deep feedback 通知、push/メール、improvement DB

■ 注意事項
- オーナー: Dashboard 009 → 010 Run 後に push/deploy
- E2E: docs/mvp-production-e2e-checklist.md §0〜§6b

■ 今すぐ私がやるべきこと
1. Dashboard 009 SQL Run → 確認 SQL
2. Dashboard 010 SQL Run → 確認 SQL
3. push/deploy 完了確認
4. E2E チェックリスト実施

■ Cursorだけで完了できること
- deploy 後の E2E 起因の軽微修正
- 名称変更（タブラベルのみ）

■ 次に検討すべきこと
- deep feedback 開発者通知
- 作品管理タブの削除操作を compact カードにも露出するか

■ ChatGPTに相談したい論点
- タブ名「プレイヤー活動」「作品管理」で初見 OK か、または「遊んだゲーム」に寄せるか

■ 残リスク
- 009/010 未適用で deploy すると通知/読了が動かない
- /my-projects ブックマークはリダイレクトで吸収

■ 本番確認手順
1. 009/010 確認 SQL（migration-009-010-apply.md）
2. プレイヤー voice 回答 → owner 通知
3. studio 読了 → project_voice_reads 行
4. マイページタブ・2×2 カード・my-projects リダイレクト
