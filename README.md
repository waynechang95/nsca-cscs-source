# 🏋️‍♂️ NSCA-CSCS 11-Week Study System & RAG AI Assistant

本專案為針對 **NSCA-CSCS (Certified Strength and Conditioning Specialist) 美國國家體能協會肌力與體能訓練專家考照** 設計的一站式全方位互動學習系統。

包含 **11 週雙語對照簡報 (24 個 HTML 簡報頁面)**、**隨頁筆記本系統 (Slide-Aware Notebook)** 以及整合 **1,876 頁原廠第五版教科書檢索 + NVIDIA GPT-120B 大模型的 RAG 隨身 AI 助教**。

---

## 🌟 系統三大核心特色

1. **📚 11 週全章節雙語簡報系統 (24 Decks)**：
   - 涵蓋 *NSCA Essentials of Strength Training and Conditioning (5th Edition)* 全部 26 章。
   - 提供繁體中文與英文對照、精美比較表格、考題解析與**一級/二級/三級槓桿動態模擬器**。
2. **📝 隨頁筆記本系統 (Slide-Aware Notebook)**：
   - 按 `N` 鍵隨時開啟右側筆記抽屜，自動綁定當前週數與頁碼上下文（如 `Week 1 • Slide 5`）。
   - 打字具備 `localStorage` 自動儲存防丟失、一鍵引用投影片重點，支援按「週數」歸類檢索與 Markdown / JSON 匯出匯入。
3. **🤖 RAG 隨身 AI 助教 (NVIDIA GPT-120B + 1,762 頁原書向量庫)**：
   - 按 `A` 鍵隨時向 AI 提問，系統會自動在原書 1,762 頁檢索庫中精確比對，並附帶 **原書章節與頁碼引文卡片 (📖 NSCA Ch X • Page Y)**。
   - AI 回答支援 Markdown 對話解析與 KaTeX 數學公式即時渲染。

---

## 📂 專案目錄結構

```text
NSCA/
├── README.md                                                # 本說明文件
├── plan.md                                                  # 11 週 CSCS 備考學習進度計畫表
├── Essentials_of_Strength_Training_and_Conditioning_5th_Edition.pdf  # NSCA 原廠 5th Ed 參考課本 (68MB)
└── slide/                                                   # 網頁應用程式主目錄 (Web App Root)
    ├── index.html                                           # 課程主控台面板 (英文版入口)
    ├── index_zh.html                                        # 課程主控台面板 (繁體中文版入口)
    ├── styles.css                                           # 核心 UI 樣式、響應式排版與抽屜 CSS
    ├── slides.js                                            # 簡報切換、筆記本、RAG 連線與 Markdown 解析器
    │
    ├── week1_en.html ~ week11_en.html                       # 第 1 至 11 週英文投影片 (11 Decks)
    ├── week1_zh.html ~ week11_zh.html                       # 第 1 至 11 週繁體中文投影片 (11 Decks)
    │
    ├── build_rag_index.py                                   # 課本 PDF 向量索引建立腳本
    ├── nsca_5th_index.json                                  # 1,762 頁原書文字檢索快取庫
    ├── rag_server.py                                        # RAG API 伺服器 (HTTP :8000 + NVIDIA GPT-120B)
    ├── nvi_api.py                                           # NVIDIA API 金鑰與連線測試檔
    └── requirements.txt                                     # Render.com 雲端部署 Python 依賴設定檔
```

---

## ⌨️ 快捷鍵列表 (Keyboard Shortcuts)

在任意簡報頁面中均可使用以下快捷鍵：

| 快捷鍵 | 功能說明 |
| :--- | :--- |
| **`Right` / `Space` / `PageDown`** | 切換至下一張投影片 |
| **`Left` / `PageUp`** | 切換至上一張投影片 |
| **`O` (Overview)** | 開啟 / 關閉 縮圖總覽矩陣網格 |
| **`N` (Notes)** | 開啟 / 關閉 隨頁筆記抽屜面板 |
| **`A` (AI Assistant)** | 開啟 / 關閉 RAG 隨身 AI 助教對話抽屜 |
| **`F` (Fullscreen)** | 切換 全螢幕模式 |
| **`Escape`** | 關閉所有彈出視窗與抽屜面板 |

---

## 🚀 本地運行說明 (Local Quick Start)

### 步驟 1：啟動 RAG AI 伺服器 (Port 8000)
開啟終端機，執行以下命令啟動後端檢索與 NVIDIA LLM API 服務：
```powershell
py -3 "d:\DesktopC\NSCA\slide\rag_server.py"
```

### 步驟 2：開啟前端網頁
雙擊點擊開啟或以瀏覽器開啟以下檔案：
* 繁體中文總入口：`d:\DesktopC\NSCA\slide\index_zh.html`
* 英文總入口：`d:\DesktopC\NSCA\slide\index.html`

---

## ☁️ 雲端部署指南 (GitHub Pages + Render.com)

本專案支援免費用 **GitHub Pages (靜態前端)** + **Render.com (Python RAG 後端)** 上線：

### 1. 推送至 GitHub
```powershell
git init
git add .
git commit -m "Deploy NSCA CSCS Project"
git branch -M main
git remote add origin https://github.com/your-username/nsca-cscs-slides.git
git push -u origin main
```

### 2. 部署 Render.com 後端 (Web Service)
* 連結 GitHub repo，設定根目錄為 `slide`。
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `python rag_server.py`

### 3. 開啟 GitHub Pages 前端
* 於 GitHub Repo 的 `Settings` -> `Pages` 開啟 Pages 託管即可完成部署！
