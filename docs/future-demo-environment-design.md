# 将来像デモ環境 — 設計案（v2：成功した Forge 世界）

**ステータス**: 設計レビュー待ち（**実装 GO 前**）  
**日付**: 2026-06-16（v2 — ペルソナ中心から世界中心へ改訂）  
**優先度**: 最優先（UI 全面レビューの前提）

**前提**

- Witness W1–W4 + Tier T1/T2 完了
- migration 014 staging + 本番適用済み
- `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false` 維持

**Out**

- 本番 UX 変更、新ルート、ランキング、通知追加、Adoption プレイヤー表示
- PLAYER_VISIBLE=true、本番 DB seed
- **ペルソナ差分検証**（Player A/B/C… を順番に確認する運用）
- 実装（本 doc GO 後）

---

## 1. 目的（v2 で変更）

**目的は「ペルソナ検証」ではない。**

**Forge が成功した未来を、世界の住人として体験すること。**

オーナーは観察用アカウント切替の行列ではなく、**活気のある Forge にログインして歩き回る**。

見たいのは:

- ゲーム投稿数が多い
- Devlog が大量にある
- 正式版作品が複数ある
- Reopened 作品もある
- Voice が蓄積されている
- 見届け人が多数存在する（**人数 UI は出さない** — 自分のマイページのみ）
- Silver / Gold が自然に存在する
- プレイ履歴が積み上がっている
- 「変化を見る → 再プレイ」が自然に成立している

**PLAYER_VISIBLE 機能追加ではない。** 既存画面 + Supabase デモデータのみ。

---

## 2. オーナー体験（レビューのしかた）

### 2.1 主役アカウント — Demo Veteran

**最重要。** この 1 アカウントで Forge の価値が最大化された状態を確認する。

| 項目 | 目標（Seeder 後） |
|------|-------------------|
| 見届け人 grant | **12 作品**（Gold 閾値 10 + 余裕） |
| tier | **見届け人 Gold** |
| プレイした作品 | **20+** |
| play sessions | **40+** |
| Voice | **25+** |
| Watch | **15+** |
| 正式版到達を見届けた履歴 | **10+** 作品で release タイムライン |
| Devlog 反映体験 | **8+** 作品で play → voice → devlog 公開 → 再プレイの流れ |

**Walkthrough ルート（Veteran で実施）**

1. `/` — 発見（投稿が並ぶ密度）
2. 代表作 2–3 本の `/games/[id]` — 育成感・Devlog 導線
3. `/mypage#play-history` — 厚いタイムライン
4. `/mypage#official-release` — Gold tier + 見届け人カード群
5. 代表作の Devlog 一覧 — 追いたくなる連なり
6. （任意）Veteran が開発者でも持つ 1 作品 → Studio — 開発者側の厚み

### 2.2 比較用 — Demo New User

| 項目 | 状態 |
|------|------|
| プレイ / Voice / 見届け人 | **すべて空** |
| 用途 | 新規導線・空状態 UI の对比のみ |

**切替は 2 アカウントだけ。** 8 ペルソナ巡回は不要。

---

## 3. 設計原則（維持）

| 原則 | 内容 |
|------|------|
| staging のみ | 本番 DB 禁止 |
| Seeder + service role | witness-sandbox 同型 |
| 本番機能を増やさない | 新 UI・新 API・新テーブルなし |
| 本番 UX 変更なし | ルート・バナー・モード切替なし |
| 原典整合 | ランキング・通知増殖・witness 人数表示なし |
| 固定ログイン情報 | **メール + パスワードを doc に明記**（オーナー実機確認必須） |

---

## 4. アーキテクチャ

```
staging Supabase
  └── [future-demo] 世界データ（25 作品・多数 Devlog/Voice/Release）
        ├── NPC 開発者 6 人（作品オーナー）
        ├── NPC プレイヤー 12 人（世界のノイズ — Voice/Play 生成用）
        ├── Demo Veteran（オーナーがログイン — 主役）
        └── Demo New User（オーナーがログイン — 空状態）
```

