# HANDOFF — MONEY 2026 Dashboard

**Cập nhật:** 11/08/2026 — UI Job Agency/Account, Bluescope cột thẳng, Production full width, Be Vietnam Pro  
**Bản đang sử dụng:** `dashboard-v2.html` — HTML/CSS/JS đơn file, ~5.500 dòng  
**Trạng thái:** chạy local tại `http://127.0.0.1:8931`, dữ liệu thật trong `localStorage['money2026_v2']`  
**Hướng dẫn dùng + deploy:** xem `HUONG_DAN_DASHBOARD.md`  
**Ưu tiên phát triển tiếp:** chỉ sửa `dashboard-v2.html` trừ khi có yêu cầu rõ ràng chuyển sang app khác.

---

## 0. TL;DR cho ca tiếp theo

- Người dùng đang chỉnh bản HTML đơn file `dashboard-v2.html`, không phải Next app trong `money-app/`.
- Dữ liệu thật nằm trong `localStorage['money2026_v2']` theo origin. Ưu tiên mở bằng `http://127.0.0.1:8931`, không dùng `file://` khi cần kiểm tra dữ liệu đã nhập.
- **Route hash riêng** (back/forward OK): `#/tong-quan` · `#/bluescope` · `#/production`.
- Job: 2 tab **Job / Linh tinh** (chưa thu) và **✅ Đã thu**; sort theo cột; đã bỏ nút danh bạ Job (Agency vẫn gợi ý qua datalist).
- UI đã dọn chú thích nhỏ (CSS ẩn + gỡ HTML còn sót: đất, nợ, freelancer, quản lý Agency).
- Dashboard Tổng quan V2: 3 card tổng tiền thu về · tiền mặt · công nợ tổng hợp.
- Production V5 + Bluescope dải ngang Rate/NS/KPI + Đất 2 khối — xem mục 3–4.
- Trước khi sửa shape dữ liệu hoặc migration, chạy `exportJSON()` trong Console để sao lưu.

---

## 1. Mở đúng bản đang dùng

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
python3 -m http.server 8931
```

Mở một trong các URL:

- `http://127.0.0.1:8931/dashboard-v2.html#/tong-quan`
- `http://127.0.0.1:8931/dashboard-v2.html#/overview`
- `http://127.0.0.1:8931/dashboard-v2.html#/bluescope`
- `http://127.0.0.1:8931/dashboard-v2.html#/production`

### Cảnh báo dữ liệu quan trọng

- Phải giữ nguyên origin `http://127.0.0.1:8931`. Đổi sang `localhost`, đổi cổng hoặc mở bằng `file://` sẽ tạo kho `localStorage` khác và trông giống như mất dữ liệu.
- Query kiểu `?rev=20260809-...` chỉ dùng phá cache, không làm đổi kho dữ liệu.
- Khi giao diện chưa nhận code mới: dùng hard refresh `Cmd + Shift + R` hoặc đổi `?rev=`.
- Các file `dashboard-v2.bak-*.html` chỉ sao lưu **mã nguồn**, không chứa dữ liệu đã nhập trong trình duyệt.

Sao lưu dữ liệu hiện tại từ Console:

```js
exportJSON()
```

Nạp lại file JSON từ Console:

```js
importJSON()
```

---

## 2. Kiến trúc thực tế

- Không có build step, framework, dependency hay backend.
- Toàn bộ giao diện, style, state và công thức nằm trong `dashboard-v2.html`.
- State chính là object toàn cục `S`.
- Dữ liệu lưu ở `localStorage['money2026_v2']`.
- `calc()` tính lại số liệu và gọi `save()` ở cuối.
- Các hàm `renderXxx()` dựng lại từng bảng hoặc từng khu UI.
- Ngày lưu đầy đủ dạng ISO `yyyy-mm-dd`; giao diện chủ yếu chỉ hiện `dd/mm`.

