# 小呆 Companion

可自訂、多角色的 ChatGPT Companion 與 Windows 透明桌面寵物。目前角色資料夾包含 **小呆、15、牧牧**，三隻共用自然行為引擎，但各自擁有獨立照片與動畫資產。

[前往公開 GitHub repo](https://github.com/Xrelifen/xiaodai-companion) · [下載最新版](https://github.com/Xrelifen/xiaodai-companion/releases/latest)

提供兩種互動方式：

- **ChatGPT Companion Panel**：透過本機 MCP plugin 在 ChatGPT 中以 inline 或 fullscreen 開啟。
- **Windows 透明桌面版**：Electron frameless、透明背景、always-on-top 視窗，可拖動並選擇是否自動漫步。

> ChatGPT 目前的 MCP App 顯示模式支援 inline 與 fullscreen，不支援真正的 PiP，也沒有公開介面可以接管內建 Pets 浮動視窗。因此這個專案提供 ChatGPT 互動面板，並用桌面版完成跨視窗顯示。

> 角色圖像目前屬於可替換資產。程式邏輯可在沒有 sprite sheet 時運作，並顯示寵物名稱佔位卡；日後把圖檔放進指定資料夾即可。

## 功能

- 加權隨機待機動作與每個動作的 cooldown
- 避免連續重複同一動作
- 每一格可自訂播放時間
- 平滑視線追蹤與 16 方向注視
- 拖動速度判斷走路或跑步播放速度
- 點擊摸頭、揮手、跳躍、休息
- localStorage 保存設定與親密度
- Windows 桌面版可選擇自動漫步
- 小呆、15、牧牧即時切換與各自獨立素材資料夾
- 缺少角色圖時安全降級，不影響設定與互動邏輯
- ChatGPT local plugin manifests、MCP server 與互動式 MCP App resource

## 一般使用者下載

在 [GitHub Releases](https://github.com/Xrelifen/xiaodai-companion/releases/latest) 選擇：

- `Xiaodai-Companion-Setup-*.exe`：推薦的 Windows 安裝程式。
- `Xiaodai-Companion-Portable-*.exe`：免安裝版。
- `xiaodai-companion-plugin.zip`：ChatGPT / Codex 本機外掛包。

每次推送 `v*` tag，GitHub Actions 會自動測試並產生上述三種下載檔。Windows 安裝檔目前未購買程式碼簽章，因此 SmartScreen 可能提示「未知發行者」；原始碼與建置紀錄均公開可檢查。

## 快速開始

需要 Node.js 22 以上。

```powershell
npm install
npm run check
npm run preview
npm run desktop
```

`npm run preview` 會在 `http://127.0.0.1:4173` 開啟可測試的 Companion UI。桌面版第一次啟動時會顯示透明、永遠置頂的寵物視窗。用左下選單切換小呆、15 或牧牧；拖曳寵物即可移動，點擊齒輪可調整隨機等待、視線平滑度和桌面漫步。

## 放入角色圖檔

每隻寵物都要分開存放，避免照片、sprite sheet 與 GIF 混用：

```text
assets/pets/
├─ 小呆/
│  ├─ pet.json
│  ├─ source/                  原始照片與角色參考圖
│  └─ generated/
│     ├─ sprite-sheet.png      程式實際使用
│     └─ preview.gif           選填，文件預覽用
├─ 15/                         同樣結構
└─ 牧牧/                       同樣結構
```

標準動畫表為 8 欄 × 11 列，每格 192×208 px。尚未製作角色動畫時，只要先把照片傳進該角色的 `source/`；核心程式不會讀取或公開原始照片。新增或替換素材後執行：

```powershell
npm run sync:pets
npm run check
```

要新增第四隻寵物，只需複製任一角色資料夾、修改 `pet.json` 的唯一 `id` 與 `name`，不必改行為引擎。

## ChatGPT 本機插件

本 repo 根目錄本身就是一個 Agent Plugins 1.0 package：

- `plugin.json`
- `mcp.json`
- `skills/xiaodai-companion/SKILL.md`
- `src/plugin/server.mjs`
- `dist/plugin/app.html`

先建立 MCP App resource：

```powershell
npm run build:plugin
```

將這個 repo 當成本機 plugin source 安裝或註冊後，重新載入插件。工具包含：

- `xiaodai.open`：開啟互動式小呆

## 行為設定

預設設定在 [`config/default-behavior.json`](config/default-behavior.json)。UI 中的調整會存到瀏覽器／Electron 的 localStorage，不會修改 repo 檔案。

```json
{
  "idleDelay": { "minMs": 3500, "maxMs": 11000 },
  "preventImmediateRepeat": true,
  "lookSmoothing": 0.11,
  "drag": {
    "walkThreshold": 80,
    "runThreshold": 350,
    "maximumPlaybackRate": 1.8
  }
}
```

## 專案結構

```text
assets/pets/             每隻寵物獨立的 source、generated 與 pet.json
config/                  預設行為設定
dist/plugin/             自包含 MCP App HTML
docs/                    動畫總覽與文件圖片
scripts/                 建置與驗證腳本
skills/                  ChatGPT/Codex plugin skill
src/core/                行為引擎與動畫定義
src/desktop/             Windows Electron shell
src/plugin/              stdio MCP server
src/ui/                  共用互動 UI
tests/                   Node 原生測試
```

## 隱私

公開 repo 預設只放 `generated/` 中可散布的成品；個人生活照請先放在 `source/`，並在公開前確認是否要提交。三隻寵物的素材彼此分離。

## License

MIT。小呆的角色圖像屬於其素材擁有者；若將 repo 公開或重新散布，請先確認你希望採用的圖像授權方式。
