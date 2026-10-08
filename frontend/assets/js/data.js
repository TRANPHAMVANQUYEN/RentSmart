/* ==========================================================
   RentSmart HCM - data.js
   Dữ liệu mẫu (mock) + lớp truy cập "CSDL" lưu trong localStorage.
   Tất cả danh mục (quận, loại phòng, tiện ích...) đặt TẠI ĐÂY để dễ chỉnh sửa.
   ========================================================== */

// Danh sách khu vực - chỉ TP.HCM. Sau này đổi sang phường/xã chỉ cần sửa mảng này.
const DISTRICTS = [
  'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'TP. Thủ Đức',
  'Huyện Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Cần Giờ'
];

const ROOM_TYPES = {
  'phong-tro': 'Phòng trọ',
  'nha-nguyen-can': 'Nhà nguyên căn',
  'can-ho': 'Căn hộ',
  'o-ghep': 'Ở ghép'
};

// Trạng thái tin: nhãn + kiểu badge (ok | warn | bad | neutral | primary)
const ROOM_STATUS = {
  pending: { label: 'Chờ duyệt', cls: 'warn' },
  approved: { label: 'Đang hiển thị', cls: 'ok' },
  rejected: { label: 'Bị từ chối', cls: 'bad' },
  removed: { label: 'Đã gỡ', cls: 'neutral' },
  rented: { label: 'Đã cho thuê', cls: 'primary' }
};

const USER_ROLES = { tenant: 'Người thuê', landlord: 'Chủ nhà / Môi giới', admin: 'Quản trị viên' };
const USER_STATUS = {
  active: { label: 'Hoạt động', cls: 'ok' },
  locked: { label: 'Bị khóa', cls: 'bad' },
  pending: { label: 'Chờ xác thực', cls: 'warn' }
};

const REPORT_REASONS = {
  'lua-dao': 'Lừa đảo', 'sai-gia': 'Sai giá', 'sai-hinh': 'Sai hình ảnh',
  'spam': 'Spam', 'trung-lap': 'Trùng lặp', 'khac': 'Khác'
};
const REPORT_STATUS = {
  open: { label: 'Chưa xử lý', cls: 'bad' },
  reviewing: { label: 'Đang xem xét', cls: 'warn' },
  done: { label: 'Đã xử lý', cls: 'ok' }
};

const AMENITIES = [
  { id: 1, name: 'Điều hòa', icon: 'bi-snow' },
  { id: 2, name: 'Nội thất đầy đủ', icon: 'bi-lamp' },
  { id: 3, name: 'Tủ lạnh', icon: 'bi-box-seam' },
  { id: 4, name: 'Máy giặt', icon: 'bi-water' },
  { id: 5, name: 'Tivi', icon: 'bi-tv' },
  { id: 6, name: 'Internet', icon: 'bi-wifi' },
  { id: 7, name: 'Ban công', icon: 'bi-sunrise' },
  { id: 8, name: 'WC riêng', icon: 'bi-badge-wc' },
  { id: 9, name: 'Chỗ để xe', icon: 'bi-bicycle' },
  { id: 10, name: 'Bảo vệ 24/7', icon: 'bi-shield-check' },
  { id: 11, name: 'Thang máy', icon: 'bi-building-up' },
  { id: 12, name: 'Nhà bếp', icon: 'bi-fire' },
  { id: 13, name: 'Khóa vân tay', icon: 'bi-fingerprint' },
  { id: 14, name: 'Nước nóng', icon: 'bi-thermometer-sun' },
  { id: 15, name: 'Gác lửng', icon: 'bi-layers' }
];

/* ---------- Dữ liệu gốc (seed) ---------- */
const HOUR = 3600 * 1000;
const iso = hoursAgo => new Date(Date.now() - hoursAgo * HOUR).toISOString();

