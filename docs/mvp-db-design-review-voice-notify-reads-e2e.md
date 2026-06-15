# MVP DB 設計レビュー — 回答通知 / nurture 読了 / E2E

**ステータス**: 設計レビュー（未 GO・migration 未作成）  
**日付**: 2026-06-15  
**目的**: 開発者への回答到着通知 DB 化・nurture 読了 Supabase 化・E2E 固定化の GO 判断材料

---

## 前提（現状）

| 領域 | 現状 |
|---|---|
| 回答到着 | `project_voice_responses` → studio / my-projects の growth 計算のみ |
| 通知 DB | `user_notifications` — `devlog` / `version_published` のみ（watch 向け） |
| 通知 INSERT RLS | **project owner のみ** INSERT 可（005） |
| voice INSERT | **player** が `project_voice_responses` に INSERT |
| nurture 読了 | localStorage `project_voice_reads:{projectId}:{version}` |
| E2E | `docs/e2e-version-published-loop-production.md` が版公開ループ特化のみ |

---

## 1. 開発者向け「回答届いた」通知 DB 化

### 1.1 推奨案 — DB trigger + `voice_received` type

**プレイヤーが voice を INSERT した直後**、SECURITY DEFINER 関数で **project owner** に通知。

理由:

- 現行 RLS では player が `user_notifications` に INSERT できない
- owner 操作の devlog / version 通知パターンと異なり、**recipient = owner**（watch ではない）
- Edge Function / service role API は MVP には重い

### 1.2 type 追加

`user_notifications.type` に **`voice_received`** を追加（`feedback` ではない）。

- `feedback` はアプリ local 通知・旧 structured 連想が残る
- DB 型は voice 専用名で原典整合

### 1.3 カラム

| カラム | 用途 |
|---|---|
| 既存 `project_id` | 作品 |
| 既存 `message` | 表示文言 |
| 既存 `read_at` | 通知既読 |
| **新規 `version_key text`** | 現行版（`published_version` と対称） |

`devlog_id` は voice 通知では NULL。

### 1.4 所有者テストプレイ除外

trigger 内:

```sql
IF NEW.user_id = (SELECT owner_id FROM projects WHERE id::text = NEW.project_id) THEN
  RETURN NEW; -- 通知しない
END IF;
```

### 1.5 同一プレイヤー・同一版の複数回答（まとめ方）

**推奨: owner + project + version 単位で未読 1 件に集約**

- INSERT 時のみ trigger（UPDATE 再回答は通知しない）
- 未読 `voice_received` が既にあれば **message 更新 + created_at 更新**（または response_count 列）
- 新規なら INSERT

部分 UNIQUE 索引案:

```sql
UNIQUE (user_id, project_id, version_key)
WHERE type = 'voice_received' AND read_at IS NULL
```

文言例:

- 初回: `「{title}」にプレイヤーの回答が届きました（v{version}）`
- 集約: `「{title}」に v{version} 向けの回答が {n} 件届いています`

MVP 最小: 集約時も「回答が届きました」固定で可（count 省略可）。

### 1.6 通知 URL

`/projects/{id}/studio#feedback`（既存 `projectStudioFeedbackHref`）

`notificationTargetHref` に `voice_received` 分岐追加。

### 1.7 devlog / version との整合

| type | 宛先 | きっかけ | INSERT 主体 |
|---|---|---|---|
| devlog | watch ユーザー | owner が devlog 投稿 | owner client |
| version_published | watch ユーザー | owner が版公開 | owner client |
| **voice_received** | **project owner** | player が voice INSERT | **DB trigger** |

recipient モデルが異なる — 同一テーブルで OK、type で分岐。

### 1.8 詳しい感想（project_feedback）

**MVP Out** — 別 type `deep_feedback_received` は後続。voice 到着が原典主導線。

---

## 2. nurture 読了 Supabase 化

### 2.1 必要性

| 課題 | localStorage | DB 化後 |
|---|---|---|
| 端末跨ぎ | 未読のまま別端末 | owner どこでも同じ読了 |
| studio Hero「回答を見る」 | 端末依存 | `voiceRead` が DB 同期 |
| my-projects バッジ | growth は DB、読了のみ local | 整合 |

**MVP として必要** — 通知 DB 化とセットで「届いた / 見た」を揃える。

### 2.2 テーブル案 — `project_voice_reads`

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK auth.users | **owner**（読んだ人） |
| project_id | text | |
| version_key | text | playableVersion |
| source_type | text | MVP は `'voice'` 固定 CHECK |
| read_at | timestamptz | default now() |

**UNIQUE (user_id, project_id, version_key, source_type)**

`source_type` は将来 deep_feedback 読了拡張用。MVP は voice のみ。

### 2.3 RLS

```sql
-- SELECT / INSERT / UPDATE: owner が自分の作品の読了のみ
auth.uid() = user_id
AND EXISTS (projects.owner_id = auth.uid() AND projects.id::text = project_id)
```

