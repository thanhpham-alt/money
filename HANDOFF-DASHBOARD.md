# HANDOFF — MONEY 2026

**Cập nhật:** 16/08/2026  
**Người dùng:** Nhật Thành · live https://money.thanhpham.fun  
**Repo:** https://github.com/thanhpham-alt/money.git · branch `main` · Vercel auto-deploy  
**Workspace:** `/Users/macbook/Claude Code/MONEY 2026`

Đây là bản đang chạy. Không mở lại Next.js `EntryView` / `/jobs` / `/tong-quan` React — middleware rewrite mọi route (trừ `/api`) về `dashboard-v2.html`.

---

## 0. TL;DR cho ca tiếp theo

- **Sửa UI/logic = `dashboard-v2.html`**, rồi **copy sang** `money-app/public/dashboard-v2.html`, commit cả 2, push `main`.
- Live: `money.thanhpham.fun` (admin) · `bluescope.thanhpham.fun` (tab Bluescope, sửa được, ẩn CTV).
- State job/production/bluescope/đất/nợ: `localStorage['money2026_v2']` **+** Neon `DashboardState` qua `POST/GET /api/state`.
- Bill / Đã chi / Đã thu: Neon `DailyExpense` qua `/api/daily-expenses`. Ảnh **không** lưu server.
- **Điện thoại** (money host): chỉ màn upload bill. Dashboard đầy đủ: thêm `?full=1`.
- Password gate đã tắt. Không bật lại trừ khi user hỏi.
- Gemini OCR đã bỏ khỏi luồng chính; đọc bill = Tesseract.js (`vie+eng`) + `parseBankReceipt()` trong HTML.

Sao lưu trước khi đụng shape `S`:

```js
exportJSON()
```

---

## 1. Mở / deploy

```bash
cd "/Users/macbook/Claude Code/MONEY 2026"
# sửa dashboard-v2.html
cp dashboard-v2.html money-app/public/dashboard-v2.html
git add dashboard-v2.html money-app/public/dashboard-v2.html
git commit -m "…" && git push origin main
```

Local Next (cần API bill + state):

```bash
cd "/Users/macbook/Claude Code/MONEY 2026/money-app"
# DATABASE_URL trong .env (Neon, không commit)
npx prisma generate
npm run dev
```

Vercel phục vụ `money-app/`. Sau push ~40–70s; HTML tĩnh đôi khi cache — hard refresh hoặc `?v=timestamp`.

Escape mobile: https://money.thanhpham.fun/?full=1

---

## 2. Kiến trúc

| Lớp | Vai trò |
|---|---|
| `dashboard-v2.html` | Toàn bộ UI + `calc()` + OCR + tabs |
| `money-app/public/dashboard-v2.html` | Bản Vercel phục vụ — **phải giống file gốc** |
| `money-app/src/middleware.ts` | Rewrite `/*` → `/dashboard-v2.html` (trừ `/api`, static) |
| `GET/POST /api/state` | Sync object `S` lên Neon `DashboardState` |
| `/api/daily-expenses` | CRUD bill / thu / chi |
| `/api/daily-expenses/ocr` | Gemini còn đó nhưng UI không gọi |
| `Settings.geminiApiKey` | Neon, không trả raw key ra client |

**Hai origin khác nhau = hai localStorage.** Neon `/api/state` là nguồn chung. Empty seed “Dự án 1” từng ghi đè LG — kéo state từ server trước khi save local rỗng.

Tab: `#/tong-quan` · `#/bluescope` · `#/production` · `#/public/bluescope`  
Nhớ tab: `localStorage['money2026_last_tab']`. Reload không được nhảy về Tổng quan.

---

## 3. UI hiện tại

### Header
`Tổng quan` · `Bluescope` · `Production`  
Nút: **Bill** · **Tất toán đất** · **Freelancer** · **Tổng nợ** (modal nợ thẻ, không còn card trên overview).

### Tổng quan
- Card **Tổng tiền** (tím): 4 ô cộng đúng tổng — Production + Job còn thu + Bluescope + tiền hiện còn (`#v_h3`).
- **Đã thu job** là chip trên tiêu đề (không cộng vào Tổng tiền — đã nằm trong tiền mặt).
- Cạnh phải: **Chênh lệch với nợ** = Tổng tiền − `totalDebt` (nợ thẻ + khoản phải trả + lãi tháng). **Không** trừ gốc vay Shinhan.
- Card **Thu / chi theo tháng**: Thu = job đã tick theo ngày thanh toán; Chi = bill DailyExpense. Không bỏ job chỉ vì đã có `job[8]`.

Đã **bỏ** card Tổng nợ và card Shinhan trên overview. Shinhan vẫn trong **Tất toán đất**.

### Job / Linh tinh
Tab: Job · Đã thu · **Đã chi**.  
Đã chi: 1 dòng `giờ · STK · tiêu đề · nội dung CK · số tiền`.

Tick **Đã thu** → cộng `#v_h3` + tạo `DailyExpense` kind `income` (`skipCash: true` vì đã cộng tay). Bỏ tick → trừ lại + xoá daily.

