# MVP 本番 E2E チェックリスト（正本）

**用途**: 本番（https://forge-flame-gamma.vercel.app）への deploy 後、または Supabase migration 適用後の確認。  
**更新**: 2026-06-15 — migration 009/010（voice_received 通知・読了 Supabase 化）対応

**適用順（正本）**: Dashboard **009 → 010 両方適用** → deploy → 本チェックリスト実施

**前提**

- Supabase プロジェクト `bpnisgzxuwdxelhnduuf`
- migration **009 → 010 両方適用後** deploy（`docs/migration-009-010-apply.md`）
- テスト用アカウント: **開発者 A（owner）**、**プレイヤー B（別ユーザー）** を用意

記録欄: 各項目に `[ ]` / `[x]`、日時・担当・メモを追記

---

## 0. migration 確認

### 009（voice_received 通知）

- [ ] Dashboard SQL Editor で `009_voice_received_notifications.sql` 適用済み
- [ ] `user_notifications.version_key` 列が存在
- [ ] `user_notifications_type_check` に `voice_received` を含む
- [ ] trigger `project_voice_responses_notify_owner` が存在
- [ ] 関数 `notify_owner_on_voice_response` が存在

確認 SQL（Dashboard）:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_notifications' AND column_name = 'version_key';

SELECT tgname FROM pg_trigger WHERE tgname = 'project_voice_responses_notify_owner';
```

### 010（project_voice_reads）

- [ ] Dashboard で `010_project_voice_reads.sql` 適用済み
- [ ] テーブル `project_voice_reads` が存在（列: user_id, project_id, version_key, source_type, read_at）
- [ ] RLS policy が SELECT / INSERT / UPDATE の 3 件

確認 SQL:

```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'project_voice_reads';
```

---

## 1. プレイヤー導線

**対象**: 未ログイン → ログイン → プレイ → 初声回答

- [ ] トップ `/` で作品一覧が表示される（ログイン不要）
- [ ] 作品詳細 `/games/{id}` が閲覧できる
- [ ] 「プレイする」等から `/login` へ（モーダルで阻まない）
- [ ] ログイン後、プレイ画面で voice 問いに回答できる
- [ ] 回答送信後、エラーなく完了表示
- [ ] owner 自身のテストプレイ回答では **開発者向け通知が増えない**（009 仕様）

---

## 2. 開発者導線

**対象**: studio・my-projects・読了フロー

- [ ] `/my-projects` に自分の作品が表示される
- [ ] 未読 voice がある作品に「回答を見る」系の次アクションが出る
- [ ] `/projects/{id}/studio` — プレイヤーの回答セクション（集計）が表示
- [ ] studio Hero の主 CTA（未読時）で read パネルが開く
- [ ] 「読了にする」操作が成功（エラー toast / console error なし）
- [ ] 読了後、同版の未読表示が消える（my-projects / studio Hero）
- [ ] 詳しい感想（project_feedback）は副セクションのまま（今回スコープ外の通知なし）

---

## 3. 通知（voice_received）

**対象**: DB 通知の作成・表示・リンク

- [ ] プレイヤー B が voice 回答 → owner A の `/notifications` に **1 件**（type 表示: プレイヤーの回答）
- [ ] 文言に作品タイトルと `v{version}` が含まれる
- [ ] 同版で追加回答 → **未読通知は 1 件のまま**（message / created_at 更新）
- [ ] 通知リンク先: `/projects/{id}/studio#feedback`（studio フィードバック位置）
- [ ] 通知を開いて既読にできる（個別既読）
- [ ] 「すべて既読」が動作
- [ ] ヘッダー通知バッジ件数が DB 通知と整合

**やらない（今回 Out）**

- deep feedback / 詳しい感想の DB 通知
- push / メール

---

## 4. 読了（project_voice_reads）

**対象**: Supabase 正本、localStorage 非移行

- [ ] studio「読了にする」後、Dashboard で `project_voice_reads` に行が upsert される
- [ ] `source_type = voice`、`version_key` = 現行 playable version
- [ ] 再ログイン・別ブラウザでも読了状態が維持（localStorage ではなく DB）
- [ ] 読了操作で **同版の未読 voice_received 通知** も既読になる（read_at 更新）
- [ ] improvement メモは **localStorage のまま**（010 対象外）

---

## 5. RLS 簡易確認

**project_voice_reads**

- [ ] owner A が自分の作品の読了を SELECT / INSERT / UPDATE できる
- [ ] プレイヤー B が owner A の `project_voice_reads` に INSERT できない（403 / RLS error）
- [ ] owner A が他人の project_id で INSERT できない

**user_notifications（voice_received）**

- [ ] プレイヤー B が `user_notifications` に voice_received を **直接 INSERT できない**（trigger のみ作成）
- [ ] owner A は自分宛て通知のみ SELECT / UPDATE（既存 005 policy）

**任意（Dashboard SQL — service role 以外はクライアントから）**

- アプリの Network タブで voice 回答 POST が `project_voice_responses` のみで、`user_notifications` INSERT が無いこと

---

## 6. 回帰（既存機能）

- [ ] devlog 公開 → watcher への `devlog` 通知
- [ ] 版公開 → watcher への `version_published` 通知
- [ ] 応援・ブックマーク・ウォッチ
- [ ] `/notifications` ↔ マイページ更新セクション
- [ ] build / lint CI 相当がローカルで pass

---

## 6b. マイページ IA（deploy 後）

- [ ] ヘッダーに「マイページ」1つのみ（開発マイページリンクなし）
- [ ] `/mypage` タブ: 「プレイヤー活動」「作品管理」
- [ ] `/my-projects` → `/mypage?tab=developer` リダイレクト
- [ ] プレイヤータブ: 2×2 カード + 更新を見る（プレビュー2件）
- [ ] 「自分で投稿した作品」がプレイヤータブに無い（作品管理タブのみ）
- [ ] 作品管理: 2カラムグリッド・検索・要対応フィルタ

---

## 7. 記録テンプレート

```
日付:
deploy URL / commit:
009 適用: 済 / 未
010 適用: 済 / 未
確認者:
結果: PASS / FAIL（項目番号）
メモ:
```

---

## 関連ドキュメント

- migration 適用手順: `docs/migration-009-010-apply.md`
- 設計レビュー: `docs/mvp-db-design-review-voice-notify-reads-e2e.md`
- migration 後確認: `docs/supabase-post-migration-checklist.md`