// [họ tên, tên đăng nhập, vai trò, trạng thái]
const SEED_USERS = [
  ['Quản Trị Viên', 'admin', 'admin', 'active'],
  ['Nguyễn Văn Hùng', 'chunha01', 'landlord', 'active'],
  ['Trần Thị Mai', 'chunha02', 'landlord', 'active'],
  ['Lê Quốc Bảo', 'chunha03', 'landlord', 'active'],
  ['Phạm Thu Hà', 'chunha04', 'landlord', 'active'],
  ['Võ Minh Tuấn', 'chunha05', 'landlord', 'active'],
  ['Đặng Ngọc Lan', 'chunha06', 'landlord', 'active'],
  ['Hoàng Anh Dũng', 'chunha07', 'landlord', 'pending'],
  ['Nguyễn Thị Hoa', 'nguoithue01', 'tenant', 'active'],
  ['Trần Minh Khang', 'nguoithue02', 'tenant', 'active'],
  ['Lê Thanh Tâm', 'nguoithue03', 'tenant', 'active'],
  ['Phạm Gia Huy', 'nguoithue04', 'tenant', 'active'],
  ['Võ Thị Ngọc', 'nguoithue05', 'tenant', 'active'],
  ['Đỗ Quang Vinh', 'nguoithue06', 'tenant', 'locked'],
  ['Bùi Khánh Linh', 'nguoithue07', 'tenant', 'active'],
  ['Huỳnh Đức Thịnh', 'nguoithue08', 'tenant', 'active'],
  ['Ngô Bảo Châu', 'nguoithue09', 'tenant', 'locked'],
  ['Dương Mỹ Duyên', 'nguoithue10', 'tenant', 'active'],
  ['Lý Hoàng Nam', 'nguoithue11', 'tenant', 'pending'],
  ['Mai Thị Thu', 'nguoithue12', 'tenant', 'active']
];

