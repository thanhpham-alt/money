# MONEY 2026 — Web App

Web app quản lý **Dashboard · Job Production · Bluescope (module + public) · Nợ & thẻ**.

Stack giống tool editor: **Next.js App Router + Prisma SQLite + Tailwind**.

Chi tiết restructure: xem `HANDOFF.md` và `~/Downloads/MONEY_2026_RESTRUCTURE.md`.

## Chạy local

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026/money-app"
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Mở **http://localhost:3001**

> Port `3001` để không đụng Video Workload (`3000`).

## Routes

| Route | Mô tả |
|-------|--------|
| `/` | Dashboard + accordion công nợ |
| `/jobs` | Job Production (mọi jobType) |
| `/jobs/[id]` | Chi tiết job — khuôn P&L chung |
| `/bluescope` | Module Bluescope nội bộ |
| `/bluescope/public` | Public view cho khách (layout riêng) |
| `/debts` | Nợ MOM / a Trí + thẻ |
| `/settings` | Tiền, % phí, URL sheet Bluescope |

**Bluescope số liệu** = 1 job `jobType=BLUESCOPE` (không duplicate ở Settings).

## Seed mẫu

- `JOB_LG` — HĐ 63.104.000 + chi phí camop/edit…
- `JOB_BLUESCOPE` — link booking + 100tr budget seed
- Các agency: Bizeyes, Sun Group, pbcm…
- Nợ MOM 88tr, a Trí 175tr, 4 thẻ tín dụng

## Cấu trúc

```text
src/
  app/           # pages + API routes
  components/    # UI + layout (style tool editor)
  features/      # dashboard, jobs, receivables, debts, settings
  lib/           # prisma, money math, utils
prisma/          # schema + SQLite
scripts/seed.ts
```

## Scripts

```bash
npm run dev          # :3001
npm run db:seed      # seed lại (upsert, không xóa)
npm run db:studio    # Prisma Studio
npm run typecheck
```
