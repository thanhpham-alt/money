# BRIEF CHỈNH SỬA WEBSITE MONEY 2026

**Ngày cập nhật:** 09/08/2026  
**Bản tiếp tục:** `dashboard-v2.html`  
**Nguồn đối chiếu tài chính:** `gop von.xlsx`, sheet `Tài Chính`  
**Phạm vi:** Tổng quan · Tất toán đất · Bluescope · Production

## 1. Trạng thái Claude đã làm trước

Các phần sau đã có trong `dashboard-v2.html` trước đợt sửa này:

- 3 tab Tổng quan, Bluescope, Production và định tuyến bằng hash.
- Dải KPI Dashboard tổng hợp Job, Bluescope, Production và Nợ.
- Bảng Job/Linh tinh có tab chưa thu/đã thu, ngày và dòng nhập nhanh.
- Bluescope có ngân sách, booking, rate card, ngày nhập nhanh và popup chi phí CTV.
- Production có danh bạ freelancer, tick thanh toán, QR và chi phí Producer.

Các điểm chưa khớp brief cũ đã được xử lý trong đợt sửa này: mô hình đất cũ còn quá nhiều trường, KPI Bluescope/Production chưa đúng nội dung cần tổng hợp, CP quay chụp từng hiện trong bảng và dòng ngày thêm mới chưa đồng nhất.

## 2. Đã chỉnh trong đợt này

### 2.1 Tất toán đất

Popup được đặt tên **Đất Chánh Mỹ**. Đã rút gọn block đất theo tình trạng mới: đã chốt tất toán với Anh Trường ở mức `1.260.000.000 ₫`; toàn bộ khoản vay hiện tại thuộc trách nhiệm của Thành và được trả dần.

Giữ ba nhóm thông tin:

- Giá chốt tất toán và tổng khoản vay hiện tại.
- Chi phí vay đợt 1 và đợt 2 — hai khoản này là phần vốn Thành đã bỏ ra.
- Lợi nhuận bán đất theo giá bán tương lai trừ giá mua `950.000.000 ₫`.
- `Nhận về tay` theo tổng bán, hoa hồng sale và dư nợ còn lại.

Đã bỏ khỏi giao diện:

- Bán sau bao nhiêu tháng nữa.
- Góp vốn Anh Trường / Thành, tổng góp vốn và tỷ lệ Trường / Thành.
- Nợ ngân hàng Anh Trường và mô hình chia lợi nhuận theo tỷ lệ cũ.
- Khối đóng lãi lũy kế và các chỉ số trung gian không còn cần cho lần tất toán này.
- Bỏ ba khối chú thích dài trong popup đất (nghĩa vụ khoản vay, giải thích hai chi phí vay và dòng phép tính); chỉ giữ ô nhập và kết quả.

Các công thức chính:

`Lợi nhuận bán đất = Giá bán đất tương lai − 950.000.000 ₫`

`Nhận về tay = Tổng bán − Hoa hồng sale − Khoản vay còn`

Hoa hồng mặc định `2%`, có thể nhập `0%` khi tự bán. Khoản vay đồng bộ trong popup Nợ theo lịch trả gốc cố định `3.240.741 ₫/tháng` từ dư nợ tháng gốc `573.611.101 ₫` (10/07/2026); lãi từng tháng tính trên dư nợ đầu kỳ với lãi suất `10,5%/năm` nên giảm dần theo gốc.

### 2.2 Dữ liệu cũ

- Các trường cũ không còn hiển thị hoặc tham gia công thức.
- Dữ liệu đã nhập trước đây vẫn được giữ trong localStorage để tránh mất lịch sử.
- Giá chốt được migration một lần về `1.260.000.000 ₫`; sau đó người dùng vẫn có thể sửa trực tiếp.
- Popup tất toán có ba khối: `Thông tin tất toán` (Số tiền chốt Anh Trường, dư nợ hiện tại tự tính, Chi phí vay đợt 1/2); `Lợi nhuận khi bán đất` (giá bán tương lai nhập được, giá mua cố định `950.000.000 ₫`, chênh lệch và lợi nhuận tự tính); và `Nhận về tay` (tổng bán − hoa hồng sale − khoản vay còn). `Thông tin vay` chỉ dẫn đến dòng lãi vay tháng tự tính trong bảng Công nợ; không hiển thị riêng khoản vay đất hoặc lịch gốc/lãi. Bỏ dòng `Giá trị sau trừ khoản vay`.

### 2.3 Dashboard / Tổng quan

