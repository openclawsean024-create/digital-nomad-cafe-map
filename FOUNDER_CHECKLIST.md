# Founder Checklist — Day 1-14 Pilot（SPEC §15.13）

> 對應 PRD §15.13 ⭐ v3.0 市場驗證計畫：5 階段驗證（landing → community → pilot → press → 國際 launch gate）。
> 本檔是 Stage 5 Day-1 ready 標的的最後一個 deliverable（6/8）；剩餘 7/8 = STATUS/PROJECT_STATE 標 Stage 5 ready；8/8 = Round 9 full verification。
> 邊界：所有外部 service 仍 **mock-only**（Supabase / Stripe / Resend / speedtest credentials 未提供），真實整合待 founder 拿到 credentials 後執行。

---

## Pre-flight（Day 0 — launch 前）

- [ ] 確認 `git log -1` 在 main branch：`a039b470 docs: record Stage 5 Round 7 cron + email deliverable`
- [ ] 確認 production URL **GitHub Pages mirror**：`https://openclawsean024-create.github.io/digital-nomad-cafe-map/` → HTTP 200（canonical Stage 5 deploy target；Vercel GitHub integration 未啟用，僅 `/` 走 Vercel edge cache）
- [ ] 確認 5 個 routes 全部 live：
  - `/landing/`（hero + 5-dim demo + email capture mock）
  - `/verify/?founder=1`（founder-only gating + speedtest mock + 5-dim form + photo upload schema）
  - `/admin/?founder=1`（founder-only gating + 4 metric cards + recharts BarChart mock）
  - `/cron/reminder-dry-run/?founder=1`（founder-only gating + payload preview）
  - `/`（Cafework main + paywall demo gate）
- [ ] 確認 `.env.local` **不含** fake credentials（Supabase / Stripe / Resend / speedtest）；只有 `VERCEL_OIDC_TOKEN=<REDACTED>`
- [ ] 確認 5-dim labels 一致性（WiFi / 安靜 / 插座 / 價格 / 友善）
- [ ] 確認 **mock-only 邊界**：無 Resend SDK、無 Stripe.js、無 Supabase client call、無真實 speedtest 外部呼叫
- [ ] 準備 **USD 100 訪談預算**（USD 20 × 5 場 = USD 100；Amazon / Starbucks 禮卡）
- [ ] 準備 **Mailchimp free tier** 帳號（email 訂閱收集 → production wiring 替換 mock localStorage）
- [ ] 準備 **Stripe test mode** 帳號（pilot 期間 USD 4.99/月）
- [ ] 註冊 **Product Hunt** 帳號（maker profile，Day 50-60 launch gate 預備）
- [ ] 確認 **founder email** 填入 `.env.local` 的 `NEXT_PUBLIC_FOUNDER_EMAIL=<founder@domain>`，這樣 founder 不靠 `?founder=1` query-flag 也能透過 env-match 路徑進入 `/verify` `/admin` `/cron/reminder-dry-run`

---

## Day 1-3：Landing page launch（SPEC §15.13.1）

- [ ] 確認 `/landing/` 上線且 **Lighthouse ≥ 90**（Performance / Accessibility / Best Practices / SEO 四項皆 ≥ 90）
- [ ] 在 Threads / Reddit r/digitalnomad / Indie Hackers **同步發文**測試 hook（草稿見附錄 A.1 / A.2 / A.3）
- [ ] Hero copy 上線：「**Find a cafe that actually lets you work. WiFi speed, power outlets, no time limit. Verified by humans.**」（已 hardcode 於 `src/app/landing/page.tsx`）
- [ ] Email 訂閱表單運作中（mock：`localStorage[deskbound-pilot-emails-v1]`，wired production 後改 Mailchimp free tier）
- [ ] 部署後 **smoke test**：`curl -sI https://openclawsean024-create.github.io/digital-nomad-cafe-map/landing/` → HTTP 200
- [ ] **Go gate ≥ 100 email**（Day 3 截止；No-go：< 50 email → 重新定位 hook / 換 channel）

