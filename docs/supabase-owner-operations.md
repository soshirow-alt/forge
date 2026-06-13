# Supabase 運用確認 — オーナー向け

Cursor から Supabase アカウントの中身（プラン・請求・利用量）は **直接見えません**。  
以下は **オーナーが Dashboard で確認する手順** と、Forge 規模での **一般的なリスク** です。

---

## 確認手順（5分）

### 1. 誰のアカウント配下か

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 右上アイコン → **Account** / **Organization**
3. 表示されている **Organization 名・メール** が Forge 用オーナーアカウントか確認

### 2. プラン（Free / Pro / Team）

1. 対象プロジェクト `bpnisgzxuwdxelhnduuf` を開く
2. 左下 **Project Settings** → **Billing**（または Organization の **Billing**）
3. **Current plan** を確認

| プラン | Forge MVP での目安 |
|---|---|
| **Free** | 個人開発・小規模 MVP に十分なことが多い |
| **Pro** | 本番トラフィック増・バックアップ要件で検討 |
| **Team** | 複数人運用時 |

### 3. 課金情報登録の有無

同じ **Billing** 画面で：

- **Payment method** が登録されているか
- **Free plan** のままなら、通常 **カード未登録でも可**

### 4. 現在の利用量

**Project Settings** → **Database** または **Usage**（表示名は時期により異なる）：

| 項目 | Free 目安（2025〜2026 時点の一般的な枠） | 確認ポイント |
|---|---|---|
| データベースサイズ | 500 MB / プロジェクト | Table Editor でデータ量 |
| 認証 MAU | 50,000 / 月 | Forge 初期は余裕 |
| エグレス | 5 GB / 月 | 画像サムネ大量時のみ注意 |
| 同時接続 | 制限あり | 初期は問題になりにくい |

※ 正確な数値は [Supabase Pricing](https://supabase.com/pricing) で確認してください。

### 5. 無料枠超過時の挙動（Free プラン）

一般的には：

- **Usage アラート** が Dashboard に出る
- 超過が続くと **プロジェクト制限**（読み取り/書き込み制限、一時停止など）— 時期・プランでポリシー変更あり
- **自動課金は Free のままでは通常発生しない**（Pro へのアップグレードは手動）

Forge MVP 初期（ユーザー数十〜数百）では **DB サイズ・MAU とも余裕** なケースがほとんどです。

---

## 現時点での課金リスク（Forge 前提）

| リスク | 程度 | 理由 |
|---|---|---|
| migration 002/003 適用 | **低** | 空テーブル追加のみ。ストレージ微増 |
| 通常の devlog / 通知 / 応援 | **低** | テキスト中心、行数少 |
| サムネ data URL 大量投稿 | **中** | DB が膨らむ。将来は Storage 移行検討 |
| Free プロジェクト自動停止 | **低〜中** | 長期間完全無アクセス時（Supabase ポリシー要確認） |
| 意図しない Pro 加入 | **低** | 手動アップグレードしない限り発生しにくい |

---

## Forge 本番接続情報（固定メモ）

| 項目 | 値 |
|---|---|
| Supabase Reference ID | `bpnisgzxuwdxelhnduuf` |
| 本番 Web | https://forge-flame-gamma.vercel.app |
| Vercel プロジェクト名 | **forge**（`forge-app` ではない） |
| env 変数 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## オーナーが月1で見るとよいもの

- [ ] Billing → プラン変更されていないか
- [ ] Usage → DB サイズ・MAU
- [ ] Table Editor → 想定外の大量データがないか
- [ ] Authentication → ユーザー数の推移

確認結果は ChatGPT 共有用サマリまたは handoff に一行メモしておくとよい。
