# production-mode 分岐監査（再発防止）

**目的** — v0/mock 時代の `shouldHideV0MockContent()` 分岐が、本番だけ機能・UI を欠落させる **構造的回帰** を防ぐ。

**正本** — モード判定: `lib/production-mode.ts`  
**配線ロードマップ** — `docs/official-release-wiring-plan.md`（Coming Soon の順序はこちら。本 doc では配線しない）

---

## モードの意味

| シグナル | 典型 | mock UI | Studio ログイン bypass |
|----------|------|---------|------------------------|
| Preview | `preview-landing-01` hostname / preview slot + `preview/landing-01` ref | あり | あり |
| Local | localhost | あり（ref 次第） | あり |
| Production | 本番 hostname / `VERCEL_ENV=production` | **なし** | **なし** |
| 強制本番同等 | `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` | **なし** | **なし** |

**Preview OK ≠ 本番 OK** — mock 用コンポーネントと本番用コンポーネントが別だと、Preview 確認の意味が弱くなる（2026-06 `/studio/mypage` 回帰が典型）。

---

## 禁止ルール（新規・変更時）

1. **`shouldHideV0MockContent()` で UI コンポーネントを丸ごと差し替えない**  
   例外: 監査表「高リスク」に理由・是正期限を記載し、オーナー GO がある場合のみ。

2. **`isPreviewV0Deployment()` で削除・投稿・保存・フォロー等の機能ボタンを隠さない**  
   Preview 限定機能は product 判断 + changelog + オーナー確認事項に明記。  
   判定 API 自体は `lib/production-mode.ts` 内のみ（`scripts/verify-production-mode-guards.ts` で検証）。

3. **mock / 本番は同一コンポーネント + データ源差し替えを優先**  
   例: `mergeSearchResults(real, mock)`、`useCommunityBoard(id, posts)`、`getOwnedProjects()`。

4. **Coming Soon 配線より先に本 doc を更新**  
   新しい `hideV0Mock` 分岐を足したら、リリース前チェックリストに影響があれば追記。

5. **Preview だけで main/prod GO しない**  
   Cursor: `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` で build + 下記チェックリスト。  
   Owner: Preview デプロイ確認 **と** 本番 hostname（または本番同等）の要点確認。

---

## 自動ガード

```bash
npm run verify:production-auth-guards   # モード判定マトリクス
npm run verify:production-mode-guards   # isPreviewV0Deployment 漏出・高リスクパターン
```

本番同等 build:

```bash
# PowerShell
$env:NEXT_PUBLIC_FORGE_PRODUCTION_MODE="true"; npm run build
```

---

## リリース前チェックリスト（オーナー向け・6 URL）

本番 hostname または Preview + `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` ローカル。

| # | URL | 観点 |
|---|-----|------|
| 1 | `/studio/mypage` | 実データ **グリッド**（検索・ピル・削除）。「あなたの作品」枠だけになっていない |
| 2 | `/studio` | 「あなたの作品」最大3件 + 削除。mypage と **二重表示にならない** |
| 3 | `/games/[自分の作品id]` | プレイ・FB・devlog が mock ではなく実データ |
| 4 | `/search` | 公開作品のみ（mock 作品が混ざらない） |
| 5 | `/mypage?tab=following` | フォロー中開発者（本番は Supabase 正本） |
| 6 | `/studio/community` | ボード・メンバーが空で **壊れ** ではなく Supabase 配線済み部分は表示 |

Cursor は上記のうち **変更 diff が触れた URL** を build 後に報告する。オーナーは毎回 **1〜6 すべて** 見なくてよいが、Studio 変更時は **1・2・6** を必須。

---

## 高リスク分岐一覧

コンポーネント丸ごと差し替え、または preview/本番で **機能差分** が出るもの。

| ファイル | 分岐 | 本番同等時 | リスク | 状態 / 次アクション |
|----------|------|------------|--------|---------------------|
| `components/studio-mypage-page.tsx` | ~~`StudioProjectsTabPanel` ↔ `DirectoryPanel`~~ | DirectoryPanel のみ | Preview mock は `getStudioMypageOwnedProjects` でデータ注入（2026-06 Phase 1） | **Phase 1 完了** — UI 差し替え廃止 |
| `components/community-hub-page.tsx` | mock store ↔ `useCommunityHubSupabase` | Supabase | 配線変更で片系統だけ死ぬ | **監視** — 同一ファイル内二重実装。配線時 E2E 必須 |
| `components/games-provider.tsx` | localStorage フォロー/mock 通知 ↔ Supabase | Supabase 正本 | mock 側だけ機能追加で再発 | **監視** — データ層分岐は許容。UI は共有 |
| `components/developer-search-v0-page.tsx` | mock catalog + LS フォロー ↔ 実 catalog + DB | 実データ | 件数・フォロー状態の非対称 | **監視** — UI 共有。変更時両モード確認 |
| `components/mypage-page.tsx` | `FollowingTabPanel`(mock) ↔ `FollowingDevelopersPanel`(real) | **本番の方が充実**（意図的逆パターン） | 分岐方向の取り違え | **doc のみ** — コメント維持 |
| `hooks/use-community-board.ts` + hub | 初期 posts 源が mock / empty | DB fetch | 空ボード | データ源差し替え **良い例** — 構造は維持 |

