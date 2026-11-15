# Goal — Cafework 遠距工作咖啡廳地圖 M1

> **建議暫緩，需 Sean 決定後才開發。** 商業評估（`PRD/SPEC.md` §0）結論為獲利潛力低、建議暫緩；本 GOAL 只在 Sean 決定繼續時才啟動。

## Objective

在純靜態、零付費服務、不收集任何個資的前提下，把現有公開探索頁整頓成「可信的免費目錄」：品質閘門真正擋得住失敗、部署可正常運作、篩選與排序不再誤導、資料來源可追溯可重現，並提供本機補資料與匯出，讓 Sean 能以最低成本手動跑「台北 50 間店」驗證試點。

規格依據：`PRD/SPEC.md` v5.0（§5 FR、§9 M1、§12 合併清單）。

## Acceptance criteria

每條 AC 的「驗證」指令必須 exit 0。新測試檔名可在實作 PR 中調整，但須同步更新本檔與 `SOP.md`。

- **AC-001：品質閘門真正擋得住失敗**（FR 非功能需求「品質閘門」）
  - 修正 `.github/workflows/ci.yml` 啟動失敗（目前 GitHub 上 0 個 job），並與 `deploy.yml` 整併成單一流程：lint、typecheck、test、build 全部通過後才部署；不得有 `continue-on-error` 或 `|| true`。
  - 新增 `lint` script（ESLint＋`eslint-config-next`）。
  - 移除未使用的 `react-leaflet`，讓 `npm ci` 不需 `--legacy-peer-deps`；CI 與 `vercel.json` 改用 `npm ci`。
  - 只保留一種 lockfile（`package-lock.json` 與 `pnpm-lock.yaml` 擇一）。
  - 驗證：`npm ci && npm run lint && npm run typecheck && npm test && npm run build` 全部 exit 0；PR 上 GitHub Actions 全綠且有實際 job；`grep -nE "continue-on-error|\|\| true|legacy-peer-deps" .github/workflows/*.yml vercel.json` 無結果；在測試分支故意讓一個測試失敗，確認 deploy job 不會執行（截圖或 run 連結附在 PR）。

- **AC-002：部署可正常載入互動功能**（FR-007）
  - 依 Sean 決定只保留一個正式網址。若保留 GitHub Pages，`next.config.mjs` 以環境變數設定 `basePath`／`assetPrefix`；若保留 Vercel，移除 Pages 部署工作流程。
  - 驗證：`npm test -- tests/build-output.test.ts`（建置後讀 `out/index.html`，斷言所有 `/_next/` 資源路徑帶有正確前綴）；部署後以 `curl -s -o /dev/null -w '%{http_code}'` 檢查首頁引用的第一個 JS 檔回 200（結果貼在 PR）。

- **AC-003：篩選與排序不誤導**（FR-003／FR-004／FR-005）
  - `wifi-50` 只在有實測速度且 ≥ 50 時符合；OSM `wifi=yes` 改為獨立標籤「OSM 標示有 Wi-Fi（未實測）」。
  - `no-time-limit` 不再以 `/24/` 比對營業時間；只認社群標記或 OSM `opening_hours` 為 `24/7`。
  - 「最近更新」依 `lastVerifiedAt` 排序（無資料者墊底），或改名為「驗證人數」。
  - `getEvidenceStatus` 依可設定的天數回傳 `stale`。
  - 驗證：`npm test -- src/domain/filter.test.ts src/domain/cafes.test.ts`，需新增案例：`hasWifi=true` 且無速度 → 不符合 `wifi-50`；`hours="Mo-Su 10:00-24:00"` → 不符合 `no-time-limit`；`24/7` → 符合；排序依時間；超過門檻天數 → `stale`。

- **AC-004：資料來源可追溯、可重現**（FR-011／FR-012）
  - 新增 `scripts/import-osm.ts`：以 Overpass 查詢產生依縣市分檔的 JSON，含 `source: "osm"`、OSM 物件類型與 ID、`fetchedAt`；腳本支援 `--fixture` 模式讀本機範例檔，測試不連網。
  - 詳細資料顯示抓取日期、該筆 OSM 物件連結、「在 OSM 回報錯誤」連結；頁尾有 ODbL 與 OSM 版權連結。
  - 驗證：`npm test -- tests/import-osm.test.ts`（fixture 輸入 → 輸出結構快照，mock `fetch` 呼叫次數為 0）；`npm test -- src/components/explorer/DetailModal.test.tsx` 斷言 OSM 連結與抓取日期存在。

