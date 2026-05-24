# WORKLOG — hirokikamanoi.com

## 2026-05-19

### 完了済み
- GitHub Pages公開済み（KAMANOI/hirokikamanoi.com）
- CNAME設定済み（hirokikamanoi.com）※DNS未切替・現在はStrikingly
- 全ページ作成済み：index.html / hair-salon.html / photography.html / about.html / legal.html
- 共通：style.css / script.js
- ナビゲーション：全ページ共通・ハンバーガーメニュー対応
- Atelier ahロゴ配置：index.html（サロンセクション）、hair-salon.html（ページヘッダー）
  - images/ah-logo-full.png（ロゴ全体）
  - images/ah-logo-mark.png（マークのみ）
- サロン写真6枚：images/salon/salon-1.jpg 〜 salon-6.jpg（3列×2グリッド）
- ヒーロー背景写真：images/hero-bg.jpg（DSC_1664.JPG）・オーバーレイ35%
- Amazonアフィリエイトリンク（tag=soraimaginary-22）全6冊追加済み
  - LOCA vol.1: B0GGB192KW
  - LOCA vol.2: B0GXD98PV5
  - The Epicurean Philosophy: B0FF58LDKM
  - juːtóʊpiə: B0F5QRWBGR
  - 椿姫のの 写真集: B0DQFTRPRP
  - かげろう: B0CJ4CRBF1
- TOPページ アコーディオン実装（全5セクション）
  - 閉じた状態：タイトル行＋説明テキスト表示
  - 開いた状態：詳細（リスト・ボタン・ギャラリー）が展開
  - max-height方式（JSでscrollHeight計算）
- グランドメニューフォント改善：serif italic（hair-salon.html）

### 残タスク
- DNS切替（Cloudflare）：4つのAレコード + CNAMEレコード設定
  - 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
  - www → KAMANOI.github.io（DNS only・Proxyなし）
- ドメイン移管：Strikingly/Tucowsからのリリース待ち
- アコーディオン動作確認（最新push: d48d7a4）

### 現在のgit状態
- branch: main
- 最新commit: d48d7a4（accordion JS fix）
- remote: https://github.com/KAMANOI/hirokikamanoi.com.git
