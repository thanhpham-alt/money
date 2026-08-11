# MONEY 2026 — Dashboard HTML

**Cập nhật:** 11/08/2026  
**File chính:** `dashboard-v2.html` (HTML + CSS + JS một file, ~5.500 dòng)  
**Dữ liệu:** `localStorage['money2026_v2']` trên trình duyệt  
**Không cần build**, không backend, không npm cho bản đang dùng.

> Bản Next.js trong `money-app/` là dự án **khác**, không đồng bộ với file HTML này. Tài liệu này chỉ nói về **dashboard HTML**.

---

## 1. Mở local (đang dùng hàng ngày)

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
python3 -m http.server 8931
```

Mở trình duyệt (giữ đúng host + port này):

| Màn | URL |
|---|---|
| Tổng quan | http://127.0.0.1:8931/dashboard-v2.html#/tong-quan |
| Bluescope | http://127.0.0.1:8931/dashboard-v2.html#/bluescope |
| Production | http://127.0.0.1:8931/dashboard-v2.html#/production |

**Phá cache sau khi sửa code:** `Cmd + Shift + R` hoặc thêm `?rev=YYYYMMDD-hhmm` vào URL.

### Cảnh báo dữ liệu (rất quan trọng)

- Kho dữ liệu gắn với **origin** (`protocol + host + port`).
- `127.0.0.1:8931` ≠ `localhost:8931` ≠ `file://` ≠ port khác → trông như **mất data**.
- File `dashboard-v2.bak-*.html` chỉ backup **mã**, không chứa số đã nhập.

Sao lưu / nạp dữ liệu (mở Console trình duyệt `F12`):

```js
exportJSON()   // tải file JSON về máy
importJSON()   // chọn file JSON để nạp lại
```

Trước khi đổi cấu trúc dữ liệu lớn: luôn `exportJSON()` trước.

---

## 2. Kiến trúc ngắn

```
dashboard-v2.html
├── CSS (layout, bảng, popup)
├── HTML (header, 3 panel, modal đất/nợ/freelancer)
└── JS
    ├── S              // state toàn cục
    ├── localStorage   // key: money2026_v2
    ├── calc()         // tính lại + save()
    ├── renderJobs / renderBS / renderProDetail / …
    └── exportJSON / importJSON
```

| Thành phần | Ghi chú |
|---|---|
| State | Object `S` (jobs, bluescope, budgets, rate, pros, crew, debts, inputs…) |
| Lưu | Tự lưu khi `calc()` / chỉnh form |
| Route | Hash: `#/tong-quan` · `#/bluescope` · `#/production` |
| Font | Be Vietnam Pro (Google Fonts) |
| Layout | Full width, không giới hạn 1720px |

---

## 3. Giao diện hiện tại

### Header
- Tab: **Tổng quan** · **Bluescope** · **Production**
- Nút: **Tất toán đất** · **Freelancer** · **Nợ thẻ**

### Tổng quan
- 3 card: Tổng tiền thu về · Tiền mặt hiện có · Công nợ tổng hợp
- Bảng **Job / Linh tinh**
  - Tab: Job chưa thu / Đã thu
  - Cột: Tên Job · **Agency** · **Account** · Ngày TT · Ngày còn lại · Tổng · Đã thu · Còn phải thu
  - Dòng nhập nhanh trên đầu bảng

### Bluescope (admin)
- Dải ngang: Rate card · Ngân sách · KPI
- Bảng booking cột thẳng (không popup hạng mục):
  - Tên · Ngày · Loại · T.gian · **Chụp · Quay · Recap · CP dựng · C.khấu** · Tổng · CTV · Còn lại
  - **Đã bỏ trường Brief** (data cũ vẫn giữ trong storage)
  - CP dựng tự tính khi có Recap
  - Chi phí CTV: popup nhiều freelancer
- Nút **⇩ Xuất data public** · **👁 Xem public**

### Bluescope public (deploy cho khách — chỉ xem)

| | |
|---|---|
| **Link public** | `…/bluescope-public.html` hoặc `…/dashboard-v2.html#/public/bluescope` |
| **Nav admin** | **Không** — không tab Tổng quan / Production / Nợ / Freelancer |
| **Sửa data** | **Không** — chỉ xem |
| **Ẩn cột** | **Chi phí CTV** · **Còn lại** (và mọi chi phí CTV) |
| **Hiện** | Rate card · Ngân sách · Booking (Chụp/Quay/Recap/CP dựng/C.khấu/Tổng) |