Workspace có thư mục `money-app/` dùng Next/Prisma/SQLite, nhưng đó là một bản khác và **không đồng bộ** với dashboard HTML. Hiện người dùng đang làm việc với bản HTML/localStorage. Không port hoặc xóa `money-app/` nếu chưa có yêu cầu riêng.

Workspace hiện không phải Git repository. Nếu cần lịch sử thay đổi đáng tin cậy, nên khởi tạo Git trước vòng phát triển tiếp theo.

---

## 3. Trạng thái giao diện hiện tại

### Header

- Ba tab: `Tổng quan`, `Bluescope`, `Production`.
- Ba nút bên phải:
  - `Tất toán đất` mở popup **Đất Chánh Mỹ**.
  - `Freelancer` mở danh bạ dùng chung.
  - `Nợ thẻ` mở popup công nợ.
- Các popup được chuyển xuống `document.body` để mở được từ mọi tab.

### Tổng quan / Job linh tinh

- Dashboard Tổng quan cũ đã bỏ khỏi giao diện; các node và input cũ vẫn giữ ẩn để không làm mất dữ liệu/công thức cũ.
- Màn hiện tại tập trung vào bảng `Job / Linh tinh`.
- Hai chế độ nằm cùng hàng: `Job / Linh tinh` và `Đã thu`.
- KPI cùng hàng: số job, tổng giá trị, đã thu, còn phải thu.
- Có dòng nhập nhanh luôn nằm trên đầu.
- Cột hiện tại: tên job, Agency/người, ngày thanh toán, ngày còn lại, tổng, trạng thái đã thu, còn phải thu.
- Job đã thu không còn tính/hiện số ngày còn lại.
- Danh sách Agency/người có nút `🗑 Quản lý`:
  - sửa tên sẽ cập nhật các Job đang dùng tên đó;
  - xóa chỉ ẩn khỏi gợi ý, không xóa Job cũ và không xóa freelancer;
  - có thể khôi phục tên đã ẩn.
- Bảng có sort theo tiêu đề cột.

### Bluescope

Booking sự kiện đã được cập nhật theo brief UX/UI mới nhất. Phần đầu là **một dải dashboard ngang duy nhất** theo thứ tự:

1. `Rate card` — luôn hiện, bốn mức giá nằm thành bốn ô trên một hàng.
2. `Các phần ngân sách` — luôn hiện; nhiều khoản ngân sách xếp ngang trong cùng khu.
3. Năm KPI nhỏ: số sự kiện, tổng ngân sách, đã trả, tổng booking, ngân sách còn lại.

Thanh tìm kiếm/bộ lọc/xóa lọc/CSV đã bỏ khỏi giao diện. Ở desktop, toàn bộ ba nhóm vừa khung trên một hàng; ở màn hình hẹp, dải này cuộn ngang độc lập và không làm tràn toàn trang. KPI ngân sách còn lại vẫn có thanh tiến độ nhỏ, chuyển màu khi gần hoặc vượt ngân sách khả dụng.

Quy tắc ngân sách:

- Mỗi dòng gồm tên khoản, số tiền, trạng thái đã trả và ngày trả.
- Đã bỏ trường `Bên trả`.
- Chỉ ngân sách đã tick `Đã trả` mới được tính là ngân sách khả dụng.
- `Ngân sách còn lại = Tổng ngân sách đã trả − Tổng booking`.

Rate card:

- Có 4 dòng cố định, luôn hiện và nằm ngang thành 4 card gọn.
- Thứ tự dòng là một phần của công thức, không được tự ý đảo:
  - `R(0)` Photo/Retouch
  - `R(1)` Camera Man
  - `R(2)` Edit Video
  - `R(3)` Short Clip

Bảng Booking sự kiện:

