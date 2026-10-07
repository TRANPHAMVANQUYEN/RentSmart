# PROMPT: Thiết kế Frontend website hỗ trợ thuê phòng trọ tại TP.HCM (RentSmart)

## 1. Vai trò của bạn

Bạn là một **Senior Frontend Developer + UI/UX Designer**. Hãy thiết kế và viết code **toàn bộ giao diện frontend** (chưa cần backend) cho website hỗ trợ thuê phòng trọ tên **RentSmart**, có bố cục và luồng sử dụng tương tự các trang cho thuê phòng trọ phổ biến tại Việt Nam, nhưng **chỉ phục vụ khu vực TP. Hồ Chí Minh**.

Kết quả phải chạy được ngay bằng cách mở file `index.html` (hoặc dùng Live Server), không cần cài đặt hay build.

---

## 2. Phạm vi và mục tiêu

- Website chỉ hiển thị, tìm kiếm, đăng tin cho phòng trọ / căn hộ / nhà nguyên căn / ở ghép **trong TP.HCM**.
- Có 3 loại người dùng: **Khách (chưa đăng nhập)**, **Người thuê**, **Chủ nhà / Môi giới**, và **Quản trị viên (Admin)**.
- Có **nút AI nổi** (floating chatbot) xuất hiện ở mọi trang người dùng.
- Có **khu vực quản trị Admin đầy đủ tính năng**.
- Toàn bộ dữ liệu là **dữ liệu giả (mock data)** lưu trong file JS, thao tác thêm/sửa/xóa lưu bằng `localStorage` để demo được luồng thật.

---

## 3. Công nghệ yêu cầu

- **HTML5 + CSS3 + JavaScript thuần (ES6+)**, có thể dùng **Bootstrap 5** (CDN) cho lưới và component.
- Biểu tượng: **Bootstrap Icons** hoặc **Font Awesome** (CDN).
- Biểu đồ trang Admin: **Chart.js** (CDN).
- Font: **Be Vietnam Pro** hoặc **Inter** (Google Fonts), có fallback `system-ui, sans-serif`.
- Không dùng framework nặng, không cần bundler.
- Code sạch, chia file rõ ràng, có comment tiếng Việt ở các đoạn quan trọng.

---

## 4. Phong cách thiết kế (QUAN TRỌNG)

**Tối giản, ít màu sắc.** Chỉ dùng **1 màu chủ đạo + các màu trung tính**.

| Vai trò | Màu gợi ý |
|---|---|
| Màu chủ đạo (nút chính, link, điểm nhấn) | Cam đất (terracotta) `#C2410C` (hover: `#9A3412`, nền nhạt `#FFF1E8`) — ấm áp, gợi mái ngói/nhà ở |
| Nền trang | Trắng kem ấm `#FCFAF7` |
| Nền thẻ / form | Trắng `#FFFFFF` |
| Viền | Xám ấm nhạt `#E7E5E4` |
| Chữ chính | `#1C1917` |
| Chữ phụ | `#57534E` |
| Giá tiền | Dùng **chính màu chủ đạo** hoặc chữ đậm, không thêm màu mới |

Quy tắc:
- Chỉ được thêm màu **trạng thái** (xanh lá, vàng, đỏ nhạt) cho **badge trong trang Admin** (Hoạt động / Chờ duyệt / Bị khóa), dùng sắc độ nhạt, chữ đậm.
- Không dùng gradient sặc sỡ, không dùng quá 2 sắc độ nhấn trên cùng một màn hình.
- Bo góc vừa phải (8–12px), bóng đổ nhẹ, nhiều khoảng trắng.
- Khai báo màu bằng **CSS variables** trong `:root` để dễ đổi.
- Responsive đầy đủ: mobile (≥360px), tablet, desktop. Ưu tiên mobile-first.
- Ảnh phòng dùng ảnh placeholder (ví dụ `https://picsum.photos/seed/room1/600/400`) hoặc khối xám có biểu tượng, **có thuộc tính `alt`**.
- Toàn bộ giao diện bằng **tiếng Việt**, tiền tệ định dạng `3.500.000 đ/tháng`.

---

## 5. Cấu trúc thư mục yêu cầu

