# AGENTS.md — digital-nomad-cafe-map（Cafework）

## 專案邊界

Cafework 是公開、免費、免登入的台灣「可工作咖啡廳」目錄，資料來自 OpenStreetMap，工作條件需實地驗證。商業評估建議**暫緩**（`PRD/SPEC.md` §0）：在 Sean 決定之前，不得開始 M1 開發；決定之後，只做 `GOAL.md` 列出的 M1 範圍。

開始改動前依序閱讀：

1. `PRD/SPEC.md`（v5.0，唯一有效的產品與商業契約）
2. `GOAL.md`（M1 驗收條件）
3. `PRD/UI-SPEC.md`（v4.0 UI 契約，仍有效）
4. `SOP.md`
5. `STATUS.md`

## 不變條件

- 未驗證的工作條件不得以數字呈現；未知一律顯示「尚無資料」或「待驗證」，不得以 0、50 或推估分數代替。
- 篩選、排序、標籤的文字必須與實際判斷邏輯一致（例如「Wi-Fi 50+ Mbps」只能比對實測速度）。
- OSM 匯入資料與社群實測資料分開保存；OSM 存在不等於驗證。必須保留「© OpenStreetMap contributors」與 ODbL 連結。
- 公開探索流程不得出現登入、付費、升級或 email 收集。
- 不得把 localStorage、mock 網速、mock email、demo 後台說成正式整合。
- 不得搬入 `nomad-cafe-map` 的 `chains.json`、`add_chains.py`、`FALLBACK_VENUES`（疑似捏造資料）、Mapbox、service role 讀取、`USING (true)` 寫入政策或 `wifi_password` 欄位。
- 不得爬取 Google 地圖、Cafe Nomad 或其他第三方網站；Overpass 只能由 Sean 手動低頻執行，測試與 CI 不得連網。
- 不得寫入真實個資、憑證或客戶資料；範例電話用 `0900-000-xxx`，email 用 `@example.com`。

## 禁止事項

- 不 push 到 `main`、不合併 PR、不 force push、不改 repo 或 Vercel 設定、不部署。
- 不建立 Supabase、Stripe、Resend、Mapbox 等帳號、專案或金鑰；不呼叫付費 API。
- 不更新 Notion。

## 驗收

所有改動必須對應 `GOAL.md` AC-001～AC-008，並執行 `SOP.md` 的驗證指令，記錄 exit code 與輸出。沒有實際執行的檢查要標「未執行」。
