/* ==========================================================
   RentSmart HCM - utils.js
   Hàm tiện ích dùng chung: định dạng, toast, hộp thoại xác nhận,
   thẻ phòng, tìm kiếm phòng, render Header/Footer.
   ========================================================== */
const RS = { base: (document.body && document.body.dataset.base) || '' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Chống XSS: luôn escape nội dung người dùng nhập trước khi chèn vào HTML
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const formatMoney = n => String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const formatPrice = n => `${formatMoney(n)} đ/tháng`;
const pad = n => String(n).padStart(2, '0');
function formatDate(v) { const d = new Date(v); return isNaN(d) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
function formatDateTime(v) { const d = new Date(v); return isNaN(d) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())} ${formatDate(v)}`; }
function timeAgo(v) {
  const m = Math.floor((Date.now() - new Date(v)) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ trước`;
  if (m < 43200) return `${Math.floor(m / 1440)} ngày trước`;
  return formatDate(v);
}
// Bỏ dấu tiếng Việt, dùng để so khớp từ khóa
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const qs = name => new URLSearchParams(location.search).get(name);
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const initials = name => String(name || '?').trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
function avatarHTML(user, cls = '') {
  if (user && user.avatar) {
    const src = typeof Auth !== 'undefined' ? Auth.imageUrl(user.avatar) : user.avatar;
    return `<img class="avatar ${cls}" src="${esc(src)}" alt="Ảnh đại diện ${esc(user.fullName)}">`;
  }
  return `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(user && user.fullName))}</span>`;
}
function badge(map, key) { const s = map[key] || { label: key, cls: 'neutral' }; return `<span class="rs-badge ${s.cls}">${esc(s.label)}</span>`; }

/* ---------- Toast ---------- */
function toast(msg, type = 'success') {
  let wrap = $('.rs-toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'rs-toast-wrap'; wrap.setAttribute('role', 'status'); document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'rs-toast ' + type;
  const icon = type === 'error' ? 'bi-x-circle' : type === 'info' ? 'bi-info-circle' : 'bi-check-circle';
  el.innerHTML = `<i class="bi ${icon}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Hộp thoại xác nhận (Bootstrap modal) ----------
   confirmDialog({title, message, confirmText, danger, reasonLabel, reasonRequired})
   -> Promise<{ok:boolean, reason:string}> */
function confirmDialog(o = {}) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'modal fade';
    el.tabIndex = -1;
    el.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title fs-5">${esc(o.title || 'Xác nhận')}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div>
      <div class="modal-body"><p class="mb-0">${esc(o.message || 'Bạn có chắc chắn muốn thực hiện?')}</p>
        ${o.reasonLabel ? `<label class="form-label mt-3" for="cdReason">${esc(o.reasonLabel)}${o.reasonRequired ? ' <span class="text-danger">*</span>' : ''}</label>
        <textarea id="cdReason" class="form-control" rows="2"></textarea><div class="invalid-feedback">Vui lòng nhập lý do.</div>` : ''}
      </div>
      <div class="modal-footer"><button class="btn btn-light-border" data-bs-dismiss="modal">Hủy</button>
        <button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(o.confirmText || 'Xác nhận')}</button></div>
    </div></div>`;
    document.body.appendChild(el);
    const modal = new bootstrap.Modal(el);
    let result = { ok: false, reason: '' };
    el.querySelector('[data-ok]').onclick = () => {
      const ta = el.querySelector('#cdReason');
      if (ta && o.reasonRequired && !ta.value.trim()) { ta.classList.add('is-invalid'); ta.focus(); return; }
      result = { ok: true, reason: ta ? ta.value.trim() : '' };
      modal.hide();
    };
    el.addEventListener('hidden.bs.modal', () => { el.remove(); resolve(result); });
    modal.show();
  });
}