- Dòng nhập nhanh nằm trên cùng; booking đã có thông tin tự dồn lên trước dòng trống.
- Cột ngày nằm giữa ô và chỉ hiện `dd/mm`.
- Bảng chính được rút còn 10 cột: `#`, tên sự kiện, ngày, loại, thời gian, hạng mục, tổng, chi phí CTV, còn lại, thao tác.
- `Chụp`, `Quay`, `Recap`, `CP dựng`, `C.khấu` được gom trong ô `Hạng mục`; bấm `Chi tiết` để mở phần nhập liệu tại dòng.
- Có sort hai chiều rồi trả về thứ tự tay tại các cột `Ngày`, `Tổng`, `Còn lại`.
- Chân bảng là hàng tổng sticky cho `CP dựng`, `C.khấu`, `Tổng`, `Chi phí CTV`, `Còn lại`; hàng này luôn tính trên toàn bộ booking.
- Cột thao tác cuối đã được giữ chiều rộng riêng; nút `Lưu` không được tràn ra ngoài bảng.
- `Chi phí CTV` mở popup nhiều dòng theo chiều ngang. Mỗi dòng có freelancer, chi phí, thanh toán và ngày trả.
- Popup luôn có sẵn một dòng trống để nhập thêm; không cần nút `+ Freelancer`.
- `Còn lại` từng booking bằng tổng booking trừ tổng chi phí CTV của booking đó.
- Badge thanh toán trong cột CTV dùng ba trạng thái/màu rõ ràng; số âm ở `Còn lại` hiển thị đỏ.
- Desktop dùng dòng cao 58px và số tiền tabular; dưới 900px mỗi booking đổi thành card dọc, dải Rate card/Ngân sách/KPI cuộn ngang và nút thao tác tối thiểu 44px.

### Production

Dashboard đầu trang đã giảm khoảng 20% và gom trên một hàng:

- Chọn dự án.
- `★ Tiền tôi thu về`.
- `Ngân sách`: tổng phí ký hợp đồng, công ty đã ứng, A Tân.
- `Dashboard`: LN ròng, tổng phải chi, tôi đã tự ứng, còn phải trả CTV.

Dự án:

- Dùng `<select>` thật nên có thể chọn đầy đủ dự án khác.
- Double-click ô chọn để đổi tên dự án hiện tại.
- Nút `+ Dự án` mở form tạo dự án.
- Nút `Xóa dự án` nằm cạnh nhóm đếm khoản thanh toán.
- Luôn giữ ít nhất một dự án.

Bảng Chi phí sản xuất:

- Dòng nhập nhanh luôn nằm đầu bảng.
- Có kéo-thả file `.xlsx` trực tiếp vào bảng để nạp chi phí.
- Nhóm điều khiển cùng hàng gồm:
  - `A Tân & hoá đơn`
  - tổng `Chi phí`, `OT`, `Tổng CP`
  - số khoản, đã thanh toán, chưa thanh toán
  - xóa dự án.
- `Chi phí`, `OT`, `Tổng CP` đều là nút sort. Chu kỳ: giảm dần → tăng dần → bỏ sort/thứ tự tay.
- Các tiêu đề cột cũng sort được.
- Chỉ kéo-thả sắp xếp dòng khi đang xem `Tất cả` và không có sort.
- Filter `Đã TT` / `Chưa TT` lấy cả khoản CTV lẫn khoản Producer.
- Ở chế độ `Tất cả`, Producer vẫn nằm trong dải riêng `Chi phí Producer` dưới bảng.
- Dải Producer xổ xuống tại chỗ, có thêm/sửa/xóa/tick thanh toán và tổng riêng.
- Xóa khoản chi Production có toast `Hoàn tác` trong khoảng 6 giây.
- Freelancer có thể gắn từ danh bạ dùng chung và kèm QR chuyển khoản.

Popup `A Tân & hoá đơn` đang theo đúng flow màu:

1. Chi phí tổng A Tân.
2. Hoá đơn VAT.
3. Phí xuất hoá đơn.
4. A Tân.
5. Chi phí thực tế A Tân.

Nút bánh răng ở khối Ngân sách mở popup cài tỷ lệ: công ty ứng, A Tân, phí xuất hóa đơn, VAT.

### Đất Chánh Mỹ và công nợ

Popup đất còn hai khối gọn:

