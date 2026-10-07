/* ==========================================================
   RentSmart HCM - admin/bao-cao.js
   Xử lý báo cáo vi phạm liên quan tới tin đăng và chủ tin.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const shell = AdminUI.mount('bao-cao', 'Báo cáo vi phạm');
  if (!shell) return;
  const root = shell.content;
  const state = {
    search: '',
    status: '',
    page: 1,
    perPage: 8,
    sortKey: 'createdAt',
    sortDir: 'desc'
  };

  window.addEventListener('admin:quick-search', e => {
    state.search = e.detail || '';
    state.page = 1;
    render(false);
  });

  function reportRows() {
    return DB.t('reports')
      .map(report => {
        const room = DB.room(report.roomId);
        const reporter = DB.user(report.reporterId);
        const owner = room ? DB.user(room.landlordId) : null;
        return { ...report, room, reporter, owner };
      })
      .filter(report => {
        const keyword = norm(state.search);
        if (keyword && !norm(`${report.room ? report.room.title : ''} ${report.reporter ? report.reporter.fullName : ''} ${report.owner ? report.owner.fullName : ''} ${report.content}`).includes(keyword)) return false;
        if (state.status && report.status !== state.status) return false;
        return true;
      });
  }

  function accessors() {
    return {
      id: report => report.id,
      createdAt: report => new Date(report.createdAt),
      reason: report => REPORT_REASONS[report.reason] || report.reason,
      status: report => REPORT_STATUS[report.status] ? REPORT_STATUS[report.status].label : report.status
    };
  }

  async function handleReportAction(action, reportId) {
    const report = DB.t('reports').find(item => item.id === +reportId);
    if (!report) return;
    const room = DB.room(report.roomId);
    const owner = room ? DB.user(room.landlordId) : null;
    const noteField = root.querySelector(`[data-note="${report.id}"]`);
    const inlineNote = noteField ? noteField.value.trim() : '';

    const prompts = {
      ignore: { title: 'Bỏ qua báo cáo', message: 'Báo cáo sẽ được đánh dấu là đã xử lý.', confirmText: 'Bỏ qua', danger: false, required: false },
      remove: { title: 'Gỡ tin theo báo cáo', message: 'Tin này sẽ bị gỡ khỏi trang công khai.', confirmText: 'Gỡ tin', danger: true, required: true },
      warn: { title: 'Cảnh cáo chủ tin', message: 'Hệ thống sẽ ghi nhận cảnh cáo cho chủ tin.', confirmText: 'Cảnh cáo', danger: false, required: true },
      lock: { title: 'Khóa tài khoản chủ tin', message: 'Tài khoản chủ tin sẽ bị khóa ngay lập tức.', confirmText: 'Khóa tài khoản', danger: true, required: true },
      delete: { title: 'Xóa tài khoản chủ tin', message: 'Tài khoản chủ tin và toàn bộ tin liên quan sẽ bị xóa.', confirmText: 'Xóa tài khoản', danger: true, required: true }
    };
    const preset = prompts[action];
    const result = await confirmDialog({
      title: preset.title,
      message: preset.message,
      confirmText: preset.confirmText,
      danger: preset.danger,
      reasonLabel: 'Ghi chú xử lý',
      reasonRequired: preset.required
    });
    if (!result.ok) return;
    const note = result.reason || inlineNote || 'Xử lý thủ công';

    if (action === 'remove' && room) {
      room.status = 'removed';
      room.statusNote = note;
      room.updatedAt = new Date().toISOString();
      DB.log('Gỡ tin', `Tin #${room.id}`, `Từ báo cáo #${report.id}: ${note}`);
    }
    if (action === 'warn' && owner) {
      owner.warningCount = (owner.warningCount || 0) + 1;
      DB.log('Cảnh cáo chủ tin', owner.username, `Báo cáo #${report.id}: ${note}`);
      toast('Đã ghi nhận cảnh cáo cho chủ tin.', 'info');
    }
    if (action === 'lock' && owner && AdminUI.canDangerOnUser(owner, shell.admin)) {
      owner.status = 'locked';
      owner.lockReason = note;
      DB.log('Khóa tài khoản', owner.username, `Từ báo cáo #${report.id}: ${note}`);
    }
    if (action === 'delete' && owner && AdminUI.canDangerOnUser(owner, shell.admin)) {
      AdminUI.deleteUserCascade(owner.id);
      DB.log('Xóa tài khoản', owner.username, `Từ báo cáo #${report.id}: ${note}`);
    }
    report.status = 'done';
    report.note = note;
    DB.save();
    DB.log('Xử lý báo cáo', `Báo cáo #${report.id}`, `${preset.confirmText}: ${note}`);
    if (action === 'ignore') toast('Đã đánh dấu bỏ qua báo cáo.');
    if (action === 'remove') toast('Đã gỡ tin và kết thúc báo cáo.', 'info');
    if (action === 'lock') toast('Đã khóa tài khoản chủ tin.', 'info');
    if (action === 'delete') toast('Đã xóa tài khoản chủ tin.', 'info');
    render(false);
  }

  function render(showLoading = false) {
    if (showLoading) {
      AdminUI.renderTableLoading(root, 8, 1280);
      setTimeout(() => render(false), 420);
      return;
    }
    const sorted = AdminUI.sortData(reportRows(), state, accessors());
    const pageInfo = AdminUI.paginate(sorted, state);

    root.innerHTML = `<section class="filter-card mb-3">
      <div class="table-tools">
        <div class="input-inline">
          <label class="form-label" for="reportSearch">Tìm kiếm</label>
          <i class="bi bi-search"></i>
          <input id="reportSearch" class="form-control" value="${esc(state.search)}" placeholder="Tin bị báo cáo, người báo cáo, chủ tin, nội dung">
        </div>
        <div>
          <label class="form-label" for="reportStatus">Trạng thái</label>
          <select id="reportStatus" class="form-select"><option value="">Tất cả</option>${Object.entries(REPORT_STATUS).map(([key, meta]) => `<option value="${key}" ${state.status === key ? 'selected' : ''}>${meta.label}</option>`).join('')}</select>
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="table align-middle">
          <thead>
            <tr>
              ${AdminUI.sortHeader('Mã báo cáo', 'id', state)}
              <th scope="col">Tin / Tài khoản bị báo cáo</th>
              <th scope="col">Người báo cáo</th>
              ${AdminUI.sortHeader('Lý do', 'reason', state)}
              <th scope="col">Nội dung</th>
              ${AdminUI.sortHeader('Ngày gửi', 'createdAt', state)}
              ${AdminUI.sortHeader('Trạng thái', 'status', state)}
              <th scope="col">Ghi chú / Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${pageInfo.items.length ? pageInfo.items.map(report => `<tr>
              <td>#${report.id}</td>
              <td>
                <div class="fw-semibold">${report.room ? esc(report.room.title) : 'Tin đã bị xóa'}</div>
                <small>${report.owner ? esc(report.owner.fullName) : 'Không xác định chủ tin'}</small>
              </td>
              <td>${report.reporter ? esc(report.reporter.fullName) : 'Không xác định'}</td>
              <td>${esc(REPORT_REASONS[report.reason] || report.reason)}</td>
              <td>${esc(report.content || '')}</td>
              <td>${formatDateTime(report.createdAt)}</td>
              <td>${badge(REPORT_STATUS, report.status)}</td>
              <td>
                <label class="form-label small" for="note-${report.id}">Ghi chú xử lý</label>
                <textarea id="note-${report.id}" class="form-control report-note mb-2" data-note="${report.id}" rows="2">${esc(report.note || '')}</textarea>
                <div class="action-stack">
                  <button type="button" class="text-action" data-action="ignore" data-id="${report.id}">Bỏ qua</button>
                  <button type="button" class="text-action" data-action="remove" data-id="${report.id}">Gỡ tin</button>
                  <button type="button" class="text-action" data-action="warn" data-id="${report.id}">Cảnh cáo</button>
                  <button type="button" class="text-action" data-action="lock" data-id="${report.id}" ${report.owner && AdminUI.canDangerOnUser(report.owner, shell.admin) ? '' : 'disabled'}>Khóa tài khoản</button>
                  <button type="button" class="text-action" data-action="delete" data-id="${report.id}" ${report.owner && AdminUI.canDangerOnUser(report.owner, shell.admin) ? '' : 'disabled'}>Xóa tài khoản</button>
                </div>
              </td>
            </tr>`).join('') : `<tr><td colspan="8">${AdminUI.emptyState('Không có báo cáo phù hợp', 'Danh sách báo cáo đang trống hoặc không khớp bộ lọc.', 'bi-flag')}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${AdminUI.paginationHTML(pageInfo, state)}
    </section>`;

    document.getElementById('reportSearch').addEventListener('input', e => { state.search = e.target.value; state.page = 1; render(false); });
    document.getElementById('reportStatus').addEventListener('change', e => { state.status = e.target.value; state.page = 1; render(false); });
    AdminUI.bindSortAndPagination(root, state, () => render(false));
    root.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => handleReportAction(btn.dataset.action, +btn.dataset.id)));
  }

  render(true);
});