```
rentsmart-hcm/
├── index.html                  # Trang chủ
├── phong-tro.html              # Danh sách tin + bộ lọc (dùng chung cho mọi danh mục)
├── chi-tiet.html               # Chi tiết phòng (?id=)
├── dang-nhap.html
├── dang-ky.html                # Có chọn vai trò
├── quen-mat-khau.html
├── tin-da-luu.html             # Người thuê (tin đã lưu + đã xem)
├── ho-so.html                  # Hồ sơ cá nhân, đổi mật khẩu
├── chu-nha/
│   ├── tong-quan.html          # Dashboard chủ nhà
│   ├── dang-tin.html           # Đăng / sửa tin
│   └── quan-ly-tin.html        # Tin của tôi
├── admin/
│   ├── dang-nhap.html          # Đăng nhập riêng cho admin
│   ├── tong-quan.html          # Dashboard thống kê
│   ├── tai-khoan.html          # Quản lý tài khoản
│   ├── tin-dang.html           # Quản lý & kiểm duyệt tin
│   ├── bao-cao-vi-pham.html    # Báo cáo vi phạm
│   ├── luu-luong.html          # Lưu lượng & chỉ số mạng
│   └── nhat-ky.html            # Nhật ký hoạt động
├── assets/
│   ├── css/
│   │   ├── main.css            # Biến màu, layout chung, component
│   │   ├── admin.css
│   │   └── chatbot.css
│   ├── js/
│   │   ├── data.js             # Mock data
│   │   ├── utils.js            # formatPrice, formatDate, toast...
│   │   ├── auth.js             # Đăng nhập/đăng ký/phân quyền bằng localStorage
│   │   ├── listing.js          # Lọc, tìm kiếm, phân trang
│   │   ├── room-form.js        # Form đăng/sửa tin (chủ nhà + admin dùng chung)
│   │   ├── pages/              # JS riêng từng trang (home, detail, auth, saved, profile, landlord)
│   │   ├── admin/              # JS riêng từng trang admin
│   │   ├── chatbot.js          # Nút AI nổi
│   │   └── admin.js            # Logic trang admin
│   └── img/
└── README.md                   # Hướng dẫn chạy + tài khoản demo
```

Header, footer, chatbot nên được **tái sử dụng** (render bằng JS từ một hàm chung) để không lặp code giữa các trang.

---

## 6. Các trang phía người dùng

### 6.1. Header & Footer (chung)
- Header: logo **RentSmart** (biểu tượng ngôi nhà + chữ), menu: **Phòng trọ · Nhà nguyên căn · Căn hộ · Ở ghép**.
- Bên phải: nút **Đăng tin**, **Đăng nhập**, **Đăng ký**. Khi đã đăng nhập: hiển thị avatar + tên + dropdown (Hồ sơ, Tin đã lưu hoặc Tin của tôi, Đăng xuất).
- Mobile: menu dạng hamburger.
- Footer: giới thiệu ngắn, chính sách bảo mật, quy định sử dụng, liên hệ, bản quyền. Giữ gọn, nền trung tính.

### 6.2. Trang chủ `index.html`
1. **Hero** có tiêu đề *"Tìm phòng trọ tại TP.HCM nhanh chóng"*, mô tả ngắn, nền ảnh hoặc màu đơn sắc.
2. **Thanh tìm kiếm**: ô nhập từ khóa, chọn **Quận/Huyện** (chỉ TP.HCM), chọn **Khoảng giá**, chọn **Diện tích**, nút **Tìm kiếm**, nút **Bộ lọc nâng cao**.
3. **Chip chọn nhanh khu vực** (Quận 1, Quận 7, Bình Thạnh, Gò Vấp, Thủ Đức, Tân Bình...).
4. **Tin nổi bật**: lưới thẻ phòng (ảnh, nhãn loại phòng, giá, diện tích, tiêu đề, địa chỉ quận, thời gian đăng, nút lưu tim).
5. **Phòng trọ theo quận**: lưới các ô quận kèm số tin, bấm vào sẽ lọc theo quận.
6. **Cách hoạt động** (3 bước: Tìm – Liên hệ – Xem phòng) và **Mẹo thuê trọ an toàn** (ngắn gọn).

