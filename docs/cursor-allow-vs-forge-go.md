# Cursor ALLOW と Forge オーナー指示

## 用語

| 用語 | 意味 |
| --- | --- |
| **オーナー指示** | チャット上の明示スコープ承認（「Stagingに適用」「Previewまで」「本番反映」「本番DBに適用」等） |
| **Cursor ALLOW** | `permissions.json` / sandbox / Auto-review による技術的実行許可（best-effort） |

オーナー指示の範囲内では工程ごとの再確認をしない。Cursor ALLOW カードも、許可済み操作では可能な限り出さない。

## 自律範囲

| 範囲 | 内容 |
| --- | --- |
| **Staging** | 常時自律（migration / CRUD / seed / backfill / Storage / smoke / 後片付け） |
| **通常修正** | 調査〜verify〜commit〜Preview push/deploy/smoke |
| **Production** | 「本番反映」「リリース」「本番DBに適用」等の**一度の指示**で main push・deploy・必要 migration/DB/Storage・smoke・changelog・main/preview 同期まで一括 |

## 停止する条件のみ

1. 指示外の未commit差分が本番に混ざる
2. 依頼範囲を超えるデータ変更が必要
3. 想定外の大量 UPDATE／DELETE
4. 対象環境・対象行を一意に特定できない
5. 当初と異なる重大リスクが判明
6. 依頼されていない force push／履歴破壊／広範囲削除が必要
7. secret 本体の表示・共有が必要

## 設定場所

- `.cursor/permissions.json`
- `.cursor/sandbox.json`
- `.cursor/rules/stall-detection-resume.mdc`
- `AGENTS.md` / `.cursor/rules/forge.mdc`

Run Mode は **Auto-review を維持**（Run Everything にしない）。