**Cách publish data lên host:**

1. Trên máy admin (đã có booking đúng): mở Bluescope → **⇩ Xuất data public**  
   → tải file `bluescope-public-data.json`
2. Upload lên cùng thư mục deploy:
   - `dashboard-v2.html`
   - `bluescope-public.html`
   - `bluescope-public-data.json`  ← bắt buộc để khách thấy số thật
3. Gửi khách: `https://your-domain/bluescope-public.html`

Khi mở entry public, app **khóa** chỉ-xem (không nhảy sang admin bằng đổi hash).  
Preview local: `http://127.0.0.1:8931/bluescope-public.html`

### Production
- Sidebar trái: Dự án · Tiền tôi thu về · Ngân sách · Dashboard
- Bảng chi phí: STT liên tục 1…N · Freelancer · Hạng mục · Chi phí (200px) · OT (200px) · Trạng thái · QR (100px)
- Trạng thái: chưa trả = số tiền · đã trả = **✓ Đã thanh toán**
- QR: ô gọn, bấm xem to; upload giữ nét (PNG, tối đa ~2000px)
- Dải **Chi phí Producer** dưới bảng
- Popup A Tân & hoá đơn

### Đất Chánh Mỹ / Nợ thẻ
- Popup đất: tất toán + lợi nhuận khi bán
- Popup nợ: thẻ + lãi vay đất tháng

---

## 4. Công thức chính (tóm tắt)

### Bluescope
```
CP quay/chụp = Rate Photo × SL chụp + Rate Camera × SL quay  (theo nửa/cả ngày)
CP dựng     = nếu Recap > 0: Rate Edit + Recap × Rate Short Clip
              else: nhập tay
Tổng booking = CP quay/chụp + CP dựng − Chiết khấu
Còn lại     = Tổng booking − Tổng CTV
Ngân sách còn lại = Tổng NS đã tick “Đã trả” − Tổng booking
```

### Job
```
Còn phải thu = Tổng − Chi phí (legacy)
Ngày còn lại = Ngày TT − hôm nay  (job đã thu: ẩn)
```

### Production
```
Tổng 1 dòng = Chi phí + OT
Còn trả CTV = Tổng phải chi − Đã thanh toán
LN ròng / Tiền tôi thu về / A Tân  → proCalc() (giữ công thức cũ)
```

### Đất
```
Dư nợ còn = max(0, 573.611.101 − 3.240.741 × số tháng từ 10/07/2026)
Còn về tay = Giá bán tương lai − Hoa hồng sale − Dư nợ còn
```

---

## 5. Dữ liệu trong `S` (shape chính)

```js
S.jobs       // [ten, agency, tong, chiPhi, daThu, ngayISO, account]
S.bluescope  // [{name, date, type, time, photo, video, recap, dung, discount, ctvCosts, brief?…}]
S.budgets    // [{id, label, amount, paid, paidDate}]
S.rate.rows  // 4 dòng cố định rate card
S.pros       // dự án production + prod[]
S.crew       // danh bạ freelancer
S.debts      // nợ thẻ
S.jobAgencies / S.jobAccounts / S.jobAgencyHidden
```

---

## 6. Deploy ra sao?

Bản dashboard là **static site**: chỉ cần host file `dashboard-v2.html` (và nếu muốn, cả thư mục backup/md — không bắt buộc).

### 6.1. Hiểu trước khi deploy

| | Local | Online |
|---|---|---|
| Code | `dashboard-v2.html` | Cùng file |
| Data | `localStorage` máy bạn | `localStorage` **từng trình duyệt / từng máy** |
| Đồng bộ | Không | **Không** tự đồng bộ giữa máy |

Deploy online = mọi người mở được **giao diện**.  
Số liệu đã nhập **không** tự lên server — mỗi máy/browser một kho riêng.

**Cách làm việc an toàn khi online:**
1. Trên máy có data: `exportJSON()` → giữ file backup.
2. Máy/web mới: `importJSON()` nạp file đó.
3. Định kỳ export sau khi nhập lớn.

### 6.2. Cách A — Netlify Drop (nhanh nhất, ~1 phút)