### 6.3. Danh sách tin `phong-tro.html`
- Layout 2 cột trên desktop: **bộ lọc bên trái**, **kết quả bên phải**. Mobile: bộ lọc mở dạng drawer.
- Bộ lọc:
  - Danh mục: Tất cả / Phòng trọ / Nhà nguyên căn / Căn hộ / Ở ghép
  - Quận/Huyện (chỉ TP.HCM) — có thể chọn nhiều
  - Khoảng giá: Dưới 3 triệu · 3–5 triệu · 5–7 triệu · 7–10 triệu · Trên 10 triệu (kèm thanh trượt tùy chỉnh)
  - Diện tích: Dưới 20m² · 20–30m² · 30–50m² · Trên 50m²
  - Tiện ích (checkbox): Điều hòa, Nội thất đầy đủ, Tủ lạnh, Máy giặt, Tivi, Internet, Ban công, WC riêng, Chỗ để xe, Bảo vệ 24/7, Thang máy, Nhà bếp, Khóa vân tay, Nước nóng, Gác lửng
- Sắp xếp: Mới nhất / Giá tăng dần / Giá giảm dần / Diện tích lớn nhất.
- Hiển thị số kết quả, **phân trang** (9–12 tin/trang), chuyển đổi chế độ xem lưới/danh sách.
- Đồng bộ bộ lọc với URL query để chia sẻ được liên kết.
- Trạng thái rỗng: *"Không tìm thấy phòng phù hợp"* kèm nút xóa bộ lọc.

### 6.4. Chi tiết phòng `chi-tiet.html?id=`
- Breadcrumb: Trang chủ / Danh mục / Tên tin.
- **Carousel ảnh** (nhiều ảnh, ảnh thu nhỏ bên dưới, bấm xem lớn).
- Tiêu đề, nhãn loại phòng, địa chỉ (Quận, TP.HCM).
- Khối thông số: **Mức giá · Diện tích · Loại hình · Ngày đăng**.
- **Tiện ích phòng** dạng lưới biểu tượng + tên.
- **Mô tả chi tiết**.
- **Thẻ chủ nhà (cột phải, cố định khi cuộn)**: avatar, tên, nhãn "Chủ nhà đã xác thực", ngày tham gia, đánh giá, tổng số phòng; nút **Hiện số điện thoại** (che bớt số, bấm mới hiện đủ), nút **Nhắn tin cho chủ nhà**, nút **Lưu tin**, nút **Báo cáo tin**.
- Hộp **cảnh báo an toàn**: không đặt cọc trước khi xem phòng và ký hợp đồng.
- **Tin tương tự** (cùng quận hoặc cùng tầm giá).
- Nếu chưa đăng nhập mà bấm Lưu/Nhắn tin → chuyển hướng đăng nhập kèm `?redirect=`.

### 6.5. Đăng nhập `dang-nhap.html`
- Thẻ form canh giữa màn hình, logo, tiêu đề *"Đăng nhập"*.
- Trường: **Tên đăng nhập / Email / SĐT**, **Mật khẩu** (có nút hiện/ẩn), checkbox **Ghi nhớ đăng nhập**, link **Quên mật khẩu?**.
- Nút **Đăng nhập**, dòng *"Chưa có tài khoản? Đăng ký ngay"*, nút **Quay lại trang chủ**.
- Validate: không để trống, hiển thị lỗi ngay dưới từng ô, thông báo sai tài khoản/mật khẩu.
- Sau khi đăng nhập thành công: **tự điều hướng theo vai trò**
  - Người thuê → trang chủ
  - Chủ nhà → `chu-nha/tong-quan.html`
  - Admin → `admin/tong-quan.html`
- Trạng thái nút loading khi đang xử lý (giả lập 600ms).

### 6.6. Đăng ký `dang-ky.html` (có chọn vai trò)
- Tiêu đề *"Tạo tài khoản mới"*.
- Trường: **Họ và tên**, **Số điện thoại**, **Email**, **Tên đăng nhập**, **Mật khẩu**, **Xác nhận mật khẩu**.
- **Chọn vai trò (bắt buộc)** dạng 2 thẻ lựa chọn lớn (radio dạng card), mặc định chưa chọn:
  - **Người thuê trọ** — *"Tôi muốn tìm phòng"*
  - **Chủ nhà / Môi giới** — *"Tôi muốn đăng tin cho thuê"*
  - Thẻ được chọn có viền màu chủ đạo + dấu tick.
  - Nếu chọn **Chủ nhà / Môi giới**: hiện thêm trường tùy chọn *"Số phòng đang quản lý"* và *"Khu vực hoạt động (quận)"*.
