# labeled 60 --live 実測結果（2026-06-16）

**ステータス**: **GO**（オーナー + ChatGPT Run判断 A — shadow A へ）  
**model**: `gpt-4o-mini`  
**prompt**: `adoption-prompt-v2`（**維持**。v3 不要）

---

## 結果サマリ

| 項目 | 値 |
|------|-----|
| direct FP | **0** |
| direct FN | **0** |
| indirect FP | **0** |
| indirect FN | **3** |
| reject FP | **0** |
| precision | **100%** |
| recall | **92.5%** |
| 自動 GO | **PASS** |

---

## FN 3 件（対応不要 — オーナー確定）

| ID | conf | 理由 |
|----|------|------|
| indirect-05 ストレス | 0.8 | indirect 閾値 0.88 未満 |
| indirect-11 入力遅延 | 0.8 | 同上 |
| indirect-12 不公平 | 0.8 | 同上 |

precision 優先で問題なし。**閾値変更禁止**。**prompt v3 不要**。

---

## 採用 37 件

direct 20 / indirect 17 / reject 0

詳細 explanation 一覧は `--live` 実行ログまたは Cursor レポート（2026-06-16）参照。

---

## 次アクション（優先順位）

1. Explanation Quality **37 件目視**
2. **shadow A**（実 devlog 新版公開 → matcher → DB レビュー、プレイヤー非表示）
3. shadow A **FP = 0** 確認
4. **shadow B**
5. shadow B **FP = 0** 確認
6. **matcher 本番 GO** 判断

doc: `docs/voice-adoptions-shadow-guide.md`

---

## 本番 GO 条件（変更なし）

```text
labeled 60 GO（完了）
  ↓
shadow A FP = 0
  ↓
shadow B FP = 0
  ↓
matcher 本番 GO 候補
```
