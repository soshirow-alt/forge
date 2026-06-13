# 本番 Supabase migration 適用手順

**対象プロジェクト**: `bpnisgzxuwdxelhnduuf`（本番 JS から確認）  
**本番 URL**: https://forge-flame-gamma.vercel.app  
**Vercel プロジェクト**: `forge`（`forge-app` ではない — env 未設定）

## 適用順

1. [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクト → **SQL Editor**
2. 未適用の migration のみ実行（下記「確認方法」参照）
3. 実行後、`scripts/check-supabase-tables.mjs` をローカル `.env` で実行して確認

## 002（未適用の場合）

`supabase/migrations/002_user_engagement.sql` の全文を実行。

## 003（未適用の場合）

`supabase/migrations/003_project_devlogs_and_notifications.sql` の全文を実行。

## 確認方法（ローカル）

```bash
# .env.local に Vercel の forge プロジェクトと同じ値を設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

node scripts/check-supabase-tables.mjs
```

すべて `OK` なら適用済み。

## 安全性

- `CREATE TABLE IF NOT EXISTS` / `CREATE POLICY` は再実行でテーブル破壊なし
- ポリシー名衝突時のみ SQL Editor でエラー → 該当 policy を drop して再実行
- **既存 `projects` / `developer_profiles` データは変更しない**

## Vercel env 確認

Dashboard → Vercel → プロジェクト **forge** → Settings → Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Production / Preview 両方に設定されていること。  
`forge-app` 側には env が無いため、デプロイ先を間違えないこと。
