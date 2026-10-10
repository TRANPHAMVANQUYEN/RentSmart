/* ==========================================================
   RentSmart HCM - admin/nhat-ky.js
   Nhật ký hoạt động của quản trị viên.
   ========================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  const shell = AdminUI.mount('nhat-ky', 'Nhật ký hoạt động');
  if (!shell) return;
  const root = shell.content;
  shell.tools.innerHTML = `<button type="button" class="btn btn-light-border" id="exportLogsBtn"><i class="bi bi-download"></i> Xuất CSV</button>`;

  const state = {
    search: '',
    action: '',
    from: '',
    to: '',
    page: 1,
    perPage: 12,
    sortKey: 'createdAt',
    sortDir: 'desc'
  };

  window.addEventListener('admin:quick-search', e => {
    state.search = e.detail || '';
    state.page = 1;
    render(false);
  });

  function rows() {
    const from = AdminUI.normalizeDateInput(state.from);
    const to = AdminUI.normalizeDateInput(state.to);
    return DB.t('activity_logs')
      .map(log => ({ ...log, admin: log.admin || DB.user(log.adminId) }))
      .filter(log => {
        const keyword = norm(state.search);
        if (keyword && !norm(`${log.action} ${log.target} ${log.note} ${log.admin ? log.admin.fullName : ''}`).includes(keyword)) return false;
        if (state.action && log.action !== state.action) return false;
        if ((from || to) && !AdminUI.dateInRange(log.createdAt, from, to)) return false;
        return true;
      });
  }

  function accessors() {
    return {
      createdAt: row => new Date(row.createdAt),
      action: row => row.action,
      target: row => row.target
    };
  }

  function exportRows() {
    const table = [['Thời gian', 'Quản trị viên', 'Hành động', 'Đối tượng', 'Ghi chú']];
    rows().forEach(log => table.push([
      formatDateTime(log.createdAt),
      log.admin ? log.admin.fullName : 'Không xác định',
      log.action,
      log.target,
      log.note || ''
    ]));
    return table;
  }

  function render(showLoading = false) {
    if (showLoading) {
      AdminUI.renderTableLoading(root, 5, 980);
      setTimeout(() => render(false), 420);
      return;
    }
    const actions = [...new Set(DB.t('activity_logs').map(log => log.action))];
    const sorted = AdminUI.sortData(rows(), state, accessors());
    const pageInfo = AdminUI.paginate(sorted, state);

    root.innerHTML = `<section class="filter-card mb-3">
      <div class="table-tools">
        <div class="input-inline">
          <label class="form-label" for="logSearch">Tìm kiếm</label>
          <i class="bi bi-search"></i>
          <input id="logSearch" class="form-control" value="${esc(state.search)}" placeholder="Hành động, đối tượng, ghi chú, quản trị viên">
        </div>
        <div>
          <label class="form-label" for="logAction">Loại hành động</label>
          <select id="logAction" class="form-select"><option value="">Tất cả</option>${actions.map(action => `<option value="${esc(action)}" ${state.action === action ? 'selected' : ''}>${esc(action)}</option>`).join('')}</select>
        </div>
        <div>
          <label class="form-label" for="logFrom">Từ ngày</label>
          <input id="logFrom" type="date" class="form-control" value="${esc(state.from)}">
        </div>
        <div>
          <label class="form-label" for="logTo">Đến ngày</label>
          <input id="logTo" type="date" class="form-control" value="${esc(state.to)}">
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="table-wrap">
        <table class="table align-middle">
          <thead>
            <tr>
              ${AdminUI.sortHeader('Thời gian', 'createdAt', state)}
              <th scope="col">Quản trị viên</th>
              ${AdminUI.sortHeader('Hành động', 'action', state)}
              ${AdminUI.sortHeader('Đối tượng', 'target', state)}
              <th scope="col">Lý do / Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${pageInfo.items.length ? pageInfo.items.map(log => `<tr>
              <td>${formatDateTime(log.createdAt)}</td>
              <td>${log.admin ? esc(log.admin.fullName) : 'Không xác định'}</td>
              <td><span class="log-badge">${esc(log.action)}</span></td>
              <td>${esc(log.target)}</td>
              <td>${esc(log.note || '')}</td>
            </tr>`).join('') : `<tr><td colspan="5">${AdminUI.emptyState('Không có nhật ký phù hợp', 'Hãy thay đổi bộ lọc để xem nhiều bản ghi hơn.', 'bi-journal-text')}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${AdminUI.paginationHTML(pageInfo, state)}
    </section>`;

    document.getElementById('logSearch').addEventListener('input', e => { state.search = e.target.value; state.page = 1; render(false); });
    [['logAction', 'action'], ['logFrom', 'from'], ['logTo', 'to']].forEach(item => {
      document.getElementById(item[0]).addEventListener('change', e => {
        state[item[1]] = e.target.value;
        state.page = 1;
        render(false);
      });
    });
    AdminUI.bindSortAndPagination(root, state, () => render(false));
  }

  document.getElementById('exportLogsBtn').addEventListener('click', () => downloadCSV('nhat-ky-hoat-dong.csv', exportRows()));
  if (await AdminAPI.hydrate(['activity_logs'], root)) render(false);
});
