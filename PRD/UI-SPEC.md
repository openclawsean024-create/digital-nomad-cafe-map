# Cafework UI-SPEC v4.0

> 狀態：prototype approved · React implementation verified · 2026-09-23
> 對應：`PRD/SPEC.md` v4.0 · AC-001–AC-008

## 1. Design intent

Cafework is a decision tool, not an operations dashboard. The first screen must help a person answer one question quickly:

> 「這家店，今天適不適合我工作？」

The interface should feel like a calm field guide: practical, transparent, and slightly editorial. It must not look like a generic SaaS admin panel, a fake analytics dashboard, or a polished map that hides missing evidence.

## 2. Page anatomy

### 2.1 Desktop

```text
┌────────────────────────────────────────────────────────────────────┐
│ brand / primary nav                         contribute / profile    │
├────────────────────────────────────────────────────────────────────┤
│ eyebrow → headline + context                 trust / directory stats│
├────────────────────────────────────────────────────────────────────┤
│ search field                 city scope       sort                  │
│ active filter chips + data truth note                              │
├───────────────────────────────┬────────────────────────────────────┤
│ map / location context         │ result list                         │
│ markers with evidence states   │ cafe cards → detail drawer/modal   │
└───────────────────────────────┴────────────────────────────────────┘
```

- Header remains compact and persistent.
- Hero copy sits above the controls; it explains the product before asking for input.
- The map is context, not the only source of truth. The result list must work when map tiles fail.
- The right-hand list is the primary action surface on desktop.
- The detail view is a drawer/modal entered from a card or marker.

### 2.2 Mobile

- Header: logo, search, one primary action.
- Hero: two short lines maximum before the first search control.
- Controls become a horizontal scroll row of filter chips; advanced filters open in a bottom sheet.
- List is the default tab. Map is a secondary tab. Contributions are reached from the detail view.
- Bottom navigation has only `探索`, `地圖`, `我的清單`; do not expose unused admin/premium destinations.

## 3. Visual system

### 3.1 Tokens

| Token | Value | Usage |
|---|---|---|
| `ink-950` | `#172329` | text, nav, borders |
| `ink-600` | `#5E6A6B` | supporting copy |
| `canvas` | `#F4F1EA` | page background |
| `surface` | `#FFFCF6` | cards and panels |
| `mist` | `#E5ECE7` | map surface, secondary blocks |
| `signal` | `#E4F37A` | primary action and verified accent |
| `coral` | `#F28B6D` | selected state / attention |
| `line` | `#D5DBD5` | dividers |

- Use one expressive serif or display face only for the primary headline; body copy remains a legible sans-serif.
- Use rounded corners sparingly (`12–18px` for cards, full pill only for filters/statuses).
- Borders are quiet but visible. Avoid heavy shadows and gradients that imply fake precision.
- Numbers are tabular/monospace only for counts and technical values.

### 3.2 Status language

| State | Visual | Copy |
|---|---|---|
| Imported | neutral dot / outline | `開放資料` |
| Partially verified | coral marker / tinted badge | `部分驗證` |
| Fully verified | signal marker / solid badge | `已驗證` |
| Unknown | dashed metric / muted text | `尚無資料` or `待驗證` |
| Prototype-only | quiet banner | `原型示意，不代表即時營業狀態` |

Never use a numeric work score if the five dimensions are not present. Display `—` with a nearby explanation.

## 4. Component contract

### Header

- Brand: `Cafework` + `找一個真的能工作的地方`.
- Primary nav: `探索地圖`, `資料怎麼來`, `我的清單` (the latter may be labelled `即將推出` until implemented).
- Actions: `補一筆資料` is primary; no `登入`, `升級`, or `營運台` in the public header.

### Search and filters

- Search placeholder: `搜尋店名、地址或區域`.
- Scope selector defaults to `全台灣`.
- Quick filters: `Wi-Fi 50+ Mbps`, `插座較多`, `安靜 4+`, `不限時`.
- Sort options: `最適合工作`, `最近更新`, `距離我最近` (only expose options the data layer can support; do not imply live distance without location permission).
- Show result count and an explicit data note: `目前多數店家尚待社群驗證`.

### Cafe card

Required hierarchy:

1. Cafe name and city.
2. Evidence status badge.
3. Work score or `— 未驗證`.
4. Three high-signal fields: Wi-Fi, outlets, noise.
5. Last verified / source line.
6. One clear action: `查看工作條件`.

Card must be a button or have a button-level accessible target. Tag lists must not carry critical meaning alone.

### Map

- Marker color encodes evidence status, not rating.
- Marker tooltip includes cafe name, city, and status.
- Include a legend and a `列表優先` fallback when map data fails.
- The prototype may use a schematic map, but must label it as location context rather than live navigation.

### Detail drawer / modal

- Title, address, source, status, last checked date.
- Five-dimension evidence grid with unknown values visible.
- `在地圖開啟` may be shown only as an external action; it is not a verification claim.
- Contribution CTA: `我到過這裡，補一筆`.
- Close with Escape, close button, and backdrop click; return focus to the triggering card.

### Contribution form

- Explain that the submission is a local prototype action until a backend is connected.
- Ask only for fields needed to verify work conditions: Wi-Fi speed, noise, outlets, stay limit, optional note/photo.
- Show a success state that says `已記錄在這台裝置` rather than implying public sync.

## 5. Responsive behavior

| Width | Behavior |
|---|---|
| `≥ 1180px` | two-pane map/list; sidebar navigation visible |
| `768–1179px` | compact header; map/list split remains fluid |
| `< 768px` | list-first tabs; filters in bottom sheet; modal becomes full-height sheet |
| `≤ 390px` | single-column cards; never truncate status or CTA labels |

Touch targets are at least 44px. Horizontal filter scrolling must preserve visible focus and not hide the active state.

## 6. Accessibility and content rules

- WCAG 2.1 AA contrast target for text and controls.
- Every icon-only button has an accessible label.
- Focus must be visible on dark and light surfaces.
- Do not encode status by color alone; pair color with text and/or icon.
- Use Traditional Chinese copy consistently. Keep technical terms in parentheses only when they help comprehension (`Wi-Fi`, `Mbps`).
- Date labels should be concrete (`最後驗證：尚無資料`), not fake relative timestamps.

## 7. Prototype acceptance checklist

- [x] Desktop composition reads as cafe discovery within three seconds.
- [x] No generic dashboard modules remain.
- [x] Unknown data is visually explicit on cards, map markers, and detail view.
- [x] Search, city scope, quick filters, sort, card selection, and contribution modal work without a framework.
- [x] Mobile width remains usable without horizontal page overflow.
- [x] Prototype-only and non-live data boundaries are visible.
- [x] Formal React implementation follows the approved prototype and passes local test, typecheck, build, and browser smoke checks.
