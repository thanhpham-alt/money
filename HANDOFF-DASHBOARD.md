# HANDOFF — MONEY 2026 · snapshot 17/08/2026

**Người dùng:** Nhật Thành  
**Live:** https://money.thanhpham.fun · https://bluescope.thanhpham.fun  
**Repo:** https://github.com/thanhpham-alt/money.git · `main` · Vercel auto-deploy  
**Workspace gốc:** `/Users/macbook/Claude Code/MONEY 2026`  
**Bản chép 17/08:** `/Users/macbook/Claude Code/Money Final _1708`  
**Commit lúc chép:** `7da3820` Fix mobile bill save feedback and allow multi-photo upload

Đây là bản đang chạy. **Không** mở lại Next.js `EntryView` / `/jobs` React. Middleware rewrite mọi route (trừ `/api`) về `dashboard-v2.html`.

---

## 0. TL;DR ca tiếp theo

1. Sửa UI/logic trong **`dashboard-v2.html`**, copy sang **`money-app/public/dashboard-v2.html`**, commit cả 2, push `main`.
2. Điện thoại (`money.thanhpham.fun`): **chỉ Upload + Ghi và trừ tiền + số tiền sau trừ**. Dashboard đủ: `?full=1`.
3. Bill **không lưu ảnh**. OCR lấy số liệu → POST `/api/daily-expenses` → trừ `#v_h3`.
4. State job/production/bluescope/đất/nợ: `localStorage['money2026_v2']` **+** Neon `DashboardState` (`/api/state`).
5. Password đã tắt. Seed rỗng “Dự án 1” từng xoá LG — đừng save `S` mặc định lên server.
6. Sao lưu: `exportJSON()` trên console desktop.

---

## 1. Server / data đang dùng

| Lớp | Ở đâu |
|---|---|
| App / API | **Vercel** · host `money.thanhpham.fun` |
| Database | **Neon Postgres** · AWS `ap-southeast-1` (Singapore) |
| Host DB | `ep-bold-truth-az34oxxs.c-3.ap-southeast-1.aws.neon.tech` · db `neondb` |
| Ảnh bill | **Không upload.** OCR tại chỗ / Gemini, chỉ gửi JSON |
| Code | GitHub `thanhpham-alt/money` |

`.env` (không commit lên git public nếu repo mở): `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`. Bản chép 17/08 **có** file `.env` để chạy tiếp.

Bảng chính:

- `DashboardState` — 1 dòng `id=default`, JSON object `S`
- `DailyExpense` — bill đã chi / đã thu (`kind`, `amount`, `occurredAt`, `description`, `note` chứa `__cash:1` + `__meta`)
- `Settings.geminiApiKey` — OCR server, không trả raw key ra client

---

## 2. Mở / deploy

```bash
cd "/Users/macbook/Claude Code/Money Final _1708"   # hoặc MONEY 2026
cp dashboard-v2.html money-app/public/dashboard-v2.html
git add dashboard-v2.html money-app/public/dashboard-v2.html
git commit -m "…" && git push origin main
```

Local API:

```bash
cd money-app
npm install
npx prisma generate
npm run dev
```

Bản chép **không** gồm `node_modules` (~634MB). Phải `npm install`.

Escape mobile: https://money.thanhpham.fun/?full=1

---

## 3. Kiến trúc file

| File | Vai trò |
|---|---|
| `dashboard-v2.html` | Toàn bộ UI + `calc()` + OCR + mobile |
| `money-app/public/dashboard-v2.html` | File Vercel phục vụ — **phải giống file gốc** |
| `money-app/src/middleware.ts` | Rewrite `/*` → `/dashboard-v2.html` |
| `money-app/src/app/api/state/route.ts` | Sync `S` |
| `money-app/src/app/api/daily-expenses/route.ts` | CRUD bill (mặc định 18 tháng, max 400 dòng) |
| `money-app/src/app/api/daily-expenses/ocr/route.ts` | Gemini Vision — **đang dùng lại** từ mobile |
| `money2026-seed.json` | Seed LG / freelancer / job |

Tab: `#/tong-quan` · `#/bluescope` · `#/production` · `#/public/bluescope`  
Nhớ tab: `localStorage['money2026_last_tab']`.

---

## 4. UI hiện tại