function downloadCSV(filename, rows) {
  const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Nén ảnh tải lên về tối đa 800px để vừa dung lượng localStorage
function readImage(file, max = 800, quality = .72) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function sortRooms(list, key) {
  const s = [...list];
  if (key === 'gia-tang') s.sort((a, b) => a.price - b.price);
  else if (key === 'gia-giam') s.sort((a, b) => b.price - a.price);
  else if (key === 'dien-tich') s.sort((a, b) => b.area - a.area);
  else s.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return s;
}

/* ---------- Thẻ phòng ---------- */
function roomCardHTML(r, opts = {}) {
  const saved = typeof Auth !== 'undefined' && Auth.isSaved(r.id);
  const link = `${RS.base}chi-tiet.html?id=${r.id}`;
  return `<article class="room-card">
    <div class="room-thumb">
      <a href="${link}" tabindex="-1" aria-hidden="true"><img src="${esc(Auth.imageUrl(r.coverImage || DB.cover(r.id)))}" alt="${esc(r.title)}" loading="lazy"></a>
      <span class="room-type">${esc(ROOM_TYPES[r.roomType])}</span>
      ${r.featured ? '<span class="room-flag"><i class="bi bi-star-fill"></i> Nổi bật</span>' : ''}
      <button class="save-btn ${saved ? 'saved' : ''}" type="button" data-save="${r.id}" aria-label="${saved ? 'Bỏ lưu tin' : 'Lưu tin'}" aria-pressed="${saved}"><i class="bi ${saved ? 'bi-heart-fill' : 'bi-heart'}"></i></button>
    </div>
    <div class="room-body">
      <div class="room-price">${formatMoney(r.price)} đ<small>/tháng</small></div>
      <h3 class="room-title"><a href="${link}">${esc(r.title)}</a></h3>
      <p class="room-desc">${esc(r.description)}</p>
      <div class="room-meta">
        <span><i class="bi bi-aspect-ratio"></i>${r.area} m²</span>
        <span><i class="bi bi-geo-alt"></i>${esc(r.district)}</span>
        <span><i class="bi bi-clock"></i>${timeAgo(r.createdAt)}</span>
      </div>
    </div></article>`;
}
const roomCol = (r, cls = 'col-12 col-sm-6 col-lg-4 col-xl-3') => `<div class="${cls}">${roomCardHTML(r)}</div>`;

// Nút tim: dùng chung cho mọi trang (event delegation)
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-save]');
  if (!btn) return;
  try {
    const res = await Auth.toggleSaved(btn.dataset.save);
    if (res === null) return;
    $$(`[data-save="${btn.dataset.save}"]`).forEach(b => {
      b.classList.toggle('saved', res);
      b.setAttribute('aria-pressed', res);
      const i = b.querySelector('i');
      if (i) i.className = 'bi ' + (res ? 'bi-heart-fill' : 'bi-heart');
    });
    toast(res ? 'Đã lưu tin' : 'Đã bỏ lưu tin');
  } catch (error) {
    toast(error.message, 'error');
  }
});

/* ---------- Header & Footer dùng chung ---------- */
function renderHeader() {
  const host = $('#app-header');
  if (!host) return;
  const b = RS.base, u = Auth.current(), cat = qs('loai');
  const nav = [['phong-tro', 'Phòng trọ'], ['nha-nguyen-can', 'Nhà nguyên căn'], ['can-ho', 'Căn hộ'], ['o-ghep', 'Ở ghép']]
    .map(([k, l]) => `<li class="nav-item"><a class="nav-link ${/phong-tro\.html/.test(location.pathname) && cat === k ? 'active' : ''}" href="${b}phong-tro.html?loai=${k}">${l}</a></li>`).join('');
  let postBtn = `<a href="${b}dang-nhap.html?redirect=${encodeURIComponent('chu-nha/dang-tin.html')}" class="btn btn-primary"><i class="bi bi-plus-circle"></i> Đăng tin</a>`;
  if (u && u.role === 'landlord') postBtn = `<a href="${b}chu-nha/dang-tin.html" class="btn btn-primary"><i class="bi bi-plus-circle"></i> Đăng tin</a>`;
  else if (u) postBtn = `<button type="button" class="btn btn-primary" id="postBlocked"><i class="bi bi-plus-circle"></i> Đăng tin</button>`;
  let account;
  if (u) {
    const items = u.role === 'landlord'
      ? [['chu-nha/tong-quan.html', 'bi-speedometer2', 'Tổng quan'], ['chu-nha/quan-ly-tin.html', 'bi-card-list', 'Tin của tôi'], ['ho-so.html', 'bi-person', 'Hồ sơ']]
      : u.role === 'admin'
        ? [['admin/tong-quan.html', 'bi-speedometer2', 'Trang quản trị']]
        : [['ho-so.html', 'bi-person', 'Hồ sơ'], ['tin-da-luu.html', 'bi-heart', 'Tin đã lưu']];
    account = `<div class="dropdown"><button class="user-chip dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">${avatarHTML(u)}<span>${esc(u.fullName.split(' ').slice(-1)[0])}</span></button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><span class="dropdown-item-text small text-muted">${esc(u.fullName)}<br>${esc(USER_ROLES[u.role])}</span></li><li><hr class="dropdown-divider"></li>
        ${items.map(i => `<li><a class="dropdown-item" href="${b}${i[0]}"><i class="bi ${i[1]} me-2"></i>${i[2]}</a></li>`).join('')}
        <li><button class="dropdown-item" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li></ul></div>`;
  } else {
    account = `<a href="${b}dang-nhap.html" class="btn btn-light-border">Đăng nhập</a><a href="${b}dang-ky.html" class="btn btn-outline-primary">Đăng ký</a>`;
  }
  host.innerHTML = `<header class="site-header"><nav class="navbar navbar-expand-lg" aria-label="Điều hướng chính"><div class="container">
    <a class="brand" href="${b}index.html" aria-label="RentSmart - Trang chủ"><span class="brand-icon"><i class="bi bi-house-heart-fill"></i></span><span>Rent<span>Smart</span></span></a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Mở menu"><i class="bi bi-list fs-3"></i></button>
    <div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-lg-4 me-auto">${nav}</ul>
      <div class="header-actions">${postBtn}${account}</div></div></div></nav></header>`;
  const out = $('#logoutBtn');
  if (out) out.onclick = async () => {
    try {
      await Auth.logout();
      location.href = b + 'index.html';
    } catch (error) {
      toast(error.message, 'error');
    }
  };
  const blocked = $('#postBlocked');
  if (blocked) blocked.onclick = () => toast('Chỉ tài khoản Chủ nhà / Môi giới mới đăng được tin.', 'info');
}