DELETE 不要（MVP）。

### 2.4 localStorage 移行

**MVP: 必須ではない**

- GO 時点で読了リセット許容（voice 中心化移行時と同様）
- 任意: studio 初回 load で localStorage → UPSERT（best-effort）

### 2.5 改善メモ

**MVP Out** — `project_improvement_notes` は localStorage 継続。

### 2.6 アプリ層

```
useNurtureVoiceRead (async)
  → voiceReadStore
  → voiceReadSupabasePersistence（新）
  → project_voice_reads
```

`buildNurtureDisplayContext(growth, voiceRead)` は変更なし。

**studio「読了にする」** 時:

1. UPSERT `project_voice_reads`
2. 任意: 同一 project+version の未読 `voice_received` 通知も `read_at` 更新

---

## 3. migration 案

### 009_voice_received_notifications.sql

1. `ALTER TABLE user_notifications ADD COLUMN version_key text NULL`
2. `type` CHECK に `voice_received` 追加
3. 部分 UNIQUE 索引（未読集約用）
4. `notify_owner_on_voice_response()` SECURITY DEFINER + trigger AFTER INSERT ON project_voice_responses
5. GRANT EXECUTE 必要最小

**RLS 変更**: owner INSERT policy は devlog/version のまま。**player INSERT policy 追加しない**。

### 010_project_voice_reads.sql

1. CREATE TABLE project_voice_reads
2. RLS + policies
3. INDEX (user_id, project_id)

---

## 4. RLS 方針（全体）

| 対象 | 方針 |
|---|---|
| user_notifications voice_received | trigger (DEFINER) のみ INSERT。既存 owner INSERT policy 不変 |
| project_voice_reads | owner 本人 CRU のみ |
| project_voice_responses | **変更なし**（006 維持） |
| 全面 RLS 見直し | **しない** |

---

## 5. 既存コード影響範囲

### 通知

- `supabase/migrations/009_*.sql`（新規）
- `lib/notifications.ts` — type `voice_received`、label、message、action hint
- `lib/supabase/user-notifications-db.ts` — row type、fetch
- `lib/project-nurture-links.ts` — `notificationTargetHref`
- `components/notifications-page.tsx` — 表示（変更小）
- `components/games-provider.tsx` — dbNotifications merge（既存パス）
- **削除不要**: local `addNotification("feedback")` は既に player 送信から除去済み

### 読了

- `supabase/migrations/010_*.sql`（新規）
- `lib/nurture-persistence/voice-read-supabase.ts`（新規）
- `lib/nurture-voice-read-store.ts` — persistence 差し替え
- `hooks/use-nurture-feedback-read.ts` — async + loading
- `components/game-growth-cycle.tsx` — markRead async
- `components/project-list-card.tsx` — read hook async

### E2E（doc のみ）

- 新規 `docs/mvp-production-e2e-checklist.md`
- 既存 `docs/e2e-version-published-loop-production.md` から版公開節を参照統合

---

## 6. 実装順序

1. **009 migration** + Dashboard 適用 + post-migration checklist
2. **通知アプリ** — type / href / 表示
3. **010 migration** + 適用
4. **読了 persistence** — Supabase + hook async
5. **studio 読了 ↔ 通知既読** 連携（任意同期）
6. **E2E doc** 固定 + 初回本番 walkthrough
7. localStorage 移行（任意・低優先）

---

## 7. MVP 最小範囲

**In**

- voice_received 通知（trigger、owner 宛、自己回答除外、未読集約）
- project_voice_reads（voice のみ）
- E2E チェックリスト doc 1 本
- 通知 → studio 深リンク

**Out**

- deep_feedback 通知
- improvement メモ DB 化
- localStorage 強制移行
- 通知メール / push
- Edge Function

---

## 8. やらない方がいいこと

- player 向け RLS で `user_notifications` INSERT 許可（漏洩リスク）
- voice / feedback テーブル統合
- 毎 prompt INSERT ごとに新規通知行（スパム）
- owner テストプレイにも通知
- service role をフロントから使う API 追加（MVP 過剰）
- nurture 読了を notification.read_at のみで代用（studio 状態と通知 UI が混ざる）

---

## 9. 設計判断メモ（GO 判断用）

### Cursor 推奨案

009 trigger + voice_received / 010 project_voice_reads / E2E doc 統合

### 推奨理由

- 現行 RLS を壊さず player→owner 通知が実現できる
- devlog 通知パターンと type 列で共存
- 読了 DB 化は store 差し替えのみで UI 変更最小

### 懸念点

- trigger デバッグは client より難しい — Dashboard SQL で insert テスト必須
- 通知集約と studio growth pending の二重状態 — 読了時の同期ルール要テスト
- migration 2 本 — 適用順 009→010、deploy 順も明記

---

## 10. E2E チェックリスト草案

→ `docs/mvp-production-e2e-checklist.md` として GO 後に固定（草案は chatgpt-summary / オーナー返答に全文）