// [chủ tin, loại, tiêu đề, giá, m², quận, địa chỉ, tiện ích, trạng thái, nổi bật, lượt xem, giờ trước, ghi chú trạng thái]
const SEED_ROOMS = [
  [2, 'phong-tro', 'Phòng trọ có ban công, full nội thất gần Hutech', 3500000, 25, 'Bình Thạnh', 'Đường Điện Biên Phủ, Phường 25', '1,2,6,7,8,9,14', 'approved', 1, 820, 3],
  [3, 'can-ho', 'Căn hộ mini 1 phòng ngủ, thang máy, bảo vệ 24/7', 6800000, 35, 'Quận 7', 'Đường Huỳnh Tấn Phát, Phường Tân Thuận Tây', '1,2,3,4,6,8,10,11,14', 'approved', 1, 640, 5],
  [4, 'phong-tro', 'Phòng trọ sạch sẽ, giờ giấc tự do, có gác lửng', 2800000, 22, 'Gò Vấp', 'Đường Quang Trung, Phường 10', '6,8,9,14,15', 'approved', 0, 410, 24],
  [5, 'nha-nguyen-can', 'Nhà nguyên căn 3 phòng ngủ, hẻm xe hơi gần ĐH Quốc gia', 12000000, 60, 'TP. Thủ Đức', 'Đường Võ Văn Ngân, Phường Linh Chiểu', '1,3,4,6,8,9,12,14', 'approved', 1, 530, 26],
  [2, 'o-ghep', 'Tìm nữ ở ghép, phòng có điều hòa gần sân bay', 1500000, 28, 'Tân Bình', 'Đường Hoàng Văn Thụ, Phường 4', '1,6,8,9,14', 'approved', 0, 260, 48],
  [6, 'can-ho', 'Căn hộ dịch vụ trung tâm Quận 1, đầy đủ nội thất', 9500000, 40, 'Quận 1', 'Đường Nguyễn Thị Minh Khai, Phường Bến Thành', '1,2,3,4,5,6,8,10,11,14', 'approved', 1, 905, 70],
  [3, 'phong-tro', 'Phòng khóa vân tay, WC riêng, máy giặt chung', 4200000, 24, 'Phú Nhuận', 'Đường Phan Xích Long, Phường 2', '1,4,6,8,9,13,14', 'approved', 0, 330, 72],
  [7, 'phong-tro', 'Phòng mới xây, thoáng mát, chỗ để xe rộng', 2500000, 20, 'Quận 12', 'Đường Tô Ký, Phường Tân Chánh Hiệp', '6,8,9,14', 'approved', 0, 180, 96],
  [4, 'phong-tro', 'Phòng trọ gần ĐH Bách Khoa, an ninh tốt', 3200000, 20, 'Quận 10', 'Đường Lý Thái Tổ, Phường 9', '1,6,8,10,14', 'approved', 0, 295, 100],
  [5, 'o-ghep', 'Ở ghép nam, gần ĐH Kinh tế Tài chính', 1300000, 18, 'Bình Thạnh', 'Đường Nguyễn Gia Trí, Phường 25', '6,9,14', 'approved', 0, 150, 120],
  [6, 'can-ho', 'Căn hộ 2 phòng ngủ view sông tại Nhà Bè', 8500000, 58, 'Nhà Bè', 'Đường Nguyễn Hữu Thọ, Xã Phước Kiển', '1,2,3,4,5,6,7,8,10,11,14', 'approved', 1, 370, 130],
  [7, 'phong-tro', 'Phòng trọ gần chợ Tân Bình, có nhà bếp', 3000000, 22, 'Tân Bình', 'Đường Cộng Hòa, Phường 13', '1,6,8,9,12,14', 'approved', 0, 220, 140],
  [8, 'nha-nguyen-can', 'Nhà nguyên căn 1 trệt 2 lầu, hẻm 5m', 10500000, 55, 'Gò Vấp', 'Đường Phạm Văn Chiêu, Phường 14', '1,3,4,6,8,9,12,14,15', 'approved', 0, 275, 150],
  [2, 'phong-tro', 'Phòng trọ gần ĐH Công nghiệp, giờ giấc thoải mái', 2200000, 18, 'Gò Vấp', 'Đường Nguyễn Văn Bảo, Phường 4', '6,9,14', 'approved', 0, 310, 160],
  [3, 'can-ho', 'Studio hiện đại, ban công, gần Crescent Mall', 7500000, 32, 'Quận 7', 'Đường Nguyễn Văn Linh, Phường Tân Phong', '1,2,3,4,5,6,7,8,10,11,13,14', 'approved', 1, 450, 170],
  [4, 'phong-tro', 'Phòng trọ công nhân, gần KCN, giá mềm', 1800000, 16, 'Bình Tân', 'Đường Kinh Dương Vương, Phường An Lạc', '8,9,14', 'approved', 0, 140, 180],
  [5, 'phong-tro', 'Phòng trọ Quận 5 gần chợ An Đông, sạch sẽ', 3300000, 21, 'Quận 5', 'Đường An Dương Vương, Phường 9', '1,6,8,9,14', 'approved', 0, 205, 200],
  [6, 'phong-tro', 'Phòng gác cao, cửa sổ lớn gần Công viên Gia Định', 4500000, 28, 'Phú Nhuận', 'Đường Hoàng Minh Giám, Phường 9', '1,2,6,7,8,14,15', 'approved', 0, 265, 220],
  [7, 'o-ghep', 'Chia sẻ phòng 2 người, gần Đầm Sen', 1700000, 25, 'Quận 11', 'Đường Lạc Long Quân, Phường 3', '1,6,8,9,14', 'approved', 0, 120, 240],
  [8, 'phong-tro', 'Phòng mới 100%, giờ giấc tự do, gần Vincom Thủ Đức', 3800000, 26, 'TP. Thủ Đức', 'Đường Kha Vạn Cân, Phường Linh Tây', '1,6,8,9,10,13,14', 'approved', 0, 190, 260],
  [2, 'phong-tro', 'Phòng trọ Quận 4 gần cầu Calmette', 3600000, 23, 'Quận 4', 'Đường Hoàng Diệu, Phường 8', '1,6,8,9,14', 'pending', 0, 0, 2],
  [3, 'can-ho', 'Căn hộ dịch vụ Quận 3 yên tĩnh, có thang máy', 11000000, 45, 'Quận 3', 'Đường Võ Văn Tần, Phường 6', '1,2,3,4,5,6,8,10,11,14', 'pending', 0, 0, 4],
  [4, 'phong-tro', 'Phòng trọ Tân Phú gần Aeon Mall', 2900000, 22, 'Tân Phú', 'Đường Tân Quý, Phường Tân Quý', '6,8,9,14', 'pending', 0, 0, 6],
  [5, 'o-ghep', 'Ở ghép nữ gần Bệnh viện Chợ Rẫy', 1600000, 20, 'Quận 5', 'Đường Nguyễn Chí Thanh, Phường 12', '1,6,14', 'pending', 0, 0, 8],
  [6, 'phong-tro', 'Phòng siêu rẻ 1 triệu, không cần cọc', 1300000, 15, 'Bình Tân', 'Đường Tên Lửa, Phường Bình Trị Đông B', '8,14', 'rejected', 0, 12, 300, 'Thông tin không đúng thực tế, nghi ngờ lừa đảo'],
  [7, 'can-ho', 'Căn hộ giá sốc, cần cọc gấp', 2500000, 50, 'Quận 1', 'Đường Lê Lợi, Phường Bến Nghé', '1,2,6,8', 'rejected', 0, 25, 310, 'Giá thấp bất thường so với thị trường'],
  [8, 'phong-tro', 'Phòng trọ trùng nội dung tin khác', 2700000, 20, 'Hóc Môn', 'Đường Nguyễn Ảnh Thủ, Xã Trung Chánh', '6,8,9', 'removed', 0, 40, 330, 'Tin trùng lặp'],
  [2, 'nha-nguyen-can', 'Nhà cho thuê khu vực Củ Chi (tin quảng cáo)', 6000000, 70, 'Củ Chi', 'Quốc lộ 22, Thị trấn Củ Chi', '8,9,12', 'removed', 0, 33, 340, 'Nội dung spam'],
  [3, 'phong-tro', 'Phòng trọ Quận 8 gần cầu Chữ Y', 2600000, 20, 'Quận 8', 'Đường Phạm Thế Hiển, Phường 5', '6,8,9,14', 'rented', 0, 210, 400],
  [4, 'phong-tro', 'Phòng trọ Quận 6 gần Bến xe Chợ Lớn', 2400000, 19, 'Quận 6', 'Đường Hậu Giang, Phường 6', '6,8,9,14', 'rented', 0, 185, 420]
];