| 項目 | 方針 |
|------|------|
| 環境 | **staging**（`.env.local` → staging project） |
| 投入 | `npm run seed:future-demo:staging` |
| 検証 | `npm run verify:future-demo:staging` |
| 作品接頭辞 | `[future-demo]` — cleanup / 目視識別 |
| 画面 | 既存 URL のみ |

### mock 18 との共存

組み込み mock 18 作品は**非表示にしない**（UX 変更 Out）。

Walkthrough で **`[future-demo]` 接頭辞の作品を主に見る** と明記。発見画面は mock + デモ世界の合算密度になる。

---

## 5. 世界データ規模（推奨値）

数字は厳密固定ではなく、**verify が下限を断言**する。

| 対象 | 推奨 | 下限（verify） |
|------|------|----------------|
| **公開作品** | **25** | ≥ 20 |
| **開発者 NPC** | **6** | ≥ 5 |
| **NPC プレイヤー** | **12** | ≥ 10 |
| **Devlog 合計** | **90** | ≥ 60 |
| **Voice 合計** | **180** | ≥ 100 |
| **Released 作品** | **12** | ≥ 10 |
| **Reopened 作品** | **3** | ≥ 2 |
| **世界の witness grants 合計** | **40+** | ≥ 30 |
| **Veteran の witness grants** | **12** | ≥ 10（Gold） |

### 作品レイヤー（25 本の内訳案）

| レイヤー | 本数 | 内容 |
|----------|------|------|
| 序盤 | 8 | 試作・Devlog 1–3・Voice 少 |
| 成長中 | 10 | Devlog 4–8・Voice 中・未 Released |
| 正式版 | 12 | 初回 Released 済（上記と重複可 — 12 Released を優先） |
| 再調整 | 3 | `release_reopened` イベントあり |

※ 25 本のうち 12 が Released、3 が Reopened。成長中作品は Released 前の Devlog/Voice が厚い。

### 開発者 NPC（ログイン不要）

| ID | 表示名（案） | 作品数 | 役割 |
|----|--------------|--------|------|
| npc-dev-1 | 星野あかり | 5 | 多数 Devlog・Voice 受け皿 |
| npc-dev-2 | 結城ソラ | 4 | Released 2 + Reopened 1 |
| npc-dev-3 | 霧島レン | 4 | アクション系 flagship |
| npc-dev-4 | 白井ヒカル | 4 | パズル・短サイクル更新 |
| npc-dev-5 | 黒川ユイ | 4 | ホラー・長期 Devlog |
| npc-dev-6 | 青木タク | 4 | 協力プレイ・Voice 多 |

---

## 6. 必要ユーザー数

| 種別 | 人数 | オーナーがログイン |
|------|------|---------------------|
| **Demo Veteran** | 1 | **はい（主役）** |
| **Demo New User** | 1 | **はい（对比）** |
| 開発者 NPC | 6 | いいえ |
| プレイヤー NPC | 12 | いいえ |
| **合計 auth.users** | **20** | **2 のみ** |

NPC は Seeder が `auth.admin.createUser` で作成。オーナー向け credential は **2 件だけ** `docs/future-demo-walkthrough.md` に記載。

---

## 7. 固定ログイン情報（案 — 実装時に正本化）

| アカウント | メール | パスワード（固定） |
|------------|--------|---------------------|
| **Demo Veteran** | `veteran@forge-future-demo.local` | `ForgeDemo!Veteran2026` |
| **Demo New User** | `new@forge-future-demo.local` | `ForgeDemo!New2026` |

- seed 実行時にもターミナル出力
- **毎回同じ** — オーナーが何度でも実機確認可能
- staging の `/login` からログイン（ローカル dev + staging `.env.local` または staging 向け URL）

---

## 8. Demo Veteran のデータ設計

Veteran は **12 Released 作品すべて**（またはそのうち 12）で、初回 Released **前**に eligibility を満たす engagement を seed する。