1. `Thông tin tất toán`: giá bán chốt A Trường, phần lời A Trường, vốn gốc trả lại 25 triệu và tổng số tiền trả lại.
2. `Lợi nhuận khi bán đất`: có ô `Giá bán tương lai` mặc định 1,26 tỷ và cho sửa độc lập; dùng giá mua cố định 950 triệu, hoa hồng sale, dư nợ còn lại và số tiền còn về tay. Hai khoản chi phí vay đã bỏ khỏi giao diện và công thức.

Phần tóm tắt dài trên tiêu đề popup đã bỏ; nút `Tất toán đất` trên header vẫn giữ số tiền về tay dạng rút gọn.

Popup công nợ:

- Có bảng nợ thẻ và dòng lãi vay đất của tháng hiện tại.
- Chỉ tiền lãi vay tháng được đưa vào bảng công nợ; dư nợ gốc đất không thêm như một dòng nợ thẻ.
- Lãi vay tự đổi theo dư nợ giảm dần.

---

## 4. Công thức đang dùng

### Bluescope

```text
CP quay/chụp nửa ngày
= Rate Photo nửa ngày × SL chụp
+ Rate Camera nửa ngày × SL quay

CP quay/chụp cả ngày
= Rate Photo cả ngày × SL chụp
+ Rate Camera cả ngày × SL quay

CP dựng
= nếu Recap > 0:
    Rate Edit Video nửa ngày + Recap × Rate Short Clip nửa ngày
  nếu không:
    số nhập tay ở CP dựng

Tổng booking
= CP quay/chụp + CP dựng − Chiết khấu

Còn lại từng booking
= Tổng booking − Tổng chi phí CTV

Ngân sách còn lại
= Tổng các khoản ngân sách đã tick Đã trả − Tổng booking
```

### Job

```text
Còn phải thu mỗi job = Tổng − Chi phí
Đã thu = cộng Còn phải thu của các job đã tick
Ngày còn lại = Ngày thanh toán − hôm nay
```

Job đã thu trả về trạng thái rỗng cho cột ngày còn lại.

### Production

```text
Tổng một khoản chi = Chi phí + OT
CP sản xuất = tổng cột Chi phí
Tổng OT = tổng cột OT
Tổng phải chi = CP sản xuất + OT
Đã thanh toán = tổng các dòng đã tick
Còn phải trả CTV = Tổng phải chi − Đã thanh toán

Phí xuất hoá đơn = Hợp đồng × feeRate
VAT = Hợp đồng × vatRate
A Tân tự tính = (Hợp đồng − CP sản xuất − OT − Phí xuất HĐ) × atanRate

Chi phí tổng A Tân = VAT + Phí xuất HĐ + A Tân
Chi phí thực tế A Tân = Phí xuất HĐ + A Tân
LN ròng = Hợp đồng − Tổng phải chi − Chi phí thực tế A Tân
Tiền tôi thu về = Tiền tôi đã tự ứng + LN ròng
```

Quy tắc nguồn tiền hiện tại:

- Nếu `Công ty đã ứng > 0`, mọi dòng đã tick thanh toán được xem là dùng tiền công ty.
- Nếu `Công ty đã ứng = 0`, mọi dòng đã tick thanh toán được xem là tiền mình tự ứng.
- Nguồn tiền không gắn riêng theo từng dòng; thay đổi số `Công ty đã ứng` có thể làm cách phân loại toàn bộ dòng đã thanh toán đổi theo.

VAT chỉ dùng trong `Chi phí tổng A Tân`; VAT không bị trừ lần nữa trong `LN ròng`, giữ theo workbook đã đối chiếu.

### Đất Chánh Mỹ

```text
Dư nợ còn = max(0, 573.611.101 − 3.240.741 × số tháng tròn từ 10/07/2026)
Lãi tháng = Dư nợ còn × 10,5% / 12
Chênh lệch giá đất = Giá bán tương lai − 950.000.000
Hoa hồng sale = Giá bán tương lai × tỷ lệ sale
Còn về tay = Giá bán tương lai − Hoa hồng sale − Dư nợ còn

Tỷ lệ lời A Trường = 250.000.000 ÷ 950.000.000 = 26,32%
Lời A Trường
= (Giá bán chốt A Trường − 950.000.000 − hoa hồng sale theo giá chốt)
  × 26,32%
Số tiền trả lại A Trường = Lời A Trường + 25.000.000
```