- **AC-005：首頁輕量載入**（FR-013）
  - 資料不再整份嵌入頁面；改為依縣市分檔的靜態 JSON，選擇縣市或搜尋時再載入；清單分頁或虛擬捲動。
  - 地圖可顯示目前篩選的全部結果（以群集方式），不再只顯示前 200 間。
  - 驗證：`npm run build && test $(wc -c < out/index.html) -lt 512000`；`npm test -- tests/data-loader.test.ts`（分檔載入、載入失敗時清單顯示錯誤而非空白）。

- **AC-006：公開補資料（只存本機）與匯出**（FR-008）
  - 詳細資料新增「我到過這裡，補一筆」：只填觀察到的欄位（每欄可留空＝未知），附到訪日期；不收照片、email、姓名。
  - 資料存 localStorage，UI 明示「只存在這台裝置，未上傳」；提供「匯出 JSON」與「清除我的補資料」。
  - 本機補資料在 UI 上標示為「你的紀錄（未審核）」，不得計入公開驗證狀態。
  - 移除 DetailModal 中 `?founder=1` 的公開說明。
  - 驗證：`npm test -- src/components/explorer/ContributionForm.test.tsx tests/contribution-store.test.ts`（空欄位存為 null、匯出結構、清除、`fetch` 呼叫次數為 0）；`git grep -n "founder=1" -- src/components/explorer` 無結果。

- **AC-007：公開站只保留探索功能**（FR-010）
  - `/landing`、`/admin`、`/verify`、`/cron/reminder-dry-run` 不再出現在公開建置；首頁「Pilot」連結移除。
  - 移除未使用的 `stripe`、`@stripe/stripe-js`、`@supabase/ssr`、`@supabase/supabase-js`、`recharts` 依賴與孤兒元件（`PaywallGate`、`StripeCheckoutMock` 等）；舊根目錄 `components/`、`lib/`、`data/`、`types/` 依 Sean 決定刪除或移至 `archive/`（不得被編譯）。
  - 驗證：`npm run build && test ! -d out/admin && test ! -d out/verify && test ! -d out/cron && test ! -d out/landing`；`grep -nE '"(stripe|@stripe/stripe-js|@supabase/ssr|@supabase/supabase-js|recharts)"' package.json` 無結果；`npm run typecheck` exit 0。

- **AC-008：文件一致、無假資料與憑證**
  - README、`SOP.md`、`STATUS.md` 的指令、測試數、路由與實況一致；`PROJECT_STATE.md`、`MINIMAX_HANDOFF.md`、`FOUNDER_CHECKLIST.md` 依 Sean 決定刪除或移至 `archive/` 並標示過時。
  - 新增 fixture 安全檢查：測試與 fixture 中的電話只允許 `0900-000-xxx`，email 只允許 `@example.com`。
  - 驗證：`npm test -- tests/fixtures-safety.test.ts`；`git grep -nIE "(sk_(live|test)_[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{20,}\.|ghp_[A-Za-z0-9]{20,}|-----BEGIN)" -- . ':!package-lock.json'` 無結果。

## Out of scope

- 真實金流、Stripe（含測試模式）、使用者訂閱、店家付費刊登（M3）。
- 後端、資料庫、Supabase 專案建立、帳號登入、雲端同步（M2）。
- 真實 email 發送、真實網速 API、照片上傳、任何個資收集。
- 付費圖磚或地圖服務的正式呼叫（M2 前評估）；M1 維持現有 Leaflet＋OSM 圖磚並保留版權標示。
- 搬入 `nomad-cafe-map` 的任何資料或 Mapbox；連鎖／獨立切換（M1 後 P1）。
- 大量呼叫 Overpass 公共伺服器；匯入只由 Sean 手動低頻執行，CI 不連網。
- 爬取 Google 地圖、Cafe Nomad 或其他第三方網站。
- 正式網址的切換部署、DNS、Vercel 專案設定變更（由 Sean 執行）。

## Exit gate

1. Sean 先決定是否推翻「暫緩」建議；未決定前不得開始 M1 開發。
2. AC-001～AC-008 的驗證指令全部 exit 0，PR 上 GitHub Actions 全綠，並附各 AC 的證據（指令輸出或 run 連結）。
3. 進入 M2 前，需達成 `PRD/SPEC.md` §0 的商業閘門（建議：台北 ≥ 50 間手動驗證、連續 4 週自然流量成長），由 Sean 確認；未達成則封存。
