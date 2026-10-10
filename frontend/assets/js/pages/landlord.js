/* Khu vực chủ nhà: tổng quan, đăng/sửa tin, quản lý tin */
(async function () {
  const me = Auth.requireRole(['landlord']);
  if (!me) return;
  const page = document.body.dataset.page;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page));
  const box = $('#content');
  const SELF_HIDDEN = 'Chủ tin tự ẩn';

  async function loadData() {
    const [rooms, districts, amenities] = await Promise.all([
      Auth.request('landlord/rooms'),
      Auth.request('districts'),
      Auth.request('amenities')
    ]);
    rooms.forEach(room => {
      room.id = Number(room.id);
      room.landlordId = Number(room.landlordId);
      room.districtId = Number(room.districtId);
      room.price = Number(room.price);
      room.area = Number(room.area);
      room.views = Number(room.views);
      room.featured = Boolean(Number(room.featured));
      room.amenityIds = (room.amenityIds || []).map(Number);
      room.images = (room.images || []).map(image => ({
        ...image,
        imageUrl: Auth.imageUrl(image.imageUrl),
        isPrimary: Boolean(Number(image.isPrimary))
      }));
      room.coverImage = Auth.imageUrl(room.coverImage || '');
    });
    DB.data.rooms = rooms;
    DB.data.districts = districts;
    DB.data.amenities = amenities;
    DB.data.room_images = rooms.flatMap(room => room.images.map((image, index) => ({
      ...image,
      roomId: room.id,
      id: index + 1
    })));
    DB.data.room_amenities = rooms.flatMap(room => room.amenityIds.map(amenityId => ({
      roomId: room.id,
      amenityId
    })));
  }

  const mine = () => DB.t('rooms').filter(room => room.landlordId === me.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pendingNote = me.status === 'pending'
    ? '<div class="alert alert-warning">Tài khoản của bạn đang chờ xác minh. Tin đăng sẽ được duyệt sau khi quản trị viên xác minh.</div>' : '';

  function showLoadError(error) {
    box.innerHTML = `<div class="alert alert-danger" role="alert">
      <strong>Không tải được dữ liệu tin đăng.</strong> ${esc(error.message)}
      <button type="button" class="btn btn-sm btn-outline-danger ms-2" data-landlord-retry>Thử lại</button>
    </div>`;
  }

  /* ----- Tổng quan ----- */
  function renderOverview() {
    const list = mine();
    const cnt = status => list.filter(room => room.status === status).length;
    const stat = (icon, label, value) => `<div class="col-6 col-lg-3"><div class="stat-card"><span class="ic"><i class="bi ${icon}"></i></span><div><small>${label}</small><strong>${value}</strong></div></div></div>`;
    box.innerHTML = `${pendingNote}
      <div class="row g-3 mb-4">${stat('bi-card-list', 'Tổng số tin', list.length)}${stat('bi-check-circle', 'Đang hiển thị', cnt('approved'))}
        ${stat('bi-hourglass-split', 'Chờ duyệt', cnt('pending'))}${stat('bi-eye', 'Tổng lượt xem', formatMoney(list.reduce((sum, room) => sum + room.views, 0)))}</div>
      <div class="d-flex justify-content-between align-items-center mb-2"><h2 class="fs-5 fw-bold mb-0">Tin mới nhất</h2><a href="quan-ly-tin.html">Xem tất cả</a></div>
      ${list.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Tin</th><th>Giá</th><th>Trạng thái</th><th>Lượt xem</th></tr></thead><tbody>
        ${list.slice(0, 5).map(room => `<tr><td><a href="../chi-tiet.html?id=${room.id}">${esc(room.title)}</a></td><td>${formatPrice(room.price)}</td><td>${badge(ROOM_STATUS, room.status)}</td><td>${room.views}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty-state"><i class="bi bi-house-add"></i><h3>Bạn chưa đăng tin nào</h3><a class="btn btn-primary mt-2" href="dang-tin.html">Đăng tin đầu tiên</a></div>'}`;
  }

  /* ----- Đăng / sửa tin ----- */
  function renderForm() {
    const id = qs('id');
    const room = id ? DB.room(id) : null;
    if (id && (!room || room.landlordId !== me.id)) {
      box.innerHTML = '<div class="empty-state"><i class="bi bi-lock"></i><h3>Bạn không có quyền sửa tin này</h3><a class="btn btn-primary mt-2" href="quan-ly-tin.html">Về danh sách</a></div>';
      return;
    }
    if (room) {
      $('h1').textContent = 'Chỉnh sửa tin';
      document.title = 'Chỉnh sửa tin – RentSmart';
    }
    box.innerHTML = pendingNote + (room ? '<div class="alert alert-info">Sau khi sửa, tin sẽ được đưa về trạng thái chờ duyệt lại.</div>' : '') + '<div id="formHost"></div>';
    RoomForm.mount($('#formHost'), {
      room,
      mode: 'landlord',
      onSaved() {
        setTimeout(() => { location.href = 'quan-ly-tin.html'; }, 700);
      },
      onCancel() { location.href = 'quan-ly-tin.html'; }
    });
  }

  /* ----- Quản lý tin ----- */
  function renderListings() {
    let tab = 'all';
    const tabs = [['all', 'Tất cả'], ['approved', 'Đang hiển thị'], ['pending', 'Chờ duyệt'], ['rejected', 'Bị từ chối'], ['rented', 'Đã cho thuê'], ['removed', 'Đã ẩn/gỡ']];

    const actions = room => {
      const buttons = [`<a class="btn btn-sm btn-light-border" href="../chi-tiet.html?id=${room.id}" title="Xem"><i class="bi bi-eye"></i><span class="visually-hidden">Xem</span></a>`];
      if (room.status !== 'rented') buttons.push(`<a class="btn btn-sm btn-light-border" href="dang-tin.html?id=${room.id}" title="Sửa"><i class="bi bi-pencil"></i><span class="visually-hidden">Sửa</span></a>`);
      if (room.status === 'approved') {
        buttons.push(`<button class="btn btn-sm btn-light-border" data-act="rent" data-id="${room.id}" title="Đã cho thuê"><i class="bi bi-key"></i><span class="visually-hidden">Đã cho thuê</span></button>`);
        buttons.push(`<button class="btn btn-sm btn-light-border" data-act="hide" data-id="${room.id}" title="Ẩn tin"><i class="bi bi-eye-slash"></i><span class="visually-hidden">Ẩn tin</span></button>`);
      }
      if (room.status === 'removed' && room.statusNote === SELF_HIDDEN) buttons.push(`<button class="btn btn-sm btn-light-border" data-act="show" data-id="${room.id}" title="Hiện lại"><i class="bi bi-eye"></i><span class="visually-hidden">Hiện lại</span></button>`);
      buttons.push(`<button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${room.id}" title="Xóa"><i class="bi bi-trash"></i><span class="visually-hidden">Xóa</span></button>`);
      return `<div class="d-flex gap-1 flex-wrap">${buttons.join('')}</div>`;
    };

    function draw() {
      const all = mine();
      const list = tab === 'all' ? all : all.filter(room => room.status === tab);
      box.innerHTML = `${pendingNote}
        <div class="d-flex flex-wrap gap-2 mb-3" role="tablist">${tabs.map(([key, label]) => `<button class="btn btn-sm ${tab === key ? 'btn-primary' : 'btn-light-border'}" data-tab="${key}">${label} (${key === 'all' ? all.length : all.filter(room => room.status === key).length})</button>`).join('')}</div>
        ${list.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Tin</th><th>Giá</th><th>Trạng thái</th><th>Lượt xem</th><th>Ngày đăng</th><th>Thao tác</th></tr></thead><tbody>
          ${list.map(room => `<tr><td style="min-width:220px"><a href="../chi-tiet.html?id=${room.id}">${esc(room.title)}</a><div class="small text-muted">${esc(room.district)}</div>${room.status === 'rejected' && room.statusNote ? `<div class="small text-danger">Lý do: ${esc(room.statusNote)}</div>` : ''}</td>
            <td>${formatPrice(room.price)}</td><td>${badge(ROOM_STATUS, room.status)}</td><td>${room.views}</td><td>${formatDate(room.createdAt)}</td><td>${actions(room)}</td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty-state"><i class="bi bi-inbox"></i><h3>Không có tin nào</h3><a class="btn btn-primary mt-2" href="dang-tin.html">Đăng tin mới</a></div>'}`;
    }

    draw();
    box.addEventListener('click', async event => {
      const tabButton = event.target.closest('[data-tab]');
      if (tabButton) {
        tab = tabButton.dataset.tab;
        draw();
        return;
      }
      const actionButton = event.target.closest('[data-act]');
      if (!actionButton) return;
      const room = DB.room(actionButton.dataset.id);
      if (!room || room.landlordId !== me.id) return;

      const action = actionButton.dataset.act;
      if (action === 'del') {
        const result = await confirmDialog({ title: 'Xóa tin', message: `Xóa vĩnh viễn tin "${room.title}"?`, confirmText: 'Xóa', danger: true });
        if (!result.ok) return;
      } else if (action === 'hide' || action === 'rent') {
        const result = await confirmDialog({
          title: action === 'hide' ? 'Ẩn tin' : 'Đánh dấu đã cho thuê',
          message: action === 'hide' ? 'Tin sẽ không còn hiển thị công khai. Bạn có thể hiện lại sau.' : 'Tin sẽ được đánh dấu đã cho thuê và ngừng hiển thị trong kết quả tìm kiếm.',
          confirmText: action === 'hide' ? 'Ẩn tin' : 'Xác nhận'
        });
        if (!result.ok) return;
      }

      try {
        if (action === 'del') {
          await Auth.request(`landlord/rooms/${room.id}`, { method: 'DELETE' });
          toast('Đã xóa tin');
        } else {
          const status = { hide: 'removed', show: 'approved', rent: 'rented' }[action];
          await Auth.request(`landlord/rooms/${room.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          toast(action === 'hide' ? 'Đã ẩn tin' : action === 'show' ? 'Tin đã hiển thị lại' : 'Đã đánh dấu đã cho thuê');
        }
        await loadData();
        draw();
      } catch (error) {
        toast(error.message, 'error');
        try {
          await loadData();
          draw();
        } catch (refreshError) {
          showLoadError(refreshError);
        }
      }
    });
  }

  box.addEventListener('click', async event => {
    if (!event.target.closest('[data-landlord-retry]')) return;
    try {
      await loadData();
      renderPage();
    } catch (error) {
      showLoadError(error);
    }
  });

  function renderPage() {
    if (page === 'tong-quan') renderOverview();
    else if (page === 'dang-tin') renderForm();
    else if (page === 'quan-ly-tin') renderListings();
  }

  try {
    await loadData();
    renderPage();
  } catch (error) {
    showLoadError(error);
  }
})();