function renderFooter() {
  const host = $('#app-footer');
  if (!host) return;
  const b = RS.base;
  host.innerHTML = `<footer class="site-footer"><div class="container"><div class="row g-4">
    <div class="col-12 col-lg-5"><a class="brand mb-2" href="${b}index.html"><span class="brand-icon"><i class="bi bi-house-heart-fill"></i></span><span>Rent<span>Smart</span></span></a>
      <p class="mb-0">Nền tảng hỗ trợ tìm và đăng tin cho thuê phòng trọ tại TP. Hồ Chí Minh, minh bạch và an toàn.</p></div>
    <div class="col-6 col-lg-3"><h4>Chính sách</h4><ul><li><a href="#">Chính sách bảo mật</a></li><li><a href="#">Quy định sử dụng</a></li></ul></div>
    <div class="col-6 col-lg-4"><h4>Liên hệ</h4><ul><li><i class="bi bi-envelope me-1"></i> support@rentsmart.vn</li><li><i class="bi bi-telephone me-1"></i> 1900 0000</li><li><i class="bi bi-geo-alt me-1"></i> TP. Hồ Chí Minh</li></ul></div>
  </div><div class="footer-bottom">© ${new Date().getFullYear()} RentSmart HCM. Bảo lưu mọi quyền.</div></div></footer>`;
}

// Danh sách <option> cho các ô chọn quận
const districtOptions = (all = 'Tất cả', useIds = false) => {
  const districts = DB.data.districts && DB.data.districts.length ? DB.data.districts : DISTRICTS;
  return `<option value="">${all}</option>` + districts.map(d => {
    const name = typeof d === 'string' ? d : d.name;
    const value = useIds && typeof d !== 'string' ? d.id : name;
    return `<option value="${esc(value)}">${esc(name)}</option>`;
  }).join('');
};

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  Auth.syncSaved().catch(error => console.warn('Không thể đồng bộ danh sách tin đã lưu:', error));
});

// Ghi nhận page view ẩn danh; không gửi địa chỉ IP hoặc thông tin định danh.
function trackPageView() {
  if (typeof Auth === 'undefined' || /\/admin\//i.test(location.pathname)) return;
  const roomId = new URLSearchParams(location.search).get('id');
  const width = window.innerWidth;
  const device = width < 576 ? 'mobile' : width < 992 ? 'tablet' : 'desktop';
  let source = '';
  try {
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      source = referrer.origin === location.origin ? referrer.pathname : 'external';
    }
  } catch (error) {
    console.warn('Không thể xác định nguồn truy cập trang.', error);
  }
  fetch(`${Auth.API_BASE}/page-views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      path: location.pathname.slice(0, 255),
      roomId: roomId && /^\d+$/.test(roomId) ? Number(roomId) : null,
      device,
      source: source || null
    }),
    keepalive: true
  }).then(response => {
    if (!response.ok) console.warn(`Không ghi nhận được lượt truy cập (HTTP ${response.status}).`);
  }).catch(error => console.warn('Không thể gửi lượt truy cập đến máy chủ.', error));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackPageView, { once: true });
else trackPageView();