const SEED_DESCRIPTIONS = [
  'Phòng sạch sẽ, thoáng mát, có cửa sổ đón gió tự nhiên. Khu dân cư an ninh, giờ giấc tự do, không chung chủ.',
  'Gần chợ, siêu thị, trạm xe buýt và nhiều quán ăn. Di chuyển thuận tiện vào trung tâm thành phố.',
  'Điện nước giá nhà nước, internet tốc độ cao, có camera an ninh. Chủ nhà thân thiện, hỗ trợ khách thuê lâu dài.',
  'Hợp đồng minh bạch, đặt cọc 1 tháng. Có thể vào ở ngay. Vui lòng liên hệ trước để hẹn giờ xem phòng.'
];

// [mã tin, người báo cáo, lý do, nội dung, trạng thái, giờ trước]
const SEED_REPORTS = [
  [25, 9, 'lua-dao', 'Chủ tin yêu cầu chuyển cọc trước khi xem phòng.', 'open', 5],
  [26, 10, 'sai-gia', 'Giá đăng 2,5 triệu nhưng khi liên hệ báo 6 triệu.', 'open', 9],
  [5, 11, 'sai-hinh', 'Hình ảnh không giống phòng thực tế khi tôi đến xem.', 'reviewing', 30],
  [27, 12, 'trung-lap', 'Tin này trùng với một tin khác của cùng chủ nhà.', 'done', 60],
  [28, 15, 'spam', 'Nội dung quảng cáo, không phải tin cho thuê.', 'done', 90],
  [14, 16, 'sai-gia', 'Giá thực tế cao hơn giá đăng 300 nghìn.', 'open', 20],
  [8, 18, 'khac', 'Chủ nhà không phản hồi sau khi nhận cọc.', 'reviewing', 40],
  [3, 20, 'lua-dao', 'Nghi ngờ tin giả, số điện thoại không liên lạc được.', 'open', 12]
];

const LOG_TEMPLATES = [
  ['Đăng nhập', 'Hệ thống quản trị', 'Đăng nhập thành công'],
  ['Duyệt tin', 'Tin #1', 'Tin hợp lệ'],
  ['Từ chối tin', 'Tin #25', 'Thông tin không đúng thực tế'],
  ['Gỡ tin', 'Tin #27', 'Tin trùng lặp'],
  ['Khóa tài khoản', 'nguoithue06', 'Vi phạm quy định đăng bài'],
  ['Mở khóa tài khoản', 'nguoithue03', 'Đã xác minh lại thông tin'],
  ['Xử lý báo cáo', 'Báo cáo #4', 'Đã gỡ tin trùng lặp'],
  ['Xóa tài khoản', 'user_spam01', 'Tài khoản spam']
];

