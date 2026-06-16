# voice_adoptions matcher — 本番 GO 手順

**Run 判断**: **[A] 推奨**（2026-06-16 オーナー GO）  
**根拠**: labeled 60 PASS / shadow A PASS / shadow B PASS / FP=0 / Explanation Quality OK

**変更禁止（維持）**

- `adoption-prompt-v2`
- direct ≥ **0.82** / indirect ≥ **0.88**
- indirect FN 許容、FP 最優先

---

## 1. 本番で動く経路（現行実装）

devlog **新版公開**（開発者）

→ `invokeAdoptionMatcherAfterPublish`（`games-provider.tsx`）

→ `POST /api/voice-adoption/run`（開発者 auth + project owner 確認）

→ `runAdoptionMatcherForDevlog`（**service role**）

→ OpenAI live matcher → `voice_adoptions` INSERT

**Edge Function** `voice-adoption-matcher` は **501 stub**。本番 GO は **Next.js API 経路**（shadow A/B と同一）。

---

## 2. Vercel 環境変数（プロジェクト名 **forge**）

Dashboard → プロジェクト **forge** → Settings → Environment Variables → **Production**（Preview も同値推奨）

| 変数 | 本番 GO 後の値 | 備考 |
|------|----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 既存のまま | 変更なし |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 既存のまま | 変更なし |
| `OPENAI_API_KEY` | **設定する** | 未設定だと matcher failed |
| `SUPABASE_SERVICE_ROLE_KEY` | **設定する** | matcher INSERT 用。**Git に commit しない** |
| `VOICE_ADOPTION_MATCHER_MODE` | `live` または **未設定** | `fixture` にしない |
| `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` | `false` または **未設定** | fixture 経路 OFF |
| `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE` | **`false`（明示維持）** | **プレイヤー UI はまだ出さない** |

### PLAYER_VISIBLE=false 維持の意味

| 層 | 本番 GO 後 |
|----|------------|
| matcher / DB INSERT | **動く** |
| 開発者 Studio 件数 | 表示可 |
| マイページ・ゲーム詳細 adoption セクション | **非表示**（Phase2/3 UI GO まで） |

Phase3 実装は **PLAYER_VISIBLE=false のまま進めてよい**（コードは入るがプレイヤーには見えない）。

---

## 3. デプロイ

1. 最新コード（matcher パイプライン含む）を **main** に反映
2. Vercel **forge** プロジェクトが自動デプロイ
3. env 追加・変更後は **Redeploy**（env は再デプロイで反映）

**Cursor は push / Vercel prod deploy をオーナー Run 承認なしに実行しない。**

---

## 4. 本番 GO 後の確認手順（オーナー）

### 4a. 開発者 — 新版 devlog 公開

1. 本番 https://forge-flame-gamma.vercel.app に開発者でログイン
2. テスト用でなければ **影響の小さい作品** で devlog 新版公開
3. DevTools Network → `POST /api/voice-adoption/run` → **200**
4. Response body: `status: "completed"` または `skipped`（候補 0 のみ）

### 4b. Supabase SQL（任意）

```sql
select id, status, candidate_count, adopted_count, created_at, error_message
from voice_adoption_matcher_runs
order by created_at desc
limit 5;
```

### 4c. プレイヤー UI — まだ出ないこと

1. ログイン状態で `/mypage` — **「あなたの回答から変わったこと」セクションなし**
2. `/games/[id]` — 同上 **なし**
3. `.env` / Vercel で `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false` 確認

### 4d. FP 監視（最初の数公開）

- service role または Dashboard で `voice_adoptions` 行を目視
- **1 件でも無関係 adoption → PLAYER_VISIBLE GO 前に止める**

---

## 5. ロールバック

| 操作 | 効果 |
|------|------|
| Vercel で `OPENAI_API_KEY` 削除 | matcher failed（INSERT なし） |
| `VOICE_ADOPTION_MATCHER_MODE=fixture` | live 停止（非推奨・staging 用） |
| 誤採用行のみ DELETE | `delete from voice_adoptions where devlog_id = '...'` |

PLAYER_VISIBLE は **true にしない**（ロールバック手段ではない）。

---

## 6. 関連 doc

- `docs/voice-adoptions-openai-matcher-design.md`
- `docs/voice-adoptions-shadow-guide.md`
- `docs/phase3-implementation-plan.md`
- `docs/supabase-owner-operations.md` — プロジェクト ID `bpnisgzxuwdxelhnduuf`
