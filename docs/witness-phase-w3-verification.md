# 見届け人 W3 — grant verify（staging）

**ステータス**: verify PASS（2026-06-16）  
**コマンド**: `npm run verify:witness:grants:staging`  
**前提**: migration 014 適用済み

---

## 1. 014 適用結果

- `project_witness_grants` 存在 — **PASS**
- 適用方法: Supabase Dashboard SQL（オーナー）

---

## 2. sandbox seed

**方針**: 専用 sandbox 作品（`[witness-sandbox] grant-verify …`）、`visibility: private`

| ユーザー | seed 内容 | 期待 grant |
|----------|-----------|------------|
| User A | sessions 0.1 + 0.2 | `multi_version` |
| User B | session + voice 1 | `voice` |
| User C | watch + sessions 2 | `watch` |
| Negative | session 1 のみ | なし |
| Owner | sessions 2 版 | なし（除外） |

**ユーザー ID**: project `description` に JSON 保存（seed / verify 同期）

**auth ユーザー不足時**: service role で sandbox 用ユーザーを 4 件自動作成

**コマンド**

```bash
npm run seed:witness:sandbox -- --fresh
npm run verify:witness:grants:staging
```

---

## 3. W3 verify 結果（2026-06-16）

**sandbox**: `37287da7-7168-4918-90dd-f4e399a6d95d`

| 検証 | 結果 |
|------|------|
| grant 件数 | 3 |
| path A | 1 |
| path B | 1 |
| path C' | 1 |
| Negative | grant なし PASS |
| Owner | grant なし PASS |
| Release Reopened | 件数 3 維持 PASS |
| 再 Released | 件数 3 維持 PASS |

---

## 4. cleanup 方針

- **`project_witness_grants` は append-only** — DELETE 不可（mutation trigger）
- verify 後も grant 行は **残す**
- sandbox project は `private` のまま放置可（後で無視・一覧フィルタ）
- 再 verify: `verify:witness:grants:staging` が **毎回 --fresh sandbox** を作成
- pre-release のみ `--cleanup` で engagement 削除可（grant 存在後は project 削除不可）

**やらない**: grant バックフィル、既存 Released 作品への遡及付与

---

## 5. Out

- UI / 通知 / ランキング / PLAYER_VISIBLE / tier

---

## 6. 関連

- `docs/witness-phase-w2-migration.md`
- `lib/witness-eligibility.ts`
- `supabase/migrations/014_project_witness_grants.sql`
