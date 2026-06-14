# P1-2.7 育成ループ client 状態 — 設計メモ

**ステータス**: 暫定 localStorage → **将来 DB 化予定**  
**P1-2.7**: migration なし、UX 検証優先

---

## 0. オーナー遵守事項（5 点）

1. **UI コンポーネントから localStorage を直接参照しない**
2. **read 状態・改善メモは専用 store / hook に集約**
3. **依存方向を維持**: `UI → hook → store → persistence`
4. **localStorage key は将来 DB テーブル名と対応する命名**
5. **docs に「暫定 localStorage → 将来 DB 化予定」を明記**（本ドキュメント）

---

## 1. 位置づけ

Forge 成長ループ:

```
FBを読む → 改善中 → 開発ログを書く → 新版公開する → 反応を待つ ↺
```

**「FB を読んだか」** は `FBを読む` ↔ `改善中` の境界。  
**改善メモ** は改善中の補助状態。

いずれもコアループに関わるため、**最終的には DB 保存が正式仕様**。  
P1-2.7 の localStorage は **許容される暫定実装** であり、正式仕様ではない。

---

## 2. 依存方向（レイヤ）

```
GameGrowthCycle（UI）
    ↓
useNurtureFeedbackRead / useNurtureImprovementNote（hook）
    ↓
feedbackReadStore / improvementNoteStore（store）
    ↓
feedbackReadLocalPersistence / improvementNoteLocalPersistence（persistence）
    ↓ 現状
localStorage（暫定）
    ↓ 将来
Supabase（DB 化後 — persistence 差し替え）
```

**DB 化時**: persistence 層のみ Supabase 実装に差し替え。hook / UI は変更最小。

---

## 3. localStorage key 命名（DB 移行前提）

| 将来テーブル（案） | localStorage key 形式 | 値 |
|---|---|---|
| `project_feedback_reads` | `project_feedback_reads:{projectId}:{feedbackId}` | `"1"`（将来 `read_at`） |
| `project_improvement_notes` | `project_improvement_notes:{projectId}:{feedbackId}` | メモ本文 |

定義: `lib/nurture-persistence/local-storage-keys.ts`

---

## 4. 関連ファイル

| レイヤ | ファイル |
|---|---|
| UI | `components/game-growth-cycle.tsx` |
| hook | `hooks/use-nurture-feedback-read.ts` |
| hook | `hooks/use-nurture-improvement-note.ts` |
| store | `lib/nurture-feedback-read-store.ts` |
| store | `lib/nurture-improvement-note-store.ts` |
| persistence | `lib/nurture-persistence/feedback-read-local.ts` |
| persistence | `lib/nurture-persistence/improvement-note-local.ts` |
| keys | `lib/nurture-persistence/local-storage-keys.ts` |
| 判定 | `lib/project-growth-state.ts` — `buildNurtureDisplayContext(..., feedbackRead)` |

---

## 5. 暫定実装の限界

- PC で読了 → スマホ未読 — **正式体験として不可**（DB 化で解消）
- key 命名変更時（P1-2.7 初版 → テーブル対応名）は端末内 read 状態がリセットされる

---

## 6. 後続タスク

1. **FB 読了状態の DB 化** — `project_feedback_reads` migration + Supabase persistence
2. **改善メモの DB 化** — `project_improvement_notes` migration（タイミング要判断）
3. 既存 localStorage → DB 移行スクリプト（任意）

---

## 7. Forge 設計思想

FB・devlog・version・通知・**読了状態** など、成長ループ履歴は **最終的に DB に残る**。  
P1-2.7 は UX 検証。実装は DB 前提の依存方向で進める。
