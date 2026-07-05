# みんなのFB 個別カード公開 — Phase 0 整理

> **状態**: 原典・法務文案・041 migration **草案** まで完了。**本番 Supabase DB への適用・UI/API 実装・main 反映・本番 deploy は未実施**。

## 環境前提（用語）

- Forge の **Preview 環境も本番も同一 Supabase プロジェクト**（`bpnisgzxuwdxelhnduuf`）を参照する
- **「Preview DB」という表現は使わない**。041 の Dashboard 適用 = **本番 DB 変更**
- Preview での動作確認も **本番 DB 共有** が前提。テスト用投稿は確認後に削除する

## Phase 区分

| Phase | 内容 | GO / RUN |
|-------|------|----------|
| **Phase 0**（今回） | 原典 §5、プライバシー/利用規約、送信前同意方針、041 migration ファイル草案 | 文書・SQL レビュー |
| **Phase 1** | migration ファイル確定、SQL レビュー、Dashboard 適用手順整理 | **本番 DB 適用は別 GO / RUN** |
| **Phase 2+** | 公開 UI、同意チェック UI、RPC 接続、通報 API 等 | Preview 確認 → 本番 deploy は別途 |

Preview 確認時も **本番 DB 共有** であることを前提に E2E する。

---

## 公開面レイアウト（v2）

**上段 — 集計**

- 選択式・再プレイ意向等: 件数・比率・グラフのみ
- 共感・通報なし

**下段 — 個別テキストカード**

| 種別 | 内容 | 非公開 |
|------|------|--------|
| **A** 問い補足 / 短文 | 選択式への任意コメント、または `short_text` 回答本文 | 選択肢そのもの |
| **B** 詳しい感想 | 1 投稿 = 1 カード。4 フィールドのみ | `focus_response` / `would_replay` |

**著者**: 登録 = 表示名 + アバター。ゲスト = 「ゲスト」バッジ。  
**非公開**: email、email プレフィックス、`user_id`、`submitter_key`、行 UUID。

---

## opaque `card_id`

- RPC `get_public_feedback_cards` は **`card_id` のみ** をクライアントに返す（内部 UUID 非露出）
- 生成: `feedback_public_card_id(target_source, target_id)` — `fc1_` + MD5 先頭 32 桁（041 参照）
- 通報: `POST /api/feedback/report` が `card_id` を受け取り、サーバー側で `target_source` + `target_id` に解決
- クライアントに `target_id` の生 UUID を渡さない

---

## 通報（Phase 4 想定・設計確定）

- **`feedback_reports` へのクライアント直接 INSERT は前提にしない**
- **`POST /api/feedback/report`** — service role で保存
- API 側: 対象存在確認、重複チェック、rate limit、自己通報不可（登録ユーザーが自分の registered_voice / registered_detailed を通報不可）
- 初期: **登録ユーザーのみ** 通報可。自動非公開なし

### `target_source`（4 値）

| 値 | 元テーブル |
|----|-----------|
| `registered_voice` | `project_voice_responses` |
| `guest_voice` | `project_guest_voice_responses` |
| `registered_detailed` | `project_feedback` |
| `guest_detailed` | `project_guest_feedback` |

---

## 送信前同意文言 — 反映方針

### 固定文案

> 投稿したフィードバックは、作品ページの「みんなのフィードバック」に表示されます。個人情報や公開したくない内容は書かないでください。

### UI 要件（Phase 2 で実装）

- **必須チェックボックス** + 上記全文（リンク不要。プライバシーポリシー / 利用規約への導線は別途あってよい）
- **同意時刻・同意バージョン等の DB 列は持たない**（原典方針）
- **既存 FB** は同意列なしですべて公開対象（`legacy_private` なし）

### 反映対象フォーム（Phase 2）

| 導線 | コンポーネント | タイミング |
|------|----------------|------------|
| 登録 — 初声送信 | `components/game-voice-section.tsx` | 送信ボタン直前 |
| 登録 — 詳しい感想 | 詳細 FB フォーム（game detail） | 送信ボタン直前 |
| ゲスト — 初声 | `components/guest-voice-section.tsx` | 送信ボタン直前 |
| ゲスト — 詳しい感想 | `components/guest-deep-feedback-form.tsx` | 送信ボタン直前 |

### 実装メモ

- チェック未 ON では submit を disabled（または送信時バリデーション）
- ゲスト / 登録で文案は同一
- Studio 開発者向けフォームには不要
- 法務ページ（`/privacy` `/terms`）は Phase 0 で更新済み — UI からのリンクは任意

---

## 041 migration 適用手順（Phase 1 GO 後）

1. `supabase/migrations/041_public_feedback_cards.sql` を Supabase Dashboard SQL Editor で実行
2. `docs/supabase-post-migration-checklist.md` に沿って RPC / RLS 確認
3. テスト投稿 → Preview UI 確認 → **テスト行削除**
4. 本番 deploy は Preview 確認後の別 GO

---

## 関連ファイル

| 用途 | パス |
|------|------|
| 原典 | `docs/forge-principles.md` §5 |
| 法務 UI | `components/privacy-policy-document.tsx`, `components/terms-of-service-document.tsx` |
| Migration 草案 | `supabase/migrations/041_public_feedback_cards.sql` |
| ゲスト FB（040） | `supabase/migrations/040_project_guest_feedback.sql` |

---

## 後続 TODO（Phase 2 完了時点）

詳細は `docs/forge-changelog.md`（2026-07-06 後続 TODO）を正とする。

| テーマ | 方針 |
|--------|------|
| **通報** | 公開FBカードに通報導線（後続）。初期は登録ユーザーのみ。`feedback_reports` + `POST /api/feedback/report`。自動非表示なし。Studio/管理側確認 + オーナー hidden は後続 |
| **共感** | 未着手 |
| **UI メリハリ** | Phase 2 で軽改善済み。追加磨き込みは後続 |
| **RPC enrich** | `choice_answer_label` / `version_key` を RPC 返却に含める正本更新は Dashboard 再適用 GO 後 |