- Bỏ toàn bộ dashboard Tổng quan cũ (dải KPI, khối Vốn và Khoản khác) để thiết kế lại theo brief mới. Giữ dữ liệu và công thức nội bộ, đồng thời giữ riêng bảng Job / Linh tinh để tiếp tục nhập liệu.
- Giữ hai nút Job/Linh tinh và Đã thu trên cùng một dải với bốn KPI Job (Số job, Tổng giá trị, Đã thu, Còn phải thu); bảng nằm ngay bên dưới.
- Bỏ các dòng tổng “Còn phải thu” lặp lại ở bảng Job, bao gồm số tóm tắt cạnh hai tab.
- Dàn lại bảng Job theo reference: thứ tự `Tên Job → Agency / Người → Ngày tạo`, ngày hiển thị gọn `dd/mm` nhưng vẫn lưu đủ năm, Agency và trạng thái thu hiển thị dạng chip màu.
- Bỏ cột `Chi phí` khỏi bảng Job; dữ liệu chi phí cũ vẫn giữ nội bộ để các tổng tiền lịch sử không đổi. Đổi `Ngày tạo` thành `Ngày thanh toán` và thêm `Ngày còn lại` = ngày thanh toán trừ ngày hiện tại; hiển thị rõ Còn/Hôm nay/Quá hạn và có thể sort theo từng cột.
- Job đã đánh dấu `Đã thu` không hiển thị hoặc tính `Ngày còn lại`.
- Trong ô `Agency / Người`, thêm nút `✎` mở danh sách quản lý: có thể thêm Agency, sửa tên hoặc ẩn/xoá gợi ý Agency; có thể sửa hoặc xoá người trong danh bạ. Xoá Agency không làm mất dữ liệu Job cũ; xoá freelancer giữ lại tên ở các dòng Production đã liên kết.
- KPI gom gồm:
  - Job chưa thu.
  - Bluescope: ngân sách còn lại, ngân sách, đã dùng và số CTV Bluescope đã thanh toán.
  - Production: tổng chi phí sản xuất.
  - Nợ phải trả.
- Khoản CTV đã thanh toán chỉ được tính trong Bluescope; Production không cộng lại khoản này.

### 2.4 Bluescope

- Tách khu nhập ngân sách khỏi dashboard số liệu. Mỗi khoản ngân sách là một ô gọn trên cùng dải ngang, gồm `Tên khoản / Số tiền / Đã trả / Ngày trả`; có nút thêm hoặc xoá khoản và tự cộng tổng. Khi không đủ chiều ngang, các ô tự xuống dòng. Trường `Bên trả` đã bỏ khỏi giao diện nhưng dữ liệu cũ vẫn được giữ nội bộ.
- Dải đầu Bluescope gom đúng một hàng theo thứ tự: nút nhảy đến Rate card nhân sự, Các phần ngân sách, Số sự kiện, Tổng ngân sách, Đã trả, Tổng booking và Ngân sách còn lại. Rate card vẫn hiển thị trực tiếp bên dưới, không dùng popup.
- Rate card được đưa ra thành bảng hiển thị trực tiếp trên trang, không còn nút hoặc popup; các đơn giá vẫn sửa được ngay và tiếp tục dùng cho công thức booking.
- Căn giữa tiêu đề và toàn bộ ô Ngày trong bảng Booking Bluescope để dễ theo dõi theo cột.
- Thêm cột `Còn lại` trong Booking Bluescope, tự tính theo `Tổng booking − Tổng chi phí CTV` và cập nhật theo từng dòng khi chỉnh chi phí.
- Booking đã có dữ liệu thực tế tự động được đưa lên đầu bảng; dòng chỉ có tên hoặc chưa nhập thông tin vẫn nằm cuối, giữ nguyên thứ tự trong từng nhóm.
- Mỗi dòng ngân sách có checkbox `Đã trả`, mặc định bỏ chọn. Khoản chưa tick không được tính vào ngân sách khả dụng; khoản đã tick được cộng ngay vào công thức còn lại.
- Ngân sách còn lại = Tổng ngân sách − Tổng booking.
- Ẩn cột `CP quay chụp`; giữ cột `CP dựng` để nhập tay khi không có Recap. Khi có Recap, `CP dựng` tự tính từ rate card (`Edit video + Recap × Short clip`).
- Khi tạo booking bằng dòng nhanh hoặc nút thêm dòng, Ngày tự điền ngày hiện tại.
- Cột Chi phí mở popup dạng bảng ngang, cho phép thêm nhiều freelancer trên cùng một sự kiện.
- Thu gọn các cột Ngày, Chi phí CTV và các ô số của bảng Booking; khôi phục nền/viền rõ cho toàn bộ trường ở dòng nạp booking.
- Mỗi freelancer có riêng: Tên liên kết danh bạ, Chi phí, trạng thái Thanh toán và Ngày trả.
- Popup tự cộng Tổng chi phí, Đã thanh toán và Còn phải trả; dữ liệu một-freelancer cũ được tự chuyển sang dòng đầu tiên.
- Bỏ nút `+ Thêm freelancer` trong popup. Luôn có một dòng trống để nhập trực tiếp; sau khi điền, hệ thống tự tạo dòng trống kế tiếp.
- Không hiển thị trường Thanh toán trùng ở ngoài bảng.

### 2.5 Production

