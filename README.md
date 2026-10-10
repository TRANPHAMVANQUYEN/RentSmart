# RentSmart HCM

Website hỗ trợ **tìm và đăng tin cho thuê phòng trọ tại TP. Hồ Chí Minh**. Frontend tĩnh HTML/CSS/JavaScript gọi Laravel API; Laravel kết nối MySQL để đọc và ghi dữ liệu.

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
| Laravel 12, Sanctum | REST API và xác thực bằng Bearer token |
| MySQL | Dữ liệu người dùng, phòng, tiện ích, tin đã lưu, báo cáo và tin nhắn |
| `localStorage` / `sessionStorage` | Token phiên, trạng thái giao diện và lịch sử xem cục bộ |

## 2. Chạy thử

Cần Internet để tải CDN và ảnh minh họa.

```bash
# Terminal 1: backend Laravel (MySQL/XAMPP cần đang chạy)
cd backend-laravel
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8001

# Terminal 2: frontend tĩnh, tại thư mục gốc
python -m http.server --directory frontend 8000
# mở http://127.0.0.1:8000
```

Frontend mặc định gọi `http://127.0.0.1:8001/api` (cấu hình tại `frontend/assets/js/auth.js`). Không mở `index.html` trực tiếp vì trình duyệt cần HTTP và CORS. Cấu hình DB nằm trong `backend-laravel/.env`; không đưa tệp này hoặc thông tin đăng nhập lên Git.

Database phát triển hiện có tài khoản quản trị `admin`. Mật khẩu demo chỉ dùng ở máy local và không ghi trong README để tránh đưa thông tin đăng nhập vào Git. Hash SHA-256 cũ sẽ được nâng cấp sang bcrypt sau lần đăng nhập thành công đầu tiên. Không dùng tài khoản demo trong môi trường triển khai.

## 3. Cấu trúc thư mục

