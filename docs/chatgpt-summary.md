■ 現在の状態
- ブランチ preview/landing-01。Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 最新 push 済みは 9c9b7ae（プレイヤーホームサムネ）前後。本タスクのコミュニティ UI 改修はローカル未 push
- DB migration 変更なし。コミュニティ v0 は localStorage + mock データのまま
- オーナー共有の GPT mock（開発者マイコミュニティ A-1〜A-4）を正本として UI を寄せた

■ Forge原典コアループ（判断の基準）
- 発見→プレイ→初声→次に直すこと→次版の学習ループ
- コミュニティは開発者とフォロワーの継続交流・参加申請の見届け。版改善の初声導線を補強する増幅レイヤー

■ 今回実装したこと
- components/community-hub-page.tsx を GPT mock に合わせて再構成
- lib/community-v0-mock-data.ts — studioCommunityProfile、DevlogQuoteRef に image/publishedAt/likeCount/commentCount、mock 文言・ハンドル調整
- lib/community-join-v0-store.ts — 参加申請に message フィールド、初期申請を星野ひかり（hikari_7）、参加者 mock をそら/ゆき/うみ に更新

■ 今回変更した画面
- 開発者マイコミュニティ /studio/community
  - 画面位置: StudioShell 内サイドバー「マイコミュニティ」→ メイン
  - 変更前: 簡素なテキストヘッダー、常時表示の compose、テキストのみ Devlog 引用、申請は名前のみ・申請なし時はセクション非表示
  - 変更後:
    - ヘッダー下にコミュニティ情報カード（アバター・しゃねこコミュニティ・参加者128人・コミュニティ設定ボタン v0 準備中）
    - サブコピー「フォロワーと交流し、一緒にゲームを育てましょう」
    - 掲示板タブ: 紫の「フォロワーへ連絡」→ 展開で宛先/Devlog 引用/メッセージ/0〜1000字/キャンセル
    - 投稿フィード: Devlog 引用をサムネ・日付・いいね/コメント付きカードで表示
    - 参加者タブ: 新しい参加申請（星野ひかり + 申請文）、承認（緑）/拒否（赤）、申請ゼロ時は空状態イラスト文言
  - 開発者視点: mock と同じ操作フローでフォロワー連絡・参加審査ができる（v0 mock 動作）
  - 確認手順:
    1. /studio/community を開く
    2. 掲示板 — 既存投稿の Devlog カード、フォロワーへ連絡で compose 展開→投稿
    3. 参加者 — 星野ひかりの申請文と承認/拒否。localStorage をクリアすると空状態も確認可

- プレイヤー参加コミュニティ /mypage/community
  - 画面位置: プレイヤーシェル「マイコミュニティ」
  - 変更: 開発者側と同型の投稿カード（Devlog リッチカードは開発者投稿にのみ表示）。compose は従来どおりテキストのみ

■ ユーザー目線の変化
- 開発者: mock 通り「コミュニティの顔」が見え、フォロワーへの連絡がボタン1つから始まる
- 開発者: 参加申請にプレイヤーの一言が見え、承認判断しやすい
- プレイヤー: 開発者投稿の Devlog 引用が視覚的に分かりやすい

■ なぜこの設計
- GPT mock を v0 の見た目正本とし、既存 localStorage フロー（申請/承認/投稿）は維持。Supabase 接続は次フェーズ
- compose を折りたたみにしたのは mock A-1/A-2 の情報密度と一致。常時表示は掲示板が埋まるため
- 参加者数 128 は mock 表示用固定（実メンバー数と乖離あり）。v0 ではラベル優先

■ 他案不採用
- コミュニティ設定を /studio/settings へ即リンク — mock に詳細画面なし。v0 は disabled+準備中
- 宛先を複数セグメント（例: 新規フォロワーのみ）— mock はフォロワー全員のみ。v1 以降

■ In / Out
- In: community-hub-page、community-v0-mock-data、community-join-v0-store の UI/mock 拡張
- Out: Supabase 永続化、コミュニティ設定画面、プレイヤー側 compose の折りたたみ化、docs/ui-mocks/26-community.md 新規作成

■ リスク
- localStorage 初期データ変更により、既にブラウザに保存済みの参加申請は旧データのまま残る可能性（シークレット or ストアクリアで確認）
- 参加者数 128 と実リスト件数の不一致は v0 想定内だが、本番前に実数連動が必要

■ 注意事項
- tsc --noEmit 成功。commit/push は未実施
- 同ブランチに未 push の Studio ホームランキング改修・ヒント文言修正が別途残っている可能性あり

■ 今すぐ私がやるべきこと
- ローカル or Preview で /studio/community を開き、mock との見た目差分が許容範囲か確認
- 問題なければ「commit + push preview/landing-01」を Cursor に依頼

■ Cursorだけで完了できること
- preview/landing-01 へ commit + push
- 参加者数を実メンバー数に連動する微調整
- docs/ui-mocks/26-community.md の起票

■ 次に検討すべきこと
- Studio ホーム「今週の伸び」ランキング（ローカル実装済み未 push）の一括 push
- コミュニティ設定画面のスコープ（公開/非公開、参加制など）

■ ChatGPTに相談したい論点
- 参加者数は mock 固定 128 のまま v0 でよいか、それとも members.length + pending を即表示すべきか