- KPI trên Dashboard đã hiển thị Tổng chi phí sản xuất thay vì “Production thu về”.
- Sửa lỗi hiển thị trạng thái thanh toán sau khi sửa tiền: dùng cùng một hàm trạng thái `rowPaid()`.
- Cơ chế freelancer, thanh toán và QR hiện có của Production được giữ nguyên; không đưa khoản thanh toán Bluescope vào Production.
- Khôi phục thao tác kéo-thả file `.xlsx` trực tiếp vào bảng Chi phí sản xuất. Khi thả, hệ thống mở màn xem trước trước khi nạp chi phí/danh bạ; không đưa lại nút Excel lớn vào giao diện.
- Count Production tách thành ba ô `Tổng khoản / Đã TT / Chưa TT`; tổng khoản vẫn tính cả chi phí Producer ở dải riêng, bấm từng ô để lọc nhanh. Tất cả cột của bảng CTV đều có sort tăng/giảm và các ô nhập được làm rõ bằng nền, viền.
- Đưa ba ô theo thời gian thực `Chi phí`, `OT` và `Tổng chi phí` (= Chi phí + OT) về cạnh cụm count đầu bảng Production, không lặp lại trong Dashboard. Tất cả chip/nút ở hàng này (`A Tân & hoá đơn`, chi phí, count) dùng cùng chiều cao, bo góc, khoảng cách và tỷ lệ chữ gọn.
- Ba chip `Chi phí / OT / Tổng CP` ở đầu bảng Production có thể bấm để sắp xếp giảm/tăng theo từng giá trị; tiêu đề cột tương ứng tiếp tục hỗ trợ sort. Dải dashboard trên cùng được thu gọn khoảng 20% về padding, cỡ chữ và chiều cao ô.
- Đưa hai khối `Thông số` và `Tổng kết` lên chung dashboard phía trên bảng chi phí sản xuất; bảng CTV dùng toàn bộ chiều rộng phía dưới.
- Bỏ hoàn toàn khối hiển thị `📦 Thông tin chi phí`; các số tổng chi phí vẫn được giữ nội bộ cho công thức lợi nhuận.
- Dashboard Production đổi thành ba khối: `Tiền tôi thu về / Ngân sách / Dashboard`; khối Ngân sách giữ `Tổng phí ký hợp đồng / Công ty đã ứng / A Tân`, còn khối Dashboard gom bốn số `LN ròng / Tổng phải chi / Tôi đã tự ứng / Còn phải trả CTV`.
- Gom quản lý dự án vào cùng hàng dashboard, theo thứ tự `Dự án / Tiền tôi thu về / Ngân sách / Dashboard`; bỏ sidebar trái để bảng chi phí dùng toàn bộ chiều rộng. Khối Dự án vẫn giữ đủ chọn dự án, tạo mới, đổi tên, xóa và mở danh bạ freelancer.
- Ô chọn Dự án cho phép gõ đổi tên trực tiếp hoặc chọn dự án khác từ danh sách; bỏ nút bút chì và dấu X trong thẻ. Danh bạ freelancer chuyển lên header cạnh Tất toán đất; nút Xoá dự án đặt cạnh cụm Chưa TT ở đầu bảng Chi phí sản xuất.
- Khối `Ngân sách` dàn ba ô `Tổng phí ký hợp đồng / Công ty đã ứng / A Tân` rõ ràng trên cùng hàng. Các tỷ lệ `Công ty ứng / A Tân / Phí HĐ / VAT` được chuyển vào popup mở bằng nút bánh răng của khối này. Popup dưới bảng chỉ còn thông tin hoá đơn/tổng hợp.
- Bỏ ô Lợi nhuận ròng riêng. Phần `A Tân & hoá đơn` là popup tổng hợp hoá đơn mở từ đầu bảng Chi phí sản xuất.
- Nút `A Tân & hoá đơn` được đặt cạnh cụm `Tổng khoản / Đã TT / Chưa TT` ở đầu bảng Chi phí sản xuất; bỏ dải thông tin lớn dưới bảng để tiết kiệm diện tích. Popup chỉ hiển thị phần tổng hợp hoá đơn, không còn phần cấu hình.

## 3. Tiêu chí nghiệm thu

- Mở `dashboard-v2.html` qua HTTP server để dữ liệu localStorage hoạt động.
- Nhập mới Job: ngày mặc định là ngày hiện tại.
- Nhập mới booking Bluescope: ngày mặc định là ngày hiện tại.
- Sửa Ngân sách/Ngày trả và tải lại trang: dữ liệu vẫn còn.
- Mở Chi phí CTV: nhập freelancer, chi phí, tick thanh toán; Dashboard cập nhật số CTV Bluescope đã trả.
- Đổi Giá chốt, Tổng khoản vay hoặc một trong hai Chi phí vay và kiểm tra `Nhận về tay còn lại` cập nhật ngay.
- Với bộ số hiện tại, `Nhận về tay còn lại` phải bằng `718.388.899 ₫`.
- Không còn thấy các trường góp vốn Trường/Thành, tỷ lệ góp vốn, nợ ngân hàng Anh Trường hoặc bán sau bao nhiêu tháng.

## 4. Việc còn có thể chốt thêm

1. Nếu cần theo dõi kế hoạch trả dần khoản vay, có thể bổ sung lịch trả gốc/lãi ở một màn riêng, không đưa lại vào popup tất toán.
2. Nếu cần thay đổi tên freelancer trong Bluescope bằng popup chọn người thay vì datalist, dùng chung modal danh bạ Production.
