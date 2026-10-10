/* ==========================================================
   RentSmart HCM - admin.js
   Khung giao diện và các tiện ích dùng chung cho toàn bộ khu vực admin.
   ========================================================== */
const AdminAPI = {
  imageUrl(value) {
    return Auth.imageUrl(value);
  },
  async request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return Auth.request(`admin/${path}`, { ...options, headers });
  },
  async hydrate(tables, root) {
    const endpoints = {
      users: ['admin/users', true],
      rooms: ['admin/rooms', true],
      reports: ['admin/reports', true],
      activity_logs: ['admin/activity-logs', true],
      districts: ['districts', false],
      amenities: ['amenities', false]
    };
    try {
      const entries = await Promise.all(tables.map(async table => {
        const [endpoint, isAdmin] = endpoints[table];
        const result = isAdmin ? await this.request(endpoint.slice(6)) : await Auth.request(endpoint);
        return [table, result];
      }));
      entries.forEach(([table, rows]) => {
        if (table === 'rooms') {
          rows.forEach(room => {
            room.featured = Boolean(Number(room.featured));
            room.coverImage = this.imageUrl(room.coverImage || '');
            room.contactName = room.ownerName;
            room.images = (room.images || []).map(image => ({
              roomId: room.id,
              imageUrl: this.imageUrl(image.imageUrl),
              isPrimary: Boolean(Number(image.isPrimary))
            }));
            room.amenityIds = (room.amenityIds || []).map(Number);
          });
          DB.data.rooms = rows;
          DB.data.room_images = rows.flatMap(room => room.images.map((image, index) => ({ ...image, id: index + 1 })));
          DB.data.room_amenities = rows.flatMap(room => room.amenityIds.map(amenityId => ({ roomId: room.id, amenityId })));
        } else if (table === 'activity_logs') {
          DB.data.activity_logs = rows.map(log => ({ ...log, admin: { fullName: log.adminName || 'Không xác định' } }));
        } else {
          DB.data[table] = rows;
        }
      });
      return true;
    } catch (error) {
      root.innerHTML = `<div class="alert alert-danger" role="alert">
        <strong>Không tải được dữ liệu quản trị.</strong> ${esc(error.message)}
        <button type="button" class="btn btn-sm btn-outline-danger ms-2" data-admin-retry>Thử lại</button>
      </div>`;
      root.querySelector('[data-admin-retry]').addEventListener('click', () => this.hydrate(tables, root).then(ok => {
        if (ok) window.location.reload();
      }));
      return false;
    }
  },
  write(method, path, payload) {
    return this.request(path, { method, body: JSON.stringify(payload) });
  }
};