### Bill
Form: ngày, giờ, số tiền, **tiêu đề hạn mục**, người nhận, nội dung CK, loại, NH, mã GD.  
Kéo-thả / chọn / chụp ảnh. OCR xong sửa rồi **Ghi** → trừ/cộng tiền hiện có.

### Mobile (`body.mobile-bill`)
Chỉ form bill + tiền hiện có. Ẩn header, wrap, Huỷ.  
Detect sớm trong `<body>`: iPhone / Android / iPad / iPhone “bản máy tính” (`MacIntel` + `maxTouchPoints>1`) / rộng ≤920px.  
`?full=1` tắt. Bluescope host không vào mode này.

### Production
LG còn. Producer strip: nút đưa ra bảng chính — **chỉ dòng chưa trả**; dòng đã trả ở lại strip. Có chọn từng ô trước khi đưa ra.

### Bluescope
Booking + rate card + ngân sách. Domain `bluescope.*` = `public-mode` + `bs-editable`.

---

## 4. Công thức overview cần nhớ

```
receivableTotal = proThuVe + jobChuaThu + sumBS + hienCo(#v_h3)
totalDebt       = nợ Tri + nợ mẹ + nợ shop + nợ thẻ + lãi Shinhan tháng
                (KHÔNG gồm dư nợ gốc ~570tr)
chênh lệch      = receivableTotal − totalDebt
Thu từ Job      = job đã tick (không cộng thêm vào Tổng tiền — đã nằm trong tiền mặt)
```

Job row: `[tên, agency, tổng, chi phí, đãThu, ngàyISO, account, ?, dailyId]`  
`r[8]` = id `DailyExpense` khi tick Đã thu.

---

## 5. OCR bill — chỗ vừa sửa

File: `parseBankReceipt()` + `extractPayee()` trong `dashboard-v2.html`.

TCB thật (16/08/2026):

```
Chuyển thành công
Tới NGUYEN THI THUY NHI    ← tên có thể xuống dòng (THUY / NHI)
VND 6,800,000
Tài khoản nhận
Ngân hàng TMCP Ngoại thương…   ← NH nhận, KHÔNG phải NH gửi
1017 5591 03
Lời nhắn
producer
Ngày thực hiện
16 thg 8, 2026 lúc 9:35
```

Kỳ vọng form: người nhận **NGUYEN THI THUY NHI**, tiêu đề = tên đó, nội dung = `producer`, giờ `09:35`, NH gửi **TCB** (logo), không lấy VCB từ “Ngoại thương”.

Lỗi đã gặp: parser cũ không dính tên xuống dòng → `person` rỗng → title = memo `producer` → ô người nhận giữ **LE THI KHUONG** lần trước.

Đã làm:
- `extractPayee()` đọc `Tới` + các dòng tên cho tới khi gặp `VND`
- `fillBillForm` ghi đè / xóa hết ô, `autocomplete=off`
- Tesseract `vie+eng` (fallback `eng`)
- NH gửi chỉ lấy phần **trên** “Tài khoản nhận”

Bill cũ đã lưu “Chuyển khoản” / sai tên **không tự sửa** — phải upload lại.

---

## 6. Việc vừa xong (16/08)

| Commit | Việc |
|---|---|
| `e4729d5` | Bỏ card Shinhan + Tổng nợ; thêm biểu đồ cột thu/chi 12 tháng |
| `7402d2a` | Gọn card Tổng tiền; Còn lại → Chênh lệch với nợ |
| `3eeb2cb` | Tách tiêu đề hạn mục + nội dung CK |
| `b773fc0` | Mobile chỉ upload bill (detect iPad / desktop-mode) |
| `d91c74d` | Sửa OCR người nhận Tới + tên xuống dòng |

---

## 7. Việc còn mở / cẩn thận

- 3 dòng Đã chi cũ (`Chuyển khoản`, thiếu lời nhắn) không backfill được.
- OCR Tesseract vẫn lệch giờ/tên nếu ảnh mờ; user sửa tay trên form rồi Ghi.
- Seed rỗng “Dự án 1” từng xoá LG 113tr / A Tân / 22 dòng CP / crew QR — đừng save `S` mặc định lên `/api/state`.
- `money-app/.env` có `DATABASE_URL` + (cũ) Gemini; **không commit**.
- `money-app/HANDOFF.md` (07/08) mô tả nav Next.js 2 tab — **lỗi thời**, đừng theo.
- Muốn dashboard trên điện thoại: `?full=1`, đừng nới breakpoint mobile-bill trừ khi user bảo.

---

## 8. API / DB (Neon Postgres)

`DailyExpense`: `occurredAt`, `kind` (`income`\|`expense`\|`job`), `amount`, `description`, `category`, `source`, `bankRef`, `bank`, `note`.  
`note` chứa `__cash:1` (đã trừ/cộng tiền) + `__meta:{time,title,person,memo,account}`.

`DashboardState`: 1 dòng `id=default`, `data` = JSON `S`, `revision`.

`Settings`: `geminiApiKey` / `geminiModel` — OCR Gemini fallback, UI hiện không dùng.

---

## 9. Lệnh cứu data (console)

```js
exportJSON()
importJSON()
openDataRescue()          // ?recover=1
```

State key: `money2026_v2`. Backup: `money2026_v2_backup_*`, `_before_seed`, `_before_lg_restore`.
