# RentSmart HCM – Frontend

Website hỗ trợ **tìm và đăng tin cho thuê phòng trọ tại TP. Hồ Chí Minh**. Frontend hiện tại vẫn là bản prototype HTML/CSS/JavaScript, dùng dữ liệu mẫu trong `localStorage`. Mã frontend đã được gom vào `frontend/` để tách biệt với backend Laravel dự kiến đặt tại `backend/`; backend chưa được khởi tạo.

- Giao diện hoàn toàn bằng tiếng Việt, responsive từ 360px trở lên (mobile-first).
- Màu chủ đạo: **cam đất `#C2410C`** (hover `#9A3412`, nền nhạt `#FFF1E8`) trên nền kem ấm `#FCFAF7`. Mọi màu khai báo bằng CSS variables ở đầu `frontend/assets/css/main.css` nên dễ đổi.
- Chỉ phục vụ khu vực TP.HCM (22 quận/huyện/thành phố).

## 1. Công nghệ

| Thành phần | Dùng để |
|---|---|
| HTML5, CSS3, JavaScript (ES6+) | Toàn bộ giao diện và logic, không dùng framework |
| Bootstrap 5.3 (CDN) | Lưới, component, modal, offcanvas, carousel |
| Bootstrap Icons (CDN) | Biểu tượng |
| Chart.js (CDN) | Biểu đồ ở trang admin |
| Google Fonts – Be Vietnam Pro | Font chữ hỗ trợ tiếng Việt |
| picsum.photos | Ảnh phòng minh họa |
| `localStorage` / `sessionStorage` | Giả lập cơ sở dữ liệu và phiên đăng nhập |
| PHP, Laravel, MySQL | Stack backend mục tiêu; chưa được cài đặt trong repository |

## 2. Chạy thử

Cần Internet để tải CDN và ảnh minh họa.

```bash
# tại thư mục gốc, chỉ chạy frontend prototype
python -m http.server --directory frontend 8000
# mở http://localhost:8000
```

Cũng có thể mở trực tiếp `frontend/index.html`, hoặc dùng extension Live Server của VS Code. Các lệnh này chỉ phục vụ giao diện prototype; chúng không chạy backend.

### Tài khoản prototype có sẵn

| Vai trò | Tên đăng nhập | Mật khẩu | Trang đăng nhập |
|---|---|---|---|
| Quản trị viên | `admin` | `Admin@123` | `admin/dang-nhap.html` |
| Chủ nhà | `chunha01` | `Demo@1234` | `dang-nhap.html` |
| Người thuê | `nguoithue01` | `Demo@1234` | `dang-nhap.html` |

Dữ liệu mẫu gồm 20 tài khoản (admin, 7 chủ nhà, 12 người thuê, có cả tài khoản bị khóa và chờ xác minh), 30 tin ở đủ trạng thái, 8 báo cáo vi phạm và 30 dòng nhật ký. Có thể đăng nhập bằng tên đăng nhập, email hoặc số điện thoại.

## 3. Cấu trúc thư mục

```
WEB_CK/
├── frontend/                 Frontend prototype hiện tại
│   ├── index.html            Trang chủ
│   ├── phong-tro.html        Danh sách tin + bộ lọc
│   ├── chi-tiet.html         Chi tiết phòng
│   ├── dang-nhap.html        Đăng nhập prototype
│   ├── dang-ky.html           Đăng ký prototype
│   ├── quen-mat-khau.html    Quên mật khẩu
│   ├── tin-da-luu.html       Tin đã lưu + lịch sử đã xem
│   ├── ho-so.html            Hồ sơ cá nhân
│   ├── chu-nha/              Các trang chủ nhà
│   ├── admin/                Các trang quản trị
│   └── assets/
│       ├── css/              CSS dùng chung và theo khu vực
│       ├── js/               Logic frontend prototype
│       └── img/              Ảnh tĩnh
├── backend/                  Vị trí dự kiến cho ứng dụng Laravel
├── README.md
├── prompt-frontend-rentsmart-hcm.md
└── rentsmart_mysql_erd.html  Sơ đồ database hiện có
```

Backend Laravel chưa được tạo; cấu trúc `backend/` ở trên là vị trí dự kiến, không phải mã backend đang chạy. Mỗi trang frontend đặt `data-base` trên thẻ `<body>` (`""` ở thư mục frontend, `"../"` ở thư mục con) để các đường dẫn trong header, footer và liên kết luôn đúng. Thứ tự nạp script: Bootstrap → `data.js` → `utils.js` → `auth.js` → (`room-form.js`) → `chatbot.js` → script của trang.

