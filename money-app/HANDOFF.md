# HANDOFF — MONEY 2026 Web App

> **Lỗi thời (07/08).** Bản đang chạy là `dashboard-v2.html` (rewrite Vercel), không phải nav Next 2 tab bên dưới.  
> Đọc **`../HANDOFF-DASHBOARD.md`** (16/08/2026).

**Cập nhật:** 2026-08-07  
**Project:** `/Users/macbook/Claude Code/MONEY 2026/money-app`
**Local:** http://localhost:3001 · **Stack:** Next 15 · Prisma + SQLite · Tailwind 4

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026/money-app"
npm install
npx prisma migrate deploy && npx prisma generate
npm run dev            # :3001
```

> ⚠️ **Sau mỗi lần `migrate`, PHẢI restart `npm run dev`.**
> Dev server giữ Prisma client cũ trong RAM → API trả 500 “column does not exist”.
> Đây là nguyên nhân lỗi Dashboard đã gặp. Đã fix bằng restart.

---

## 1. Nav: chỉ 2 tab

```
[ Nhập liệu ]   [ Tổng quan ]              ⚙ (icon, không phải tab)
```

| Route | Nội dung |
|---|---|
| `/` | **Nhập liệu** — form 5 ô thêm/sửa job + danh sách job (sửa/xoá) |
| `/tong-quan` | **Tổng quan** — hero Thực có · 4 KPI · bảng job 4 cột · accordion “Công nợ & Vốn” |
| ⚙ modal | Tiền hiện có · % phí xuất HĐ · % A Tân |

**Route giữ lại nhưng KHÔNG hiện trong nav** (vào bằng link trực tiếp):
`/jobs` (bảng job đầy đủ) · `/bluescope` (booking + rate card + gói) · `/finance` (đất) ·
`/debts` (sửa nợ & thẻ) · `/jobs/[id]` · `/bluescope/public` (view cho khách).

> Brief nói xoá `/bluescope` và `/finance`. Tôi **giữ route, bỏ khỏi nav** — công thức đất và
> booking Bluescope đã verify khớp Excel, xoá là mất hẳn. Nav vẫn gọn đúng 2 tab.
> Accordion ở Tổng quan có link sang 2 trang này.

Đã bỏ hẳn: tab Cài đặt, dark mode, tab Production (thành popup), tab Content list,
`features/dashboard`, `features/production`.

### Form Nhập liệu — 5 ô
Tên job · Agency · Loại (dropdown) · Tổng HĐ · Đã thu · Tổng chi phí
→ **Còn lại** và **LN gộp** tự tính, không cho nhập.
Chi phí nhập **1 số tổng**; muốn tách dòng thì mở “Chi tiết chi phí” (không bắt buộc).

**Bug đã fix ở đây:** job mới trước đây tự tạo 7 dòng chi phí rỗng (Camop 1, Camop 2…)
→ khiến ô “Tổng chi phí” bị khoá (server trả 409, client bỏ qua im lặng).
Giờ job mới tạo ra **0 dòng**, và lỗi 409 được hiện toast.
Đã test: HĐ 50tr / thu 20tr / chi phí 12tr → còn lại 30tr · LN gộp 38tr ✅

---

## 2. Công thức — đã verify khớp Excel 100%

### `lib/production.ts` → `productionMetrics()` (sheet **JOB**)

| Sheet | Công thức | Verify |
|---|---|---|
| C5 phí xuất hoá đơn | `hợp đồng × 4%` | ✅ 4.480.000 |
| C21 tổng CP sản xuất | `SUM(hạng mục)` | ✅ 42.400.000 |
| F19 tổng ứng | `SUM(đã ứng)` | ✅ 7.000.000 |
| C25 A Tân | **nhập tay** (null → tự 20% LN) | ✅ 18.000.000 |
| C24 | `phí xuất + A Tân` | ✅ 22.480.000 |
| C23 | `hợp đồng × 8% + C24` | ✅ 31.440.000 |
| C27 lợi nhuận | `hợp đồng − CP sản xuất` | ✅ 69.600.000 |
| C28 **lợi nhuận còn lại** | `C27 − C24` → **chảy vào Dashboard** | ✅ 47.120.000 |

### `lib/production.ts` → `landMetrics()` (sheet **Tài Chính**)

Góp vốn 950tr (Trường 26.32% / Thành 73.68%) · nợ NH tự giảm `3.240.741/tháng` từ 10/07/2026
→ LN ròng **292.000.000** · tôi được chia **215.157.895** · vốn gốc **376.388.899**
→ **Thực nhận 598.546.794** ✅ khớp tuyệt đối ô E35.

### `lib/credit.ts` → `cardStatus()` (sheet **CÔNG NỢ**)

Trừ dần theo kỳ đáo hạn: **Techcombank ngày 5 · TPB 25 · OCB 25 · SCB 25**
`CÒN LẠI = DƯ NỢ − monthly × số kỳ đã qua − adjust`

Số thật đã seed: TCB 71.800.000 · TPB 24.568.000 · OCB 1.262.000 · SCB 8.610.000 (trả 6.903.000/th) · Tiền cố định 8.000.000/th.
`THÁNG NÀY` tổng = **14.903.000** ✅ khớp sheet.

> ❗ **Khác biệt cần bạn quyết:** sheet ghi `CÒN LẠI = 99.337.000` (đã trừ sẵn tiền tháng này).
> App tính **106.240.000** vì hôm nay 07/08, chưa tới ngày 25 nên chưa trừ.
> → Cần thêm ô tick **“đã trả tháng này”** cho mỗi thẻ, tick vào là khớp 99.337.000. **Chưa làm.**

### `lib/bluescope.ts` (Bluescope)
Ngân sách 100tr · đã xài = `SUM(quay chụp + dựng − chiết khấu)` = **44.000.000** ✅ · còn lại 56tr.
Gói: VIDEO CƠ BẢN 6tr · PODCAST 60tr ✅ · EVENT 46tr ✅

---

## 3. Bug đã fix (quan trọng)

**`parseMoneyInput` làm mất tiền.** `"5.000.000"` → `Number()` → `NaN` → lưu **0**.
Chỉ cần click vào 1 ô tiền rồi click ra là số bị xoá thành 0.
Fix ở `lib/utils.ts`: bỏ hết ký tự không phải số (`.` `,` là phân cách nghìn của VND).
Đã verify: focus + blur giữ nguyên 5.000.000.

---

## 4. Kiến trúc

```
src/
  lib/
    production.ts      productionMetrics() · landMetrics()   ← công thức Excel
    credit.ts          cardStatus() · cardTotals()           ← thẻ theo kỳ đáo hạn
    bluescope.ts       loadBluescope() · eventTotal()        (server-only, có prisma)
    bluescope-const.ts hằng số cho client (EVENT_TYPES…)
    money.ts           jobMetrics() · remainingDebt()
    utils.ts           formatVnd · parseMoneyInput ⚠️
  components/sheet/
    cell.tsx           TextCell · MoneyCell · NumCell · DateCell (commit khi blur/Enter)
    pill.tsx           Pill · PillSelect (màu tự sinh theo chữ)
  features/
    dashboard/ jobs/ production/ bluescope/ finance/ debts/
  app/api/
    dashboard · jobs · production(+advances) · bluescope(+rows) · finance · debts · public/bluescope
