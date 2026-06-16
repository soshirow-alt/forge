# Forge Handoff

> ChatGPT / Cursor 間の**現在地サマリ**。  
> 詳細な原典は `docs/forge-principles.md`、履歴は `docs/forge-changelog.md` を参照。

最終更新：**2026-06-16**（Studio フェーズパネル + プレイヤー更新 UI 実装完了）

---

## 現在の状態

Forge は **完成前のインディーゲームを発見 → プレイ → 声を届ける → 変化を見る → 再プレイ** する MVP。

**開発者ループ**: 投稿 → **育成（studio）** → 回答を見る → ゲームを修正する → 変更を記録する → 新版を公開する → 反応を待つ  
**プレイヤーサイクル**: 発見 → プレイ → 声を届ける → **前回プレイ後の更新を見る** → 再プレイ

- **作品育成**: `/projects/{id}/studio` — 単一フェーズパネル（rail + いま: 工程名 + ガイダンス + CTA）
- **growth 判定**: `project_voice_responses` 中心。`buildNurtureDisplayContext` は phaseLabel（工程名のみ）
- **読了**: Supabase `project_voice_reads`（owner + version + source_type=voice）
- **開発者通知**: trigger `voice_received` → `/notifications` → studio
- **本番**: https://forge-flame-gamma.vercel.app（deploy 後 commit 更新）
- **migration 009/010**: Dashboard 適用済み

---

## ロードマップ優先順位（2026-06-16 確定）

| 順 | テーマ | 状態 |
|----|--------|------|
| **P0** | Studio 導線の整理（フェーズパネル統合） | **実装済み** |
| **P1** | プレイヤー更新 UI + cursor:pointer | **実装済み** |
| **P2** | プレイヤー「自分の意見が採用された」体験（AI 紐づけ） | **設計レビューのみ** — `docs/player-voice-adoption-ai-design-review.md` |
| 次 GO 待ち | voice_adoptions migration + Edge Function + voice_adopted 通知 | P2 GO 後 |

---

## 直近で決まった仕様

1. **Studio Hero = 工程名のみ** — 「プレイヤーの回答が届きました」等のイベント語は Hero/カードタイトルに使わない
2. **作品カード**: 「いま: {工程名}」（「次:」禁止）
3. **マイページ更新**: セクション「前回プレイ後の更新」。primary「もう一度プレイする」、secondary「更新内容を見る」
4. **AI 採用体験**: 開発者手動「参考にした」は避ける。LLM + confidence + 具体引用 UI（未実装）
5. **原典**: `docs/forge-principles.md` が唯一の憲法

---

## 画面マップ（主要）

| URL | 用途 |
|-----|------|
| `/` | 発見（公開） |
| `/games/{id}` | プレイ・初声・これまでの更新 |
| `/mypage` | プレイヤー活動 / 作品管理タブ |
| `/projects/{id}/studio` | 開発者育成フェーズパネル |
| `/notifications` | 通知一覧 |

---

## 危険箇所

| 項目 | リスク |
|------|--------|
| AI 採用未実装 | プレイヤー「育てた感」は更新 UI のみ — P2 GO まで限界 |
| improvement メモ | localStorage のみ |
| 低 confidence AI | 将来 GO 時 — 誤通知より無通知を優先 |

---

## 次にやるべきこと

1. **本番 deploy 確認**（Studio フェーズ / マイページ更新 UI）
2. **P2 GO 判断** — AI voice↔devlog 紐づけ（設計レビュー参照）
3. **E2E** — 2アカウント voice 通知・読了・フェーズ遷移

---

## ChatGPTに相談したいこと

- P2 confidence 閾値（0.75 案）の許容 — 取りこぼし vs 誤通知
- 同趣旨複数プレイヤーへの通知方針
- devlog 本文を AI に送るプライバシー・ログ保持