const AdminUI = (() => {
  const MENU = [
    { key: 'tong-quan', label: 'Tổng quan', icon: 'bi-speedometer2', href: 'tong-quan.html' },
    { key: 'tai-khoan', label: 'Tài khoản', icon: 'bi-people', href: 'tai-khoan.html' },
    { key: 'tin-dang', label: 'Tin đăng', icon: 'bi-card-list', href: 'tin-dang.html' },
    { key: 'bao-cao', label: 'Báo cáo vi phạm', icon: 'bi-flag', href: 'bao-cao-vi-pham.html' },
    { key: 'luu-luong', label: 'Lưu lượng & Mạng', icon: 'bi-activity', href: 'luu-luong.html' },
    { key: 'nhat-ky', label: 'Nhật ký hoạt động', icon: 'bi-journal-text', href: 'nhat-ky.html' }
  ];

  const CHART_COLORS = {
    primary: '#c2410c',
    primarySoft: '#fb923c',
    primaryLight: '#fdba74',
    stone: '#a8a29e',
    stoneLight: '#d6d3d1',
    grid: '#ebe7e3'
  };

  function menuMarkup(activeKey, counts = { pendingRooms: 0, openReports: 0 }) {
    return MENU.map(item => {
      let badgeText = '';
      if (item.key === 'tin-dang' && counts.pendingRooms) badgeText = String(counts.pendingRooms);
      if (item.key === 'bao-cao' && counts.openReports) badgeText = String(counts.openReports);
      return `<a href="${item.href}" class="${item.key === activeKey ? 'active' : ''}">
        <span class="nav-main"><i class="bi ${item.icon}" aria-hidden="true"></i><span>${item.label}</span></span>
        ${badgeText ? `<span class="menu-badge">${badgeText}</span>` : ''}
      </a>`;
    }).join('');
  }

  function mount(activeKey, pageTitle, pageDesc = 'Quản trị dữ liệu và vận hành RentSmart HCM.') {
    const admin = Auth.requireRole(['admin'], 'dang-nhap.html');
    if (!admin) return null;
    document.body.classList.add('admin-body');
    const shell = document.getElementById('admin-shell');
    if (!shell) return null;
    shell.innerHTML = `<div class="admin-layout">
      <aside class="admin-sidebar" aria-label="Điều hướng quản trị">
        <div class="admin-brand">
          <span class="brand-icon"><i class="bi bi-shield-lock"></i></span>
          <div><strong>RentSmart Admin</strong><small>Hệ thống quản trị nội bộ</small></div>
        </div>
        <nav class="admin-nav">${menuMarkup(activeKey)}</nav>
        <div class="admin-sidebar-footer">
          <small><i class="bi bi-person-badge me-1"></i>${esc(admin.fullName)}</small>
        </div>
      </aside>
      <div class="overlay-backdrop" data-sidebar-close></div>
      <div class="admin-main">
        <header class="admin-topbar">
          <div class="admin-topbar-inner">
            <button type="button" class="sidebar-toggle" aria-label="Mở menu quản trị" data-sidebar-toggle><i class="bi bi-list fs-4"></i></button>
            <div class="quick-search">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input id="adminQuickSearch" type="search" class="form-control" placeholder="Tìm nhanh tài khoản, tin đăng, báo cáo..." aria-label="Tìm nhanh trong trang quản trị">
            </div>
            <div class="topbar-actions">
              <div class="dropdown">
                <button class="icon-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Thông báo quản trị">
                  <i class="bi bi-bell"></i>
                  <span class="notify-badge d-none" data-notify-count></span>
                </button>
                <div class="dropdown-menu dropdown-menu-end notification-menu">
                  <div class="dropdown-header">Mục cần xử lý ngay</div>
                  <div data-notify-list><div class="notify-empty">Đang tải thông báo…</div></div>
                </div>
              </div>
              <div class="dropdown">
                <button class="topbar-user dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  ${avatarHTML(admin)}
                  <span class="d-none d-sm-inline">${esc(admin.fullName.split(' ').slice(-2).join(' '))}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><span class="dropdown-item-text small text-muted">${esc(admin.username)} · Quản trị viên</span></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button class="dropdown-item" type="button" id="adminLogoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
                </ul>
              </div>
            </div>
          </div>
        </header>
        <main class="admin-page" id="admin-page-content">
          <div class="page-heading">
            <div>
              <h1>${esc(pageTitle)}</h1>
              <p>${esc(pageDesc)}</p>
            </div>
            <div class="page-tools" id="admin-page-tools"></div>
          </div>
          <div id="admin-page-body"></div>
        </main>
      </div>
    </div>`;

    document.title = `${pageTitle} – RentSmart Admin`;
    document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
      try {
        await Auth.logout();
        location.href = 'dang-nhap.html';
      } catch (error) {
        toast(error.message, 'error');
      }
    });
    const toggle = shell.querySelector('[data-sidebar-toggle]');
    const closeBackdrop = shell.querySelector('[data-sidebar-close]');
    if (toggle) toggle.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    if (closeBackdrop) closeBackdrop.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 992) document.body.classList.remove('sidebar-open');
    });

    const quick = document.getElementById('adminQuickSearch');
    const emitQuickSearch = debounce(value => {
      window.dispatchEvent(new CustomEvent('admin:quick-search', { detail: String(value || '').trim() }));
    }, 220);
    quick.addEventListener('input', e => emitQuickSearch(e.target.value));

    Auth.request('admin/dashboard').then(data => {
      const counts = { pendingRooms: data.counts.pendingRooms || 0, openReports: data.counts.openReports || 0 };
      const nav = shell.querySelector('.admin-nav');
      if (nav) nav.innerHTML = menuMarkup(activeKey, counts);
      const badge = shell.querySelector('[data-notify-count]');
      const total = counts.pendingRooms + counts.openReports;
      if (badge) {
        badge.textContent = total > 9 ? '9+' : String(total);
        badge.classList.toggle('d-none', total === 0);
      }
      const items = [];
      (data.pendingRooms || []).forEach(room => items.push(`<a class="dropdown-item notify-item" href="tin-dang.html"><span class="dot" aria-hidden="true"></span><span><strong class="d-block">Tin chờ duyệt #${room.id}</strong><p>${esc(room.title)} · ${esc(room.ownerName || '')}</p></span></a>`));
      (data.openReports || []).forEach(report => items.push(`<a class="dropdown-item notify-item" href="bao-cao-vi-pham.html"><span class="dot" aria-hidden="true"></span><span><strong class="d-block">Báo cáo #${report.id}</strong><p>${esc(report.roomTitle || 'Tin đã xóa')} · ${esc(report.reporterName || 'Ẩn danh')}</p></span></a>`));
      const list = shell.querySelector('[data-notify-list]');
      if (list) list.innerHTML = items.length ? items.slice(0, 8).join('') : '<div class="notify-empty">Không có mục nào cần xử lý ngay.</div>';
    }).catch(error => {
      const list = shell.querySelector('[data-notify-list]');
      if (list) list.innerHTML = `<div class="notify-empty">${esc(error.message)}</div>`;
    });

    return {
      admin,
      shell,
      content: document.getElementById('admin-page-body'),
      tools: document.getElementById('admin-page-tools')
    };
  }

  function openModal({ title = 'Chi tiết', body = '', footer = '', size = 'lg', scrollable = false } = {}) {
    const el = document.createElement('div');
    el.className = 'modal fade';
    el.tabIndex = -1;
    el.innerHTML = `<div class="modal-dialog modal-${size} ${scrollable ? 'modal-dialog-scrollable' : ''} modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5">${esc(title)}</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer || '<button type="button" class="btn btn-light-border" data-bs-dismiss="modal">Đóng</button>'}</div>
      </div>
    </div>`;
    document.body.appendChild(el);
    const modal = new bootstrap.Modal(el);
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
    return {
      el,
      modal,
      body: el.querySelector('.modal-body'),
      footer: el.querySelector('.modal-footer'),
      close() { modal.hide(); }
    };
  }

  function toggleSort(state, key) {
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      state.sortKey = key;
      state.sortDir = 'asc';
    }
  }

  function sortHeader(label, key, state, className = '') {
    const active = state.sortKey === key;
    const icon = active ? (state.sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up';
    const aria = active ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
    return `<th scope="col" class="${className}" aria-sort="${aria}"><button class="table-sort ${active ? 'active' : ''}" type="button" data-sort="${key}" aria-label="Sắp xếp theo ${esc(label)}">${label}<i class="bi ${icon}" aria-hidden="true"></i></button></th>`;
  }

  function sortData(items, state, accessors) {
    const getter = accessors[state.sortKey];
    if (!getter) return [...items];
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      if (av instanceof Date && bv instanceof Date) return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'vi', { sensitivity: 'base', numeric: true }) * dir;
    });
  }

  function paginate(items, state) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    const start = (state.page - 1) * state.perPage;
    return {
      totalItems,
      totalPages,
      start: totalItems ? start + 1 : 0,
      end: Math.min(totalItems, start + state.perPage),
      items: items.slice(start, start + state.perPage)
    };
  }

  function paginationHTML(pageInfo, state) {
    if (pageInfo.totalPages <= 1) {
      return `<div class="pagination-wrap"><small class="text-muted">Hiển thị ${pageInfo.start}-${pageInfo.end} / ${pageInfo.totalItems} mục</small></div>`;
    }
    const buttons = [];
    const pages = [];
    for (let i = 1; i <= pageInfo.totalPages; i++) pages.push(i);
    const visible = pages.filter(i => i === 1 || i === pageInfo.totalPages || Math.abs(i - state.page) <= 1);
    let last = 0;
    visible.forEach(i => {
      if (i - last > 1) buttons.push('<li class="page-item disabled"><span class="page-link">…</span></li>');
      buttons.push(`<li class="page-item ${i === state.page ? 'active' : ''}"><button type="button" class="page-link" data-page="${i}">${i}</button></li>`);
      last = i;
    });
    return `<div class="pagination-wrap">
      <small class="text-muted">Hiển thị ${pageInfo.start}-${pageInfo.end} / ${pageInfo.totalItems} mục</small>
      <nav aria-label="Phân trang"><ul class="pagination">
        <li class="page-item ${state.page === 1 ? 'disabled' : ''}"><button type="button" class="page-link" data-page="${state.page - 1}">Trước</button></li>
        ${buttons.join('')}
        <li class="page-item ${state.page === pageInfo.totalPages ? 'disabled' : ''}"><button type="button" class="page-link" data-page="${state.page + 1}">Sau</button></li>
      </ul></nav>
    </div>`;
  }

  function skeletonRows(columns, rows = 6) {
    return Array.from({ length: rows }, () => `<tr>${Array.from({ length: columns }, () => '<td><span class="skeleton skeleton-line d-block"></span></td>').join('')}</tr>`).join('');
  }

  function renderTableLoading(container, columns, minWidth = 980) {
    container.innerHTML = `<div class="table-wrap"><table class="table align-middle skeleton-table" style="min-width:${minWidth}px"><tbody>${skeletonRows(columns)}</tbody></table></div>`;
  }

  function emptyState(title, desc, icon = 'bi-inbox') {
    return `<div class="empty-state compact"><i class="bi ${icon}" aria-hidden="true"></i><h3>${esc(title)}</h3><p class="mb-0 text-muted">${esc(desc)}</p></div>`;
  }

  function bindSortAndPagination(container, state, callback) {
    container.querySelectorAll('[data-sort]').forEach(btn => btn.addEventListener('click', () => {
      toggleSort(state, btn.dataset.sort);
      callback();
    }));
    container.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => {
      const next = +btn.dataset.page;
      if (!Number.isNaN(next) && next > 0) {
        state.page = next;
        callback();
      }
    }));
  }

  function setMasterCheckbox(container, selector = '.row-select[data-id]') {
    const master = container.querySelector('.row-select-all');
    if (!master) return;
    const rows = [...container.querySelectorAll(selector)];
    master.checked = rows.length > 0 && rows.every(el => el.checked);
    master.indeterminate = rows.some(el => el.checked) && !master.checked;
  }

  function ownerRoomCount(userId) {
    return DB.t('rooms').filter(room => room.landlordId === +userId).length;
  }

  function reportCountForRoom(roomId) {
    return DB.t('reports').filter(report => report.roomId === +roomId && report.status !== 'done').length;
  }

  function canDangerOnUser(user, currentUser = Auth.current()) {
    return !!user && user.role !== 'admin' && currentUser && user.id !== currentUser.id;
  }

  function normalizeDateInput(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function dateInRange(value, from, to) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    if (from && date < from) return false;
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  }

  return {
    MENU,
    CHART_COLORS,
    mount,
    openModal,
    sortHeader,
    sortData,
    paginate,
    paginationHTML,
    renderTableLoading,
    emptyState,
    bindSortAndPagination,
    setMasterCheckbox,
    ownerRoomCount,
    reportCountForRoom,
    canDangerOnUser,
    normalizeDateInput,
    dateInRange
  };
})();