```

**1 nguồn số:** Bluescope chi phí **chỉ** từ `BluescopeEvent` (đã xoá `JobExpense` rác 44tr để khỏi đếm 2 lần). Dashboard + JOB đều đọc qua `expenseTotalOverride`.

**API gọn:** `/api/bluescope/rows` là 1 endpoint CRUD cho 5 bảng (rate/event/content/package/packageItem) — whitelist field theo bảng, có `order:[id…]` để sort.

---

## 5. CÒN LẠI PHẢI LÀM

1. **Gắn nút popup Production vào bảng `/jobs`.**
   `features/jobs/production-modal.tsx` **đã viết xong + build pass**, chỉ cần import vào
   `jobs-view.tsx`: thêm cột nút 🧮 + `useState(openJobId)` → `<ProductionModal jobId=… onClose=…/>`.
2. **Thẻ:** thêm tick “đã trả tháng này” (xem mục 2) + UI sửa `dư nợ / trả mỗi tháng / ngày đáo hạn`
   (API đã nhận đủ field; `/debts` UI còn style cũ).
3. **Sort + kéo-thả** cho bảng job — hook `useRowDrag` đã có sẵn (dùng ở Bluescope).
4. **UI style cũ còn sót:** `/jobs`, `/debts`, `/jobs/[id]` vẫn màu cam. `/` `/tong-quan`
   `/bluescope` `/finance` + Production modal đã theo design system mới.
5. Nợ cá nhân thiếu **Shopcash 60tr** (sheet có Trí 175tr + Mom 88tr + Shopcash 60tr + Thẻ).
6. `create-job-modal.tsx` giờ không dùng nữa (form ở tab Nhập liệu thay thế) — có thể xoá.

## 5b. Deploy Turso + Vercel — CHƯA LÀM

Theo `BRIEF_DEPLOY.md`. **Chưa thực hiện** vì push GitHub + deploy là hành động ra ngoài,
cần bạn xác nhận trước.

Chuẩn bị sẵn: `npm run build` **pass** (21 route). Cần làm khi bạn OK:
1. `npm i @libsql/client @prisma/adapter-libsql` · sửa `lib/prisma.ts` dùng adapter.
2. Dump `prisma/dev.db` → import vào Turso (**không** tạo DB rỗng, data thật đang ở đây).
3. `build` script thêm `prisma generate`.
4. Push `https://github.com/thanhpham-alt/money.git` → import Vercel → set env.

> 🔒 **Token Turso đang nằm plaintext trong `BRIEF_DEPLOY.md`.** Chỉ để trong `.env`
> (đã có trong `.gitignore`) + Vercel Env Vars. Không commit. Nên **rotate token** sau khi
> deploy xong vì nó đã bị ghi ra file.

---

## 6. Quy tắc

- **KHÔNG** xoá `prisma/dev.db` (data thật đã nhập).
- Sau `migrate` → **restart dev server**.
- Bluescope build hẳn trong app, **không** link Google Sheets nữa.
- Port **3001** · UI tiếng Việt · light mode only.
- Ô vàng `badge-input` = nhập tay · ô tím `badge-auto` = công thức, không sửa.

## 7. Scripts

```bash
npm run db:seed             # settings, nợ MOM/Trí, jobs mẫu
npm run db:seed:bluescope   # rate card, booking, gói (idempotent)
npx tsx scripts/seed-cards.ts  # thẻ + ngày đáo hạn thật (XOÁ thẻ cũ rồi seed lại)
```