Tỷ lệ sale mặc định 2%; nhập 0 nếu tự bán.

---

## 5. Dữ liệu chính trong state

```js
S.rate.rows
// [{name, qty, half, full}] — 4 dòng cố định

S.budgets
// [{id, label, amount, paid, paidDate}]

S.bluescope
// [{name, brief, date, type, time, photo, video, recap,
//   dung, discount, note, ctvCosts:[...]}]

S.jobs
// [[ten, agency, tong, chiPhiLegacy, daThu, ngayThanhToanISO]]

S.debts
// [[nganHang, duNo, traThangNay]]

S.crew
// [{id, ten, vitri, sdt, qr}]

S.pros
// [{id, name, contract, feeRate, vatRate, atan, atanRate,
//   advance, advRate, prod:[...]}]

prodRow
// {ten, note, cp, otTien, qr, crewId, flText,
//  loai:'ctv'|'producer', nguon}
```

`rowPaid(r)` coi một dòng là đã thanh toán khi `nguon` có giá trị khác `chua_tra`. Các field cũ như `paid`, `ung`, `ungTien`, `chiho...` vẫn được migrate/đồng bộ để không làm hỏng dữ liệu cũ.

---

## 6. Bản đồ code — tìm theo tên thay vì số dòng

| Khu vực | Hàm / id nên tìm |
|---|---|
| State và migration | `LS_KEY`, `DEFAULT`, `budgetRow`, `bsRow`, `prodRow`, `normalizeProd` |
| Lưu dữ liệu | `save`, `exportJSON`, `importJSON` |
| Rate card | `renderRate`, `quayChup`, `chiPhiDung`, `bs-rate-toggle` |
| Ngân sách Bluescope | `renderBudgets`, `syncBudgetLegacy` |
| Booking Bluescope | `renderBS`, `renderBsQuick`, `openBsCost`, `bsTong`, `bsCostTotal`, `BS_VIEW`, `bindBsControls`, `exportBsCSV` |
| Job | `renderJobs`, `renderJobQuick`, `jobPaymentDaysHTML`, `openJobContactsManager` |
| Production | `proCalc`, `renderProDetail`, `renderProd`, `renderPdStrip`, `saveQuickRow` |
| Danh bạ | `renderCrew`, `syncCrewIntoProd`, `pickCrew` |
| Nạp Excel | `enableProductionExcelDrop`, `handleExcel`, `parseGiaiChi`, `parseCrewList` |
| Đất / vay | `landLoanState`, `renderLandLoanInterest` |
| Tính tổng | `calc` |
| Điều hướng | `ROUTES`, `showTab`, `goTab`, `routeFromHash` |

Quy tắc khi sửa:

- Không gọi render toàn bảng từ mỗi ký tự nhập nếu không cần; re-render sẽ làm mất con trỏ/focus.
- Input tiền phải đọc bằng `parseNum()`, không dùng `parseFloat()`.
- Thêm field mới phải có default và migration cho localStorage cũ.
- Không đổi thứ tự 4 dòng rate card nếu chưa đổi công thức từ index sang role/id.
- Không xóa các node/input `hidden` chỉ vì chưa thấy trên UI; nhiều node đang giữ tương thích với `calc()` và dữ liệu cũ.

---

## 7. Kiểm tra trước khi bàn giao tiếp