---

## 中リスク分岐一覧

本番同等で **Coming Soon / 空** — バグではなく **未配線**。ユーザーには「壊れた」に見えうる。

| ファイル / ルート | 本番同等時 |
|-------------------|------------|
| `components/studio-notifications-page.tsx` | 空 + Coming Soon（Supabase 未配線） |
| `components/studio-mypage-page.tsx` | 実績・フォロワータブ → Coming Soon |
| `components/mypage-page.tsx` | FB履歴・実績 → Coming Soon |
| `components/game-detail-v0-page.tsx` | 「みんなのFB」タブ → Coming Soon |
| `components/influence-ranking-v0-page.tsx` | 本番は Supabase RPC 実データ（019 + 030 privacy）。空月は空状態 |
| `app/studio/rankings/page.tsx` | Coming Soon |
| `components/creator-profile-real-view.tsx` | 実績・フォロワー → Coming Soon |
| `components/notifications-v0-page.tsx` | DB 通知のみ（mock 追加分なし） |

配線順は **`docs/official-release-wiring-plan.md`**。本監査完了前に配線を増やさない（2026-06 方針）。

---

## 低リスク分岐一覧

mock データ・mock 表示の **単純非表示** または **データ merge 抑制**。

| ファイル | 挙動 |
|----------|------|
| `lib/discovery-public-games.ts` | `mergeHomeCards` / `mergeSearchResults` — 本番は real のみ |
| `components/studio-home-page.tsx` | 「最近の動き」mock 非表示、「今週の伸び」Coming Soon |
| `components/studio-profile-self-page.tsx` | mock 自己紹介・バッジ・活動ログ非表示 |
| `components/profile-self-v0-page.tsx` | 同上（プレイヤー） |
| `app/studio/projects/[id]/page.tsx` | mock project ID → 404 |
| `app/page.tsx` | LP mock カード merge 抑制 |
| `components/works-search-page.tsx` | `hideV0Mock` は **loading ゲートのみ**（UI 同一） |
| `lib/developer-community-v0-store.ts` | 本番で no-op |
| `lib/community-join-v0-store.ts` | 本番で no-op |
| `lib/voice-adoption/constants.ts` | 本番で fixture パス変更 |
| `hooks/use-game-devlogs-v0.ts` | 本番は Supabase devlog のみ |
| `components/content-report-button.tsx` | 本番 + UUID のみ表示（設計どおり） |
| `components/creator-follow-button.tsx` | 本番で developer UUID 未解決時ボタン非表示（データ不足） |
| `components/player-public-profile-v0-page.tsx` | 本番は real view へ |
| `components/creator-profile-page.tsx` | real view ルーティング |
| `lib/supabase/middleware.ts` | 本番 auth 保護 prefix |
| `components/studio-entry-gate-provider.tsx` | 本番 login 必須 |

---

## `isPreviewV0Deployment()` 使用箇所

| ファイル | 用途 |
|----------|------|
| `lib/production-mode.ts` | 定義・`getForgeDeploymentMode` |
| `lib/preview-v0.ts` | re-export のみ |

**機能ボタンの Preview ガードに使わない**（2026-06 削除ボタン回帰で学習）。

---

## 変更履歴（監査）

| 日付 | 内容 |
|------|------|
| 2026-06-30 | data-layer **Phase 2** — ad demo を `/demo/ad-screenshot` に隔離（`4282b4a`）。Preview 確認ブロッカー（`0d500d0`: legacy `/demo` redirect 削除・Studio 読み込み中停止）。`VERCEL_ENV=preview` で demo route 許可（`44013bd`）。**ログイン済み Preview 確認待ち** — 本番 deploy 禁止 |
| 2026-06-28 | 初版。`/studio/mypage` 回帰を契機に一覧化・禁止ルール・チェックリスト・ verify スクリプト |
