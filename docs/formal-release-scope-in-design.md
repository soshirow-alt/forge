# 正式版スコープイン設計

**ステータス**: Phase 1 実装（2026-07-08）  
**関連**: `docs/official-release-design.md`, `docs/forge-ui-product-decisions.md`

---

## 1. 三軸の分離

| 軸 | 保存先 | 意味 |
|---|---|---|
| 開発フェーズ | `projects.phase` | 作品の成熟段階（試作版〜正式版候補） |
| 正式版公開済み | `projects.release_status` + `project_release_events` | 作者として完成版として公開しているか |
| プレイ条件 | `projects.play_access_type` | 料金/体験の事前開示（掲載ゲートではない） |

**正式版公開済みを `phase` に混ぜない。**

---

## 2. 正式版イベントの入口（`source`）

| source | 入口 | devlog / playable_version | フォロワー通知 |
|---|---|---|---|
| `studio` | Studio「正式verとして宣言」 | 必須 | あり |
| `onboarding` | 投稿/編集「すでに正式版として公開済み」 | 不要 | **なし** |

migration `046` で `project_release_events.source` を追加。既存行は `studio` デフォルト。

onboarding は RPC `declare_project_released_onboarding` で **原子的・冪等** に書き込む。

---

## 3. v1 の取り消し方針

- 一度 onboarding / studio で `released` になった作品は、**通常の編集画面では取り消せない**
- 保存前に確認モーダルを表示
- Studio の Release Reopened（再調整）は **現行維持**
- `release_retracted` 等は v1 スコープ外

---

## 4. `play_access_type`

```text
unspecified | free | demo_available | paid | other
```

- DB default: `unspecified`（既存作品を勝手に「無料」表示しない）
- 新規投稿 UI の初期選択: `free`（保存値として明示送信）
- `unspecified` はカード/詳細でバッジ非表示、CTA は従来どおり
- 掲載可否のゲートにはしない

---

## 5. プレイヤー向け表示優先順位

1. `release_status === 'released'` → 主: 🏆 完成品 / 副: phase（控えめ）
2. `release_status === 'release_reopened'` → 主: 正式版再調整中
3. それ以外 → phase を通常表示

---

## 6. migration

- `046_formal_release_scope_in.sql`
  - `projects.play_access_type`
  - `project_release_events.source`
  - `declare_project_released_onboarding(uuid)` RPC
