/* ==========================================================
   RentSmart HCM - auth.js
   Đăng nhập / đăng ký / phân quyền bằng localStorage (CHỈ DÙNG CHO DEMO).
   Mật khẩu thật phải được băm ở backend, không bao giờ lưu thô.
   ========================================================== */
const Auth = {
  SESSION_KEY: 'rs_session',

  // Người dùng hiện tại (đọc từ localStorage nếu "ghi nhớ", ngược lại từ sessionStorage)
  current() {
    const raw = localStorage.getItem(this.SESSION_KEY) || sessionStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;
    const u = DB.user(+raw);
    return u && u.status !== 'locked' ? u : null;
  },

  login(identifier, password, remember) {
    const id = String(identifier).trim().toLowerCase();
    const u = DB.t('users').find(x => x.username.toLowerCase() === id || x.email.toLowerCase() === id || x.phone === id);
    if (!u || u.password !== password) return { ok: false, error: 'Sai tài khoản hoặc mật khẩu.' };
    if (u.status === 'locked') return { ok: false, error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.' };
    (remember ? localStorage : sessionStorage).setItem(this.SESSION_KEY, u.id);
    u.lastLogin = new Date().toISOString();
    DB.save();
    if (u.role === 'admin') DB.log('Đăng nhập', 'Hệ thống quản trị', 'Đăng nhập thành công');
    return { ok: true, user: u };
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  // Trang chủ theo vai trò (đường dẫn tính từ thư mục gốc)
  homeFor(role) {
    return role === 'admin' ? 'admin/tong-quan.html' : role === 'landlord' ? 'chu-nha/tong-quan.html' : 'index.html';
  },

  // Chỉ chấp nhận redirect là đường dẫn tương đối nội bộ (tránh open redirect)
  safeRedirect(url) {
    return url && /^[\w\-./?=&%]+$/.test(url) && !url.includes('..') && !url.startsWith('/') ? url : '';
  },

  register(d) {
    if (!['tenant', 'landlord'].includes(d.role)) return { ok: false, error: 'Vai trò không hợp lệ.' };
    const users = DB.t('users');
    if (users.some(u => u.username.toLowerCase() === d.username.toLowerCase())) return { ok: false, field: 'username', error: 'Tên đăng nhập đã tồn tại.' };
    if (users.some(u => u.email.toLowerCase() === d.email.toLowerCase())) return { ok: false, field: 'email', error: 'Email đã được sử dụng.' };
    if (users.some(u => u.phone === d.phone)) return { ok: false, field: 'phone', error: 'Số điện thoại đã được sử dụng.' };
    users.push({
      id: DB.nextId('users'), username: d.username, email: d.email, phone: d.phone, password: d.password,
      fullName: d.fullName, avatar: '', role: d.role, status: 'active', createdAt: new Date().toISOString(), lastLogin: '',
      managedRooms: d.managedRooms || '', activeArea: d.activeArea || ''
    });
    DB.save();
    return { ok: true };
  },

  // Bảo vệ trang theo vai trò. Không đủ quyền -> chuyển về trang đăng nhập.
  requireRole(roles, loginPage) {
    const u = this.current();
    if (u && roles.includes(u.role)) return u;
    const base = (document.body.dataset.base || '');
    const back = location.pathname.split('/').slice(-(base.split('../').length)).join('/') + location.search;
    location.replace(loginPage || `${base}dang-nhap.html?redirect=${encodeURIComponent(back)}`);
    return null;
  },

  /* ----- Tin đã lưu & đã xem (theo từng người dùng) ----- */
  _key(kind) { const u = this.current(); return u ? `rs_${kind}_${u.id}` : null; },
  _list(kind) { const k = this._key(kind); try { return k ? JSON.parse(localStorage.getItem(k)) || [] : []; } catch (e) { return []; } },
  saved() { return this._list('saved'); },
  isSaved(id) { return this.saved().includes(+id); },
  // Trả về true/false (trạng thái mới) hoặc null nếu phải đăng nhập
  toggleSaved(id) {
    id = +id;
    if (!this.current()) {
      const base = document.body.dataset.base || '';
      const here = location.pathname.split('/').pop() + location.search;
      location.href = `${base}dang-nhap.html?redirect=${encodeURIComponent(base ? here : (here || 'index.html'))}`;
      return null;
    }
    const list = this.saved();
    const i = list.indexOf(id);
    i >= 0 ? list.splice(i, 1) : list.unshift(id);
    localStorage.setItem(this._key('saved'), JSON.stringify(list));
    return i < 0;
  },
  viewed() { return this._list('viewed'); },
  addViewed(id) {
    const k = this._key('viewed');
    if (!k) return;
    const list = this.viewed().filter(x => x !== +id);
    list.unshift(+id);
    localStorage.setItem(k, JSON.stringify(list.slice(0, 12)));
  }
};
