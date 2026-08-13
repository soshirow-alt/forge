# Legal drafts — clause-level diff vs Production-facing docs (2026-08)

Source of truth (live): `components/terms-of-service-document.tsx`, `components/privacy-policy-document.tsx`
Drafts: `docs/legal/2026-08-terms-draft.md`, `docs/legal/2026-08-privacy-draft.md`

## Terms — 条項単位

| 現行 | ドラフト | 差分 |
|---|---|---|
| 運営者：Forge 運営 | 〔Owner記入〕+ 連絡先メール | 法的身元を埋める枠を明示 |
| §1 5カテゴリ・reciprocity・使用関係は概ねあり | バイナリ非ホスト／外部URL中心を明記 | 明確化 |
| §2 開発者／プレイヤー | 同一ユーザーが双方になりうる／ウォッチ定義 | 役割・ウォッチ追加 |
| §3 ログイン必要 | 試用・プレイ含むログイン要件 + Production ゲストFB不可 | **重要** |
| §7-2 コミュニティ・AI・使用関係 | §9 / §9-2 にコミュニティUGCとAIを復元 | 維持+明確化 |
| §8 AI（現行） | §9-2 へ移動・マッチング言及 | 番号再編 |
| §4 未成年＋「同意したものとみなす」 | 同意前提は残し、みなし同意を弱め Owner/legal | **Owner判断** |
| §5 投稿 | 音楽・アセット・ツール・マルウェア等を列挙 | 5カテゴリ強化 |
| §7 FB + reciprocity | 非義務・公開作品なしは reciprocity なし（通常通知は voice 経路依存） | 整合 |
| （薄い）通知 | §8 ウォッチ／確認依頼／email境界 | 新規明確化 |
| §7-2 使用関係 | §9 維持・強化 | 境界維持 |
| §9 禁止 | 認証情報窃取・フィッシング等 | ツール/サービス向け強化 |
| §11 IP許諾 | 表示・OGP等に必要な範囲／非公開メッセージ除外 | 広すぎる譲渡を回避する方針を維持 |

## Privacy — 条項単位

| 現行 | ドラフト | 差分 |
|---|---|---|
| ゲストFB可能・初声 | ProductionではゲストFB無効／フィードバック用語 | **重要修正** |
| コミュニティ情報 | コミュニティ取得・利用目的を復元 | 欠落修正 |
| Resend あり | Resend 維持 | 同等 |
| AI／外部サービス曖昧 | Supabase/Vercel/Resend/X を表で列挙；OpenAIは条件付きOwner判断 | 明確化 |
| 未成年 | 同意前提（全面禁止にしない） | Owner判断事項として明示 |

## Fact-check notes (this pass)

- Analytics SDK: repo に GA/PostHog/Sentry 等の常設利用なし
- OpenAI: 製品コードに live matcher 経路あり。Production 有効かは env — **Owner確認**（Cursor/Codex開発利用は Privacy 根拠にしない）
- Guest FB: Production API `guest_feedback_disabled`
- 運営者個人名: 補完しない
