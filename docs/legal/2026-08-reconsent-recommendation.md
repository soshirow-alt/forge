# Re-consent / version management recommendation（2026-08）

## Current state

- Terms / Privacy show 制定日・最終更新日 only
- No `accepted_terms_version` / `accepted_privacy_version` columns in product auth flow (this audit)
- No blocking re-accept gate after login
- Past policy: versioning / re-approval intentionally deferred

## Materiality of this refresh

| Area | Material? |
|---|---|
| Guest FB disabled clarification | Yes (Privacy) |
| Processor list (OpenAI, Resend, etc.) | Yes (Privacy) |
| 5-category UGC / malware expansion | Yes (Terms) |
| Reciprocity / watch notification wording | Mostly clarification |
| Terminology 初声→FB | Low–medium |

## Classification (product / risk — not legal advice)

### A. 今回必須（文書反映前に Owner 決定が必要）

1. 運営者の正式表記（名称・連絡）を埋めるか、暫定のまま出すか
2. Privacy のゲストFB記述を Production 実態へ直す承認
3. 処理者（特に OpenAI）を名指ししてよいか

### B. 今回推奨

1. **Privacy の実質変更が大きいため、既存ユーザーへの非ブロッキング告知**（バナー／お知らせ／メールのいずれか）を推奨
2. 文書ヘッダに **version 文字列**（例 `terms-2026-08-01`）と **effective date** を付与
3. 将来の証拠保全のため `profiles`（又は settings）へ `accepted_*_version` + timestamp を足す設計を検討（**実装は別タスク**）

### C. 後回し可

1. ログイン直後の **blocking** 再同意ゲート
2. 全ユーザーへの強制再チェックボックス
3. 用語だけ直す小改定での再同意

## Recommendation summary

- **Blocking re-consent**: 今すぐ必須とは言わない（C）。ただし Privacy の処理者・取得範囲の明確化後は **告知（B）を推奨**。
- **Legal review**: 未成年条項・責任制限・権利許諾の広さは counsel 確認を推奨。
- **Do not implement** version columns / gates in this phase.