## 4. Tính năng

### Người thuê và khách
- **Trang chủ:** hero kèm ô tìm kiếm (từ khóa, quận, mức giá, diện tích), danh mục nhanh, tin nổi bật, quận có nhiều tin, hướng dẫn thuê an toàn.
- **Danh sách:** lọc theo loại, quận (chọn nhiều), khoảng giá (có thanh trượt), diện tích, tiện ích; sắp xếp mới nhất / giá / diện tích; xem dạng lưới hoặc danh sách; phân trang 9 tin mỗi trang. Bộ lọc nằm trong ngăn kéo (offcanvas) trên mobile và được đồng bộ lên URL nên chia sẻ được liên kết.
- **Chi tiết phòng:** thư viện ảnh (carousel, ảnh thu nhỏ, phóng to), thông số, tiện ích, mô tả, **khung bản đồ giữ chỗ** (xem mục 6), thẻ chủ nhà cố định bên cạnh, số điện thoại được che và chỉ hiện đủ khi bấm, nhắn tin cho chủ nhà, báo cáo tin, tin tương tự. Nhắn tin, báo cáo và lưu tin yêu cầu đăng nhập rồi quay lại đúng trang.
- **Tin đã lưu và lịch sử đã xem** theo từng tài khoản; **hồ sơ** cho phép đổi tên, ảnh đại diện, mật khẩu.
- **Đăng ký:** chọn vai trò bằng thẻ, kiểm tra hợp lệ (số điện thoại Việt Nam 10 số, email, mật khẩu tối thiểu 8 ký tự kèm thanh đo độ mạnh, nhập lại khớp, đồng ý điều khoản), chặn trùng tên đăng nhập, email, số điện thoại.

### Chủ nhà
- Dashboard thống kê tin của mình.
- Đăng và sửa tin: nhiều ảnh (tối đa 8, tự nén, chọn ảnh bìa), tiện ích, thông tin liên hệ. Tin mới và tin vừa sửa đều về trạng thái **Chờ duyệt**.
- Quản lý tin theo tab trạng thái: sửa, ẩn/hiện lại, đánh dấu đã cho thuê, xóa (có hộp thoại xác nhận). Tin bị admin gỡ thì chủ nhà không tự hiện lại được.

### Quản trị viên
- **Tổng quan:** chỉ số chính và biểu đồ (Chart.js).
- **Tài khoản:** tìm, lọc, thêm/sửa, khóa (kèm lý do) / mở khóa, xóa, thao tác hàng loạt, xuất CSV.
- **Tin đăng:** duyệt, từ chối kèm lý do, gỡ, đánh dấu nổi bật, thêm/sửa/xóa tin thay chủ nhà.
- **Báo cáo vi phạm:** xem chi tiết, chuyển trạng thái, xử lý và gỡ tin liên quan.
- **Lưu lượng:** biểu đồ và chỉ số mạng **mô phỏng** theo thời gian thực.
- **Nhật ký:** mọi thao tác của admin được ghi lại, có lọc và xuất CSV.

### Trợ lý AI nổi
Có ở mọi trang người dùng (không có ở admin). Hiện là **rule-based**: nhận diện từ khóa tiếng Việt, tách giá và quận để gợi ý tối đa 3 phòng. Lịch sử chat giữ trong `sessionStorage`. Để dùng mô hình thật, thay hàm `askAI(message)` trong `frontend/assets/js/chatbot.js`; hàm trả về `{ text, rooms }`.

## 5. Cách dữ liệu hoạt động

