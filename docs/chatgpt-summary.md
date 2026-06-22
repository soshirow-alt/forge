■ 現在の状態
- ブランチ preview/landing-01。Studio 本番ルート整理（第1波）はローカル実装済・push 待ち
- 今回: 作品投稿フォーム（/submit）のジャンル/特徴タグ整理 + プレイヤー問い設定 UX を実装（未 push）

■ 今回実装したこと
- lib/forge-genre-options.ts — 18ジャンルに整理（RPG・アクション…メトロイドヴァニア）。特徴系7項目を削除
- lib/forge-feature-tag-options.ts 新規 — ストーリー重視・癒し系・インディー・ピクセルアート・レトロ・協力プレイ等12タグ
- /submit — 特徴タグをジャンル直下へ移動。問い設定・関連リンクより上
- version-prompt-editor — テンプレ選択時は質問文欄を非表示（テンプレ＝質問文）。カスタムのみ質問文入力
- version-prompt-form — 回答形式表示を2行化（例: はい/いいえ + 自由記述（任意））
- voice-prompt-card + game-voice-section — 構造化問いに「ひと言コメント（任意）」欄。answer_label に「はい — コメント」形式で保存（集計は answer_value のまま）

■ なぜこの設計
- ジャンルと特徴タグの役割分離 — 検索・プロフィール好みジャンルはゲームタイプのみ。投稿時の「協力プレイ」「癒し系」等は tags 側
- テンプレ問いで質問文欄が重複表示されていた UX バグを解消
- 原典の初声 — 構造化回答 + 任意の深い材料。DB migration なしで optional コメントを answer_label に載せ、yes/no 集計は answer_value 維持

■ 他案不採用
- optional コメント用 DB 列追加 — 現状 answer_label で開発者に届くため見送り
- 特徴タグを検索フィルタにも即追加 — 今回スコープ外（genre フィルタのみ更新）

■ スコープ In / Out
- In: submit フォーム、VersionPromptEditor（edit も共用）、プレイヤー GameVoiceSection
- Out: v0 mock FB モーダル、Supabase migration、本番 deploy

■ 今回変更した画面
- 作品投稿 /submit — 変更前: ジャンル25項目に特徴混在、特徴タグが問い設定の下。変更後: ジャンル18 + 直下に特徴タグ12、問い設定はその下
- 問い設定（投稿・作品編集共通）— テンプレ選択時: 質問文欄なし、回答形式2行（はい/いいえ + 自由記述（任意））
- ゲーム詳細 初声 — はい/いいえ等の下に「ひと言コメント（任意）」

■ ユーザー目線の変化
- 開発者: ジャンル選びがすっきり。問い設定の二重入力が消える
- プレイヤー: はい/いいえ + 短い補足が可能

■ 注意事項
- 未 push。Studio 整理と合わせて RUN 可能
- /projects/{id}/edit も VersionPromptEditor 共用で同様

■ オーナー確認手順
1. /submit — ジャンルにストーリー重視・癒し系なし。特徴タグがジャンル直下
2. 自分で問い → テンプレ — 質問文欄なし、回答形式2行
3. カスタム — 質問文欄あり
4. ゲーム詳細初声 — 任意コメント欄

■ 今すぐ私がやるべきこと
- 確認後 RUN 指示

■ Cursorだけで完了できること
- push、微調整

■ 次に検討すべきこと
- 検索への特徴タグフィルタ
- Studio 整理 push

■ ChatGPTに相談したい論点
- 特になし
