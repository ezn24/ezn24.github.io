# 在 GitHub Profile README 嵌入在地化摘要

把以下內容放到 Profile 的 `README.md`：

```html
<a href="https://ezn24.github.io/#translations">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ezn24.github.io/assets/localization-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://ezn24.github.io/assets/localization-light.svg">
    <img src="https://ezn24.github.io/assets/localization-light.svg" width="800" alt="ezn24 參與的 Weblate 與 Crowdin 專案、翻譯字串數及個人參與比例">
  </picture>
</a>
```

卡片由同一個 GitHub Actions 工作流程每 6 小時排程更新，不需要新增 Token 或再建一套資料抓取流程。GitHub 圖片快取可能讓更新稍後才顯示。

- **Weblate：**依專案合併所有元件與語言，分子與分母分別加總後計算；不是元件百分比的平均值，也不等於單一 App 元件的比例。
- **Crowdin：**各專案的個人歷年繁中翻譯字串數，占所有貢獻者歷年繁中翻譯數的比例。
- 不含審核。點擊卡片可前往網站查看完整元件、語言及計算說明。

卡片使用 Weblate、Crowdin 官方 Logo，標示為中英對照。Logo 已嵌入 SVG，不依賴外部圖片請求。

SVG 由 `scripts/render-localization-cards.py` 直接讀取既有統計快照產生，不增加 API 請求。