function buildSeed() {
  const users = SEED_USERS.map((u, i) => {
    const id = i + 1;
    return {
      id, username: u[1], email: `${u[1]}@example.com`, phone: '090000' + String(id).padStart(4, '0'),
      password: u[2] === 'admin' ? 'Admin@123' : 'Demo@1234', fullName: u[0], avatar: '',
      role: u[2], status: u[3], createdAt: iso(24 * (400 - id * 17)), lastLogin: iso(id * 7)
    };
  });
  const rooms = [], room_images = [], room_amenities = [];
  SEED_ROOMS.forEach((r, i) => {
    const id = i + 1;
    const owner = users.find(u => u.id === r[0]);
    rooms.push({
      id, landlordId: r[0], title: r[2], description: SEED_DESCRIPTIONS[i % 4] + ' ' + SEED_DESCRIPTIONS[(i + 1) % 4],
      price: r[3], area: r[4], address: r[6], district: r[5], roomType: r[1], status: r[8], featured: !!r[9],
      views: r[10], contactName: owner.fullName, contactPhone: owner.phone, statusNote: r[12] || '',
      createdAt: iso(r[11]), updatedAt: iso(r[11])
    });
    for (let k = 0; k < 4; k++) {
      room_images.push({ id: id * 10 + k, roomId: id, imageUrl: `https://picsum.photos/seed/room${id}-${k}/800/600`, isPrimary: k === 0 });
    }
    r[7].split(',').forEach(a => room_amenities.push({ roomId: id, amenityId: +a }));
  });
  const reports = SEED_REPORTS.map((r, i) => ({ id: i + 1, roomId: r[0], reporterId: r[1], reason: r[2], content: r[3], status: r[4], createdAt: iso(r[5]), note: '' }));
  const activity_logs = [];
  for (let i = 0; i < 30; i++) {
    const t = LOG_TEMPLATES[i % LOG_TEMPLATES.length];
    activity_logs.push({ id: i + 1, adminId: 1, action: t[0], target: t[1], note: t[2], createdAt: iso(i * 7 + 1) });
  }
  return { users, rooms, room_images, amenities: AMENITIES, room_amenities, reports, activity_logs };
}

/* ---------- Lớp "CSDL" trên localStorage ---------- */
const DB = {
  KEY: 'rs_db_v1',
  data: null,
  init() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { this.data = null; }
    if (!this.data) { this.data = buildSeed(); this.save(); }
    return this;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); return true; }
    catch (e) { if (typeof toast === 'function') toast('Bộ nhớ trình duyệt đã đầy, hãy dùng ảnh nhỏ hơn.', 'error'); return false; }
  },
  reset() { localStorage.removeItem(this.KEY); this.init(); },
  t(table) { return this.data[table]; },
  nextId(table) { return this.data[table].reduce((m, r) => Math.max(m, r.id || 0), 0) + 1; },
  user(id) { return this.data.users.find(u => u.id === +id); },
  room(id) { return this.data.rooms.find(r => r.id === +id); },
  images(roomId) { return this.data.room_images.filter(i => i.roomId === +roomId).sort((a, b) => b.isPrimary - a.isPrimary); },
  cover(roomId) { const im = this.images(roomId)[0]; return im ? im.imageUrl : `https://picsum.photos/seed/rs${roomId}/600/400`; },
  amenitiesOf(roomId) {
    const ids = this.data.room_amenities.filter(a => a.roomId === +roomId).map(a => a.amenityId);
    return this.data.amenities.filter(a => ids.includes(a.id));
  },
  // Ghi nhật ký hoạt động của admin
  log(action, target, note) {
    const me = (typeof Auth !== 'undefined' && Auth.current()) || { id: 1 };
    this.data.activity_logs.unshift({ id: this.nextId('activity_logs'), adminId: me.id, action, target, note: note || '', createdAt: new Date().toISOString() });
    this.save();
  },
  // Xóa tin kèm ảnh và tiện ích liên quan
  deleteRoom(id) {
    id = +id;
    this.data.rooms = this.data.rooms.filter(r => r.id !== id);
    this.data.room_images = this.data.room_images.filter(i => i.roomId !== id);
    this.data.room_amenities = this.data.room_amenities.filter(a => a.roomId !== id);
    this.data.reports = this.data.reports.filter(r => r.roomId !== id);
  }
};
DB.init();
