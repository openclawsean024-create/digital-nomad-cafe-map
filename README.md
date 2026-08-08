# Cafework — 全台 4357 間遠距工作咖啡廳地圖

> **v3.0 開放版** — 從 SPEC v3.0 的「會員制」pilot 升級為「**全免費、免登入、公開資料**」版本。
> 資料來源:OpenStreetMap 社群貢獻 (4357 間咖啡廳,涵蓋 22 個縣市)。

## ✨ 特色

- 🔓 **完全開放** — 所有咖啡廳免費查看,免登入、免會員制
- 🌏 **全台 4357 間** — 涵蓋 22 個縣市,從台北 1570 間到離島 11-13 間
- 📊 **5 維評分** — WiFi、插座、安靜度、價格、友善度由社群驗證累積
- 🗺️ **互動地圖** — Leaflet + OpenStreetMap,免費 + 無 API key
- 📱 **響應式設計** — 桌面、平板、手機皆可
- 💬 **使用者評論** — 留下真實工作情境,幫助下一位來找店的人
- ✅ **到店驗證** — 拍座位照 + 掃 WiFi,就能累積驗證分數

## 🚀 快速開始

```bash
npm install --legacy-peer-deps
npm run dev
# 開啟 http://localhost:3000
```

## 🛠️ 技術棧

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **地圖**: Leaflet + OpenStreetMap (免費、無 API key)
- **狀態**: React useState + localStorage
- **測試**: Vitest
- **部署**: Vercel

## 📦 資料來源

從 [OpenStreetMap Overpass API](https://overpass-api.de/) 抓取全台 `amenity=cafe` 資料,經過清洗後保留 **4357 間**真正咖啡廳(已過濾手搖飲品牌如 50嵐、清心福全、可不可等)。

更新資料:
```bash
node scripts/fetch-cafes.mjs
```

執行後會從 `https://overpass-api.de/api/interpreter` 抓取全台 6,000+ 筆,清洗後輸出到 `src/data/cafes-data.ts`。

## 🗺️ 縣市資料

| 縣市 | 間數 | 縣市 | 間數 |
|---|---|---|---|
| 台北市 | 263 | 新北市 | 145 |
| 桃園市 | 126 | 台中市 | 121 |
| 台南市 | 55 | 高雄市 | 50 |
| 彰化縣 | 33 | 新竹市 | 30 |
| 新竹縣 | 28 | 雲林縣 | 28 |
| 嘉義市 | 24 | 基隆市 | 17 |
| 苗栗縣 | 13 | 宜蘭縣 | 12 |
| 屏東縣 | 12 | 嘉義縣 | 9 |
| 南投縣 | 7 | 花蓮縣 | 7 |
| 台東縣 | 6 | 金門縣 | 5 |
| 連江縣 | 2 | 澎湖縣 | 1 |

## 📊 5 維評分如何運作

```
工作分數 = WiFi 30% + 安靜 30% + 插座 20% + 價格 10% + 友善度 10%  (滿分 100)
```

- 評分欄位為 0 時顯示「—」,表示「尚無驗證」
- 0 分店家排序時排最後,鼓勵使用者驗證
- 第一次驗證 = 設定值,之後驗證 = 累積平均

## 🚀 部署到 Vercel

1. **接 GitHub repo**:`https://github.com/openclawsean024-create/digital-nomad-cafe-map`
2. **Vercel dashboard** 自動偵測 Next.js 16 設定
3. **環境變數**:不需要 (因為完全本地化、無外部 API)
4. **Build command**: `next build` (預設)
5. **點 Deploy** 即可

### 目前線上版本

🌐 https://digital-nomad-cafe-map.vercel.app

## 📁 專案結構

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # 全站 metadata
│   ├── page.tsx          # 首頁 (= CafeExplorer)
│   └── manifest.ts       # PWA manifest
├── components/
│   ├── CafeExplorer.tsx  # 主 UI
│   └── MapView.tsx       # Leaflet 地圖
├── data/
│   ├── cafes-data.ts     # 4357 間 OSM 咖啡廳
│   └── cafes.ts          # 從 cafes-data 載入
├── domain/
│   ├── cafes.ts          # 商業邏輯 (filter/sort/calculateWorkScore)
│   └── types.ts          # TypeScript 介面
└── lib/
    └── storage.ts        # localStorage helper
```

## 📜 SPEC v3.0 差異

原始 SPEC v3.0 設計為付費會員制 (NT$199 單次、NT$99/月訂閱),但根據使用者決策,改為**開放版**:

| 項目 | v3.0 原版 | v3.0 開放版 |
|---|---|---|
| 會員制 | NT$199 一次 / NT$99 月 | ❌ 取消 |
| 資料範圍 | 48 店 pilot | ✅ 994 間全台 |
| Log-in | 必要 | ❌ 不需要 |
| 評論 | 全公開 | ✅ 全公開 |
| 驗證 | 需登入 | ✅ 自由驗證 |
| 來源 | 假資料 | ✅ OSM 真實 |

## 📝 License

MIT
