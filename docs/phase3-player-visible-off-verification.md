# Phase3 — PLAYER_VISIBLE=false 時の確認手順

**前提**: `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false`（本番 GO 後も維持）

Phase3 コードは **PLAYER_VISIBLE ゲート** の内側。false の間プレイヤーには **一切表示されない**。

---

## 1. 本番 / staging（PLAYER_VISIBLE=false）

| 画面 | URL | 期待 |
|------|-----|------|
| マイページ | `/mypage` | adoption セクション **なし** |
| 作品詳細 | `/games/[id]` | adoption セクション **なし** |
| 作品詳細 + adoption URL | `/games/[id]?adoption={uuid}#adoption-verify` | AdoptionVerifyBanner **なし** |
| プレイ起動 | サイドバー「プレイする」 | 通常 PlayLaunchDialog（adoption 文言 **なし**） |

**裏側**: matcher は `voice_adoptions` に INSERT 継続（Studio 件数は開発者のみ）。

---

## 2. ローカル — Phase3 配線確認（一時的に visible ON）

**`.env.local` のみ**（commit しない）:

```env
NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=true
NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE=true
```

`npm run dev` 再起動。

1. `/mypage#voice-adoptions` — CTA が **「変化を確かめる」**、href に `?adoption=` + `#adoption-verify`
2. fixture adoption 行の CTA をクリック → `/games/{id}?adoption=...`
3. **AdoptionVerifyBanner** が NewPlayableVersionBanner **の上** に表示
4. 「プレイして確認する」→ PlayLaunchDialog に **quote / summary** 文言
5. プレイ後 voice フォーム — **「前回の変更を確かめたあと…」** 前置き

確認後 **必ず** `PLAYER_VISIBLE=false` に戻す。

---

## 3. build

```bash
npm run build
```

---

## 4. PLAYER_VISIBLE=true GO 時（別 Run）

ChatGPT + オーナー判断後:

1. Vercel `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=true`
2. Redeploy
3. 本番で §2 相当を fixture なしで確認
4. FP 監視継続

---

## 関連

- `docs/phase3-implementation-plan.md`
- `docs/phase3-adoption-verify-ux-design.md`
