■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: d2fd87d（UX fix batch）。本変更は push 直後に新 commit
- プレイヤー v0 01–18 mock 完成済み

■ 今回実装したこと
- /mypage 全タブ共通 — メイン上部の h1「マイページ」を削除
- タブ行（見届け中〜フォロー中開発者）がコンテンツ最上部から始まる
- サイドバー「マイページ」点灯で現在地は十分と判断（オーナー指摘）

■ 今回変更した画面
- P-10〜15 マイページ /mypage（全 inner tab 共通）
  - 画面位置: メインコンテンツ最上部、タブ行の直上
  - 変更前: 大見出し「マイページ」+ その下にタブ行
  - 変更後: タブ行のみ（見届け中 / 保存作品 / …）
  - プレイヤー視点: サイドバーと重複ラベルが消え、各タブの見出し（例: 見届け中の作品）が主役に
  - 開発者視点: IA 変更なし。URL・tab パラメータ同じ
  - 確認手順:
    1. preview /mypage を開く — 左上に「マイページ」h1 がない
    2. 保存作品・プレイ履歴等タブを切替 — どれも h1 なし
    3. サイドバー「マイページ」が active 表示のまま

■ ユーザー目線の変化
- マイページ内で「マイページ」と2回言わない
- タブと各パネル見出し（見届け中の作品 等）に視線が早く届く

■ なぜこの設計
- サイドバー activeNav=mypage で現在地が明示済み
- モバイルでもヘッダー 👤 とタブで文脈は足りる
- 全タブ同一レイアウトのため h1 削除は1箇所（MyPagePageContent）で完結

■ 他案不採用
- h1 をタブ名に差し替え — 各パネルに既にセクション見出しあり、二重化
- サイドバー点灯を消す — ナビ正本を崩す

■ In / Out
- In: mypage-page.tsx の header/h1 削除
- Out: タブ文言変更、/mypage/profile、本番 deploy

■ リスク
- なし（見出し削除のみ。a11y は tablist + 各 panel 内 h2 で維持）

■ オーナー確認手順
- preview /mypage と ?tab=saved 等 — h1 なし・タブ動作同じ

■ 今すぐ私がやるべきこと
- deploy 後 /mypage 各タブを目視

■ Cursorだけで完了できること
- 他画面でもサイドバー active と重複する h1 があれば同様整理

■ 次に検討すべきこと
- Player v0 mock 完了後の次テーマ（Studio / prod GO）

■ ChatGPTに相談したい論点
- 特になし（小 UI 整理）