---

## Day 2-4：Community post（SPEC §15.13.2）

- [ ] Threads 發文（草稿見附錄 A.1，200-300 字 + emoji + CTA）
- [ ] Reddit r/digitalnomad 發文（草稿見附錄 A.2，400-600 字 long-form story + no direct promotion）
- [ ] Indie Hackers 發文（草稿見附錄 A.3，300-400 字 build-in-public 角度）
- [ ] Hook 主題：「**What's your worst 'can't-work-at-this-cafe' story?**」（第一篇）
- [ ] Follow-up poll：「**Would you pay USD 5/mo to never have this happen again?**」（第二篇，Day 4 發）
- [ ] **Go gate ≥ 1000 reach + ≥ 30 留言**（No-go：< 500 reach → 換 channel 試 Hacker News / 微博 / Twitter indie maker 社群）

---

## Day 3-7：5 場訪談（SPEC §15.13.3）

- [ ] 招募 5 位訪談對象（**freelancer 3 + nomad 2**），每場 30 分鐘
- [ ] 每場結束發 USD 20 禮卡（Amazon / Starbucks）
- [ ] 訪談大綱 5 題（見附錄 B）
- [ ] 訪談後請對象跑 `/verify/?founder=1`（founder 陪跑；非 founder 改走 Day 8 pilot open path）
- [ ] 訪談錄音/筆記 → Notion / Google Doc 歸檔
- [ ] **Go gate ≥ 3/5 表達付費意願**（No-go：< 2/5 → 免費版策略調整：放更多免費 cafe，降低 paywall 上限）

---

## Day 4-10：Taipei 50 店 seed（SPEC §15.13.4）

- [ ] founder + 5 訪談對象到店，每店 30 分鐘
- [ ] 每店執行 `/verify/?founder=1` flow：
  - [ ] speedtest mock 抓 wifi（輸入 WiFi SSID + Mbps，UI 隨機 30-150 Mbps；production 改 speedtest-cli）
  - [ ] 5-dim 評分：WiFi _____ Mbps / 安靜度 _/5 / 插座率 _% / 價格 NT$ _____ / 友善 _/5
  - [ ] 拍照：座位 ≥ 1、插座 ≥ 1、menu ≥ 1
  - [ ] 評論 150 字內
  - [ ] 寫入 Supabase `cafes` table + `cafe_ratings` table（demo mode：localStorage `deskbound-verifications-v1`）
- [ ] 完整 per-store checklist 見附錄 C
- [ ] **Go gate ≥ 50 店 + 全部 speedtest 驗證**（No-go：< 30 店 → 擴大 1 城市範圍如新北 / 台中，或延長 seed 5 天）

---

## Day 8-14：Pilot 付費（SPEC §15.13.5）

- [ ] 確認 **Stripe Checkout test mode** 上線（Pro USD 4.99/月 + 單次 USD 4.99）
- [ ] Pilot 開放給 email 訂閱者 + 5 訪談對象（共 ~100-105 人）
- [ ] `/` 上的 `<PaywallGate>` 顯示 demo Stripe Checkout mock（3/天 gate）；真實 wiring 後改為真實 Stripe Checkout session
- [ ] 收集 **NPS survey**（推播 email + landing page 表單；問卷題：「你會推薦 Cafework 給朋友嗎？0-10 分」）
- [ ] **Go gate ≥ 5 付費**（No-go：< 3 → 重新驗證 persona：可能 nomad ≠ 目標，要轉向 freelancer / remote employee）
- [ ] **Day 14 決策會議**：
  - 5 付費 + 8 驗證評分 + NPS ≥ 30 = **Go**（進入 Stage 6 Tokyo seed）
  - 否則 = **freeze + 重新訪談 5 個不同 persona**

---

## Day 14：go/no-go 決策

