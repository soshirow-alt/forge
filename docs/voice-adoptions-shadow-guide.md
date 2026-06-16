# voice_adoptions shadow 確認ガイド

**ステータス**: オーナー方針確定（実測フェーズ）  
**目的**: プレイヤー表示前に **本番 devlog** で FP=0 を確認する

---

## 1. shadow とは

| 項目 | shadow 時 | プレイヤー表示 GO 後 |
|------|-----------|----------------------|
| matcher 実行 | **する** | する |
| voice_adoptions INSERT | **する**（DB） | する |
| プレイヤー UI 表示 | **しない** | する |

**feature flag**: `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false`（staging / shadow 期間）

実装: `lib/voice-adoption/constants.ts` → `isVoiceAdoptionPlayerVisible()`。  
手順: **`docs/voice-adoptions-shadow-a-runbook.md`**

matcher は本番同等に動かし、誤採用だけを人間が止める。

---

## 2. 最低 2 回の公開

| 回 | 名称 | 内容 |
|----|------|------|
| **shadow1** | 公開 A | staging 作品で devlog 新版公開 → matcher 実行 |
| **shadow2** | 公開 B | 別内容の devlog 新版公開 → matcher 実行 |

labeled 60 `--live` **GO 済み**（2026-06-16）。次は **shadow A** から。

doc: `docs/voice-adoptions-labeled-60-live-results.md`

---

## 3. 確認項目

### ① FP（最重要 — オーナー shadow 確認項目）

人間レビューで **「これは違うだろ」** があるか。

- **明らかに関係ない adoption がないか**
- **explanation が不自然でないか**
- **indirect が過剰採用されていないか**
- 1 件でもあれば **プレイヤー表示 GO 不可**
- dispute 待ちにしない — shadow 段階で止める

### ② Explanation Quality

採用行の `player_quote` / `update_summary` を読み、

「確かに自分の声と今回の変更は関係ある」

と思えるか。

### ③ Distribution（偏り）

| 偏り | 疑い |
|------|------|
| direct しか出ない | indirect 理解不足 or devlog が明示的すぎ |
| indirect だけ異常に多い | 「関係ありそう」採用 — FP リスク |
| reject が通り過ぎ | 閾値 or prompt 緩すぎ |

---

## 4. GO 条件

```text
shadow1（公開 A）: FP = 0
shadow2（公開 B）: FP = 0
```

**両方達成** → プレイヤー表示 GO **候補**（matcher 本番 GO Run と合わせて判断）

Explanation Quality も両公開で目視 OK。

---

## 5. 運用手順（案）

1. staging DB + `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false`（runbook 参照）
2. 開発者アカウントで公開 A → `POST /api/voice-adoption/run` 確認
3. service role で `voice_adoptions` 行を SQL レビュー（FP / Quality / Distribution）
4. 公開 B を繰り返し
5. FP=0 × 2 → オーナー + ChatGPT で本番 GO

**Out**: shadow 中にプレイヤー mypage / 作品詳細へ adoption セクション表示

---

## 6. labeled 60 との関係

| 段階 | 目的 |
|------|------|
| `npm run verify:voice-adoption:staging -- --live` | 60 件自動 FP=0 |
| shadow 公開 A / B | 実 devlog・実 voice で FP=0 × 2 |

両方通過してからプレイヤー表示。

---

## 7. 関連 doc

- `docs/voice-adoptions-staging-precision-guide.md`
- `docs/voice-adoptions-labeled-60-live-results.md` — labeled 60 GO 記録
- `docs/voice-adoptions-shadow-a-runbook.md` — shadow A 実行・FP レビュー
