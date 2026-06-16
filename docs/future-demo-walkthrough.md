# 将来像デモ世界 — Walkthrough（staging）

**正本 credential** — 毎回同じ。seed 完了時にもターミナルに出力される。

---

## 1. 固定ログイン

| アカウント | メール | パスワード | 用途 |
|------------|--------|------------|------|
| **Demo Veteran**（主役） | `veteran@forge-future-demo.local` | `ForgeDemo!Veteran2026` | 成功した Forge 世界の住人として歩く |
| **Demo New User**（对比） | `new@forge-future-demo.local` | `ForgeDemo!New2026` | 新規空状態の对比 |

**ログイン URL**: staging に接続した Forge の `/login`  
（ローカル: `npm run dev` + staging `.env.local`）

NPC 18 人（開発者 6 + プレイヤー 12）は Seeder が作成。**オーナーは上記 2 つのみログイン。**

---

## 2. Seed / Verify

```bash
npm run seed:future-demo:staging
npm run verify:future-demo:staging
```

- **staging のみ** — 本番 DB 禁止
- 初回 seed 後は `--fresh` 不可（witness grants append-only）
- 再 seed が必要な場合は別途相談（通常は hide/show で十分）

---

## 3. 世界戦の切替（元の世界 ↔ デモ世界）

witness grants 付与後は作品削除不可のため、**visibility トグル**で世界を切替する。

| 操作 | コマンド | 効果 |
|------|----------|------|
| **元の世界戦に戻す** | `npm run hide:future-demo:staging` | 全 `[future-demo]` 作品を **private** に |
| **デモ世界戦に戻す** | `npm run show:future-demo:staging` | 全 `[future-demo]` 作品を **public** に |

- オーナーが「元の世界戦に戻して」と言ったら **hide**
- 「デモ世界に戻して」と言ったら **show**
- Veteran の grant / 履歴データは DB に残る（削除しない）

---

## 4. 世界構成サマリ（25 作品）

| 項目 | 数 |
|------|-----|
| 公開作品（seed 後） | 25 |
| 開発者 NPC | 6 |
| プレイヤー NPC | 12 |
| auth 合計 | 20 |
| Released | 12 |
| Reopened | 3 |
| Devlog 合計 | 90 前後 |
| Voice 合計 | 100+ |

作品はすべて **`[future-demo]`** 接頭辞。発見画面では mock 18 作品も並ぶ — **デモレビューは接頭辞で識別。**

### Demo Veteran の状態（目安）

- 見届け人 grant: **12** → tier **Gold**
- プレイ sessions: **40+**
- Voice: **25+**
- 正式版到達・Devlog 反映をプレイ履歴で確認可能

---

## 5. Veteran ツアー（30–45 分）

1. **ログイン** — `veteran@forge-future-demo.local`
2. **`/`** — 投稿密度。`[future-demo]` 作品が並ぶか
3. **代表作** — `[future-demo] 星灯の旅路` 等の `/games/[id]` — 育成感・Voice・Devlog 導線
4. **`/mypage#play-history`** — 厚いタイムライン、release 行
5. **`/mypage#official-release`** — **Gold** tier + 見届け人 teal カード
6. **Devlog 一覧** — 連続更新、変化の narrative
7. **Reopened 作品** — `[future-demo]` の Reopened 3 本で再調整履歴

### UI レビュー 6 観点

- 発見画面は魅力的か
- 詳細画面は育成感があるか
- プレイ履歴は価値を感じるか
- 見届け人は誇らしいか（自マイページのみ）
- Devlog は追いたくなるか
- 正式版到達は嬉しいか

---

## 6. New User（5 分）

1. ログアウト
2. `new@forge-future-demo.local` でログイン
3. `/mypage` — 空状態を Veteran と对比

---

## 7. 維持事項

- PLAYER_VISIBLE=false — Adoption は UI に出ない
- witness 人数・作品詳細 witness — 出ない
- ランキング・通知追加 — なし

---

## 8. 関連

- 設計: `docs/future-demo-environment-design.md`
- Seeder: `scripts/future-demo-seed.ts`, `scripts/future-demo-lib.ts`
- Verify: `scripts/future-demo-verify.ts`