### Desktop — Tổng quan
- **Tổng tiền** = Production thu về + Job còn thu + Bluescope + tiền hiện còn (`#v_h3`). Bốn ô này cộng đúng tổng.
- Chip **Đã thu job** trên tiêu đề — không cộng vào Tổng tiền (đã nằm trong tiền mặt).
- **Chênh lệch với nợ** = Tổng tiền − `totalDebt` (nợ thẻ + khoản phải trả + lãi tháng). **Không** trừ gốc Shinhan ~570tr.
- Biểu đồ 12 tháng: **Thu** = job đã tick theo ngày thanh toán `r[5]`; **Chi** = DailyExpense expense. Không bỏ job chỉ vì có `job[8]`.

### Desktop — Job
Tab Job / Đã thu / Đã chi. Đã chi 1 dòng: giờ · STK · tiêu đề · nội dung · số tiền.  
List chi chỉ fetch khi mở tab (tránh lag lúc load trang).

### Mobile — chỉ bill
Detect sớm (`body.mobile-bill`): iPhone / Android / iPad / iPhone “bản máy tính” / rộng ≤920px. Bluescope host không vào mode này.

Màn hình:

1. **Tiền hiện có sau trừ**
2. **Upload** (chọn được **nhiều ảnh**)
3. **Ghi và trừ tiền**
4. Dòng kết quả xanh: `Đã trừ N ảnh · X ₫ · còn Y ₫`

Form, preview ảnh, ngày/giờ, NH, mã GD **ẩn**. Field vẫn còn trong DOM để OCR điền.

Luồng mobile 17/08:

- Chọn N ảnh → lần lượt: nén JPEG 720px → Gemini OCR (timeout 7s) → fallback Tesseract `eng` → nếu có `amount` thì `addDaily` + trừ tiền ngay.
- Ngày/giờ = lúc upload, hoặc giờ status bar góc trái nếu đọc được.
- **Không** hiện ảnh bill.
- Sau khi trừ: báo thành công trên `#bill-result`. Không `alert` giả “Chưa đọc được số tiền” nếu vừa ghi xong.
- Không `loadDaily` / không `ensureDeploySeed` / `pullStateFromServer` chạy nền.

Lỗi đã gặp (đã fix): trừ tiền xong clear form, không báo, user bấm Ghi lần 2 → alert sai.

### Production
LG còn. Producer: chỉ dòng **chưa trả** đưa ra bảng chính.

---

## 5. OCR / bill — chỗ dễ gãy

```
ocrOneBill(file)
  shrinkBillFile(file, 720)          // không đưa ảnh gốc
  ocrViaGemini(small jpeg)           // /api/daily-expenses/ocr
  fallback parseBankReceipt(Tesseract eng)
  occurredAt/time = uploadStamp() hoặc statusBarTime(raw)
```

TCB thật: `Tới NGUYEN THI THUY NHI` có thể xuống dòng. `extractPayee()` đọc cả dòng sau `Tới` tới khi gặp `VND`. NH gửi = phần **trên** “Tài khoản nhận” (TCB), không lấy VCB của STK nhận.

Công thức job row: `[tên, agency, tổng, chi phí, đãThu, ngàyISO, account, ?, dailyId]`

---

## 6. Việc 16–17/08

| Commit | Việc |
|---|---|
| `e4729d5` | Bỏ card Shinhan + Tổng nợ; biểu đồ thu/chi |
| `7402d2a` | Còn lại → Chênh lệch với nợ |
| `3eeb2cb` | Tiêu đề hạn mục + nội dung CK |
| `b773fc0` / `a7d62f6` | Mobile chỉ bill, 2 nút |
| `d91c74d` | OCR tên Tới xuống dòng |
| `4df90c4` | Tổng tiền 4 ô; chi load nhẹ |
| `01958ce` | Không preview ảnh; nén + Gemini + giờ upload |
| `7da3820` | Nhiều ảnh, trừ từng tờ, báo thành công |

---

## 7. Cẩn thận

- Hai origin = hai `localStorage`. Neon `/api/state` là nguồn chung.
- Đừng save seed rỗng lên server.
- `money-app/HANDOFF.md` (07/08) **lỗi thời**.
- Desktop `?full=1` nếu cần sửa dashboard trên điện thoại.
- Gemini key trong Neon Settings + `.env`. Nếu OCR fail, check `/api/daily-expenses/ocr`.
- Bill cũ “Chuyển khoản” / sai tên không tự sửa.

---

## 8. Cứu data

```js
exportJSON()
importJSON()
openDataRescue()   // ?recover=1
```

Key: `money2026_v2`. Backup: `money2026_v2_backup_*`, `_before_seed`, `_before_lg_restore`.

Seed file: `money2026-seed.json` (LG 113tr, A Tân, crew QR…).
