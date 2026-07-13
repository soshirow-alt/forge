# Cursor ALLOW と Supabase 環境境界

## 用語

| 用語 | 意味 |
| --- | --- |
| **オーナー指示** | チャット上の明示スコープ承認 |
| **Cursor ALLOW** | `permissions.json` / Auto-review の技術的実行許可（best-effort） |

## Supabase 境界（正本）

| 環境 | ref | Cursor の扱い |
| --- | --- | --- |
| **Staging**（Preview 接続先） | `vuqpwvjvgyxffmvpfrxo` | **常時自律**: migration / seed / CRUD / Storage / smoke / 後片付け。再確認しない |
| **Production** | `bpnisgzxuwdxelhnduuf` | **原則オーナー手動**: migration / UPDATE / DELETE / backfill / Storage 変更。Cursor は適用 SQL・実行順・影響範囲・適用後確認 SQL を提示。オーナー適用後の **read-only 検証と smoke は自律** |

Production の read-only（SELECT / REST GET / read-only RPC / 件数・行特定）はいつでも可。

## その他の自律範囲

| 範囲 | 内容 |
| --- | --- |
| **通常修正** | 調査〜verify〜commit〜Preview push/deploy/smoke |
| **Production コード反映** | オーナーが「本番反映」等を明示 → main push・Vercel Production deploy・smoke・changelog・main/preview 同期（工程再確認なし）。**DB migration / 破壊的 DB write はオーナー手動**（上記境界） |

## 停止する条件のみ

1. 指示外の未commit差分が本番に混ざる
2. 依頼範囲を超えるデータ変更が必要
3. 想定外の大量 UPDATE／DELETE
4. 対象環境・対象行を一意に特定できない（または Staging 適用手段が無い）
5. 当初と異なる重大リスクが判明
6. 依頼されていない force push／履歴破壊／広範囲削除が必要
7. secret 本体の表示・共有が必要

## 設定場所

- `.cursor/permissions.json`
- `.cursor/sandbox.json`
- `.cursor/rules/stall-detection-resume.mdc`
- `AGENTS.md` / `.cursor/rules/forge.mdc`

Run Mode は **Auto-review を維持**。
