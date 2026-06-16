# voice_adoptions — staging / fixture 検証手順

本番 migration・本番 OpenAI・Edge Function deploy は **まだ行わない**。
まず fixture モードで precision / UI / dispute / RLS を確認する。

## 1. 環境変数（ローカル `.env.local`）

```env
NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE=true
VOICE_ADOPTION_MATCHER_MODE=fixture
```

- `NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE=true` … UI 用 localStorage fixture store（adoptions 表示・dispute）
- `VOICE_ADOPTION_MATCHER_MODE=fixture` … matcher は決定論 fixture（OpenAI なし）

## 2. matcher precision（10 ペア）

```bash
npm run verify:voice-adoption
```

期待結果:

- precision **100%**（偽陽性 0）
- recall **≥ 60%**（5 件中 3 件以上採用 — fixture では 5/5 = 100%）
- 関連あり 5 / 無関連 3 / グレー 2

API でも確認可（dev のみ）:

```bash
curl -X POST http://localhost:3000/api/voice-adoption/matcher
```

## 3. Phase2 UI 確認

1. `npm run dev`
2. ログイン
3. `/mypage` — 「あなたの回答から変わったこと」が **MyPageUpdatesSection の上** に表示
4. `/games/emberfall` — 同セクション（compact）。0 件なら非表示
5. 各カードに `player_quote` ↔ `update_summary` の対が表示されること
6. 「もう一度プレイする」→ `#new-playable-version-banner`
7. 「この関連は違う」→ 行が消える（suppressed）

## 4. Studio 採用件数

1. 開発者として `/projects/emberfall/studio`（または該当 Studio）
2. 育成サイクル「公開」パネル
3. fixture 時: 「あなたの声が反映された件数: 5件」（Emberfall + fixture のみ）

## 5. dispute → suppressed

fixture モード:

1. `/mypage#voice-adoptions` で 1 件「この関連は違う」
2. カードが消える
3. localStorage `forge-voice-adoptions-fixture-v1` 内 status が `suppressed`

DB 適用後（staging Dashboard で 011 適用後）:

1. disputes INSERT → trigger で adoption status=suppressed
2. SELECT では active のみ返るため UI から消える

## 6. RLS（2 アカウント — migration 011 適用後）

**アカウント A（プレイヤー）**

- `voice_adoptions` SELECT: 自分の active のみ
- 他ユーザー adoption は見えない

**アカウント B（別プレイヤー）**

- A の adoption 行は 0 件

**プロジェクトオーナー**

- 自 project の adoptions（active + suppressed）を SELECT 可（Studio 件数用）
- matcher_runs も自 project のみ

確認 SQL（Dashboard SQL Editor、各ユーザー JWT コンテキストまたは service role + RLS テスト）:

```sql
-- プレイヤー A として
select id, player_quote, status from voice_adoptions where user_id = auth.uid();
```

## 7. 本番適用前

- `docs/voice-adoptions-pre-implementation-review.md` §17 Run 判断用メモを ChatGPT に貼付
- staging で 011 適用 → 上記 RLS → その後 Edge Function deploy（別 Run）

## 8. 今回やらないこと

- Supabase Dashboard 本番 migration
- 本番 Edge Function deploy
- 本番 OpenAI
- voice_adopted 通知
- 再プレイ hook 本実装
- 育成履歴 UI