```
WEB_CK/
├── frontend/                         Website HTML/CSS/JavaScript tĩnh
│   ├── index.html                    Trang chủ
│   ├── phong-tro.html                Danh sách phòng và bộ lọc
│   ├── chi-tiet.html                 Chi tiết một phòng
│   ├── dang-nhap.html                Đăng nhập
│   ├── dang-ky.html                  Đăng ký
│   ├── quen-mat-khau.html            Yêu cầu đặt lại mật khẩu
│   ├── dat-lai-mat-khau.html         Đặt mật khẩu mới từ liên kết email
│   ├── ho-so.html                    Hồ sơ cá nhân
│   ├── tin-da-luu.html               Tin đã lưu và lịch sử xem
│   ├── chu-nha/                      Trang dành cho chủ nhà
│   │   ├── tong-quan.html            Dashboard chủ nhà
│   │   ├── quan-ly-tin.html          Danh sách/quản lý tin của chủ nhà
│   │   └── dang-tin.html             Form đăng tin
│   ├── admin/                        Trang dành cho quản trị viên
│   │   ├── dang-nhap.html            Đăng nhập quản trị
│   │   ├── tong-quan.html            Dashboard admin
│   │   ├── tai-khoan.html            Quản lý tài khoản
│   │   ├── tin-dang.html             Quản lý và duyệt tin
│   │   ├── bao-cao-vi-pham.html      Xử lý báo cáo
│   │   ├── luu-luong.html            Thống kê lượt xem
│   │   └── nhat-ky.html              Nhật ký thao tác
│   └── assets/
│       ├── css/
│       │   ├── main.css              Giao diện dùng chung
│       │   ├── admin.css             Giao diện admin
│       │   └── chatbot.css           Giao diện chatbot
│       ├── img/                      Ảnh tĩnh của frontend (hiện để dành)
│       └── js/
│           ├── auth.js               Gọi API, token, phiên đăng nhập, ảnh và tin đã lưu
│           ├── utils.js              Hàm giao diện dùng chung: header, thẻ phòng, thông báo...
│           ├── data.js               Dữ liệu mẫu/ảnh dự phòng cho phần giao diện cũ
│           ├── listing.js            Tải, lọc, sắp xếp và phân trang danh sách phòng
│           ├── room-form.js          Form đăng/sửa tin
│           ├── admin.js              Khung, menu và tiện ích chung của admin
│           ├── chatbot.js            Giao diện chat và gợi ý phòng qua API
│           ├── pages/                JavaScript riêng cho các trang người dùng
│           │   ├── home.js           Trang chủ
│           │   ├── detail.js         Trang chi tiết phòng
│           │   ├── auth.js           Đăng nhập/đăng ký/quên mật khẩu
│           │   ├── landlord.js       Dashboard và quản lý tin chủ nhà
│           │   ├── profile.js        Hồ sơ, ảnh đại diện và mật khẩu
│           │   └── saved.js          Tin đã lưu và lịch sử xem
│           └── admin/                JavaScript riêng cho từng trang admin
│               ├── dang-nhap.js      Đăng nhập admin
│               ├── tong-quan.js      Dashboard và biểu đồ
│               ├── tai-khoan.js      Quản lý tài khoản
│               ├── tin-dang.js       Duyệt/quản lý tin
│               ├── bao-cao.js        Báo cáo vi phạm
│               ├── luu-luong.js      Lượt xem và lưu lượng
│               └── nhat-ky.js        Nhật ký hoạt động
├── backend-laravel/                  Backend Laravel và REST API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── RoomController.php    API phòng công khai, quận và tiện ích
│   │   │   └── Api/                  Controller nghiệp vụ cho API
│   │   ├── Http/Middleware/
│   │   │   └── RequireRole.php       Kiểm tra vai trò/trạng thái tài khoản
│   │   ├── Models/User.php           Mô hình tài khoản/xác thực
│   │   ├── Notifications/            Thông báo qua email
│   │   ├── Providers/                Đăng ký dịch vụ/cấu hình ứng dụng
│   │   └── Services/                 Logic dùng chung, ví dụ lưu ảnh phòng
│   ├── bootstrap/app.php             Khởi động Laravel và đăng ký middleware
│   ├── config/                       Cấu hình DB, CORS, mail, file, auth...
│   ├── database/
│   │   ├── migrations/               Các thay đổi cấu trúc DB do Laravel quản lý
│   │   ├── factories/                Tạo dữ liệu giả cho kiểm thử
│   │   └── seeders/                  Nạp dữ liệu mẫu
│   ├── public/                       Điểm vào HTTP và file Laravel public
│   ├── resources/                    Tài nguyên mặc định cho Blade/Vite
│   ├── routes/
│   │   ├── api.php                   Khai báo URL API và nối tới controller
│   │   ├── web.php                   Route trang web Laravel
│   │   └── console.php               Khai báo lệnh Artisan tùy chỉnh
│   ├── storage/                      Log, cache, session và file tải lên
│   ├── tests/
│   │   ├── Feature/                  Kiểm thử API/luồng tích hợp
│   │   └── Unit/                     Kiểm thử đơn vị
│   ├── artisan                       Chạy lệnh Laravel
│   ├── composer.json                 Khai báo thư viện PHP
│   ├── composer.lock                 Khóa phiên bản thư viện PHP đã cài
│   ├── package.json                  Công cụ JavaScript/Vite phía Laravel
│   ├── phpunit.xml                   Cấu hình kiểm thử PHP
│   └── .env.example                  Mẫu cấu hình môi trường
├── .claude/                          Hướng dẫn/kỹ năng hỗ trợ AI khi lập trình
├── .gemini/                          Bản hướng dẫn/kỹ năng cho Gemini
├── .github/                          Prompt và tài nguyên hỗ trợ GitHub Copilot
├── .gitignore                        Chỉ định file Git không theo dõi
├── README.md                         Tài liệu dự án này
├── prompt-frontend-rentsmart-hcm.md  Tài liệu yêu cầu/định hướng frontend
├── RentSmart MySQL ERD Specification.pdf  Đặc tả sơ đồ database
└── rentsmart_mysql_erd.html          Sơ đồ database dạng HTML
```

Các file trong `frontend/assets/js/pages/` và `frontend/assets/js/admin/` được nạp bởi trang HTML tương ứng; không phải trang nào cũng nạp toàn bộ các file JavaScript. Mỗi trang đặt `data-base` trên thẻ `<body>` (`""` ở thư mục `frontend/`, `"../"` ở thư mục con) để liên kết tới tài nguyên và trang khác không bị sai đường dẫn.