- Checkbox *"Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật"* (bắt buộc).
- Nút **Đăng ký tài khoản**, dòng *"Đã có tài khoản? Đăng nhập tại đây"*.
- Validate: SĐT Việt Nam (10 số, bắt đầu 0), email hợp lệ, mật khẩu ≥ 8 ký tự, xác nhận khớp, bắt buộc chọn vai trò. Có thanh đo độ mạnh mật khẩu đơn giản.
- Lưu tài khoản vào `localStorage` với trường `role` = `tenant` hoặc `landlord`, `status` = `active`, sau đó thông báo thành công và chuyển sang đăng nhập.
- **Không cho phép đăng ký vai trò admin** từ giao diện này.

### 6.7. Các trang theo vai trò
**Người thuê:** `tin-da-luu.html` (danh sách tin đã lưu, bỏ lưu, lịch sử đã xem), hồ sơ cá nhân (đổi tên, avatar, mật khẩu).

**Chủ nhà / Môi giới:**
- `tong-quan.html`: thẻ thống kê nhanh (tổng tin, đang hiển thị, chờ duyệt, lượt xem), danh sách tin gần đây.
- `dang-tin.html`: form đăng/sửa tin gồm tiêu đề, loại hình, giá, diện tích, quận/huyện + địa chỉ cụ thể, mô tả, chọn tiện ích, **tải nhiều ảnh (xem trước + chọn ảnh bìa)**, thông tin liên hệ. Tin mới có trạng thái **Chờ duyệt**.
- `quan-ly-tin.html`: bảng tin của tôi với trạng thái (Chờ duyệt / Đang hiển thị / Bị từ chối / Đã gỡ / Đã cho thuê), nút sửa, ẩn, xóa, đánh dấu *Đã cho thuê*.

---

## 7. Nút AI nổi (Floating AI Chat) — có ở mọi trang người dùng

- **Nút tròn cố định góc dưới bên phải**, biểu tượng robot, màu chủ đạo, có hiệu ứng nhấp nháy nhẹ lần đầu để thu hút chú ý, có tooltip *"Hỏi AI tìm trọ"*.
- Bấm vào mở **cửa sổ chat** (rộng ~360px, cao ~520px; mobile thì gần toàn màn hình), có thể đóng/thu nhỏ.
- **Header**: biểu tượng robot + *"AI Trợ Lý Tìm Trọ"* + nút đóng (X).
- **Lời chào tự động**: *"Xin chào! Tôi là trợ lý ảo hỗ trợ tìm phòng trọ tại TP.HCM. Bạn có thể chọn câu hỏi nhanh bên dưới hoặc gõ câu hỏi."*
- **Câu hỏi nhanh (chip)**: *Cách liên hệ an toàn? · Giá phòng TP.HCM? · Khu vực nào gần trường đại học? · Tiện ích nên có?*
- Ô nhập câu hỏi + nút gửi (Enter để gửi). Bong bóng chat người dùng/AI khác nhau rõ ràng, có hiệu ứng *"đang trả lời…"* (3 chấm) và tự cuộn xuống cuối.
- **Nút "Liên hệ nhân viên hỗ trợ trực tiếp"** ở dưới cùng (hiện thông báo/giả lập chuyển cho nhân viên).
- **Logic giả lập (rule-based)** trong `chatbot.js`, nhận diện từ khóa tiếng Việt (không phân biệt hoa thường, bỏ dấu):
  - "giá", "bao nhiêu" → trả lời mức giá trung bình theo quận (Q1, Q7, Bình Thạnh, Gò Vấp, Thủ Đức, Tân Bình...)
  - "an toàn", "lừa đảo", "cọc" → hướng dẫn thuê trọ an toàn
  - "gần trường", "đại học", "sinh viên" → gợi ý khu vực
  - "tiện ích", "điều hòa", "máy giặt" → gợi ý tiện ích
  - Khi tìm được phòng phù hợp (ví dụ *"phòng dưới 4 triệu ở Gò Vấp"*) → trả về **2–3 thẻ phòng thu nhỏ có link tới trang chi tiết**.
  - Không hiểu → trả lời lịch sự và gợi ý các câu hỏi nhanh.
- Lưu lịch sử hội thoại trong phiên (`sessionStorage`).
- Viết sẵn một hàm `askAI(message)` tách biệt để sau này **dễ thay bằng API thật** (ví dụ gọi LLM), có comment chỉ rõ chỗ thay.

