# Cafework · 數位牧民工作咖啡廳地圖

Cafework 幫助遠距工作者在走進咖啡廳前，先看見 Wi-Fi、插座、安靜度與久坐條件的證據。

目前專案已完成 v4.0 產品重整、獨立 HTML 原型確認與正式 React explorer 改版；目前仍不代表可以直接上線實際使用。

## 目前產物

- `PRD/SPEC.md` — 唯一目前有效的產品需求與資料信任契約。
- `PRD/UI-SPEC.md` — 頁面資訊架構、視覺規則、響應式與無障礙規格。
- `dashboard.html` — 已確認的 Cafework UI 原型；原型資料不代表即時營業狀態。
- `AGENTS.md` / `SOP.md` — 專案流程、驗收與禁止事項。

## 產品邊界

- 目前匯入 4,357 筆台灣 OpenStreetMap 咖啡廳位置資料，涵蓋 22 個縣市／區域。
- 多數店家尚沒有實際工作條件驗證；介面必須顯示「尚無資料」，不能用猜測補成評分。
- 公開探索維持免費、免登入；本輪不處理付費、帳號、email、Stripe、Speedtest API 或後端同步。
- 正式 React explorer 已依確認後的 prototype 實作；目前仍需真實到店驗證與後端整合才能宣稱可上線。

## 本地開發與驗證

```bash
npm ci --legacy-peer-deps
npm run dev
# http://localhost:3000
```

```bash
npm run test
npm run typecheck
npm run build
```

目前 `npm ci` 需要 `--legacy-peer-deps`，原因是現有 `react-leaflet@4.2.1` 宣告 React 18 peer，而專案使用 React 19；這是獨立的依賴整理工作，本輪沒有混入修正。

## 技術概況

- Next.js 16 App Router + React 19
- Leaflet / OpenStreetMap 地圖
- Vitest domain/component tests
- 靜態 export；目前未完成 production integrations

## 後續順序

1. 進行真實到店驗證 pilot，累積可追溯的工作條件證據。
2. 將驗證資料接到正式後端同步流程，取代目前 local-first fallback。
3. 重新評估 production readiness，再決定是否開放實際使用。