1. Vào [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Kéo **cả folder** `MONEY_2026` hoặc chỉ file `dashboard-v2.html` vào.
3. Netlify trả URL dạng `https://random-name.netlify.app`
4. Mở: `https://…netlify.app/dashboard-v2.html#/tong-quan`

Tuỳ chọn: đổi tên site trong Site settings.

### 6.3. Cách B — Vercel (static)

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
npx vercel
```

- Framework: **Other**
- Output: thư mục hiện tại
- URL ví dụ: `https://money-2026.vercel.app/dashboard-v2.html#/tong-quan`

Hoặc kéo folder lên [vercel.com/new](https://vercel.com/new).

### 6.4. Cách C — GitHub Pages

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
git init
git add dashboard-v2.html HUONG_DAN_DASHBOARD.md
git commit -m "MONEY 2026 dashboard"
# tạo repo trên GitHub rồi:
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

Settings repo → **Pages** → Source: branch `main` / root.  
URL: `https://<USER>.github.io/<REPO>/dashboard-v2.html#/tong-quan`

### 6.5. Cách D — Cloudflare Pages / bất kỳ static host

Upload `dashboard-v2.html` (hoặc cả folder).  
Không cần Node, không cần build command.

### 6.6. Cách E — Server riêng (nginx / cPanel)

Chỉ cần serve file tĩnh:

```nginx
server {
  listen 80;
  server_name money.example.com;
  root /var/www/money2026;
  index dashboard-v2.html;
  location / {
    try_files $uri $uri/ /dashboard-v2.html;
  }
}
```

Copy `dashboard-v2.html` vào `/var/www/money2026/`.

### 6.7. Gợi ý URL gọn

Nếu host chỉ có 1 file, có thể **đổi tên** thành `index.html` để mở thẳng domain:

```bash
cp dashboard-v2.html index.html
# deploy index.html → https://your-site.com/#/tong-quan
```

(Giữ bản `dashboard-v2.html` local để dev.)

### 6.8. HTTPS & bảo mật

- Nên bật HTTPS (Netlify/Vercel/CF đều free).
- App **không có login**. Ai có link đều mở được UI.
- Không đưa số nhạy cảm lên host public nếu không chấp nhận rủi ro; hoặc bảo vệ bằng:
  - Netlify/Cloudflare **password protection** (gói trả phí / Zero Trust)
  - VPN / chỉ deploy nội bộ

### 6.9. Checklist sau deploy

1. Mở URL → 3 tab chạy, Console không lỗi đỏ.
2. `exportJSON` từ local → `importJSON` trên site online → số hiện đúng.
3. Sửa 1 ô → F5 → data còn (cùng browser).
4. Hard refresh sau mỗi lần re-upload code.

---

## 7. Kiểm tra code sau khi sửa

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
node -e "const fs=require('fs');const s=fs.readFileSync('dashboard-v2.html','utf8');const a=s.indexOf('<script>')+8;const b=s.lastIndexOf('</script>');new Function(s.slice(a,b));console.log('JS syntax OK')"
```

---

## 8. File trong folder (liên quan)

| File | Vai trò |
|---|---|
| `dashboard-v2.html` | **App đang dùng** |
| `dashboard-v2.bak-*.html` | Backup mã nguồn |
| `HANDOFF-DASHBOARD.md` | Handoff kỹ thuật chi tiết (cũ + bổ sung) |
| `HUONG_DAN_DASHBOARD.md` | **File này** — dùng nhanh + deploy |
| `BRIEF_CHINH_SUA_WEBSITE_MONEY2026.md` | Brief chỉnh sửa nền |
| `money-app/` | Next/Prisma — **không** phải bản đang edit |
| `MONEY_2026_System.xlsx` | Excel gốc tham chiếu công thức |

---

## 9. Quy tắc khi sửa tiếp

1. Chỉ sửa `dashboard-v2.html` (trừ khi yêu cầu chuyển stack).
2. `exportJSON()` trước migration / đổi shape data.
3. Input tiền: `parseNum()`, không `parseFloat`.
4. Field mới: có default + migrate cho localStorage cũ.
5. Không xoá node `hidden` đang nuôi `calc()`.
6. Hard refresh sau mỗi lần sửa.

---

## 10. Tóm tắt 30 giây

```bash
# Chạy local
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
python3 -m http.server 8931
# → http://127.0.0.1:8931/dashboard-v2.html#/tong-quan

# Deploy nhanh
# Kéo dashboard-v2.html (hoặc cả folder) lên Netlify Drop / Vercel
# → mở URL + importJSON nếu cần data
```

**Data = localStorage trình duyệt.** Deploy code ≠ mang theo số đã nhập. Luôn backup bằng `exportJSON()`.