Kiểm tra cú pháp JS nhúng:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('dashboard-v2.html','utf8');const a=s.indexOf('<script>')+8;const b=s.lastIndexOf('</script>');new Function(s.slice(a,b));console.log('JS syntax OK')"
```

Smoke test nên chạy trên đúng origin đang có dữ liệu:

1. Refresh từng route và kiểm tra không lỗi Console.
2. Sửa một giá trị nhỏ, refresh lại và xác nhận localStorage giữ dữ liệu.
3. Bluescope: tick/bỏ tick ngân sách và kiểm tra `Ngân sách còn lại`.
4. Bluescope: nhập nhiều CTV, kiểm tra tổng header và cột `Còn lại`.
5. Bluescope: kiểm tra Rate card + Ngân sách + 5 KPI cùng một hàng, sort hai chiều và mở `Hạng mục`.
6. Bluescope: kiểm tra desktop 1600px và mobile dưới 900px, không có tràn ngang ngoài ý muốn.
7. Production: đổi dự án, sort ba trạng thái, filter đã/chưa thanh toán.
8. Production: kiểm tra Producer xuất hiện trong filter đã/chưa thanh toán.
9. Production: mở popup A Tân và đối chiếu đủ 5 bước tính.
10. Job: job đã thu phải không hiện số ngày còn lại.
11. Đất: thay giá bán/tỷ lệ sale và kiểm tra nhận về tay; kiểm tra lãi tháng ở popup Nợ.
12. Export JSON trước mọi thay đổi cấu trúc lớn.

---

## 8. Rủi ro và việc nên làm tiếp

- Dữ liệu hiện chỉ có một bản trong trình duyệt, không có database/backend thật và không có đồng bộ nhiều máy.
- File HTML đã gần 5.000 dòng; thay đổi chéo giữa CSS/render/calc dễ tạo regression.
- Chưa có test tự động. Hiện chỉ có kiểm tra cú pháp và smoke test bằng trình duyệt.
- Xóa dòng Production có Undo; xóa Job, Booking hoặc dòng ngân sách chưa có Undo đồng nhất.
- Đổi tên dự án bằng double-click trên select khá khó nhận biết; có thể thay bằng menu hoặc modal quản lý dự án sau.
- Bảng rộng dùng horizontal scroll ở màn hẹp; không nên ép font nhỏ hơn để nhét mọi cột.
- Nên khởi tạo Git và tạo commit ổn định trước khi tiếp tục vòng chỉnh UX lớn.

Nguồn tham khảo tài chính hiện có:

- `MONEY_2026_System.xlsx` trong workspace.
- `/Users/macbook/Downloads/gop von.xlsx` là file người dùng đã cung cấp để đối chiếu phần đất.
- `BRIEF_CHINH_SUA_WEBSITE_MONEY2026.md` là brief nền; tài liệu này mới hơn và phản ánh code hiện tại.

---

## 9. Điểm bắt đầu cho người nhận tiếp

1. Mở `HANDOFF-DASHBOARD.md` này.
2. Mở `dashboard-v2.html`; tìm đúng hàm theo bảng ở mục 6.
3. Export JSON từ origin `127.0.0.1:8931` trước khi sửa migration hoặc data shape.
4. Không tiếp tục dựa trên `money-app/` nếu người dùng chưa yêu cầu chuyển nền tảng.
5. Sau khi sửa: chạy syntax check, mở browser, kiểm tra đúng route và hard refresh.

---

## 10. Production V5 — cập nhật 09/08/2026

Đã triển khai theo `yeu-cau-chinh-sua-ui-production.md`:

- Giới hạn nội dung Production ở `1360px`, căn giữa; dashboard đầu trang chia hai cột trên desktop và xếp dọc trên mobile.
- Bốn khối `Dự án`, `Tiền tôi thu về`, `Ngân sách`, `Dashboard` giữ nguyên công thức và dữ liệu, chỉ thu gọn bố cục.
- Bảng chi phí rút còn 7 cột: `#`, `Freelancer`, `Hạng mục`, `Chi phí`, `OT`, `Trạng thái / Còn trả`, `QR`.
- `Đã TT` và `Còn trả` đã gộp thành một nút trạng thái: chưa trả hiện số tiền; đã trả hiện màu xanh và `Đã trả`.
- Thêm tìm kiếm freelancer bằng `PROD_SEARCH`; không ghi vào localStorage và có nút xoá nhanh.
- Thêm footer tổng `Chi phí`, `OT`, `Còn trả`; số tổng lấy từ `proCalc()` nên gồm cả khoản Producer.
- Dải `Chi phí Producer` vẫn giữ màu vàng, mở rộng tại chỗ; bảng con cũng dùng trạng thái thanh toán gộp.
- Ở màn hình dưới `760px`, mỗi khoản chi hiển thị dạng card hai cột, các trường chính chiếm toàn hàng; không còn phụ thuộc cuộn ngang của bảng chính.