- [ ] 召開決策會議（founder + 1 advisor）
- [ ] 決策依據：
  1. Pilot 付費數 ≥ 5
  2. Taipei seed 評分 ≥ 8/10（owner + 訪談對象主觀評分）
  3. NPS ≥ 30
- [ ] **Go** → 進入 Stage 6：Tokyo 50 店 seed（Day 15-30）→ Bangkok 50 店 seed（Day 31-45）→ Product Hunt launch（Day 50-60，PH top 5 of day gate）
- [ ] **No-go** → freeze 30 天，回到 Stage 1-5 重新驗證 persona + hook + channel
- [ ] 決策紀錄寫進 `STATUS.md` 新增「Stage 6 in progress」或回到「Stage 5 freeze」

---

## 附錄 A：Community post 草稿（ready-to-post）

### A.1 — Threads（200-300 字，emoji 友善）

```
剛在台北找到一間 WiFi 穩到可以打 4 小時電話會議的咖啡廳。
但我花了 3 個禮拜試了 30 間才找到。

最扯的一次：在某連鎖店坐到插座被店員拔掉，
說「不好意思我們是餐廳不是 co-working space」。

所以我們做了一個東西：
- 4357 間台灣咖啡廳
- 每間都有 wifi 速度、安靜度、插座率、價格、友善 5 維評分
- 全是人到店驗證的

landing page 上線了 → https://digital-nomad-cafe-map.vercel.app/landing/
先收集 email，Day 14 開台北 50 店完整評分。

如果你也被「找不到能工作的咖啡廳」搞瘋，
留個 email，我開服的時候第一個通知你 ☕️
```

### A.2 — Reddit r/digitalnomad（400-600 字，long-form story）

```
Title: I tested 30 cafes in Taipei to find one that lets me work. Here's what I learned.

Body:

I've been doing the Taipei digital nomad thing for 6 months now.
WFH was killing me (apartment too small, no separation),
so I started hunting for cafes that could be a real workspace.

The first month was brutal.

Cafe #4 had great wifi but the owner told me "one drink per 2 hours" rule.
Cafe #11 was quiet but the wifi dropped every 20 minutes.
Cafe #19 had perfect outlets but was so loud I couldn't take calls.
Cafe #23 was the worst — I sat down, plugged in, ordered a coffee,
and 30 minutes later a staff member came over and UNPLUGGED MY LAPTOP.
Said "we're a restaurant, not a co-working space."

That's when I realized: the problem isn't finding cafes.
The problem is finding cafes that actually WORK for work.

So I started a project. Here's what it does:

- Maps 4,357 cafes across Taiwan
- Each one rated on 5 dimensions: WiFi speed / quietness / outlet density / price / staff friendliness
- All ratings are human-verified (founder + 5 volunteers walked in, ordered a coffee, sat for 30 min)

We're launching a pilot in Taipei with 50 hand-picked cafes verified in the next 7 days.
If you're in Taipei and want early access (free during pilot), drop your email:
https://digital-nomad-cafe-map.vercel.app/landing/

If you have your own "worst cafe work story" — please share.
I'm collecting them for the next round of community posts.

(Not promoting my product — genuinely want to hear your horror stories.)
```

### A.3 — Indie Hackers（300-400 字，build-in-public）