| grant_path | 作品数（案） | Veteran の engagement |
|------------|--------------|------------------------|
| multi_version | 5 | sessions 0.1 + 0.2+ |
| voice | 4 | session + voice |
| watch | 3 | watch + sessions 2+ |

**手順（014 整合）**

1. Veteran + NPC の engagement を時系列で insert
2. 12 作品に初回 `released` を **時刻順** insert → trigger で Veteran に grant
3. 3 作品に `release_reopened` を追加（grant 増殖なし）
4. verify が Veteran grants ≥ 10 と tier Gold を断言

**プレイ履歴の厚み**

- 20+ 作品で `project_plays` + sessions
- 8+ 代表作で voice + `published_version` 付き devlog + release を同一タイムラインに
- 「◯回更新を見届けた」= 現行定義（published devlog 件数）が自然に 2+ になるよう devlog を配置

---

## 9. 世界ノイズ（NPC プレイヤー）

活気のため、Veteran **以外**の NPC プレイヤーにも:

- 各作品 2–8 Voice
- 各作品 1–4 play sessions
- 一部 watch

→ 開発者 Studio の Voice 一覧、作品詳細の雰囲気が「人がいる」状態になる。

**witness grants** も NPC 間で 30+ 件（Silver/Gold が世界に存在するが、**他人の tier は見えない** — Veteran 自分のマイページのみ）。

---

## 10. Seeder 構成

### 10.1 ファイル

```
scripts/future-demo-lib.ts           # 定数、固定 credential、marker、テンプレ
scripts/future-demo-seed.ts          # オーケストレータ
scripts/future-demo-verify.ts        # 世界密度 + Veteran/New 断言
docs/future-demo-walkthrough.md      # オーナー実機手順（実装 F5 で作成）
```

npm:

```
seed:future-demo:staging
verify:future-demo:staging
```

### 10.2 Seed フェーズ（順序固定）

| Step | 内容 |
|------|------|
| S0 | `--fresh` cleanup（grants 前のみ — append-only 遵守） |
| S1 | auth 20 人 + developer_profiles（NPC 6 + Veteran 用 1） |
| S2 | projects 25 insert（`[future-demo]` + marker JSON） |
| S3 | devlogs 一括（作品あたり 2–6、計 90 目標） |
| S4 | version_prompts + NPC engagement（Voice / sessions / watches） |
| S5 | Veteran engagement（12 Released 対象作品を中心に厚く） |
| S6 | release_events — 12 released → grants 発火 |
| S7 | 3 作品 reopen |
| S8 | verify 実行 |

### 10.3 テンプレート生成

- タイトル: `[future-demo] {形容詞}{名詞}` プールから 25 件（重複なし）
- 時系列: 基準日 2025-12-01 から 180 日 spread — 古い作品ほど Devlog/Release が多い
- 版: `0.1` → `0.2` → `0.3` — Released 前に Veteran sessions を配置

### 10.4 marker / cleanup

- `FUTURE_DEMO_MARKER` in `projects.description` — worldId, userIds, projectIds JSON
- `--fresh`: grants **前**の `[future-demo]` 作品のみ削除可能
- grants 後は **残置**（witness-sandbox と同じ）

---

## 11. Verify 方針

**ペルソナ表ではなく世界密度 + 2 ログインアカウント断言。**

| チェック | 条件 |
|----------|------|
| 作品数 | `[future-demo]` ≥ 20 |
| Devlog | ≥ 60 |
| Voice | ≥ 100 |
| Released | ≥ 10 |
| Reopened | ≥ 2 |
| 世界 grants | ≥ 30 |
| Veteran grants | ≥ 10 |
| Veteran tier | `resolveWitnessTier(n).label === "見届け人 Gold"` |
| Veteran sessions | ≥ 40 |
| New User grants | === 0 |
| New User sessions | === 0 |
| 014 table | exists |

FAIL 時: どの下限を満たさないかを stdout に明示。