- **Dữ liệu mẫu gốc** nằm trong `frontend/assets/js/data.js`. Lần đầu mở web, nó được chép vào `localStorage` với key `rs_db_v1`. Từ đó mọi thao tác chỉ ghi vào `localStorage`, file `data.js` không bị sửa.
- Các bảng: `users`, `rooms`, `room_images`, `amenities`, `room_amenities`, `reports`, `activity_logs`. Truy cập qua đối tượng `DB` (`DB.t('rooms')`, `DB.room(id)`, `DB.save()`...).
- **Phiên đăng nhập:** key `rs_session` (ở `localStorage` nếu chọn "Ghi nhớ", ngược lại ở `sessionStorage`). **Tin đã lưu/đã xem:** `rs_saved_<id>` và `rs_viewed_<id>`.
- Chỉ tin trạng thái **Đang hiển thị** mới xuất hiện công khai. Tin ở trạng thái khác chỉ chủ tin và admin xem được.
- Ảnh tải lên được nén và lưu dạng base64. `localStorage` chỉ khoảng 5MB nên nên dùng ít ảnh, nhỏ. Hết dung lượng sẽ có thông báo lỗi.
- **Đặt lại dữ liệu mẫu:** xóa key `rs_db_v1` (DevTools → Application → Local Storage), hoặc chạy `DB.reset()` trong console.
- Dữ liệu chỉ nằm trên trình duyệt hiện tại: đổi trình duyệt, dùng chế độ ẩn danh hoặc xóa dữ liệu duyệt web sẽ quay về dữ liệu mẫu.

## 6. Khung bản đồ ở trang chi tiết

Trong `frontend/chi-tiet.html` (do `frontend/assets/js/pages/detail.js` dựng) có khối `#roomMap`, là khung tỉ lệ 16:9 ở desktop và 4:3 ở mobile, đang hiển thị chữ giữ chỗ. Địa chỉ đầy đủ được đặt sẵn ở thuộc tính `data-address`. Khi tích hợp bản đồ (Google Maps, Leaflet/OpenStreetMap...), chỉ cần khởi tạo bản đồ vào `#roomMap`, thay nội dung giữ chỗ, và dùng `data-address` để định vị hoặc thêm trường tọa độ vào dữ liệu phòng.

## 7. Quy ước giao diện

- Tối giản: một màu chủ đạo cộng các màu trung tính. Màu trạng thái (xanh lá, vàng, đỏ nhạt) chỉ dùng cho badge.
- Bo góc 8–12px, bóng đổ nhẹ, nhiều khoảng trắng.
- Tiền tệ định dạng `3.500.000 đ/tháng`.
- Trợ năng: mọi ảnh có `alt`, nút chỉ có biểu tượng có `aria-label`, có trạng thái focus rõ, độ tương phản chữ trắng trên màu chủ đạo khoảng 5,2:1.

## 8. Bảo mật và giới hạn của bản demo

- Mật khẩu **lưu thô** trong `localStorage` và việc phân quyền chỉ kiểm tra ở phía client: chỉ phù hợp để minh họa, **không dùng cho hệ thống thật**.
- Chuyển hướng sau đăng nhập (`?redirect=`) chỉ chấp nhận đường dẫn nội bộ tương đối.
- Nội dung do người dùng nhập luôn được escape trước khi render.
- Nhắn tin cho chủ nhà, quên mật khẩu và số liệu lưu lượng/mạng của admin đều là mô phỏng, chưa gửi đi đâu.

## 9. Chuẩn bị backend Laravel

`frontend/` hiện vẫn là prototype; việc di chuyển thư mục không biến dữ liệu mẫu thành dữ liệu thật. Backend dự kiến là một dự án Laravel độc lập tại `backend/`, với cấu trúc chuẩn do Composer/Laravel tạo ra (`app/`, `routes/`, `database/migrations/`, `resources/views/`, `storage/` và `public/`). Chỉ `backend/public/` nên được cấu hình làm document root khi triển khai.

Để khởi tạo backend, cần cài PHP và Composer, sau đó tạo dự án Laravel trong `backend/` theo hướng dẫn chính thức của Laravel. Các tệp `.env` chứa thông tin kết nối MySQL và khóa ứng dụng phải nằm trong backend, không commit lên Git. Hiện môi trường làm việc chưa có PHP/Composer nên backend chưa được khởi tạo hoặc kiểm thử.

Các bước tích hợp tiếp theo:

1. Tạo migrations, models, seeders và API cho người dùng, tin đăng, ảnh, tiện ích, báo cáo và nhật ký.
2. Thay `DB` trong `frontend/assets/js/data.js` và `Auth` trong `frontend/assets/js/auth.js` bằng lời gọi API; xác thực và phân quyền phải được kiểm tra ở server.
3. Khi tích hợp giao diện vào Laravel, chuyển các trang sang Blade trong `resources/views/` hoặc phục vụ frontend riêng và cấu hình API/CORS rõ ràng.
4. Lưu mật khẩu đã băm ở server và chuyển ảnh từ base64 sang lưu trữ tệp phù hợp; không dùng dữ liệu prototype hoặc tài khoản demo trong production.