Điểm code mới nên tìm:

- CSS: `PRODUCTION V5 — gọn, tập trung, dễ đọc`
- Search: `PROD_SEARCH`, `pro-search`, `pro-search-clear`
- Trạng thái gộp: `.pro-pay-status`
- Tổng bảng: `pro-foot-cost`, `pro-foot-ot`, `pro-foot-due`

Đã xác minh:

- JavaScript nhúng: `Syntax OK`.
- Localhost: `http://127.0.0.1:8931/dashboard-v2.html?rev=20260809-production-v5#/production`.
- Console không có lỗi.
- Dữ liệu dự án kiểm thử: footer khớp `42.400.000 ₫` chi phí, `0 ₫` OT, `42.400.000 ₫` còn trả.
- Tìm kiếm và nút xoá tìm kiếm hoạt động; bộ lọc/count hiện có vẫn giữ nguyên.

---

## 11. Dashboard Tổng quan V2 — cập nhật 10/08/2026

Đã triển khai theo `yeu-cau-dashboard-tong-quan.md`:

- Thêm dashboard nổi bật ngay phía trên bảng `Job / Linh tinh`, gồm 3 card: `Tổng tiền thu về`, `Tiền mặt hiện có`, `Công nợ tổng hợp`.
- `Tổng tiền thu về` dùng công thức:
  - tổng `★ Tiền tôi thu về` của các dự án Production;
  - `Tổng booking` Bluescope;
  - `Ngân sách còn lại` Bluescope chỉ cộng khi dương;
  - tổng Job đã thu.
- Ô `Tiền mặt hiện có` tiếp tục dùng input cũ `v_h3`, nên giữ nguyên dữ liệu localStorage và vẫn nhập tay trực tiếp.
- Chênh lệch sổ sách hiển thị theo hai chiều: sổ sách cao hơn tiền mặt hoặc tiền mặt cao hơn sổ sách.
- Bảng công nợ gồm: Job còn phải thu, Production còn phải trả CTV, ngân sách Bluescope âm/dương và nợ thẻ từ header.
- Công thức `Tổng còn nợ ròng`:
  `Nợ thẻ + Còn trả CTV − Còn thu Job − Ngân sách còn lại Bluescope`.
  Vì vậy ngân sách dương làm giảm nợ; ngân sách âm tự động làm tăng nghĩa vụ.
- Badge trạng thái: giá trị ròng `≤ 0` hiện `✅ Hết nợ`; giá trị `> 0` hiện `⚠ Còn nợ`.
- Bố cục 3 cột trên desktop, 2 cột ở tablet và 1 cột trên mobile.

Điểm code mới nên tìm:

- CSS: `OVERVIEW V2 — Tổng tiền, tiền mặt, công nợ`
- HTML: `.ov-dashboard`, `ov-total-income`, `ov-debt-status`, `ov-net-debt`
- Công thức: `bsLeftPositive`, `totalIncome`, `netDebt`, `cashDiff` trong `calc()`

Đã xác minh trên localhost:

- URL: `http://127.0.0.1:8931/dashboard-v2.html?rev=20260810-overview-v2#/overview`.
- JavaScript nhúng hợp lệ; Console không có lỗi.
- Dữ liệu lúc kiểm thử: tổng thu về `96.793.600 ₫`, công nợ ròng `222.407.741 ₫`.
- Responsive đã kiểm tra ở viewport `390 × 844`; ba card xếp dọc, không tràn ngang.
