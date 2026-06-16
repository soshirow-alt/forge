# プレイ履歴 Phase 1 — 検証手順

**前提**: migration `012_project_play_sessions.sql` を Supabase Dashboard で適用済み  
**PLAYER_VISIBLE**: false 維持

---

## 1. migration 012

Dashboard SQL で `supabase/migrations/012_project_play_sessions.sql` を実行。

確認:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'project_play_sessions';
```

RLS: 自分の行のみ SELECT / INSERT。

---

## 2. recordPlay 改修

| 変更 | 内容 |
|------|------|
| 毎回 INSERT | `project_play_sessions` に版・context 付きで追記 |
| 後方互換 | `project_plays` upsert 継続（hasPlayedGame） |
| 再プレイ | 以前は初回のみ記録 → **毎プレイ session 追加** |
| context | `general` / `new_version`（再プレイ） / `adoption_verify`（Phase3 経由） |

手順:

1. ログイン → 未プレイ作品 → プレイ
2. Supabase `project_play_sessions` に 1 行、`context=general`
3. 同作品を再プレイ → 2 行目、`context=new_version`
4. `project_plays` は 1 行のまま

012 未適用時: session INSERT はスキップ（plays upsert のみ）。UI は voice/devlog のみ表示可。

---

## 3. タイムライン合成

ソース（**プレイした作品のみ**）:

| type | ソース |
|------|--------|
| play | `project_play_sessions` |
| voice | `project_voice_responses`（ユーザー本人） |
| devlog | `published_version` ありの devlog のみ |

**非表示**: adoption（PLAYER_VISIBLE=false）  
**バックフィル**: なし — 012 適用後の session のみ

サマリ行（作品カード上部）:

- N回プレイ
- N回声を届けた（0 なら省略）
- N回更新を見届けた（0 なら省略）
- 最初のプレイからN日（`project_plays.created_at` または最古 session）

---

## 4. UI — `/mypage` プレイ履歴

**位置**: マイページ → プレイヤータブ → `#play-history`（VoiceAdoptions の下）

| 状態 | 期待 |
|------|------|
| 未プレイ | 「まだプレイ履歴がありません」 |
| プレイのみ | 作品カード + play 行 + サマリ（声 0 でも OK） |
| プレイ + 声 | voice 行が時系列に混在 |
| プレイ + 新版 devlog | devlog 行「新版 X が公開 — …」 |

プレイのみユーザー: 応援/追跡/ブックマークがなくても **プレイ履歴セクションは表示**。

---

## 5. build

```bash
npm run build
```

2026-06-16: **PASS**

---

## 6. Out of scope（Phase 1b 以降）

- `/games/[id]` コンパクト履歴
- adoption 行 UI（PLAYER_VISIBLE GO 後）
- 深い FB タイムライン
- 過去プレイのバックフィル
