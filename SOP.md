# SOP — digital-nomad-cafe-map（Cafework）

## 目前階段

文件重建完成（PRD v5.0、M1 GOAL），**尚未依本版開發**。商業評估建議暫緩，需 Sean 決定後才開始 M1。

## 驗證指令（依 `package.json` 查證，2026-11-16）

| 檢查 | 指令 | 狀態 |
|---|---|---|
| 安裝 | `npm ci --legacy-peer-deps` | 已配置；需旗標（M1 AC-001 要移除） |
| Lint | `npm run lint` | **尚未配置**（無 `lint` script，無 ESLint 依賴）；CI 名為 Lint 的 job 實際只跑 `tsc` |
| 型別檢查 | `npm run typecheck`（`tsc --noEmit`） | 已配置 |
| 單元／元件測試 | `npm test`（`vitest run`，預設 node 環境，元件測試以 `// @vitest-environment jsdom` 切換） | 已配置；20 個測試檔、189 個案例（原始碼計數，**未在本機執行**） |
| 覆蓋率 | `npm run test:coverage`（門檻 lines/functions/statements 80、branches 75） | 已配置；CI 未執行 |
| 建置 | `npm run build`（`output: 'export'` → `out/`） | 已配置 |
| E2E | — | **尚未配置** |
| 其他 | `npm run cron:dry`（`tsx scripts/cron-dry.ts`，mock email payload） | 已配置；屬 M1 要移出公開範圍的 Stage 5 工具 |

M1 完成後的標準檢查（目標）：

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## CI 現況（2026-11-16 查 GitHub Actions）

- `.github/workflows/ci.yml`：歷來 2 次執行皆 `failure` 且未建立任何 job（工作流程啟動失敗，原因未在本機確認）。
- `.github/workflows/deploy.yml`：只做 `npm install --legacy-peer-deps` → `npm run build` → 部署 GitHub Pages，**不跑測試**，最近一次 2026-09-23 成功。
- 結論：目前沒有任何自動化檢查會擋住壞掉的程式進入部署。

## 開發流程

1. 確認 Sean 已決定是否推翻「暫緩」。
2. 從 `main` 開功能分支，一次處理一條 AC。
3. 每條 AC 先寫失敗測試，再實作。
4. 執行上方標準檢查，記錄 exit code。
5. 開 Draft PR，附各 AC 證據；不得自行合併或部署。

## 資料匯入（M1 AC-004 完成後）

- 只由 Sean 手動執行 `scripts/import-osm.ts`，低頻呼叫 Overpass 公共伺服器。
- 輸出依縣市分檔，含 `fetchedAt` 與 OSM 物件 ID；提交前檢查筆數變化。
- 測試只用 `--fixture` 模式，不連網。

## 已知風險

- GitHub Pages 版首頁 JS 404（無 `basePath`），互動功能失效；Vercel 版可用。
- 首頁 HTML 4.29 MB（整份資料嵌入）。
- 公開建置仍含 `/landing`、`/admin`、`/verify`、`/cron/reminder-dry-run`（`?founder=1` 即可進入的 mock）。
- 舊根目錄 `components/`、`lib/`、`data/`、`types/` 不在 tsconfig include，未被編譯，但仍在 repo。
- 使用 OSM 官方圖磚，流量上升時違反其使用政策。