---

## 8. KHU VỰC ADMIN (đầy đủ tính năng)

Giao diện riêng: **sidebar trái cố định** (nền tối trung tính hoặc trắng, chỉ dùng màu chủ đạo cho mục đang chọn) + **topbar** (ô tìm kiếm nhanh, chuông thông báo, avatar admin, đăng xuất). Sidebar thu gọn được trên mobile.

Menu: **Tổng quan · Tài khoản · Tin đăng · Báo cáo vi phạm · Lưu lượng & Mạng · Nhật ký hoạt động**.

Bảo vệ route: nếu `role !== 'admin'` thì chuyển về `admin/dang-nhap.html`.

### 8.1. Tổng quan (`tong-quan.html`)
- **Thẻ chỉ số (KPI)**: Tổng tài khoản · Người thuê · Chủ nhà · Tổng tin đăng · Tin chờ duyệt · Tin vi phạm/bị gỡ · Lượt truy cập hôm nay · Tài khoản mới 7 ngày.
- **Biểu đồ đường**: lượt truy cập 30 ngày gần nhất.
- **Biểu đồ cột**: số tin đăng mới theo tuần.
- **Biểu đồ tròn/donut**: tỷ lệ tin theo loại (Phòng trọ / Nhà nguyên căn / Căn hộ / Ở ghép) và tỷ lệ tài khoản theo vai trò.
- **Biểu đồ cột ngang**: Top 5 quận có nhiều tin nhất.
- **Danh sách "Cần xử lý ngay"**: tin chờ duyệt mới nhất, báo cáo vi phạm chưa xử lý (có nút thao tác nhanh).
- Biểu đồ dùng 1 màu chủ đạo và các sắc độ xám/teal nhạt, không dùng nhiều màu.

### 8.2. Quản lý tài khoản (`tai-khoan.html`)
- Bảng: Avatar, Họ tên, Tên đăng nhập, Email, SĐT, **Vai trò**, **Trạng thái** (Hoạt động / Bị khóa / Chờ xác thực), Ngày tạo, Số tin đăng, Thao tác.
- **Tìm kiếm**, **lọc theo vai trò/trạng thái/ngày tạo**, **sắp xếp** theo cột, **phân trang**, chọn nhiều dòng (checkbox) để thao tác hàng loạt.
- Thao tác từng tài khoản:
  - **Xem chi tiết** (modal): thông tin, danh sách tin đã đăng, lịch sử báo cáo vi phạm, lần đăng nhập gần nhất.
  - **Chỉnh sửa** thông tin / **đổi vai trò**.
  - **Khóa / Mở khóa** (nhập lý do, có thể đặt thời hạn).
  - **Xóa tài khoản vi phạm** (modal xác nhận, **bắt buộc chọn/nhập lý do**; khi xóa sẽ gỡ toàn bộ tin của tài khoản đó).
  - **Đặt lại mật khẩu** (giả lập).
- **Thêm tài khoản mới** (modal form) và **xuất danh sách CSV**.
- Thao tác hàng loạt: khóa, mở khóa, xóa.

### 8.3. Quản lý & kiểm duyệt tin (`tin-dang.html`)
- Tab theo trạng thái: **Tất cả · Chờ duyệt · Đang hiển thị · Bị từ chối · Đã gỡ** (kèm số lượng trên mỗi tab).
- Bảng: ảnh bìa, tiêu đề, chủ tin, quận, giá, diện tích, ngày đăng, trạng thái, số báo cáo, thao tác.
- Lọc theo quận, loại hình, khoảng giá, ngày đăng; tìm theo tiêu đề/chủ tin.
- Thao tác:
  - **Xem nhanh** (modal đầy đủ ảnh + mô tả + thông tin chủ tin).
  - **Duyệt** / **Từ chối** (nhập lý do) / **Gỡ tin** (nhập lý do vi phạm) / **Khôi phục** / **Xóa vĩnh viễn** (xác nhận).
  - **Ghim tin nổi bật** (bật/tắt).
  - **Chỉnh sửa tin**.
  - **Đăng tin mới thay mặt chủ nhà** (form giống `dang-tin.html`, chọn chủ tin từ danh sách tài khoản; tin do admin đăng được duyệt luôn).
