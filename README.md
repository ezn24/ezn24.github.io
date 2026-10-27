# ezn24 — Personal space

GitHub Pages 個人首頁。設計參考 ArtCraft / PdfCraft 的米白底、細線框、綠色重點字與編號分區，使用原創版型與程式碼。

## GitHub Pages

本專案不需要安裝套件、建置或 API token。

在 `ezn24/Web` 的 **Settings → Pages → Build and deployment** 設定：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- 按 **Save**

GitHub 完成部署後，Pages 設定頁會顯示正式網址。若沒有自訂網域，預期網址為 `https://ezn24.github.io/Web/`。這份說明不代表已部署成功。

## 功能

- GitHub REST API 讀取公開 repo，依 `pushed_at` 排序，顯示前 6 個。
- 含 fork，可篩選獨立倉庫及 fork。推送時間不代表每次都是本人修改；可能包含上游同步。
- 5 分鐘快取與自動更新，手動更新按鈕、離開背景後重新同步。不是 WebSocket 即時串流。
- GitHub API 故障或達速率限制時，顯示本機快取或隨站附帶的快照，明確標示資料時間。
- 跟隨系統／淺色／深色；預設跟隨系統，支援系統即時切換及 localStorage 記憶。
- Weblate 與 Crowdin 貢獻清單為核實後的靜態資料，更新於 2026-10-28。沒有把專案整體翻譯完成率當成個人貢獻。
- 手機排版、鍵盤焦點、跳至內容連結與 reduced-motion 支援。

## 內容來源

- 個人介紹：`https://github.com/ezn24/.github/blob/main/profile/README.md`
- GitHub：`https://api.github.com/users/ezn24/repos?sort=pushed&per_page=100`
- Weblate：`https://hosted.weblate.org/user/ezn24/` 的 Translates 區塊（不是 watched projects）。
- Crowdin：`https://crowdin.com/profile/ezn24` 的 Contributed 區塊。

修改 `profile.js` 中的翻譯陣列可更新翻譯專案；修改 `excluded` 可排除不想展示的 repo。GitHub repo 說明保持原文。

## 本機預覽

```sh
python3 -m http.server 8000
```

在瀏覽器開啟 `http://localhost:8000`。請透過 HTTP 伺服器預覽，避免 file:// 的 fetch 限制。
