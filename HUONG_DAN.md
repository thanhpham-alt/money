# MONEY 2026 — Hệ thống tài chính + Job Agency

## File đã build

| File | Vai trò |
|------|---------|
| `MONEY_2026_System.xlsx` | **File chính** — upload lên Google Sheets / dán vào MONEY 2026 |
| `build_money_2026.py` | Script rebuild nếu cần chỉnh cấu trúc |

## Link liên quan

| Tên | Link | Ghi chú |
|-----|------|---------|
| **Dashboard / MONEY 2026** (file hiện tại) | https://docs.google.com/spreadsheets/d/12dpkDrLw1Cban2KNyNiHJ6vfqun_Las8Qa_ZI1cA3Js/edit | File Google đích |
| **Booking Bluescope** (file **riêng**) | https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit | Không gộp vào Money |

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│  01_DASHBOARD  (Dashboard chính)                        │
│   • Tiền / Nợ MOM / Nợ Trí / Tín dụng / Thực có         │
│   • TỔNG CÔNG NỢ  ←  03_CONG_NO                         │
│   • P&L jobs      ←  02_JOB_AGENCY                      │
└────────────▲──────────────────────────▲─────────────────┘
             │                          │
     ┌───────┴────────┐         ┌───────┴────────┐
     │ 03_CONG_NO     │         │ 02_JOB_AGENCY  │
     │ (còn phải thu) │◄────────│ registry jobs  │
     └────────────────┘         └───────▲────────┘
                                        │ INDIRECT(sheet!I4…)
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────┴─────┐      ┌──────┴──────┐    ┌───────┴────────┐
              │  JOB_LG   │      │JOB_BLUESCOPE│    │ _TEMPLATE_JOB  │
              │ (mẫu LG)  │      │ tóm tắt +   │    │ copy → JOB_XXX │
              │           │      │ link ngoài  │    │                │
              └───────────┘      └──────┬──────┘    └────────────────┘
                                        │ IMPORTRANGE (Google Sheets)
                                        ▼
                         ┌──────────────────────────────┐
                         │ BLUESCOPE BOOKING (file riêng)│
                         │ Rate card · Event · Content   │
                         └──────────────────────────────┘
```

---

## Các sheet trong file

1. **00_HUONG_DAN** — hướng dẫn ngắn trong sheet  
2. **01_DASHBOARD** — Dashboard chính  
3. **02_JOB_AGENCY** — sổ cái mọi job (Agency + Job + link sheet)  
4. **03_CONG_NO** — công nợ KH (đồng bộ từ Agency + dòng nhập tay)  
5. **04_NO_CA_NHAN** — nợ MOM + a Trí + lịch trả  
6. **05_TIN_DUNG** — dư nợ thẻ theo tháng  
7. **JOB_LG** — ví dụ job kiểu LG (đã seed ~63tr HĐ)  
8. **JOB_BLUESCOPE** — tóm tắt Bluescope + hyperlink file booking  
9. **_TEMPLATE_JOB** — mẫu copy khi thêm job mới  
10. **99_CAU_HINH** — % phí HĐ, % A Tân, tiền hiện có, link Bluescope  

**Màu ô**

- **Vàng** = nhập tay  
- **Xanh dương nhạt** = công thức (đừng sửa)  
- **Tím** = link / file ngoài  

---

## Cách dùng hàng ngày

### 1. Cập nhật tiền / nợ cá nhân

- `99_CAU_HINH` → **Tien_Hien_Co**  
- `04_NO_CA_NHAN` → số tháng đã trả MOM (F4), đã trả a Trí  
- `05_TIN_DUNG` → số đã trả từng thẻ / tháng  

→ Dashboard tự tính **Tổng nợ** và **Thực có**.

### 2. Theo dõi công nợ (liên kết Dashboard)

- Mọi job trong **02_JOB_AGENCY** chảy sang **03_CONG_NO**  
- Dashboard ô **TỔNG CÒN PHẢI THU** = tổng cột Còn lại  

### 3. Thêm job mới (giống LG)

1. Chuột phải tab **`_TEMPLATE_JOB`** → **Duplicate**  
2. Đổi tên tab: `JOB_SUNGROUP` (không dấu, không khoảng trắng)  
3. Điền Agency, Tên job, Tổng HĐ, chi phí (ô vàng)  
4. Vào **02_JOB_AGENCY** thêm dòng: Agency | Tên job | **Tên sheet** = `JOB_SUNGROUP`  
5. Các cột Tổng HĐ / Đã thu / Còn lại / Chi phí / LN **tự kéo** từ sheet job  

### 4. Bluescope — luôn là đường link riêng

- Mở booking: link trong Dashboard hoặc `JOB_BLUESCOPE`  
- Trên **Google Sheets**, để live-sync ngân sách / đã xài, dán (Allow access 1 lần):

```text
=IMPORTRANGE("https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit";"BLUESCOPE_2025!L2")
=IMPORTRANGE("https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit";"BLUESCOPE_2025!N2")
=IMPORTRANGE("https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit";"BLUESCOPE_2025!O2")
```

Vào các ô tương ứng ở sheet **JOB_BLUESCOPE** (C9 / C11 / …).  
Excel local: giữ số seed (100tr ngân sách, 44tr đã xài) — sửa tay khi cần.

---

## Upload lên Google Sheets

1. Mở Drive → upload `MONEY_2026_System.xlsx`  
2. Mở file → **File → Save as Google Sheets** (hoặc Open with Sheets)  
3. Tuỳ chọn: copy toàn bộ sheet sang file MONEY 2026 hiện có  
   https://docs.google.com/spreadsheets/d/12dpkDrLw1Cban2KNyNiHJ6vfqun_Las8Qa_ZI1cA3Js/edit  
4. Bật **IMPORTRANGE** cho Bluescope (Allow access)  
5. Kiểm tra Dashboard: công nợ + job LG + Bluescope hiện số  

> **Lưu ý:** `INDIRECT` giữa các sheet trong **cùng** file Money hoạt động trên Sheets.  
> File Bluescope **không** nằm trong workbook — chỉ qua IMPORTRANGE / hyperlink.

---

## Seed dữ liệu mẫu (đã có sẵn)

| Agency / Job | Ghi chú |
|--------------|---------|
| LG / LG Production | Sheet `JOB_LG`, HĐ 63.104.000 |
| Bluescope / Booking | Sheet `JOB_BLUESCOPE` + link file riêng |
| Bizeyes (Rivus, Masteris, Elyse), 2 Mic, a Trí, Sky, Sun Group, pbcm | Có trên Agency, **chưa gắn sheet** — nhập tay hoặc tạo `JOB_*` |

---

## Rebuild

```bash
cd "/Users/macbook/Documents/MAC MEDIA/MONEY_2026"
python3 build_money_2026.py
```