- Thao tác hàng loạt: duyệt, gỡ, xóa.
- Thống kê nhỏ phía trên: tổng tin, số tin theo từng trạng thái, tin đăng hôm nay.

### 8.4. Báo cáo vi phạm (`bao-cao-vi-pham.html`)
- Bảng báo cáo: mã báo cáo, tin/tài khoản bị báo cáo, người báo cáo, **lý do** (lừa đảo, sai giá, sai hình ảnh, spam, trùng lặp, khác), nội dung, ngày gửi, trạng thái (Chưa xử lý / Đang xem xét / Đã xử lý).
- Hành động: **Bỏ qua báo cáo**, **Gỡ tin**, **Cảnh cáo chủ tin**, **Khóa tài khoản**, **Xóa tài khoản**, kèm ghi chú xử lý. Mọi hành động được ghi vào nhật ký.

### 8.5. Lưu lượng & chỉ số mạng (`luu-luong.html`)
Mọi số liệu là **dữ liệu mô phỏng**, có thể **tự cập nhật mỗi 3–5 giây** bằng `setInterval` để nhìn như thời gian thực.
- **Lưu lượng truy cập**: người dùng đang online, lượt xem trang/giờ, lượt truy cập theo ngày/tuần/tháng (chọn bộ lọc thời gian), tỷ lệ thoát, thời gian ở lại trung bình.
- **Nguồn truy cập**: tìm kiếm, trực tiếp, mạng xã hội, giới thiệu (biểu đồ donut).
- **Thiết bị**: Mobile / Desktop / Tablet; **Trình duyệt** phổ biến.
- **Trang được xem nhiều nhất** (top 10) và **từ khóa tìm kiếm phổ biến** (top 10).
- **Chỉ số hạ tầng/mạng** (thẻ + biểu đồ đường thời gian thực):
  - Trạng thái server (Online/Offline), **Uptime** (%)
  - **Thời gian phản hồi** trung bình (ms)
  - **Số request/giây (RPS)**
  - **Băng thông** vào/ra (Mbps)
  - **Tỷ lệ lỗi** HTTP 4xx / 5xx
  - **Độ trễ (latency)** và **packet loss** (%)
  - Mức dùng **CPU / RAM / ổ đĩa** (thanh tiến trình)
  - Số **kết nối đang hoạt động**
- Hiển thị **cảnh báo** (banner) khi chỉ số vượt ngưỡng (ví dụ phản hồi > 800ms hoặc lỗi 5xx > 2%).
- Bảng **log truy cập gần đây** (thời gian, IP, đường dẫn, mã phản hồi, thiết bị), có lọc theo mã trạng thái.

### 8.6. Nhật ký hoạt động (`nhat-ky.html`)
- Bảng ghi lại thao tác của admin (duyệt/gỡ tin, khóa/xóa tài khoản, đăng nhập...), gồm thời gian, admin thực hiện, hành động, đối tượng, lý do/ghi chú.
- Lọc theo loại hành động, theo khoảng ngày, tìm kiếm; xuất CSV.

### 8.7. Yêu cầu chung cho Admin
- Mọi hành động nguy hiểm (xóa, khóa, gỡ) đều có **modal xác nhận** và **thông báo toast** sau khi hoàn thành.
- Bảng có **skeleton/loading**, trạng thái rỗng, và hiển thị tốt trên màn hình nhỏ (cuộn ngang trong khung bảng).
- Dữ liệu admin đồng bộ với dữ liệu người dùng qua `localStorage` (ví dụ: tin bị gỡ thì không còn hiển thị ở trang chủ).

---

## 9. Dữ liệu mẫu (`data.js`)

### 9.1. Khu vực: chỉ TP.HCM
Tạo mảng `districts` dễ chỉnh sửa, gồm: Quận 1, 3, 4, 5, 6, 7, 8, 10, 11, 12, Bình Thạnh, Gò Vấp, Phú Nhuận, Tân Bình, Tân Phú, Bình Tân, TP. Thủ Đức, Huyện Bình Chánh, Hóc Môn, Củ Chi, Nhà Bè, Cần Giờ.
> Ghi chú: cấu trúc hành chính có thể thay đổi, nên đặt danh sách này trong **một nơi duy nhất** để sau này cập nhật theo phường/xã mà không phải sửa nhiều file.