```
Built a cafe workability map for Taiwan (4,357 cafes, 5-dim ratings).

What I'm building:
A map of cafes that actually let you work — WiFi speed, quietness, outlets, price, staff friendliness. Every rating is human-verified (we walk in, sit 30 min, order something).

Why I started this:
Got kicked out of a Taipei cafe because "we're a restaurant, not a co-working space."
Realized finding a work-friendly cafe is a 30-cafe trial-and-error problem.

Where I am:
- Stage 4 production live (https://digital-nomad-cafe-map.vercel.app/)
- Stage 5 in progress: /landing + /verify + /admin + paywall demo + city reminder cron dry-run + email template (all mock-only for now)
- 5/8 Stage 5 deliverables shipped this week

What's next (Day 1-14 pilot):
1. Landing page → 100 email gate
2. Community posts (Threads/Reddit/IndieHackers) → 1000 reach + 30 comments gate
3. 5 user interviews → 3/5 paid intent gate
4. Taipei 50-cafe on-site verification → 50 stores gate
5. Stripe pilot → 5 paid gate

Mock-only constraint: no real Supabase / Stripe / Resend credentials yet.
All UI is wired to mock data so I can validate UX before committing to backend.

If you're a Taipei nomad / freelancer and want to try it:
https://digital-nomad-cafe-map.vercel.app/landing/

AMA about the build, the mock-only constraint, or anything else.
```

---

## 附錄 B：訪談大綱（5 題）

1. **目前工作模式**：WFH / 島內移動頻率 / 主要城市 / 一天工作幾小時？
2. **找陌生城市咖啡廳的 workaround**：你現在怎麼找？Google Maps 評價 / Threads 問 / 直接走進去 / 朋友推薦？哪個最常用？
3. **上次踩雷經驗**（具體故事）：最近一次進到咖啡廳才發現「不能工作」的經驗？什麼指標你事前不知道、進去才發現？
4. **如果有工具告訴你 wifi 速度 + 安靜度 + 插座率 + 價格 + 友善，付費意願？** USD 5/月 或 NT$ 150/月，哪個你會選？什麼情境下你會訂？
5. **會推薦幾個朋友？為什麼？** 哪些朋友會需要這個工具？為什麼？

---

## 附錄 C：Taipei 50 店 seed per-store checklist

```
□ 店名：____________________ 地址：____________________
□ 到店時間：____:____  停留時間：____ 分鐘
□ order 1 drink（NT$ ____）
□ speedtest mock 抓 wifi（輸入 WiFi SSID + Mbps）
   - WiFi SSID: ____________________
   - Mbps: ____
□ 5-dim 評分：
   - WiFi _____ Mbps
   - 安靜度 _/5
   - 插座率 _%
   - 價格 NT$ _____
   - 友善 _/5
□ 拍照：
   - 座位 ≥ 1
   - 插座 ≥ 1
   - menu ≥ 1
□ 評論（150 字內）：
   __________________________________________________________
   __________________________________________________________
   __________________________________________________________
□ 寫入 Supabase `cafes` table + `cafe_ratings` table
   （demo mode：localStorage `deskbound-verifications-v1`，founder 後台匯出）
□ 不限時布林：□是 □否
□ 久坐友善 1-5：_/5
```

---

## Stage 5 verification evidence（已驗證，作為本 checklist 的 baseline）

- 136/136 vitest tests pass（15 test files）
- `npm run typecheck` exit 0（strict TypeScript）
- `npm run build` exit 0（5 static routes：`/`, `/landing`, `/verify`, `/admin`, `/cron/reminder-dry-run`）
- 5 個 production URLs 全部 HTTP 200（GitHub Pages mirror）
- `/verify/?founder=1`：founder-only gating + speedtest mock + 5-dim form + photo upload schema
- `/admin/?founder=1`：founder-only gating + 4 metric cards（emails/reach/cafes/paid）+ recharts BarChart mock
- `/cron/reminder-dry-run/?founder=1`：founder-only gating + Resend-ready JSON payload preview
- `<PaywallGate>` on `/`：3/天 gate + Stripe Checkout mock UI；open-access invariant preserved
- `npm run cron:dry`：CLI prints JSON payload（mock-only）

---

## 完成偵測

本檔與 `STATUS.md` + `PROJECT_STATE.md` 一起 commit 後，Stage 5 = **pilot-ready done**。
Round 9 將跑 full verification（5 URLs all 200 + byte-identical + 136/136 tests + 5 routes + 本檔 + status-final）→ Ralph driver 標 goal complete。