---

## 12. Walkthrough（実装後 doc 骨子）

`docs/future-demo-walkthrough.md` に記載する内容:

### 12.1 事前

- staging `.env.local` 確認
- `npm run seed:future-demo:staging`
- `npm run verify:future-demo:staging` PASS

### 12.2 ログイン情報（固定）

上記 §7 の表を **そのまま** 掲載。

### 12.3 Veteran ツアー（30–45 分）

| # | URL | 見るポイント |
|---|-----|--------------|
| 1 | `/` | 投稿密度、`[future-demo]` 作品が並ぶ |
| 2 | `/games/{flagship}` | 育成感、Voice、Devlog 導線 |
| 3 | `/mypage#play-history` | タイムラインの厚み、release 行 |
| 4 | `/mypage#official-release` | Gold + 見届け人カード |
| 5 | Devlog ページ | 連続更新、変化の narrative |
| 6 | Reopened 作品 | 正式版再調整の履歴 |

### 12.4 New User（5 分）

- ログアウト → `new@...` ログイン
- `/mypage` 空状態 — Veteran との对比

### 12.5 UI レビュー観点チェックリスト

- 発見画面は魅力的か
- 詳細画面は育成感があるか
- プレイ履歴は価値を感じるか
- 見届け人は誇らしいか（自マイページのみ）
- Devlog は追いたくなるか
- 正式版到達は嬉しいか

---

## 13. 既存機能（変更なし）

**使う**: 発見、作品詳細、Voice、#play-history、#official-release + tier、Studio、Devlog、Release パネル

**使わない / 禁止**: ランキング、通知追加、Adoption 表示、作品詳細 witness 人数、PLAYER_VISIBLE

---

## 14. 実装フェーズとコスト

| Phase | 内容 | 工数 |
|-------|------|------|
| **F0** | 本 doc v2 GO | 0.5 日 |
| **F1** | lib + 20 users + 25 projects 骨格 | 2 日 |
| **F2** | devlogs + NPC voice/sessions 一括 | 2–2.5 日 |
| **F3** | Veteran arc + 12 release + grants | 2 日 |
| **F4** | reopen + 世界 grants ノイズ + verify | 1–1.5 日 |
| **F5** | walkthrough doc + オーナー目視 | 0.5–1 日 |

**合計: 8–9.5 日**

**MVP 短縮（6 日）**: 18 作品、8 Released、Veteran grants 10、Devlog 50 — UI レビュー最低ライン。

---

## 15. リスクと対策

| リスク | 対策 |
|--------|------|
| grants append-only | `--fresh` は grants 前のみ。再 seed は新 worldId / 新 prefix 検討 |
| seed 時間・件数 | バッチ insert、テンプレートで重複コード削減 |
| mock 18 混在 | walkthrough で `[future-demo]` を明示 |
| パスワード不明 | **固定 credential** を walkthrough 正本化（§7） |
| release 順序ミス | verify が Veteran grants / Gold を断言 |

---

## 16. v1 からの変更点

| v1（旧） | v2（本 doc） |
|----------|--------------|
| Player A–D + Developer A–D | **Demo Veteran + Demo New User** のみログイン |
| 5–6 作品 | **20–25 作品** |
| ペルソナ差分検証 | **活気ある世界 + Veteran 主役体験** |
| 8 ログインアカウント | **2 ログイン + 18 NPC** |

---

## 17. オーナー判断依頼（GO 前）

1. **世界規模**: 25 作品フル vs MVP 18 作品
2. **固定パスワード**: §7 案でよいか
3. **mock 18 混在**: walkthrough 明示で許容か
4. **Veteran Gold**: grants 12 でよいか（10 最低）
5. **F0 GO** → 実装開始

---

## 18. 関連

- `scripts/witness-sandbox-lib.ts`
- `lib/witness-tier.ts`
- `docs/player-play-history-design.md`
- `docs/official-release-design.md`
- `docs/forge-principles.md`
