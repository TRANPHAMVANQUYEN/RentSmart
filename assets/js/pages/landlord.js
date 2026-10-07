/* Khu vực chủ nhà: tổng quan, đăng/sửa tin, quản lý tin */
(function () {
  const me = Auth.requireRole(['landlord']);
  if (!me) return;
  const page = document.body.dataset.page;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page || (page === 'dang-tin' && a.dataset.nav === 'dang-tin')));
  const box = $('#content');
  const mine = () => DB.t('rooms').filter(r => r.landlordId === me.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const SELF_HIDDEN = 'Chủ tin tự ẩn';

  const pendingNote = me.status === 'pending'
    ? '<div class="alert alert-warning">Tài khoản của bạn đang chờ xác minh. Tin đăng sẽ được duyệt sau khi quản trị viên xác minh.</div>' : '';

  /* ----- Tổng quan ----- */
  if (page === 'tong-quan') {
    const list = mine();
    const cnt = s => list.filter(r => r.status === s).length;
    const stat = (ic, label, val) => `<div class="col-6 col-lg-3"><div class="stat-card"><span class="ic"><i class="bi ${ic}"></i></span><div><small>${label}</small><strong>${val}</strong></div></div></div>`;
    box.innerHTML = `${pendingNote}
      <div class="row g-3 mb-4">${stat('bi-card-list', 'Tổng số tin', list.length)}${stat('bi-check-circle', 'Đang hiển thị', cnt('approved'))}
        ${stat('bi-hourglass-split', 'Chờ duyệt', cnt('pending'))}${stat('bi-eye', 'Tổng lượt xem', formatMoney(list.reduce((s, r) => s + r.views, 0)))}</div>
      <div class="d-flex justify-content-between align-items-center mb-2"><h2 class="fs-5 fw-bold mb-0">Tin mới nhất</h2><a href="quan-ly-tin.html">Xem tất cả</a></div>
      ${list.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Tin</th><th>Giá</th><th>Trạng thái</th><th>Lượt xem</th></tr></thead><tbody>
        ${list.slice(0, 5).map(r => `<tr><td><a href="../chi-tiet.html?id=${r.id}">${esc(r.title)}</a></td><td>${formatPrice(r.price)}</td><td>${badge(ROOM_STATUS, r.status)}</td><td>${r.views}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty-state"><i class="bi bi-house-add"></i><h3>Bạn chưa đăng tin nào</h3><a class="btn btn-primary mt-2" href="dang-tin.html">Đăng tin đầu tiên</a></div>'}`;
  }

  /* ----- Đăng / sửa tin ----- */
  if (page === 'dang-tin') {
    const id = qs('id');
    const room = id ? DB.room(id) : null;
    if (id && (!room || room.landlordId !== me.id)) {
      box.innerHTML = '<div class="empty-state"><i class="bi bi-lock"></i><h3>Bạn không có quyền sửa tin này</h3><a class="btn btn-primary mt-2" href="quan-ly-tin.html">Về danh sách</a></div>';
    } else {
      if (room) { $('h1').textContent = 'Chỉnh sửa tin'; document.title = 'Chỉnh sửa tin – RentSmart'; }
      box.innerHTML = pendingNote + (room ? '<div class="alert alert-info">Sau khi sửa, tin sẽ được đưa về trạng thái chờ duyệt lại.</div>' : '') + '<div id="formHost"></div>';
      RoomForm.mount($('#formHost'), {
        room, mode: 'landlord',
        onSaved() { toast(room ? 'Đã cập nhật tin, đang chờ duyệt' : 'Đăng tin thành công, đang chờ duyệt'); setTimeout(() => location.href = 'quan-ly-tin.html', 700); },
        onCancel() { location.href = 'quan-ly-tin.html'; }
      });
    }
  }

  /* ----- Quản lý tin ----- */
  if (page === 'quan-ly-tin') {
    let tab = 'all';
    const TABS = [['all', 'Tất cả'], ['approved', 'Đang hiển thị'], ['pending', 'Chờ duyệt'], ['rejected', 'Bị từ chối'], ['rented', 'Đã cho thuê'], ['removed', 'Đã ẩn/gỡ']];

    const actions = r => {
      const b = [`<a class="btn btn-sm btn-light-border" href="../chi-tiet.html?id=${r.id}" title="Xem"><i class="bi bi-eye"></i><span class="visually-hidden">Xem</span></a>`];
      if (r.status !== 'rented') b.push(`<a class="btn btn-sm btn-light-border" href="dang-tin.html?id=${r.id}" title="Sửa"><i class="bi bi-pencil"></i><span class="visually-hidden">Sửa</span></a>`);
      if (r.status === 'approved') {
        b.push(`<button class="btn btn-sm btn-light-border" data-act="rent" data-id="${r.id}" title="Đã cho thuê"><i class="bi bi-key"></i><span class="visually-hidden">Đã cho thuê</span></button>`);
        b.push(`<button class="btn btn-sm btn-light-border" data-act="hide" data-id="${r.id}" title="Ẩn tin"><i class="bi bi-eye-slash"></i><span class="visually-hidden">Ẩn tin</span></button>`);
      }
      if (r.status === 'removed' && r.statusNote === SELF_HIDDEN) b.push(`<button class="btn btn-sm btn-light-border" data-act="show" data-id="${r.id}" title="Hiện lại"><i class="bi bi-eye"></i><span class="visually-hidden">Hiện lại</span></button>`);
      b.push(`<button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${r.id}" title="Xóa"><i class="bi bi-trash"></i><span class="visually-hidden">Xóa</span></button>`);
      return `<div class="d-flex gap-1 flex-wrap">${b.join('')}</div>`;
    };

    function draw() {
      const all = mine();
      const list = tab === 'all' ? all : all.filter(r => r.status === tab);
      box.innerHTML = `${pendingNote}
        <div class="d-flex flex-wrap gap-2 mb-3" role="tablist">${TABS.map(([k, l]) => `<button class="btn btn-sm ${tab === k ? 'btn-primary' : 'btn-light-border'}" data-tab="${k}">${l} (${k === 'all' ? all.length : all.filter(r => r.status === k).length})</button>`).join('')}</div>
        ${list.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Tin</th><th>Giá</th><th>Trạng thái</th><th>Lượt xem</th><th>Ngày đăng</th><th>Thao tác</th></tr></thead><tbody>
          ${list.map(r => `<tr><td style="min-width:220px"><a href="../chi-tiet.html?id=${r.id}">${esc(r.title)}</a><div class="small text-muted">${esc(r.district)}</div>${r.status === 'rejected' && r.statusNote ? `<div class="small text-danger">Lý do: ${esc(r.statusNote)}</div>` : ''}</td>
            <td>${formatPrice(r.price)}</td><td>${badge(ROOM_STATUS, r.status)}</td><td>${r.views}</td><td>${formatDate(r.createdAt)}</td><td>${actions(r)}</td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty-state"><i class="bi bi-inbox"></i><h3>Không có tin nào</h3><a class="btn btn-primary mt-2" href="dang-tin.html">Đăng tin mới</a></div>'}`;
    }
    draw();

    box.addEventListener('click', async e => {
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; return draw(); }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const r = DB.room(a.dataset.id);
      if (!r || r.landlordId !== me.id) return;
      const act = a.dataset.act;
      if (act === 'del') {
        const res = await confirmDialog({ title: 'Xóa tin', message: `Xóa vĩnh viễn tin "${r.title}"?`, confirmText: 'Xóa', danger: true });
        if (!res.ok) return;
        DB.deleteRoom(r.id); DB.save(); toast('Đã xóa tin');
      } else if (act === 'hide') {
        const res = await confirmDialog({ title: 'Ẩn tin', message: 'Tin sẽ không còn hiển thị công khai. Bạn có thể hiện lại sau.', confirmText: 'Ẩn tin' });
        if (!res.ok) return;
        r.status = 'removed'; r.statusNote = SELF_HIDDEN; DB.save(); toast('Đã ẩn tin');
      } else if (act === 'show') {
        r.status = 'approved'; r.statusNote = ''; DB.save(); toast('Tin đã hiển thị lại');
      } else if (act === 'rent') {
        const res = await confirmDialog({ title: 'Đánh dấu đã cho thuê', message: 'Tin sẽ được đánh dấu đã cho thuê và ngừng hiển thị trong kết quả tìm kiếm.', confirmText: 'Xác nhận' });
        if (!res.ok) return;
        r.status = 'rented'; DB.save(); toast('Đã đánh dấu đã cho thuê');
      }
      draw();
    });
  }
})();
