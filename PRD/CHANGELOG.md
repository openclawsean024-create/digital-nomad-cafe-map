# Changelog · digital-nomad-cafe-map PRD

所有 PRD / SPEC 變更記錄於此。最新在上。

---

## [v4.0] · 2026-09-21 · product reset / prototype milestone

### Added

- Replaced the contradictory v3.x contract with a single current `PRD/SPEC.md`.
- Added `PRD/UI-SPEC.md` with the discovery-first information architecture, visual tokens, responsive behavior, accessibility rules, and unknown-data states.
- Added project-level `AGENTS.md` and `SOP.md` with prototype-before-React and data-trust invariants.
- Rewrote `dashboard.html` as a standalone Cafework map/list prototype with search, city scope, filters, sort, detail view, contribution modal, mobile tabs, and explicit prototype boundaries.

### Changed

- Product language now describes a free Taiwan directory with transparent evidence, not a global or premium service.
- Unknown work-condition data is treated as unknown; it must not be represented as a measured zero or fabricated score.

### Deferred

- Formal React page rewrite waits for prototype confirmation.
- Data nullability cleanup, backend verification, integrations, legacy-module cleanup, and deployment remain separate milestones.

---

## [v3.0.2] · 2026-09-06 · fleet-upgrade

### Added（新增）
- `PRD/SPEC.md` v3.0.2 等級入口規格書（13.6KB / 9 章）
  - §1 問題陳述（5 個痛點：沒結構化評分 / 踩雷代價高 / 競品卡住 / 繁中缺 / 沒驗證）
  - §1.2 4 種 persona（freelancer / nomad / remote worker / 商務客）
  - §1.4 7 條 Non-Goals（不做會員/帳號/付費/原生/多語/Google Maps/星等）
  - §2 完整使用流程圖（mermaid）+ 7 個主要場景（S1–S7）
  - §3 24 條 FR 編號（FR-001 至 FR-024）
  - §4 NFR 表（9 維度：Performance / Security / Privacy / A11y / Browser / Mobile / Static export / TypeScript / Coverage）
  - §5 完整目錄樹（5.1 Module Map 9 個 module）
  - §5.3 降級策略表（5 種失敗情境）
  - §6 11 條 Definition of Done
  - §7 部署契約（GitHub Pages）
  - §7.1 GHA 4 jobs（lint / test / build / deploy）
  - §8 9 條 Out of Scope
  - 附錄指向 v3.0 詳版 SPEC.md（1224 行）
- `PRD/CHANGELOG.md` v3.0.2 變更日誌（本檔）
- `.github/workflows/ci.yml` GHA workflow 4 jobs（lint / test / build / deploy）
  - 既有 `.github/workflows/deploy.yml` 保留為備援

### Changed（變更）
- 升級對齊 SPEC v3.0 契約（§1–§19 全部套用）
- v3.0 完整詳版（PRD/SPEC.md 1224 行）保留向下相容
- 既有 136 tests 保留（domain 邏輯）
- 既有 Next.js 16 + React 19 + Leaflet + Vitest 架構保留

### Fixed（修正）
- N/A（本次純文件化 + GHA workflow 升級，沒改 production code）

### Status
- Clone: ✅ done
- PRD: ✅ SPEC.md + CHANGELOG.md 完成（v3.0.2 入口）
- Dev: ✅ typecheck 0 error / tests 136/136 pass / build 3.9MB out/
- GHA: ✅ ci.yml 建立（4 jobs: lint/test/build/deploy）
- Push: ⏸ pending GITHUB_TOKEN

---

## [v3.0] · 2026-07-19 · forced-upgrade (sweet=8 / 商業化 86/100)

### Added
- 視角從「台灣島內移居工作者」升級為「全球數位牧民咖啡廳地圖」
- Sweet Spot 5 問重檢：Q1–Q5 全通過，sweet=8
- 商業化分數 69 → **86/100**（真實值，sweet=8 × 7 + 30）
- §15.11 v3.0 量表（market sizing / unit econ / pricing pyramid / competitor quadrant / launch gates）
- §15.12 ADR≥5（mobile-first PWA / Supabase realtime / Maps tiles caching / tier paywall / community seed）
- §15.13 市場驗證≥5 階段（landing → community → pilot → press → 國際 launch gate）
- Peer 5 個 URL 全部 curl 200 驗證

### Changed
- 從 48 店 pilot 擴張到 4357 間（OSM 全台）
- v3.0 開放版：取消會員制、改全免費

### Verification
- TypeScript: ✅ 0 error
- Vitest: ✅ 136/136 pass
- Build: ✅ static export 成功
- OSM data: ✅ 4357 間真實資料

---

## [v2.2.2] · 2026-06 · 台灣 niche pilot

### Added
- 48 店 pilot（Taipei 精選）
- 5 維評分雛型
- 付費會員制（NT$199 單次 / NT$99 月）

### Notes
- 付費模型驗證失敗（轉換率 < 1%）
- 為 v3.0 開放版鋪路