### Backend API theo chức năng

Các controller API cụ thể nằm trong `backend-laravel/app/Http/Controllers/Api/`:

| File | Chức năng |
|---|---|
| `AuthController.php` | Đăng ký, đăng nhập/đăng xuất, yêu cầu và đặt lại mật khẩu |
| `AdminController.php` | Dashboard admin; quản lý tài khoản, tin đăng, báo cáo và nhật ký |
| `LandlordController.php` | Danh sách, tạo/sửa/xóa tin và đổi trạng thái tin của chủ nhà |
| `ProfileController.php` | Cập nhật thông tin cá nhân, ảnh đại diện và mật khẩu |
| `RoomInteractionController.php` | Tin đã lưu, báo cáo tin và nhắn tin cho chủ nhà |
| `PageViewController.php` | Ghi nhận lượt xem và cung cấp báo cáo lưu lượng |

`RoomController.php` ở `app/Http/Controllers/` xử lý dữ liệu phòng công khai. `routes/api.php` ánh xạ URL như `/api/rooms` tới các controller trên. Các API cần đăng nhập được bảo vệ bằng Sanctum; API admin và chủ nhà còn kiểm tra vai trò ở phía server.

### Thư mục Laravel khác

- `app/`: mã nghiệp vụ của ứng dụng. `Models/` mô tả dữ liệu/định danh, `Services/` chứa thao tác dùng chung, `Notifications/` tạo thông báo, `Providers/` đăng ký dịch vụ.
- `bootstrap/`: khởi tạo ứng dụng Laravel. `bootstrap/app.php` cấu hình middleware và xử lý lỗi.
- `config/`: cấu hình mặc định theo từng phần. Thông tin theo máy, như kết nối MySQL và SMTP, đặt trong `.env`, không ghi đè bí mật vào Git.
- `database/`: migration, factory, seeder; **không phải thư mục chứa dữ liệu MySQL đang chạy trong XAMPP**.
- `public/`: điểm vào HTTP của Laravel và file công khai, ví dụ ảnh được lưu ở public disk.
- `resources/`: giao diện Blade và tài nguyên dành cho Vite của Laravel. Website chính hiện đặt riêng trong `frontend/`.
- `storage/`: file sinh khi chạy như log, cache, session và file tải lên.
- `tests/`: các bài kiểm thử tự động.
- `vendor/`: thư viện PHP Composer cài tự động; không chỉnh sửa trực tiếp.
- `package.json` và `vite.config.js`: cấu hình công cụ Vite của skeleton Laravel; không phải nơi chứa mã JavaScript chính của frontend tĩnh.

### Các file tài liệu và cấu hình ở gốc

- `.env` trong `backend-laravel/` chứa cấu hình riêng của máy local, có thể có mật khẩu; không chia sẻ công khai.
- `composer.json` / `composer.lock` quản lý thư viện PHP; `package.json` quản lý công cụ JavaScript.
- `artisan` chạy các lệnh quản lý Laravel như `serve`, `migrate`, `test`.
- `README.md`, file prompt và các sơ đồ ERD giải thích cách chạy, yêu cầu và cấu trúc database; chúng không phải mã xử lý website.

### Đường đi của một yêu cầu

Ví dụ khi mở danh sách phòng: `phong-tro.html` nạp `listing.js` → JavaScript gửi `GET /api/rooms` → `routes/api.php` chuyển request tới `RoomController` → Laravel đọc MySQL → trả JSON → frontend hiển thị danh sách. Tạo/sửa/xóa dữ liệu cũng đi theo luồng tương tự, nhưng cần đăng nhập và kiểm tra vai trò/quyền sở hữu.

> Thư mục `backend-laravel/database/migrations/` chứa **mã lệnh thay đổi bảng**, không chứa database MySQL của XAMPP. Laravel kết nối database theo cấu hình trong `backend-laravel/.env`. Với database RentSmart đã có dữ liệu, không chạy `php artisan migrate:fresh` vì lệnh đó xóa bảng và dữ liệu hiện tại.

## 4. Tính năng

