/* ==========================================================
   RentSmart HCM - admin/tin-dang.js
   Quản lý và kiểm duyệt tin đăng của toàn hệ thống.
   ========================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  const shell = AdminUI.mount('tin-dang', 'Quản lý & kiểm duyệt tin');
  if (!shell) return;
  const root = shell.content;
  shell.tools.innerHTML = `<button type="button" class="btn btn-primary" id="addRoomForOwnerBtn"><i class="bi bi-plus-circle"></i> Đăng tin mới thay mặt chủ nhà</button>`;

  const state = {
    tab: 'all',
    search: '',
    district: '',
    roomType: '',
    price: '',
    from: '',
    to: '',
    page: 1,
    perPage: 10,
    sortKey: 'createdAt',
    sortDir: 'desc',
    selected: new Set()
  };

  window.addEventListener('admin:quick-search', e => {
    state.search = e.detail || '';
    state.page = 1;
    const input = root.querySelector('#listingSearch');
    if (input) input.value = state.search;
    render(false);
  });

  function roomCounts() {
    const rooms = DB.t('rooms');
    return {
      all: rooms.length,
      pending: rooms.filter(room => room.status === 'pending').length,
      approved: rooms.filter(room => room.status === 'approved').length,
      rejected: rooms.filter(room => room.status === 'rejected').length,
      removed: rooms.filter(room => room.status === 'removed').length,
      today: rooms.filter(room => formatDate(room.createdAt) === formatDate(new Date())).length,
      rented: rooms.filter(room => room.status === 'rented').length
    };
  }

  function priceMatch(room) {
    if (!state.price) return true;
    const value = room.price;
    const ranges = {
      '0-3000000': value < 3000000,
      '3000000-5000000': value >= 3000000 && value <= 5000000,
      '5000000-7000000': value > 5000000 && value <= 7000000,
      '7000000-10000000': value > 7000000 && value <= 10000000,
      '10000000+': value > 10000000
    };
    return !!ranges[state.price];
  }

  function listingRows() {
    const from = AdminUI.normalizeDateInput(state.from);
    const to = AdminUI.normalizeDateInput(state.to);
    return DB.t('rooms')
      .map(room => ({
        ...room,
        owner: DB.user(room.landlordId),
        reportCount: DB.t('reports').filter(report => report.roomId === room.id && report.status !== 'done').length
      }))
      .filter(room => {
        if (state.tab !== 'all' && room.status !== state.tab) return false;
        const keyword = norm(state.search);
        if (keyword && !norm(`${room.title} ${room.owner ? room.owner.fullName : ''} ${room.district}`).includes(keyword)) return false;
        if (state.district && room.district !== state.district) return false;
        if (state.roomType && room.roomType !== state.roomType) return false;
        if (!priceMatch(room)) return false;
        if ((from || to) && !AdminUI.dateInRange(room.createdAt, from, to)) return false;
        return true;
      });
  }

  function roomAccessors() {
    return {
      title: room => norm(room.title),
      owner: room => norm(room.owner ? room.owner.fullName : ''),
      district: room => norm(room.district),
      price: room => room.price,
      area: room => room.area,
      createdAt: room => new Date(room.createdAt),
      status: room => ROOM_STATUS[room.status] ? ROOM_STATUS[room.status].label : room.status,
      reportCount: room => room.reportCount
    };
  }

  function openRoomModal(room = null) {
    const modal = AdminUI.openModal({
      title: room ? 'Chỉnh sửa tin đăng' : 'Đăng tin mới thay mặt chủ nhà',
      size: 'xl',
      scrollable: true,
      body: '<div id="adminRoomFormWrap"></div>',
      footer: '<button type="button" class="btn btn-light-border" data-bs-dismiss="modal">Đóng</button>'
    });
    RoomForm.mount(modal.body.querySelector('#adminRoomFormWrap'), {
      room,
      mode: 'admin',
      onSaved() {
        modal.close();
        AdminAPI.hydrate(['users', 'rooms', 'reports'], root).then(ok => { if (ok) render(false); });
      },
      onCancel() { modal.close(); }
    });
  }

  function openQuickView(roomId) {
    const room = DB.room(roomId);
    if (!room) return;
    const owner = DB.user(room.landlordId);
    const images = DB.images(room.id);
    AdminUI.openModal({
      title: `Xem nhanh tin #${room.id}`,
      size: 'xl',
      scrollable: true,
      body: `<div class="detail-grid">
        <section class="detail-card">
          ${room.coverImage ? `<img class="gallery-cover mb-3" src="${esc(room.coverImage)}" alt="${esc(room.title)}" loading="lazy">` : '<div class="empty-state">Tin đăng chưa có ảnh.</div>'}
          <div class="gallery-grid">${images.map(img => `<img src="${esc(img.imageUrl)}" alt="Ảnh tin ${room.id}" loading="lazy">`).join('')}</div>
        </section>
        <section class="detail-card">
          <h3 class="mb-2">${esc(room.title)}</h3>
          <div class="mb-2">${badge(ROOM_STATUS, room.status)} ${room.featured ? '<span class="rs-badge primary ms-1">Đã ghim</span>' : ''}</div>
          <ul class="inline-list list-unstyled mb-3">
            <li><span>Chủ tin</span><strong>${owner ? esc(owner.fullName) : 'Không xác định'}</strong></li>
            <li><span>Liên hệ</span><strong>${esc(room.contactPhone)}</strong></li>
            <li><span>Quận/Huyện</span><strong>${esc(room.district)}</strong></li>
            <li><span>Giá thuê</span><strong>${formatPrice(room.price)}</strong></li>
            <li><span>Diện tích</span><strong>${room.area} m²</strong></li>
            <li><span>Báo cáo đang mở</span><strong>${DB.t('reports').filter(report => report.roomId === room.id && report.status !== 'done').length}</strong></li>
          </ul>
          <p class="mb-0">${esc(room.description)}</p>
        </section>
      </div>`
    });
  }

  async function saveRoomStatus(room, status, note, action) {
    await AdminAPI.write('PATCH', `rooms/${room.id}`, { status, rejectReason: note || null });
    await AdminAPI.hydrate(['rooms', 'reports'], root);
  }

  async function approveRoom(room) {
    try {
      await saveRoomStatus(room, 'approved', '', 'Duyệt tin');
      toast('Đã duyệt tin đăng.');
      render(false);
    } catch (error) {
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(error.message, 'error');
    }
  }

  async function rejectRoom(room) {
    const result = await confirmDialog({
      title: 'Từ chối tin đăng',
      message: `Bạn có chắc muốn từ chối tin "${room.title}"?`,
      confirmText: 'Từ chối',
      danger: true,
      reasonLabel: 'Lý do từ chối',
      reasonRequired: true
    });
    if (!result.ok) return;
    try {
      await saveRoomStatus(room, 'rejected', result.reason, 'Từ chối tin');
      toast('Đã từ chối tin đăng.', 'info');
      render(false);
    } catch (error) {
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(error.message, 'error');
    }
  }

  async function removeRoom(room) {
    const result = await confirmDialog({
      title: 'Gỡ tin đăng',
      message: 'Tin này sẽ bị ẩn khỏi toàn bộ trang công khai.',
      confirmText: 'Gỡ tin',
      danger: true,
      reasonLabel: 'Lý do gỡ tin',
      reasonRequired: true
    });
    if (!result.ok) return;
    try {
      await saveRoomStatus(room, 'removed', result.reason, 'Gỡ tin');
      toast('Đã gỡ tin khỏi trang công khai.', 'info');
      render(false);
    } catch (error) {
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(error.message, 'error');
    }
  }

  async function restoreRoom(room) {
    const result = await confirmDialog({
      title: 'Khôi phục tin đăng',
      message: 'Tin sẽ được hiển thị trở lại trên trang công khai.',
      confirmText: 'Khôi phục'
    });
    if (!result.ok) return;
    try {
      await saveRoomStatus(room, 'approved', '', 'Khôi phục tin');
      toast('Đã khôi phục tin đăng.');
      render(false);
    } catch (error) {
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(error.message, 'error');
    }
  }

  async function deleteForever(room) {
    const result = await confirmDialog({
      title: 'Xóa vĩnh viễn tin đăng',
      message: 'Hành động này sẽ xóa toàn bộ ảnh, tiện ích và báo cáo liên quan tới tin.',
      confirmText: 'Xóa vĩnh viễn',
      danger: true,
      reasonLabel: 'Ghi chú xóa',
      reasonRequired: true
    });
    if (!result.ok) return;
    try {
      await AdminAPI.write('DELETE', `rooms/${room.id}`, { note: result.reason });
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast('Đã xóa vĩnh viễn tin đăng.', 'info');
      render(false);
    } catch (error) { toast(error.message, 'error'); }
  }

  async function toggleFeatured(room) {
    try {
      await AdminAPI.write('PATCH', `rooms/${room.id}`, { featured: !room.featured });
      await AdminAPI.hydrate(['rooms'], root);
      room = DB.room(room.id);
      toast(room.featured ? 'Đã ghim tin nổi bật.' : 'Đã bỏ ghim tin.');
      render(false);
    } catch (error) { toast(error.message, 'error'); }
  }

  async function bulkAction(action) {
    const ids = [...state.selected];
    if (!ids.length) return;
    const rooms = ids.map(id => DB.room(id)).filter(Boolean);
    if (action === 'approve') {
      try {
        await Promise.all(rooms.map(room => AdminAPI.write('PATCH', `rooms/${room.id}`, { status: 'approved' })));
        await AdminAPI.hydrate(['rooms', 'reports'], root);
        toast('Đã duyệt các tin được chọn.');
        state.selected.clear();
        render(false);
      } catch (error) {
        await AdminAPI.hydrate(['rooms', 'reports'], root);
        toast(error.message, 'error');
      }
      return;
    }
    const result = await confirmDialog({
      title: action === 'delete' ? 'Xóa vĩnh viễn nhiều tin' : 'Gỡ nhiều tin',
      message: action === 'delete' ? 'Các tin được chọn sẽ bị xóa hoàn toàn khỏi dữ liệu.' : 'Các tin được chọn sẽ bị gỡ khỏi trang công khai.',
      confirmText: action === 'delete' ? 'Xóa hàng loạt' : 'Gỡ hàng loạt',
      danger: true,
      reasonLabel: action === 'delete' ? 'Ghi chú xóa' : 'Lý do gỡ tin',
      reasonRequired: true
    });
    if (!result.ok) return;
    try {
      await Promise.all(rooms.map(room => action === 'delete'
        ? AdminAPI.write('DELETE', `rooms/${room.id}`, { note: result.reason })
        : AdminAPI.write('PATCH', `rooms/${room.id}`, { status: 'removed', rejectReason: result.reason })));
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(action === 'delete' ? 'Đã xóa các tin được chọn.' : 'Đã gỡ các tin được chọn.', 'info');
      state.selected.clear();
      render(false);
    } catch (error) {
      await AdminAPI.hydrate(['rooms', 'reports'], root);
      toast(error.message, 'error');
    }
  }

  function render(showLoading = false) {
    if (showLoading) {
      AdminUI.renderTableLoading(root, 11, 1180);
      setTimeout(() => render(false), 420);
      return;
    }

    const counts = roomCounts();
    const sorted = AdminUI.sortData(listingRows(), state, roomAccessors());
    const pageInfo = AdminUI.paginate(sorted, state);

    root.innerHTML = `<div class="status-tabs">
      ${[
        ['all', `Tất cả (${counts.all})`],
        ['pending', `Chờ duyệt (${counts.pending})`],
        ['approved', `Đang hiển thị (${counts.approved})`],
        ['rejected', `Bị từ chối (${counts.rejected})`],
        ['removed', `Đã gỡ (${counts.removed})`]
      ].map(item => `<button type="button" class="status-tab ${state.tab === item[0] ? 'active' : ''}" data-tab="${item[0]}">${item[1]}</button>`).join('')}
    </div>

    <section class="stats-strip">
      ${[
        ['Tổng tin', counts.all],
        ['Tin chờ duyệt', counts.pending],
        ['Đang hiển thị', counts.approved],
        ['Bị từ chối', counts.rejected],
        ['Đã gỡ', counts.removed],
        ['Tin hôm nay', counts.today]
      ].map(item => `<article class="mini-stat"><small class="text-muted">${item[0]}</small><strong>${item[1]}</strong></article>`).join('')}
    </section>

    <section class="filter-card mb-3">
      <div class="table-tools">
        <div class="input-inline">
          <label class="form-label" for="listingSearch">Tìm kiếm</label>
          <i class="bi bi-search"></i>
          <input id="listingSearch" class="form-control" value="${esc(state.search)}" placeholder="Tiêu đề, chủ tin, quận/huyện">
        </div>
        <div>
          <label class="form-label" for="listingDistrict">Quận/Huyện</label>
          <select id="listingDistrict" class="form-select">${districtOptions('Tất cả quận/huyện')}</select>
        </div>
        <div>
          <label class="form-label" for="listingType">Loại hình</label>
          <select id="listingType" class="form-select"><option value="">Tất cả</option>${Object.entries(ROOM_TYPES).map(([key, label]) => `<option value="${key}" ${state.roomType === key ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="listingPrice">Khoảng giá</label>
          <select id="listingPrice" class="form-select">
            <option value="">Tất cả</option>
            <option value="0-3000000" ${state.price === '0-3000000' ? 'selected' : ''}>Dưới 3 triệu</option>
            <option value="3000000-5000000" ${state.price === '3000000-5000000' ? 'selected' : ''}>3 – 5 triệu</option>
            <option value="5000000-7000000" ${state.price === '5000000-7000000' ? 'selected' : ''}>5 – 7 triệu</option>
            <option value="7000000-10000000" ${state.price === '7000000-10000000' ? 'selected' : ''}>7 – 10 triệu</option>
            <option value="10000000+" ${state.price === '10000000+' ? 'selected' : ''}>Trên 10 triệu</option>
          </select>
        </div>
        <div>
          <label class="form-label" for="listingFrom">Từ ngày</label>
          <input id="listingFrom" type="date" class="form-control" value="${esc(state.from)}">
        </div>
      </div>
      <div class="filter-grid mt-3">
        <div>
          <label class="form-label" for="listingTo">Đến ngày</label>
          <input id="listingTo" type="date" class="form-control" value="${esc(state.to)}">
        </div>
        <div class="d-flex align-items-end"><button type="button" class="btn btn-light-border w-100" id="listingResetBtn"><i class="bi bi-arrow-clockwise"></i> Xóa bộ lọc</button></div>
      </div>
    </section>

    <div class="bulk-bar ${state.selected.size ? 'show' : ''}" id="listingBulkBar">
      <div><strong>${state.selected.size}</strong> tin đang được chọn</div>
      <div class="bulk-actions">
        <button type="button" class="btn btn-sm btn-outline-primary" data-bulk="approve">Duyệt</button>
        <button type="button" class="btn btn-sm btn-light-border" data-bulk="remove">Gỡ</button>
        <button type="button" class="btn btn-sm btn-danger" data-bulk="delete">Xóa vĩnh viễn</button>
      </div>
    </div>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="table align-middle">
          <thead>
            <tr>
              <th scope="col" style="width:44px"><input type="checkbox" class="form-check-input row-select-all" aria-label="Chọn tất cả tin đăng"></th>
              <th scope="col">Ảnh bìa</th>
              ${AdminUI.sortHeader('Tiêu đề', 'title', state)}
              ${AdminUI.sortHeader('Chủ tin', 'owner', state)}
              ${AdminUI.sortHeader('Quận', 'district', state)}
              ${AdminUI.sortHeader('Giá', 'price', state)}
              ${AdminUI.sortHeader('Diện tích', 'area', state)}
              ${AdminUI.sortHeader('Ngày đăng', 'createdAt', state)}
              ${AdminUI.sortHeader('Trạng thái', 'status', state)}
              ${AdminUI.sortHeader('Số báo cáo', 'reportCount', state)}
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${pageInfo.items.length ? pageInfo.items.map(room => `<tr>
              <td><input type="checkbox" class="form-check-input row-select" data-id="${room.id}" ${state.selected.has(room.id) ? 'checked' : ''} aria-label="Chọn tin ${esc(room.title)}"></td>
              <td>${room.coverImage ? `<img class="thumb" src="${esc(room.coverImage)}" alt="${esc(room.title)}" loading="lazy">` : '<span class="text-muted small">Chưa có ảnh</span>'}</td>
              <td><div class="fw-semibold">${esc(room.title)}</div><small>${ROOM_TYPES[room.roomType]}${room.featured ? ' · Đã ghim' : ''}</small></td>
              <td>${room.owner ? esc(room.owner.fullName) : 'Không xác định'}</td>
              <td>${esc(room.district)}</td>
              <td>${formatPrice(room.price)}</td>
              <td>${room.area} m²</td>
              <td>${formatDate(room.createdAt)}</td>
              <td>${badge(ROOM_STATUS, room.status)}${room.statusNote ? `<small>${esc(room.statusNote)}</small>` : ''}</td>
              <td>${room.reportCount}</td>
              <td>
                <div class="action-stack">
                  <button type="button" class="icon-action" data-action="view" data-id="${room.id}" aria-label="Xem nhanh tin ${esc(room.title)}"><i class="bi bi-eye"></i></button>
                  <button type="button" class="icon-action" data-action="edit" data-id="${room.id}" aria-label="Chỉnh sửa tin ${esc(room.title)}"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="icon-action" data-action="pin" data-id="${room.id}" aria-label="${room.featured ? 'Bỏ ghim' : 'Ghim'} tin ${esc(room.title)}"><i class="bi ${room.featured ? 'bi-pin-angle-fill' : 'bi-pin-angle'}"></i></button>
                  ${room.status === 'pending' ? `<button type="button" class="icon-action" data-action="approve" data-id="${room.id}" aria-label="Duyệt tin ${esc(room.title)}"><i class="bi bi-check2"></i></button><button type="button" class="icon-action" data-action="reject" data-id="${room.id}" aria-label="Từ chối tin ${esc(room.title)}"><i class="bi bi-x-lg"></i></button>` : ''}
                  ${['approved', 'rented'].includes(room.status) ? `<button type="button" class="icon-action" data-action="remove" data-id="${room.id}" aria-label="Gỡ tin ${esc(room.title)}"><i class="bi bi-eye-slash"></i></button>` : ''}
                  ${['rejected', 'removed'].includes(room.status) ? `<button type="button" class="icon-action" data-action="restore" data-id="${room.id}" aria-label="Khôi phục tin ${esc(room.title)}"><i class="bi bi-arrow-counterclockwise"></i></button>` : ''}
                  <button type="button" class="icon-action" data-action="delete" data-id="${room.id}" aria-label="Xóa vĩnh viễn tin ${esc(room.title)}"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>`).join('') : `<tr><td colspan="11">${AdminUI.emptyState('Không tìm thấy tin phù hợp', 'Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.', 'bi-search')}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${AdminUI.paginationHTML(pageInfo, state)}
    </section>`;

    root.querySelector('#listingDistrict').value = state.district;
    root.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      state.page = 1;
      state.selected.clear();
      render(false);
    }));

    root.querySelector('#listingSearch').addEventListener('input', e => { state.search = e.target.value; state.page = 1; render(false); });
    [['listingDistrict', 'district'], ['listingType', 'roomType'], ['listingPrice', 'price'], ['listingFrom', 'from'], ['listingTo', 'to']].forEach(item => {
      root.querySelector(`#${item[0]}`).addEventListener('change', e => {
        state[item[1]] = e.target.value;
        state.page = 1;
        render(false);
      });
    });
    root.querySelector('#listingResetBtn').addEventListener('click', () => {
      state.search = '';
      state.district = '';
      state.roomType = '';
      state.price = '';
      state.from = '';
      state.to = '';
      state.page = 1;
      state.selected.clear();
      render(false);
    });

    AdminUI.bindSortAndPagination(root, state, () => render(false));

    const master = root.querySelector('.row-select-all');
    const rows = [...root.querySelectorAll('.row-select[data-id]')];
    master.addEventListener('change', e => {
      rows.forEach(row => {
        row.checked = e.target.checked;
        if (e.target.checked) state.selected.add(+row.dataset.id);
        else state.selected.delete(+row.dataset.id);
      });
      render(false);
    });
    rows.forEach(row => row.addEventListener('change', e => {
      const id = +e.target.dataset.id;
      if (e.target.checked) state.selected.add(id);
      else state.selected.delete(id);
      AdminUI.setMasterCheckbox(root);
      const bar = document.getElementById('listingBulkBar');
      if (bar) bar.classList.toggle('show', !!state.selected.size);
      const label = bar ? bar.querySelector('strong') : null;
      if (label) label.textContent = String(state.selected.size);
    }));
    AdminUI.setMasterCheckbox(root);

    root.querySelectorAll('[data-bulk]').forEach(btn => btn.addEventListener('click', () => bulkAction(btn.dataset.bulk)));
    root.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
      const room = DB.room(+btn.dataset.id);
      if (!room) return;
      switch (btn.dataset.action) {
        case 'view': openQuickView(room.id); break;
        case 'edit': openRoomModal(room); break;
        case 'pin': toggleFeatured(room); break;
        case 'approve': approveRoom(room); break;
        case 'reject': rejectRoom(room); break;
        case 'remove': removeRoom(room); break;
        case 'restore': restoreRoom(room); break;
        case 'delete': deleteForever(room); break;
      }
    }));
  }

  document.getElementById('addRoomForOwnerBtn').addEventListener('click', () => openRoomModal());
  if (await AdminAPI.hydrate(['users', 'rooms', 'reports', 'districts', 'amenities'], root)) render(false);
});
