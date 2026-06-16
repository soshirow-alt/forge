# matcher 本番 — 並行実行チェックリスト（オーナー）

**Run [A] 積極推進** — プレイ履歴実装と **並行 OK**

Cursor は Vercel Dashboard を操作できない。以下は **オーナー作業**。

---

## A. Vercel env（プロジェクト **forge**）

Settings → Environment Variables → **Production**（Preview も同値）

| 変数 | 値 |
|------|-----|
| `OPENAI_API_KEY` | 設定 |
| `SUPABASE_SERVICE_ROLE_KEY` | 設定 |
| `VOICE_ADOPTION_MATCHER_MODE` | `live` または未設定 |
| `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` | `false` または未設定 |
| `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE` | **`false`（維持）** |

→ **Redeploy**

詳細: `docs/voice-adoptions-matcher-prod-go.md`

---

## B. コード deploy

1. Phase3 + 設計 doc を **commit / push main**
2. Vercel 自動デプロイ確認
3. 本番 devlog 新版公開 → `/api/voice-adoption/run` 200
4. FP 目視（最初の数公開）

---

## C. プレイ履歴（Cursor）

- `docs/player-play-history-design.md` — 設計 GO
- migration 012 + UI — Cursor 実装（matcher 確認を待たない）

---

## D. 確認

| 項目 | 期待 |
|------|------|
| matcher | `voice_adoption_matcher_runs` completed |
| PLAYER_VISIBLE | false — adoption UI **非表示** |
| プレイ | `project_play_sessions` 追加後、再プレイで行が増える |
