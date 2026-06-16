# 正式版（Released）設計

**ステータス**: Phase 1 実装完了（2026-06-16）  
**検証**: `docs/official-release-phase1-verification.md`

---

## 1. 原則

Forge における **正式版** は **開発者の宣言** を正本とする。

**semver（1.0.0 等）で正式版判定はしない。**

| 理由 | 説明 |
|------|------|
| 開発者のタイミング尊重 | 完成と考えた瞬間を Forge が上書きしない |
| 版番号 ≠ 完成度 | 0.9 が完成、1.0 が試作、がありうる |
| Forge の役割 | 品質審査機関ではない |

Forge が記録するもの:

- **いつ** 正式版になったか
- **誰が** 見届けたか
- **どんな声** が反映されたか

Forge が判定 **しない** もの:

- 本当に完成しているか
- 品質が十分か

---

## 2. 暫定: 正式版宣言条件

開発者が Studio で **Released** を選択したとき、以下を満たすこと:

| 条件 | 説明 |
|------|------|
| **Released 選択** | 開発者明示（正本） |
| **プレイ可能版を経由済み** | 少なくとも 1 回 playable_version が存在 |
| **devlog 1 件以上** | 更新の記録がある（育成の軌跡） |

**Out**

- semver 1.0.0 自動判定
- Forge 側の品質レビュー / 承認ゲート
- 正式版未到達作品の公開停止

---

## 3. 正式版到達後の方針

正式版は **退場ではなく「育成の一区切り」**。

| 項目 | 方針 |
|------|------|
| ゲームページ | **残す**（削除・卒業しない） |
| devlog | **継続可** |
| voice adoption | **継続可** |
| プレイ | **継続可** |

将来的な表示候補（実装は後）:

- 正式版到達日
- 見届け人数
- あなたの声が反映された回数（作品単位 / 個人）

---

## 4. Released 取り消し（Release Reopened）

**結論（オーナー確定）**: **取り消し可能**。ただし **履歴は消さない**。

Forge は育成履歴を残すサービス。正式版到達の事実を消さない。

### NG

```text
Released → 未公開（履歴消滅）
```

### OK

```text
Released → Release Reopened → Released（再宣言）
```

### データ設計（推奨）

**現在状態** と **イベント履歴** を分離。

| 層 | 役割 |
|----|------|
| `projects.release_status`（等） | **現在** — `released` / `reopened`（正式版再調整中） |
| **`project_release_events`**（新規） | **履歴** — イベントを積み上げ、削除しない |

**イベント例**

```text
2027-03-15  Released
2027-03-18  Release Reopened
2027-04-01  Released
```

| 列（案） | 説明 |
|----------|------|
| `id` | UUID |
| `project_id` | 作品 |
| `event_type` | `released` / `release_reopened` |
| `actor_user_id` | 開発者 |
| `created_at` | イベント日時 |
| `note` | 任意（開発者メモ） |

**Out**: イベント行の DELETE / UPDATE で履歴改ざん

### UI 表示（案）

**現在状態**（作品詳細 / Studio）

- **正式版** — 最新イベントが `released` かつ `reopened` なし
- **正式版再調整中** — 最新が `release_reopened`

**過去イベント** — 履歴として表示（タイムライン）。

### 見届け人バッジ（オーナー確定）

- **初回 `Released` で付与**
- **`Release Reopened` 後も剥奪しない** — 見届けた事実は消えない
- 再 `Released` は履歴として積み上げ（バッジ二重付与は実装時に設計 — 初回のみ推奨）

例:

```text
2027-03-15 Released        → 見届け人付与
2027-03-18 Release Reopened → 見届け人維持
2027-04-01 Released        → 履歴のみ（剥奪なし）
```

Forge は **現在状態** ではなく **育成履歴** を評価する。

---

## 5. 見届け人バッジとの接続

`docs/player-badges-design-review.md` 参照。

- 見届け人 = **正式版到達まで伴走**（単純 1 回プレイ NG）
- 条件候補: 声を届けた / 複数版プレイ / 継続して追っていた
- 正式版の定義は **本 doc の開発者宣言** が前提

---

## 6. Phase 1 実装（2026-06-16）

| 項目 | 正本 |
|------|------|
| migration | `013_project_release_events.sql` |
| 状態 lib | `lib/project-release-state.ts` |
| DB | `lib/supabase/project-release-events-db.ts` |
| Studio UI | `components/project-release-studio-panel.tsx` |
| マイページ | `components/official-release-section.tsx` |
| プレイ履歴 | `lib/player-play-timeline.ts` — `release` イベント |

**`projects.release_status`**: `in_development` / `released` / `release_reopened`  
**`project_release_events`**: append-only、`released` / `release_reopened`

---

## 7. 実装スコープ（将来 Phase 2+）

1. ~~Released 取り消し可否~~ → **取り消し可、履歴保持（確定）**
2. Released 後に devlog 新版公開 — 表示上「正式版 + 更新中」か
3. 見届け人の参加条件 — watch / voice / 複数版プレイの最低セット
4. Reopen 後の再 Released — 見届け人バッジは初回のみか、再 Released も別カウントか → **初回 Released のみ付与、Reopen でも剥奪なし（確定）**

---

## 8. 関連 doc

- `docs/player-badges-design-review.md`
- `docs/forge-principles.md`
- `docs/phase3-adoption-verify-ux-design.md`