### Người thuê và khách
- **Trang chủ:** hero kèm ô tìm kiếm (từ khóa, quận, mức giá, diện tích), danh mục nhanh, tin nổi bật, quận có nhiều tin, hướng dẫn thuê an toàn.
- **Danh sách:** lọc theo loại, quận (chọn nhiều), khoảng giá (có thanh trượt), diện tích, tiện ích; sắp xếp mới nhất / giá / diện tích; xem dạng lưới hoặc danh sách; phân trang 9 tin mỗi trang. Bộ lọc nằm trong ngăn kéo (offcanvas) trên mobile và được đồng bộ lên URL nên chia sẻ được liên kết.
- **Chi tiết phòng:** thư viện ảnh (carousel, ảnh thu nhỏ, phóng to), thông số, tiện ích, mô tả, **khung bản đồ giữ chỗ** (xem mục 6), thẻ chủ nhà cố định bên cạnh, số điện thoại được che và chỉ hiện đủ khi bấm, nhắn tin cho chủ nhà, báo cáo tin, tin tương tự. Nhắn tin, báo cáo và lưu tin yêu cầu đăng nhập rồi quay lại đúng trang.
- **Tin đã lưu và lịch sử đã xem** theo từng tài khoản; **hồ sơ** cho phép đổi tên, ảnh đại diện, mật khẩu.
- **Đăng ký:** chọn vai trò bằng thẻ, kiểm tra hợp lệ (số điện thoại Việt Nam 10 số, email, mật khẩu tối thiểu 8 ký tự kèm thanh đo độ mạnh, nhập lại khớp, đồng ý điều khoản), chặn trùng tên đăng nhập, email, số điện thoại.

### Chủ nhà
- Dashboard lấy tin và lượt xem của chính chủ nhà từ MySQL.
- Đăng và sửa tin: nhiều ảnh (tối đa 8, tự nén, chọn ảnh bìa), tiện ích, thông tin liên hệ. Tin mới và tin vừa sửa đều về trạng thái **Chờ duyệt**.
- Quản lý tin theo tab trạng thái qua API: sửa, ẩn/hiện lại, đánh dấu đã cho thuê, xóa (có hộp thoại xác nhận). Máy chủ chỉ cho chủ nhà thao tác trên tin của chính mình; tin bị admin gỡ thì không thể tự hiện lại.

### Quản trị viên
- **Tổng quan:** chỉ số chính và biểu đồ (Chart.js).
- **Tài khoản:** tìm, lọc, thêm/sửa, khóa (kèm lý do) / mở khóa, xóa, thao tác hàng loạt, xuất CSV.
- **Tin đăng:** duyệt, từ chối kèm lý do, gỡ, đánh dấu nổi bật, thêm/sửa/xóa tin thay chủ nhà.
- **Báo cáo vi phạm:** xem chi tiết, chuyển trạng thái, xử lý và gỡ tin liên quan.
- **Lưu lượng:** số lượt xem thật được ghi nhận từ các trang công khai; thống kê trang, thiết bị, nguồn và lượt truy cập gần đây. Hệ thống không giả lập CPU, RAM, IP hoặc số người đang online.
- **Nhật ký:** mọi thao tác của admin được ghi lại, có lọc và xuất CSV.

### Trợ lý AI nổi
Có ở mọi trang người dùng (không có ở admin). Phần trả lời hiện là **rule-based**; gợi ý phòng được lọc từ danh sách tin thật qua API Laravel. Lịch sử chat giữ trong `sessionStorage`. Nút liên hệ mở ứng dụng email của người dùng với địa chỉ hỗ trợ và tiêu đề đã điền sẵn; đây chưa phải hệ thống ticket trong ứng dụng.

## 5. API và dữ liệu

