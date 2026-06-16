# shadow A 実行手順（Runbook）

**目的**: 実 devlog 新版公開 → マッチャー live → `voice_adoptions` INSERT。**プレイヤー UI には出さない**。オーナーが SQL / スクリプトで **FP=0** を確認してから shadow B へ。

**前提**: labeled 60 `--live` **GO**（prompt v2 固定）。candidate cap **50** 実装済み。

---

## 1. staging 環境変数（`.env.local`）

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...

# shadow A 必須
NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE=false
NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false
VOICE_ADOPTION_MATCHER_MODE=live
```

| 変数 | shadow A の値 | 意味 |
|------|---------------|------|
| `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE` | `false` | fixture 採用を出さない |
| `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE` | `false` | マイページ・ゲーム詳細の「声が反映」UI を非表示（DB は INSERT される） |
| `VOICE_ADOPTION_MATCHER_MODE` | `live` または未設定 | OpenAI マッチャー |

**開発者 Studio**（マイプロジェクトの件数表示）は shadow 中も **表示のまま** — マッチャーが動いたかの目安。FP 判定は本文レビューが正本。

`.env.local` 変更後は **dev サーバー再起動**。

---

## 2. テスト用プロジェクトの準備

1. **staging** でログイン（開発者アカウント）
2. テスト用プロジェクトを選ぶ（または新規）
3. **複数プレイヤー声**を用意（同一 `project_id`、公開前バージョン）
   - direct になりうる声 1〜2
   - indirect になりうる声 1〜2
   - **採用されないはず**の無関係な声 2〜3（FP 検出用）
4. devlog 下書きを書き、**声に対応する変更**と**無関係な変更**を意図的に混ぜない（1 回の公開 = 1 テーマの変更がレビューしやすい）

---

## 3. 新版公開（トリガー）

1. devlog を **新版公開**（`publishPlayableVersion`）
2. ブラウザ Network で `POST /api/voice-adoption/run` が **200** であること（開発者のみ）
3. 失敗時: `voice_adoption_matcher_runs` の `error_message` を確認

---

## 4. プレイヤー UI 確認（非表示）

| 画面 | URL | 期待 |
|------|-----|------|
| ゲーム詳細 | `/games/[id]` | 「あなたの声が反映されました」**出ない** |
| マイページ | `/mypage` | 同上 **出ない** |
| マイプロジェクト | `/my-projects` | Studio 件数は **出てよい**（開発者のみ） |

---

## 5. FP レビュー（正本）

### 5a. スクリプト（推奨）

公開した devlog の UUID を控えて:

```bash
npm run shadow:adoption-review -- <devlogId>
```

各行について:

- **voice body** と **devlog の変更内容**が同じ問題を指しているか
- **explanation** が過剰・誤解を招かないか
- **indirect** が無関係な声まで拾っていないか

### 5b. Supabase SQL Editor

```sql
-- devlog 概要
select id, project_id, title, published_version, published_at
from project_devlogs where id = '<devlogId>';

-- マッチャー実行
select id, status, candidate_count, adopted_count, created_at, error_message
from voice_adoption_matcher_runs
where devlog_id = '<devlogId>'
order by created_at desc;

-- 採用行 + 声本文
select
  va.id,
  va.confidence,
  va.player_quote,
  va.update_summary,
  pvr.answer_value as voice_answer,
  pvr.answer_label as voice_label,
  pvr.version_key as voice_version
from voice_adoptions va
join project_voice_responses pvr on pvr.id = va.voice_response_id
where va.devlog_id = '<devlogId>' and va.status = 'active'
order by va.confidence desc;
```

---

## 6. 合格基準（shadow A GO）

| 項目 | 基準 |
|------|------|
| FP | **0**（1 件でも誤採用 → FAIL、prod 前に prompt / 説明文を修正） |
| FN | 許容（labeled 60 と同様、閾値は触らない） |
| プレイヤー UI | 採用ブロック **非表示** |
| matcher run | `status = completed`（または adopted=0 で completed） |

**GO** → shadow B（別 devlog / 別シナリオ）へ。  
**FAIL** → 原因を `docs/voice-adoptions-labeled-60-live-results.md` と同様に記録 → prompt v2 を維持したまま説明品質 or ラベル追加を検討（閾値変更は最後）。

---

## 7. ロールバック

shadow 中の誤採用行のみ削除（本番 GO 前）:

```sql
delete from voice_adoptions where devlog_id = '<devlogId>';
```

プレイヤーは元から見えないため UI 影響なし。

---

## 8. 関連ドキュメント

- `docs/voice-adoptions-shadow-guide.md` — shadow A/B 全体像
- `docs/voice-adoptions-staging-precision-guide.md` — precision 方針
- `docs/voice-adoptions-openai-matcher-design.md` — マッチャー設計
