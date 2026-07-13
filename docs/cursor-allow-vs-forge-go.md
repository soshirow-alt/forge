# Cursor ALLOW と Supabase 環境境界

## 用語

| 用語 | 意味 |
| --- | --- |
| **オーナー指示** | チャット上の明示スコープ承認 |
| **Cursor ALLOW** | `permissions.json` / Auto-review の技術的実行許可（best-effort） |
| **本番コード一括承認** | チャットの「本番反映して」「リリースして」等 → main 反映+push・Production deploy・smoke・main↔preview 同期を **工程再確認なし** で一括実行 |

## Supabase 境界（正本）

| 環境 | ref | Cursor の扱い |
| --- | --- | --- |
| **Staging**（Preview 接続先） | `vuqpwvjvgyxffmvpfrxo` | **常時自律**: migration / seed / CRUD / Storage / smoke / 後片付け。再確認しない |
| **Production** | `bpnisgzxuwdxelhnduuf` | **原則オーナー手動**: migration / INSERT / UPDATE / DELETE / backfill / Storage 変更。Cursor は適用 SQL・実行順・影響範囲・適用後確認 SQL を提示。オーナー適用後の **read-only 検証と smoke は自律** |

Production の read-only（SELECT / REST GET / read-only RPC / 件数・行特定）はいつでも可。

## その他の自律範囲

| 範囲 | 内容 |
| --- | --- |
| **通常修正** | 調査 → 編集 → verify → commit → Preview push / deploy / smoke（自律） |
| **Production コード反映** | 「本番反映して」「リリースして」等の一度の指示 = 一括承認。main 反映+push・Vercel Production deploy・smoke・changelog・main↔preview 同期。**工程ごとの確認はしない**。**DB migration / INSERT / UPDATE / DELETE / backfill / Storage はオーナー手動**（上記境界） |

## 停止する条件のみ

1. 指示外の未commit差分が本番反映へ混ざる
2. 対象環境・対象行を一意に特定できない（または Staging 適用手段が無い）
3. 想定外の大量変更（UPDATE／DELETE／backfill 等）
4. 依頼されていない不可逆操作（force push・履歴破壊・広範囲削除等）が必要
5. secret 本体の表示・共有が必要

（依頼範囲を超えるデータ変更が必要になった場合、または当初と異なる重大リスクが判明した場合も停止。）

加えて **§10.2**（課金・原典変更等）は `docs/forge-triage-operations.md` 参照。

## 設定場所

- `.cursor/permissions.json`
- `.cursor/sandbox.json`
- `.cursor/rules/stall-detection-resume.mdc`
- `AGENTS.md` / `.cursor/rules/forge.mdc`

**Run Mode**: オーナーは full-auto 寄りを意図。`permissions.json` の allow/block はそれに合わせる。**Production DB write は引き続きオーナー手動**（エージェントは実行しない）。