- Các endpoint công khai: `GET /api/rooms`, `GET /api/rooms/{id}`, `GET /api/districts`, `GET /api/amenities`.
- Quên/đặt lại mật khẩu: `POST /api/forgot-password` và `POST /api/reset-password`; đổi hồ sơ/mật khẩu yêu cầu token qua `PATCH /api/profile` và `POST /api/profile/password`. Bảng `password_reset_tokens` được bổ sung bằng migration cộng thêm. Cần cấu hình SMTP trong `.env` để gửi email thật; cấu hình mẫu dùng mail log trong môi trường phát triển.
- Xác thực: `POST /api/register`, `POST /api/login`; `GET /api/me` và `POST /api/logout` yêu cầu `Authorization: Bearer <token>`.
- Tin đã lưu, báo cáo và gửi tin nhắn cũng yêu cầu token: `GET /api/saved-rooms`, `POST /api/saved-rooms/{id}/toggle`, `POST /api/rooms/{id}/reports`, `POST /api/rooms/{id}/messages`.
- Chủ nhà quản lý tin qua `/api/landlord/rooms*`; nhóm API yêu cầu Sanctum và vai trò `landlord` được kiểm tra ở server.
- Lượt xem ẩn danh được ghi qua `POST /api/page-views`; không lưu địa chỉ IP. API quản trị tại `/api/admin/*` yêu cầu token Sanctum và vai trò `admin` được kiểm tra ở server.
- Quản trị viên có thể quản lý tài khoản, duyệt tin, xử lý báo cáo và xem nhật ký. Ảnh do admin thêm được lưu trên public disk của Laravel; chạy `php artisan storage:link` một lần trong `backend-laravel` để trình duyệt truy cập ảnh.
- Danh sách công khai chỉ trả tin có trạng thái `approved`. Mật khẩu được băm trên server; Sanctum token được lưu trong `personal_access_tokens`.
- Database hiện có trước Laravel. Các migration đang dùng chỉ bổ sung bảng token Sanctum và `password_reset_tokens`; **không chạy `migrate:fresh`** trên database chứa dữ liệu cần giữ.

## 6. Khung bản đồ ở trang chi tiết

Trong `frontend/chi-tiet.html` (do `frontend/assets/js/pages/detail.js` dựng) có khối `#roomMap`, là khung tỉ lệ 16:9 ở desktop và 4:3 ở mobile, đang hiển thị chữ giữ chỗ. Địa chỉ đầy đủ được đặt sẵn ở thuộc tính `data-address`. Khi tích hợp bản đồ (Google Maps, Leaflet/OpenStreetMap...), chỉ cần khởi tạo bản đồ vào `#roomMap`, thay nội dung giữ chỗ, và dùng `data-address` để định vị hoặc thêm trường tọa độ vào dữ liệu phòng.

## 7. Quy ước giao diện

- Tối giản: một màu chủ đạo cộng các màu trung tính. Màu trạng thái (xanh lá, vàng, đỏ nhạt) chỉ dùng cho badge.
- Bo góc 8–12px, bóng đổ nhẹ, nhiều khoảng trắng.
- Tiền tệ định dạng `3.500.000 đ/tháng`.
- Trợ năng: mọi ảnh có `alt`, nút chỉ có biểu tượng có `aria-label`, có trạng thái focus rõ, độ tương phản chữ trắng trên màu chủ đạo khoảng 5,2:1.

## 8. Bảo mật và giới hạn hiện tại

- API đăng nhập dùng Laravel Sanctum; frontend giữ token trong storage tương ứng với lựa chọn ghi nhớ. API quản trị và API chủ nhà kiểm tra role/ownership ở server.
- Chuyển hướng sau đăng nhập (`?redirect=`) chỉ chấp nhận đường dẫn nội bộ tương đối.
- Nội dung do người dùng nhập luôn được escape trước khi render.
- Tin nhắn, báo cáo, hồ sơ, quản lý tin chủ nhà và đặt lại mật khẩu đều dùng API. Để link đặt lại mật khẩu đến được người dùng, cần cấu hình máy chủ SMTP; mailer mặc định `log` chỉ ghi email vào log Laravel. Lưu lượng chỉ có dữ liệu từ khi bắt đầu triển khai ghi nhận page view.

## 9. Dữ liệu mẫu

`data.js` còn cung cấp ảnh dự phòng cho giao diện cũ; lịch sử xem và lịch sử chat được giữ trên thiết bị. Trang công khai, quản trị, chủ nhà, hồ sơ và các tương tác có tài khoản lấy/ghi dữ liệu nghiệp vụ qua API Laravel; dữ liệu localStorage không còn là nguồn dữ liệu nghiệp vụ cho các luồng đó.
