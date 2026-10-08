/* ==========================================================
   RentSmart HCM - admin/tai-khoan.js
   Quản lý toàn bộ tài khoản trong hệ thống.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const shell = AdminUI.mount('tai-khoan', 'Quản lý tài khoản');
  if (!shell) return;
  const root = shell.content;
  shell.tools.innerHTML = `<button type="button" class="btn btn-light-border" id="exportUsersBtn"><i class="bi bi-download"></i> Xuất CSV</button><button type="button" class="btn btn-primary" id="addUserBtn"><i class="bi bi-person-plus"></i> Thêm tài khoản</button>`;

  const state = {
    search: '',
    role: '',
    status: '',
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
    const input = root.querySelector('#accountSearch');
    if (input) input.value = state.search;
    render(false);
  });

  function accountRows() {
    const from = AdminUI.normalizeDateInput(state.from);
    const to = AdminUI.normalizeDateInput(state.to);
    return DB.t('users')
      .map(user => ({
        ...user,
        roomCount: AdminUI.ownerRoomCount(user.id)
      }))
      .filter(user => {
        const keyword = norm(state.search);
        if (keyword && !norm(`${user.fullName} ${user.username} ${user.email} ${user.phone}`).includes(keyword)) return false;
        if (state.role && user.role !== state.role) return false;
        if (state.status && user.status !== state.status) return false;
        if ((from || to) && !AdminUI.dateInRange(user.createdAt, from, to)) return false;
        return true;
      });
  }

  function exportCSVRows() {
    const rows = [['Họ tên', 'Tên đăng nhập', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Số tin đăng', 'Lần đăng nhập cuối']];
    accountRows().forEach(user => rows.push([
      user.fullName,
      user.username,
      user.email,
      user.phone,
      USER_ROLES[user.role] || user.role,
      USER_STATUS[user.status] ? USER_STATUS[user.status].label : user.status,
      formatDateTime(user.createdAt),
      user.roomCount,
      user.lastLogin ? formatDateTime(user.lastLogin) : 'Chưa có'
    ]));
    return rows;
  }

  function userAccessors() {
    return {
      fullName: user => norm(user.fullName),
      username: user => norm(user.username),
      email: user => norm(user.email),
      role: user => USER_ROLES[user.role] || user.role,
      status: user => USER_STATUS[user.status] ? USER_STATUS[user.status].label : user.status,
      createdAt: user => new Date(user.createdAt),
      roomCount: user => user.roomCount
    };
  }

  function openAccountForm(user = null) {
    const isEdit = !!user;
    const modal = AdminUI.openModal({
      title: isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới',
      size: 'lg',
      body: `<form id="accountForm" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="accFullName">Họ và tên <span class="text-danger">*</span></label>
            <input id="accFullName" class="form-control" required value="${esc(user ? user.fullName : '')}">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accUsername">Tên đăng nhập <span class="text-danger">*</span></label>
            <input id="accUsername" class="form-control" required value="${esc(user ? user.username : '')}">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accEmail">Email <span class="text-danger">*</span></label>
            <input id="accEmail" type="email" class="form-control" required value="${esc(user ? user.email : '')}">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accPhone">Số điện thoại <span class="text-danger">*</span></label>
            <input id="accPhone" class="form-control" inputmode="tel" required value="${esc(user ? user.phone : '')}">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accRole">Vai trò <span class="text-danger">*</span></label>
            <select id="accRole" class="form-select">${Object.entries(USER_ROLES).map(([key, label]) => `<option value="${key}" ${user && user.role === key ? 'selected' : ''}>${label}</option>`).join('')}</select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accStatus">Trạng thái <span class="text-danger">*</span></label>
            <select id="accStatus" class="form-select">${Object.entries(USER_STATUS).map(([key, meta]) => `<option value="${key}" ${user && user.status === key ? 'selected' : ''}>${meta.label}</option>`).join('')}</select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accPassword">${isEdit ? 'Đặt lại mật khẩu (để trống nếu giữ nguyên)' : 'Mật khẩu'} ${isEdit ? '' : '<span class="text-danger">*</span>'}</label>
            <input id="accPassword" type="password" class="form-control" ${isEdit ? '' : 'required'} autocomplete="new-password">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accAvatar">URL ảnh đại diện</label>
            <input id="accAvatar" class="form-control" value="${esc(user && user.avatar ? user.avatar : '')}">
          </div>
        </div>
      </form>`,
      footer: `<button type="button" class="btn btn-light-border" data-bs-dismiss="modal">Hủy</button><button type="button" class="btn btn-primary" id="saveAccountBtn">${isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>`
    });

    const form = modal.body.querySelector('#accountForm');
    modal.footer.querySelector('#saveAccountBtn').addEventListener('click', () => {
      const payload = {
        fullName: form.querySelector('#accFullName').value.trim(),
        username: form.querySelector('#accUsername').value.trim(),
        email: form.querySelector('#accEmail').value.trim(),
        phone: form.querySelector('#accPhone').value.trim(),
        role: form.querySelector('#accRole').value,
        status: form.querySelector('#accStatus').value,
        password: form.querySelector('#accPassword').value,
        avatar: form.querySelector('#accAvatar').value.trim()
      };
      if (!payload.fullName || !payload.username || !payload.email || !payload.phone || (!isEdit && !payload.password)) {
        toast('Vui lòng nhập đầy đủ các trường bắt buộc.', 'error');
        return;
      }
      if (!/^0\d{9}$/.test(payload.phone)) {
        toast('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.', 'error');
        return;
      }
      const users = DB.t('users');
      const duplicate = users.find(item => item.id !== (user ? user.id : 0) && (
        item.username.toLowerCase() === payload.username.toLowerCase() ||
        item.email.toLowerCase() === payload.email.toLowerCase() ||
        item.phone === payload.phone
      ));
      if (duplicate) {
        toast('Tên đăng nhập, email hoặc số điện thoại đã tồn tại.', 'error');
        return;
      }
      if (isEdit) {
        user.fullName = payload.fullName;
        user.username = payload.username;
        user.email = payload.email;
        user.phone = payload.phone;
        user.role = payload.role;
        user.status = payload.status;
        user.avatar = payload.avatar;
        if (payload.password) user.password = payload.password;
        DB.log('Cập nhật tài khoản', user.username, `Vai trò: ${USER_ROLES[user.role]}`);
      } else {
        DB.t('users').push({
          id: DB.nextId('users'),
          fullName: payload.fullName,
          username: payload.username,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          status: payload.status,
          avatar: payload.avatar,
          password: payload.password,
          createdAt: new Date().toISOString(),
          lastLogin: ''
        });
        DB.log('Thêm tài khoản', payload.username, `Vai trò: ${USER_ROLES[payload.role]}`);
      }
      DB.save();
      toast(isEdit ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản mới.');
      modal.close();
      render(false);
    });
  }

  function openDetail(user) {
    const rooms = DB.t('rooms').filter(room => room.landlordId === user.id);
    const sentReports = DB.t('reports').filter(report => report.reporterId === user.id);
    const relatedReports = DB.t('reports').filter(report => {
      const room = DB.room(report.roomId);
      return room && room.landlordId === user.id;
    });
    AdminUI.openModal({
      title: `Chi tiết tài khoản · ${user.fullName}`,
      size: 'xl',
      scrollable: true,
      body: `<div class="detail-grid">
        <section class="detail-card">
          <div class="user-cell mb-3">${avatarHTML(user, 'avatar-lg')}<div><h3 class="mb-1">${esc(user.fullName)}</h3><div class="text-muted">@${esc(user.username)}</div></div></div>
          <ul class="inline-list list-unstyled mb-0">
            <li><span>Email</span><strong>${esc(user.email)}</strong></li>
            <li><span>Số điện thoại</span><strong>${esc(user.phone)}</strong></li>
            <li><span>Vai trò</span><strong>${esc(USER_ROLES[user.role] || user.role)}</strong></li>
            <li><span>Trạng thái</span><span>${badge(USER_STATUS, user.status)}</span></li>
            <li><span>Ngày tạo</span><strong>${formatDateTime(user.createdAt)}</strong></li>
            <li><span>Đăng nhập gần nhất</span><strong>${user.lastLogin ? formatDateTime(user.lastLogin) : 'Chưa có'}</strong></li>
          </ul>
        </section>
        <section class="detail-card">
          <h3>Danh sách tin đã đăng</h3>
          ${rooms.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Tiêu đề</th><th>Giá</th><th>Trạng thái</th></tr></thead><tbody>${rooms.map(room => `<tr><td>${esc(room.title)}<small>${esc(room.district)}</small></td><td>${formatPrice(room.price)}</td><td>${badge(ROOM_STATUS, room.status)}</td></tr>`).join('')}</tbody></table></div>` : AdminUI.emptyState('Chưa có tin đăng', 'Tài khoản này chưa đăng tin nào.', 'bi-house')}
        </section>
        <section class="detail-card">
          <h3>Lịch sử báo cáo do tài khoản gửi</h3>
          ${sentReports.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Mã</th><th>Lý do</th><th>Trạng thái</th></tr></thead><tbody>${sentReports.map(report => `<tr><td>#${report.id}</td><td>${esc(REPORT_REASONS[report.reason] || report.reason)}<small>${esc(report.content || '')}</small></td><td>${badge(REPORT_STATUS, report.status)}</td></tr>`).join('')}</tbody></table></div>` : AdminUI.emptyState('Không có báo cáo nào', 'Tài khoản này chưa từng gửi báo cáo.', 'bi-check2-circle')}
        </section>
        <section class="detail-card">
          <h3>Lịch sử báo cáo liên quan tới tin của tài khoản</h3>
          ${relatedReports.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Mã</th><th>Tin</th><th>Trạng thái</th></tr></thead><tbody>${relatedReports.map(report => { const room = DB.room(report.roomId); return `<tr><td>#${report.id}</td><td>${room ? esc(room.title) : 'Tin đã xóa'}<small>${esc(REPORT_REASONS[report.reason] || report.reason)}</small></td><td>${badge(REPORT_STATUS, report.status)}</td></tr>`; }).join('')}</tbody></table></div>` : AdminUI.emptyState('Không có báo cáo vi phạm', 'Các tin của tài khoản này chưa nhận báo cáo nào.', 'bi-shield-check')}
        </section>
      </div>`
    });
  }

  function openLockModal(user, unlock = false) {
    if (unlock) {
      confirmDialog({
        title: 'Mở khóa tài khoản',
        message: `Bạn có chắc muốn mở khóa tài khoản ${user.username}?`,
        confirmText: 'Mở khóa'
      }).then(result => {
        if (!result.ok) return;
        user.status = 'active';
        user.lockReason = '';
        user.lockUntil = '';
        DB.save();
        DB.log('Mở khóa tài khoản', user.username, 'Mở khóa thủ công từ trang quản trị');
        toast('Đã mở khóa tài khoản.');
        render(false);
      });
      return;
    }
    const modal = AdminUI.openModal({
      title: `Khóa tài khoản · ${user.username}`,
      body: `<form id="lockUserForm" novalidate>
        <div class="mb-3">
          <label class="form-label" for="lockReason">Lý do khóa <span class="text-danger">*</span></label>
          <textarea id="lockReason" class="form-control" rows="3" required></textarea>
        </div>
        <div>
          <label class="form-label" for="lockUntil">Thời hạn khóa (không bắt buộc)</label>
          <input id="lockUntil" type="datetime-local" class="form-control">
        </div>
      </form>`,
      footer: `<button type="button" class="btn btn-light-border" data-bs-dismiss="modal">Hủy</button><button type="button" class="btn btn-danger" id="confirmLockBtn">Khóa tài khoản</button>`
    });
    modal.footer.querySelector('#confirmLockBtn').addEventListener('click', () => {
      const reason = modal.body.querySelector('#lockReason').value.trim();
      const until = modal.body.querySelector('#lockUntil').value;
      if (!reason) {
        toast('Vui lòng nhập lý do khóa tài khoản.', 'error');
        return;
      }
      user.status = 'locked';
      user.lockReason = reason;
      user.lockUntil = until ? new Date(until).toISOString() : '';
      DB.save();
      DB.log('Khóa tài khoản', user.username, `${reason}${user.lockUntil ? ` · đến ${formatDateTime(user.lockUntil)}` : ''}`);
      toast('Đã khóa tài khoản.', 'info');
      modal.close();
      render(false);
    });
  }

  function deleteUser(user) {
    confirmDialog({
      title: 'Xóa tài khoản vi phạm',
      message: `Bạn sắp xóa tài khoản ${user.username}. Toàn bộ tin đăng của tài khoản này cũng sẽ bị xóa.`,
      confirmText: 'Xóa tài khoản',
      danger: true,
      reasonLabel: 'Lý do xóa tài khoản',
      reasonRequired: true
    }).then(result => {
      if (!result.ok) return;
      AdminUI.deleteUserCascade(user.id);
      DB.save();
      DB.log('Xóa tài khoản', user.username, result.reason);
      toast('Đã xóa tài khoản và toàn bộ tin liên quan.', 'info');
      render(false);
    });
  }

  function resetPassword(user) {
    DB.log('Đặt lại mật khẩu', user.username, 'Giả lập yêu cầu đặt lại mật khẩu');
    DB.save();
    toast(`Đã gửi yêu cầu đặt lại mật khẩu cho ${user.username}.`);
  }

  async function bulkAction(action) {
    const ids = [...state.selected];
    if (!ids.length) return;
    const users = ids.map(id => DB.user(id)).filter(Boolean);
    if (action === 'unlock') {
      users.forEach(user => {
        if (!AdminUI.canDangerOnUser(user, shell.admin)) return;
        user.status = 'active';
        user.lockReason = '';
        user.lockUntil = '';
      });
      DB.save();
      DB.log('Mở khóa hàng loạt', `${users.length} tài khoản`, 'Mở khóa từ bảng tài khoản');
      toast('Đã mở khóa các tài khoản được chọn.');
      state.selected.clear();
      render(false);
      return;
    }
    const confirm = await confirmDialog({
      title: action === 'delete' ? 'Xóa hàng loạt tài khoản' : 'Khóa hàng loạt tài khoản',
      message: action === 'delete' ? 'Các tài khoản được chọn sẽ bị xóa cùng toàn bộ tin liên quan.' : 'Các tài khoản được chọn sẽ bị khóa tạm thời.',
      confirmText: action === 'delete' ? 'Xóa hàng loạt' : 'Khóa hàng loạt',
      danger: action === 'delete',
      reasonLabel: 'Lý do thực hiện',
      reasonRequired: true
    });
    if (!confirm.ok) return;
    const validUsers = users.filter(user => AdminUI.canDangerOnUser(user, shell.admin));
    if (!validUsers.length) {
      toast('Không có tài khoản hợp lệ để xử lý.', 'error');
      return;
    }
    validUsers.forEach(user => {
      if (action === 'delete') AdminUI.deleteUserCascade(user.id);
      else {
        user.status = 'locked';
        user.lockReason = confirm.reason;
      }
    });
    DB.save();
    DB.log(action === 'delete' ? 'Xóa tài khoản hàng loạt' : 'Khóa tài khoản hàng loạt', `${validUsers.length} tài khoản`, confirm.reason);
    toast(action === 'delete' ? 'Đã xóa các tài khoản được chọn.' : 'Đã khóa các tài khoản được chọn.', action === 'delete' ? 'info' : 'success');
    state.selected.clear();
    render(false);
  }

  function render(showLoading = false) {
    if (showLoading) {
      AdminUI.renderTableLoading(root, 11, 1180);
      setTimeout(() => render(false), 420);
      return;
    }

    const sorted = AdminUI.sortData(accountRows(), state, userAccessors());
    const pageInfo = AdminUI.paginate(sorted, state);

    root.innerHTML = `<section class="filter-card mb-3">
      <div class="table-tools">
        <div class="input-inline">
          <label class="form-label" for="accountSearch">Tìm kiếm</label>
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="accountSearch" class="form-control" value="${esc(state.search)}" placeholder="Họ tên, tên đăng nhập, email, số điện thoại">
        </div>
        <div>
          <label class="form-label" for="accountRole">Vai trò</label>
          <select id="accountRole" class="form-select"><option value="">Tất cả</option>${Object.entries(USER_ROLES).map(([key, label]) => `<option value="${key}" ${state.role === key ? 'selected' : ''}>${label}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="accountStatus">Trạng thái</label>
          <select id="accountStatus" class="form-select"><option value="">Tất cả</option>${Object.entries(USER_STATUS).map(([key, meta]) => `<option value="${key}" ${state.status === key ? 'selected' : ''}>${meta.label}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="accountFrom">Từ ngày</label>
          <input id="accountFrom" type="date" class="form-control" value="${esc(state.from)}">
        </div>
        <div>
          <label class="form-label" for="accountTo">Đến ngày</label>
          <input id="accountTo" type="date" class="form-control" value="${esc(state.to)}">
        </div>
      </div>
    </section>

    <div class="bulk-bar ${state.selected.size ? 'show' : ''}" id="bulkBar">
      <div><strong>${state.selected.size}</strong> tài khoản đang được chọn</div>
      <div class="bulk-actions">
        <button type="button" class="btn btn-sm btn-light-border" data-bulk="unlock">Mở khóa</button>
        <button type="button" class="btn btn-sm btn-outline-primary" data-bulk="lock">Khóa</button>
        <button type="button" class="btn btn-sm btn-danger" data-bulk="delete">Xóa</button>
      </div>
    </div>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="table align-middle">
          <thead>
            <tr>
              <th scope="col" style="width:44px"><input type="checkbox" class="form-check-input row-select-all" aria-label="Chọn tất cả tài khoản"></th>
              <th scope="col">Avatar</th>
              ${AdminUI.sortHeader('Họ tên', 'fullName', state)}
              ${AdminUI.sortHeader('Tên đăng nhập', 'username', state)}
              ${AdminUI.sortHeader('Email', 'email', state)}
              <th scope="col">SĐT</th>
              ${AdminUI.sortHeader('Vai trò', 'role', state)}
              ${AdminUI.sortHeader('Trạng thái', 'status', state)}
              ${AdminUI.sortHeader('Ngày tạo', 'createdAt', state)}
              ${AdminUI.sortHeader('Số tin đăng', 'roomCount', state)}
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${pageInfo.items.length ? pageInfo.items.map(user => {
              const lockedHint = user.lockUntil ? ` · đến ${formatDateTime(user.lockUntil)}` : '';
              const dangerDisabled = !AdminUI.canDangerOnUser(user, shell.admin);
              return `<tr>
                <td><input type="checkbox" class="form-check-input row-select" data-id="${user.id}" ${state.selected.has(user.id) ? 'checked' : ''} aria-label="Chọn tài khoản ${esc(user.username)}"></td>
                <td>${avatarHTML(user)}</td>
                <td><div class="fw-semibold">${esc(user.fullName)}</div><small>${user.lastLogin ? `Đăng nhập: ${formatDateTime(user.lastLogin)}` : 'Chưa đăng nhập'}</small></td>
                <td>${esc(user.username)}</td>
                <td>${esc(user.email)}</td>
                <td>${esc(user.phone)}</td>
                <td>${esc(USER_ROLES[user.role] || user.role)}</td>
                <td>${badge(USER_STATUS, user.status)}${user.status === 'locked' && user.lockReason ? `<small>${esc(user.lockReason)}${lockedHint ? esc(lockedHint) : ''}</small>` : ''}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.roomCount}</td>
                <td>
                  <div class="action-stack">
                    <button type="button" class="icon-action" data-action="detail" data-id="${user.id}" aria-label="Xem chi tiết ${esc(user.username)}"><i class="bi bi-eye"></i></button>
                    <button type="button" class="icon-action" data-action="edit" data-id="${user.id}" aria-label="Chỉnh sửa ${esc(user.username)}"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="icon-action" data-action="password" data-id="${user.id}" aria-label="Đặt lại mật khẩu ${esc(user.username)}"><i class="bi bi-key"></i></button>
                    <button type="button" class="icon-action" data-action="${user.status === 'locked' ? 'unlock' : 'lock'}" data-id="${user.id}" aria-label="${user.status === 'locked' ? 'Mở khóa' : 'Khóa'} ${esc(user.username)}" ${dangerDisabled ? 'disabled' : ''}><i class="bi ${user.status === 'locked' ? 'bi-unlock' : 'bi-lock'}"></i></button>
                    <button type="button" class="icon-action" data-action="delete" data-id="${user.id}" aria-label="Xóa ${esc(user.username)}" ${dangerDisabled ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>`;
            }).join('') : `<tr><td colspan="11">${AdminUI.emptyState('Không tìm thấy tài khoản phù hợp', 'Hãy thử nới điều kiện tìm kiếm hoặc bộ lọc.', 'bi-search')}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${AdminUI.paginationHTML(pageInfo, state)}
    </section>`;

    document.getElementById('accountSearch').addEventListener('input', e => {
      state.search = e.target.value;
      state.page = 1;
      render(false);
    });
    [['accountRole', 'role'], ['accountStatus', 'status'], ['accountFrom', 'from'], ['accountTo', 'to']].forEach(item => {
      document.getElementById(item[0]).addEventListener('change', e => {
        state[item[1]] = e.target.value;
        state.page = 1;
        render(false);
      });
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
      const bar = document.getElementById('bulkBar');
      if (bar) bar.classList.toggle('show', !!state.selected.size);
      const label = bar ? bar.querySelector('strong') : null;
      if (label) label.textContent = String(state.selected.size);
    }));
    AdminUI.setMasterCheckbox(root);

    root.querySelectorAll('[data-bulk]').forEach(btn => btn.addEventListener('click', () => bulkAction(btn.dataset.bulk)));
    root.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
      const user = DB.user(+btn.dataset.id);
      if (!user) return;
      switch (btn.dataset.action) {
        case 'detail': openDetail(user); break;
        case 'edit': openAccountForm(user); break;
        case 'password': resetPassword(user); break;
        case 'lock': openLockModal(user, false); break;
        case 'unlock': openLockModal(user, true); break;
        case 'delete': deleteUser(user); break;
      }
    }));
  }

  document.getElementById('addUserBtn').addEventListener('click', () => openAccountForm());
  document.getElementById('exportUsersBtn').addEventListener('click', () => downloadCSV('tai-khoan-rentsmart.csv', exportCSVRows()));
  render(true);
});
