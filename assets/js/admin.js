/* ==========================================================
   RentSmart HCM - admin.js
   Khung giao diện và các tiện ích dùng chung cho toàn bộ khu vực admin.
   ========================================================== */
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

  function getUrgentCounts() {
    return {
      pendingRooms: DB.t('rooms').filter(r => r.status === 'pending').length,
      openReports: DB.t('reports').filter(r => r.status === 'open').length
    };
  }

  function menuMarkup(activeKey) {
    const counts = getUrgentCounts();
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

  function notificationMarkup() {
    const rooms = DB.t('rooms').filter(r => r.status === 'pending').slice(0, 4);
    const reports = DB.t('reports').filter(r => r.status === 'open').slice(0, 4);
    const list = [];
    rooms.forEach(room => {
      const owner = DB.user(room.landlordId);
      list.push({
        title: `Tin chờ duyệt #${room.id}`,
        text: `${esc(room.title)} · ${owner ? esc(owner.fullName) : 'Không xác định'}`,
        href: 'tin-dang.html'
      });
    });
    reports.forEach(report => {
      const room = DB.room(report.roomId);
      const reporter = DB.user(report.reporterId);
      list.push({
        title: `Báo cáo #${report.id}`,
        text: `${room ? esc(room.title) : 'Tin đã xóa'} · ${reporter ? esc(reporter.fullName) : 'Ẩn danh'}`,
        href: 'bao-cao-vi-pham.html'
      });
    });
    if (!list.length) return '<div class="notify-empty">Không có mục nào cần xử lý ngay.</div>';
    return list.slice(0, 8).map(item => `<a class="dropdown-item notify-item" href="${item.href}">
      <span class="dot" aria-hidden="true"></span>
      <span><strong class="d-block">${item.title}</strong><p>${item.text}</p></span>
    </a>`).join('');
  }

  function mount(activeKey, pageTitle, pageDesc = 'Quản trị dữ liệu và vận hành RentSmart HCM.') {
    const admin = Auth.requireRole(['admin'], 'dang-nhap.html');
    if (!admin) return null;
    document.body.classList.add('admin-body');
    const shell = document.getElementById('admin-shell');
    if (!shell) return null;
    const urgent = getUrgentCounts();
    const totalNotifies = urgent.pendingRooms + urgent.openReports;
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
                  ${totalNotifies ? `<span class="notify-badge">${totalNotifies > 9 ? '9+' : totalNotifies}</span>` : ''}
                </button>
                <div class="dropdown-menu dropdown-menu-end notification-menu">
                  <div class="dropdown-header">Mục cần xử lý ngay</div>
                  ${notificationMarkup()}
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
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
      Auth.logout();
      location.href = 'dang-nhap.html';
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

  function deleteUserCascade(userId) {
    DB.t('rooms').filter(room => room.landlordId === +userId).forEach(room => DB.deleteRoom(room.id));
    DB.data.users = DB.t('users').filter(user => user.id !== +userId);
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
    deleteUserCascade,
    normalizeDateInput,
    dateInRange
  };
})();