### 9.2. Cấu trúc dữ liệu (bám theo thiết kế CSDL sơ bộ)
```js
users:        { id, username, email, phone, password, fullName, avatar, role: 'tenant'|'landlord'|'admin', status: 'active'|'locked'|'pending', createdAt }
rooms:        { id, landlordId, title, description, price, area, address, district, roomType: 'phong-tro'|'nha-nguyen-can'|'can-ho'|'o-ghep', status: 'pending'|'approved'|'rejected'|'removed'|'rented', featured, views, createdAt, updatedAt }
room_images:  { id, roomId, imageUrl, isPrimary }
amenities:    { id, name, icon }
room_amenities: { roomId, amenityId }
reports:      { id, roomId, reporterId, reason, content, status, createdAt }
activity_logs:{ id, adminId, action, target, note, createdAt }
```
- Tối thiểu: **30 tin**, **20 tài khoản** (có cả 3 vai trò), **8 báo cáo vi phạm**, **15 amenity**, **30 dòng log**.
- Giá từ 1,3 triệu đến 12 triệu; diện tích 15–60 m²; địa chỉ thật theo quận ở TP.HCM (tên đường có thật, không dùng số điện thoại thật).
- Dữ liệu lưu lượng/mạng được **sinh ngẫu nhiên có quy luật** bằng hàm trong `data.js`/`admin.js`.

### 9.3. Tài khoản demo (ghi vào README)
| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Chủ nhà | `chunha01` | `Demo@1234` |
| Người thuê | `nguoithue01` | `Demo@1234` |

---

## 10. Yêu cầu chất lượng

- **Responsive** trên mọi trang, kể cả bảng admin.
- **Truy cập (a11y)**: dùng thẻ ngữ nghĩa (`header, nav, main, footer`), `label` cho mọi input, `alt` cho ảnh, focus rõ ràng, điều hướng bằng bàn phím được, độ tương phản đạt chuẩn.
- **Hiệu năng**: lazy-load ảnh (`loading="lazy"`), không phụ thuộc thư viện không cần thiết.
- **Trải nghiệm**: có trạng thái loading, trạng thái rỗng, thông báo lỗi thân thiện, toast thành công.
- **Bảo mật phía client (demo)**: escape nội dung người dùng nhập trước khi hiển thị (tránh XSS), không hiển thị mật khẩu thô trong giao diện. Ghi chú rõ trong README rằng đây là bản demo, mật khẩu thật phải được băm ở backend.
- Code tách biệt HTML / CSS / JS, đặt tên class rõ ràng (có thể theo BEM), không lặp code.

---

## 11. Cách bạn nên trả lời

1. Trước hết **tóm tắt ngắn** kiến trúc và luồng trang (không quá 15 dòng).
2. Sau đó **xuất đầy đủ code từng file** theo đúng cấu trúc thư mục ở mục 5, mỗi file trong một khối code riêng, ghi rõ **đường dẫn file** ở dòng đầu.
3. Không viết "phần còn lại tương tự", không bỏ sót file hay dùng `...` để lược code. Nếu quá dài, hãy **chia thành nhiều phần** và hỏi tôi có tiếp tục không.
4. Cuối cùng viết `README.md` hướng dẫn chạy, tài khoản demo và danh sách tính năng đã hoàn thành.

---

## 12. Checklist nghiệm thu

- [ ] Trang chủ, danh sách, chi tiết hiển thị đúng, chỉ có dữ liệu TP.HCM.
- [ ] Bộ lọc quận/giá/diện tích/tiện ích và sắp xếp, phân trang hoạt động.
- [ ] Đăng ký **bắt buộc chọn vai trò** Người thuê hoặc Chủ nhà; đăng nhập điều hướng đúng theo vai trò.
- [ ] Chủ nhà đăng được tin mới → trạng thái *Chờ duyệt* → admin duyệt thì hiện ra trang chủ.
- [ ] Nút AI nổi xuất hiện ở mọi trang người dùng, trả lời được các câu hỏi mẫu và gợi ý phòng.
- [ ] Admin: xem/lọc/khóa/xóa tài khoản, xem số lượng tin, duyệt/từ chối/gỡ/xóa/đăng tin, xử lý báo cáo, xem lưu lượng và chỉ số mạng, xem nhật ký.
- [ ] Giao diện chỉ dùng **1 màu chủ đạo + màu trung tính**, nhất quán trên mọi trang.
- [ ] Responsive tốt trên điện thoại, máy tính bảng, máy tính.
