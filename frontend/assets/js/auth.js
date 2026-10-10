/* ==========================================================
   RentSmart HCM - auth.js
   Đăng nhập / đăng ký qua Laravel API với token Sanctum.
   ========================================================== */
const Auth = {
  SESSION_KEY: 'rs_session',
  TOKEN_KEY: 'rs_token',
  API_BASE: 'http://127.0.0.1:8001/api',
  savedSync: null,

  imageUrl(value) {
    if (!value) return value;
    if (typeof value !== 'string') return value;
    if (/^https?:\/\//i.test(value) || /^(data|blob):/i.test(value)) return value;
    if (!value.startsWith('/storage/')) return value;
    return new URL(value, new URL(this.API_BASE).origin).href;
  },

  // Dữ liệu hồ sơ chỉ dùng để hiển thị; quyền truy cập API luôn được kiểm tra ở backend.
  current() {
    const raw = localStorage.getItem(this.SESSION_KEY) || sessionStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user && user.id && user.status !== 'locked' ? user : null;
    } catch (error) {
      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  },

  token() {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY) || '';
  },

  saveCurrent(user) {
    const storage = localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    const token = this.token();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${this.API_BASE}/${path}`, { ...options, headers });
    const result = await response.json();
    const validationMessage = result.errors && Object.values(result.errors).flat()[0];
    if (!response.ok) throw new Error(validationMessage || result.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    return result;
  },

  async login(identifier, password, remember) {
    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identifier: String(identifier).trim(), password })
      });
      const result = await response.json();
      if (!response.ok) return { ok: false, error: result.message || 'Không thể đăng nhập.' };
      if (!result.token || !result.user) throw new Error('Phản hồi đăng nhập từ máy chủ không hợp lệ.');

      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem(this.SESSION_KEY);
      otherStorage.removeItem(this.TOKEN_KEY);
      storage.setItem(this.SESSION_KEY, JSON.stringify(result.user));
      storage.setItem(this.TOKEN_KEY, result.token);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, error: error.message || 'Không kết nối được máy chủ.' };
    }
  },

  async logout() {
    const token = this.token();
    let failure = null;
    try {
      if (token) {
        const response = await fetch(`${this.API_BASE}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        if (!response.ok) failure = new Error(`Máy chủ từ chối đăng xuất (HTTP ${response.status}).`);
      }
    } catch (error) {
      failure = new Error('Không thể kết nối máy chủ để thu hồi token đăng nhập.');
    } finally {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
    if (failure) throw failure;
  },

  async register(d) {
    try {
      const response = await fetch(`${this.API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          username: d.username,
          email: d.email,
          phone: d.phone,
          password: d.password,
          fullName: d.fullName,
          role: d.role
        })
      });
      const result = await response.json();
      if (response.ok) return { ok: true };
      const field = result.errors ? Object.keys(result.errors)[0] : '';
      return {
        ok: false,
        field: field === 'fullName' ? 'fullName' : field,
        error: field ? result.errors[field][0] : (result.message || 'Không thể đăng ký.')
      };
    } catch (error) {
      return { ok: false, error: error.message || 'Không kết nối được máy chủ.' };
    }
  },

  // Trang chủ theo vai trò (đường dẫn tính từ thư mục gốc)
  homeFor(role) {
    return role === 'admin' ? 'admin/tong-quan.html' : role === 'landlord' ? 'chu-nha/tong-quan.html' : 'index.html';
  },

  // Chỉ chấp nhận redirect là đường dẫn tương đối nội bộ (tránh open redirect)
  safeRedirect(url) {
    return url && /^[\w\-./?=&%]+$/.test(url) && !url.includes('..') && !url.startsWith('/') ? url : '';
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
  async syncSaved() {
    const user = this.current();
    if (!user || !['tenant', 'landlord'].includes(user.role)) return;
    if (!this.savedSync) {
      this.savedSync = this.request('saved-rooms').then(rooms => {
        const ids = rooms.map(room => Number(room.id));
        localStorage.setItem(this._key('saved'), JSON.stringify(ids));
        document.querySelectorAll('[data-save]').forEach(button => {
          const saved = ids.includes(Number(button.dataset.save));
          button.classList.toggle('saved', saved);
          button.setAttribute('aria-pressed', String(saved));
          const icon = button.querySelector('i');
          if (icon) icon.className = `bi ${saved ? 'bi-heart-fill' : 'bi-heart'}`;
          button.setAttribute('aria-label', saved ? 'Bỏ lưu tin' : 'Lưu tin');
        });
        return ids;
      }).finally(() => { this.savedSync = null; });
    }
    return this.savedSync;
  },
  // Trả về true/false (trạng thái mới) hoặc null nếu phải đăng nhập
  async toggleSaved(id) {
    id = +id;
    if (!this.current()) {
      const base = document.body.dataset.base || '';
      const here = location.pathname.split('/').pop() + location.search;
      location.href = `${base}dang-nhap.html?redirect=${encodeURIComponent(base ? here : (here || 'index.html'))}`;
      return null;
    }
    await this.syncSaved();
    const result = await this.request(`saved-rooms/${id}/toggle`, { method: 'POST' });
    const list = this.saved().filter(savedId => savedId !== id);
    if (result.saved) list.unshift(id);
    localStorage.setItem(this._key('saved'), JSON.stringify(list));
    return Boolean(result.saved);
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
