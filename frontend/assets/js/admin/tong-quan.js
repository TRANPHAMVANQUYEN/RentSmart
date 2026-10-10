/* ==========================================================
   RentSmart HCM - admin/tong-quan.js
   Tổng quan số liệu và danh sách việc cần xử lý ngay.
   ========================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  const shell = AdminUI.mount('tong-quan', 'Tổng quan');
  if (!shell) return;
  const root = shell.content;
  let charts = [];
  let stats;

  async function roomStatusUpdate(room, status, note) {
    await AdminAPI.write('PATCH', `rooms/${room.id}`, { status, rejectReason: note || null });
    await AdminAPI.hydrate(['rooms', 'reports'], root);
  }

  async function handleApprove(id) {
    const room = DB.room(id);
    if (!room) return;
    try {
      await roomStatusUpdate(room, 'approved', '');
      toast('Đã duyệt tin thành công.');
      await refresh();
    } catch (error) { toast(error.message, 'error'); }
  }

  async function handleReject(id) {
    const room = DB.room(id);
    if (!room) return;
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
      await roomStatusUpdate(room, 'rejected', result.reason);
      toast('Đã từ chối tin đăng.', 'info');
      await refresh();
    } catch (error) { toast(error.message, 'error'); }
  }

  async function handleReport(reportId, removeRoom) {
    const report = DB.t('reports').find(item => item.id === +reportId);
    if (!report) return;
    const room = DB.room(report.roomId);
    const result = await confirmDialog({
      title: removeRoom ? 'Gỡ tin từ báo cáo' : 'Đánh dấu đã xử lý',
      message: removeRoom ? 'Tin này sẽ bị gỡ khỏi trang công khai.' : 'Báo cáo sẽ được chuyển sang trạng thái đã xử lý.',
      confirmText: removeRoom ? 'Gỡ tin' : 'Xác nhận',
      danger: removeRoom,
      reasonLabel: 'Ghi chú xử lý',
      reasonRequired: removeRoom
    });
    if (!result.ok) return;
    try {
      await AdminAPI.write('POST', `reports/${report.id}/resolve`, {
        action: removeRoom ? 'remove' : 'ignore',
        note: result.reason || 'Đã kiểm tra thủ công'
      });
      await refresh();
      toast(removeRoom ? 'Đã gỡ tin từ báo cáo.' : 'Đã cập nhật báo cáo.');
    } catch (error) { toast(error.message, 'error'); }
  }

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
  }

  function renderCharts() {
    destroyCharts();
    const rooms = DB.t('rooms');
    const users = DB.t('users');
    const daily = new Map(stats.dailyViews.map(item => [item.day, Number(item.total)]));
    const visitsLabels = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - idx));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, key };
    });
    const weeks = stats.weeklyRooms;
    const roomTypeCounts = Object.keys(ROOM_TYPES).map(key => Number(stats.roomsByType[key] || 0));
    const roleCounts = ['tenant', 'landlord', 'admin'].map(role => Number(stats.usersByRole[role] || 0));
    const topDistricts = stats.topDistricts;

    charts.push(new Chart(document.getElementById('ovVisitsChart'), {
      type: 'line',
      data: {
        labels: visitsLabels.map(item => item.label),
        datasets: [{
          label: 'Lượt truy cập',
          data: visitsLabels.map(item => daily.get(item.key) || 0),
          borderColor: AdminUI.CHART_COLORS.primary,
          backgroundColor: 'rgba(194, 65, 12, .12)',
          fill: true,
          tension: .35,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: AdminUI.CHART_COLORS.grid } }
        }
      }
    }));

    charts.push(new Chart(document.getElementById('ovWeeklyListingsChart'), {
      type: 'bar',
      data: {
        labels: weeks.map(item => `Tuần ${String(item.week).slice(-2)}`),
        datasets: [{ label: 'Tin mới', data: weeks.map(item => Number(item.total)), backgroundColor: AdminUI.CHART_COLORS.primarySoft, borderRadius: 10 }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: AdminUI.CHART_COLORS.grid }, beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    }));

    charts.push(new Chart(document.getElementById('ovRoomTypeChart'), {
      type: 'doughnut',
      data: {
        labels: Object.values(ROOM_TYPES),
        datasets: [{ data: roomTypeCounts, backgroundColor: [AdminUI.CHART_COLORS.primary, AdminUI.CHART_COLORS.primarySoft, AdminUI.CHART_COLORS.primaryLight, AdminUI.CHART_COLORS.stone] }]
      },
      options: { maintainAspectRatio: false, cutout: '62%' }
    }));

    charts.push(new Chart(document.getElementById('ovRoleChart'), {
      type: 'doughnut',
      data: {
        labels: ['Người thuê', 'Chủ nhà', 'Quản trị viên'],
        datasets: [{ data: roleCounts, backgroundColor: [AdminUI.CHART_COLORS.primary, AdminUI.CHART_COLORS.stone, AdminUI.CHART_COLORS.stoneLight] }]
      },
      options: { maintainAspectRatio: false, cutout: '62%' }
    }));

    charts.push(new Chart(document.getElementById('ovDistrictChart'), {
      type: 'bar',
      data: {
        labels: topDistricts.map(item => item.name),
        datasets: [{ label: 'Số tin', data: topDistricts.map(item => Number(item.total)), backgroundColor: AdminUI.CHART_COLORS.primary, borderRadius: 10 }]
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: AdminUI.CHART_COLORS.grid }, beginAtZero: true, ticks: { precision: 0 } },
          y: { grid: { display: false } }
        }
      }
    }));
  }

  function render() {
    const users = DB.t('users');
    const rooms = DB.t('rooms');
    const pendingRooms = rooms.filter(room => room.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const openReports = DB.t('reports').filter(report => report.status === 'open').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const counts = stats.counts;

    root.innerHTML = `<section class="kpi-grid mb-4">
      ${[
        ['bi-people', 'Tổng tài khoản', counts.users],
        ['bi-person-hearts', 'Người thuê', counts.tenants],
        ['bi-house-door', 'Chủ nhà', counts.landlords],
        ['bi-card-list', 'Tổng tin đăng', counts.rooms],
        ['bi-hourglass-split', 'Tin chờ duyệt', counts.pendingRooms],
        ['bi-flag', 'Tin vi phạm / bị gỡ', counts.removedRooms + counts.rejectedRooms],
        ['bi-graph-up-arrow', 'Lượt truy cập hôm nay', formatMoney(counts.todayViews)],
        ['bi-person-plus', 'Tài khoản mới 7 ngày', counts.newAccounts]
      ].map(item => `<article class="metric-card"><div class="metric-icon"><i class="bi ${item[0]}"></i></div><div><small>${item[1]}</small><strong>${item[2]}</strong></div></article>`).join('')}
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head"><div><h2 class="h5 mb-1">Lượt truy cập 30 ngày gần nhất</h2><p class="card-subtle mb-0">${stats.dailyViews.length ? 'Dữ liệu lượt xem được ghi nhận trong hệ thống.' : 'Chưa có dữ liệu lượt xem được ghi nhận.'}</p></div></div>
        <div class="chart-canvas-wrap"><canvas id="ovVisitsChart" aria-label="Biểu đồ lượt truy cập 30 ngày" role="img"></canvas></div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><div><h2 class="h5 mb-1">Tin đăng mới theo tuần</h2><p class="card-subtle mb-0">Theo thời gian tạo dữ liệu hiện có.</p></div></div>
        <div class="chart-canvas-wrap"><canvas id="ovWeeklyListingsChart" aria-label="Biểu đồ cột số tin đăng mới theo tuần" role="img"></canvas></div>
      </article>
    </section>

    <section class="chart-grid-3 mb-4">
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Tỷ lệ tin theo loại</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="ovRoomTypeChart" aria-label="Biểu đồ tròn tỷ lệ tin theo loại" role="img"></canvas></div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Tỷ lệ tài khoản theo vai trò</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="ovRoleChart" aria-label="Biểu đồ tròn tỷ lệ tài khoản theo vai trò" role="img"></canvas></div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Top 5 quận có nhiều tin</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="ovDistrictChart" aria-label="Biểu đồ cột ngang top 5 quận có nhiều tin" role="img"></canvas></div>
      </article>
    </section>

    <section class="queue-card p-3">
      <div class="section-head"><div><h2 class="h5 mb-1">Cần xử lý ngay</h2><p class="card-subtle mb-0">Tập trung vào tin chờ duyệt và báo cáo chưa xử lý.</p></div></div>
      <div class="chart-grid-2">
        <div>
          <div class="list-head"><h3 class="h6 mb-0">Tin chờ duyệt mới nhất</h3><span class="rs-badge warn">${pendingRooms.length} tin</span></div>
          <div class="queue-list">
            ${pendingRooms.slice(0, 5).map(room => {
              const owner = DB.user(room.landlordId);
              return `<article class="queue-item">
                <div>
                  <h3>${esc(room.title)}</h3>
                  <p>${owner ? esc(owner.fullName) : 'Không xác định'} · ${esc(room.district)} · ${formatPrice(room.price)}</p>
                </div>
                <div class="queue-actions">
                  <button class="btn btn-sm btn-outline-primary" type="button" data-approve-room="${room.id}">Duyệt</button>
                  <button class="btn btn-sm btn-danger" type="button" data-reject-room="${room.id}">Từ chối</button>
                </div>
              </article>`;
            }).join('') || AdminUI.emptyState('Không còn tin chờ duyệt', 'Danh sách tin chờ duyệt đang trống.', 'bi-check2-circle')}
          </div>
        </div>
        <div>
          <div class="list-head"><h3 class="h6 mb-0">Báo cáo chưa xử lý</h3><span class="rs-badge bad">${openReports.length} báo cáo</span></div>
          <div class="queue-list">
            ${openReports.slice(0, 5).map(report => {
              const room = DB.room(report.roomId);
              const reporter = DB.user(report.reporterId);
              return `<article class="queue-item">
                <div>
                  <h3>${room ? esc(room.title) : 'Tin đã bị xóa'}</h3>
                  <p>${reporter ? esc(reporter.fullName) : 'Không xác định'} · ${esc(REPORT_REASONS[report.reason] || report.reason)} · ${formatDateTime(report.createdAt)}</p>
                </div>
                <div class="queue-actions">
                  <button class="btn btn-sm btn-light-border" type="button" data-mark-report="${report.id}">Đã xem</button>
                  <button class="btn btn-sm btn-danger" type="button" data-remove-report-room="${report.id}">Gỡ tin</button>
                </div>
              </article>`;
            }).join('') || AdminUI.emptyState('Không có báo cáo tồn đọng', 'Tất cả báo cáo đã được xử lý.', 'bi-shield-check')}
          </div>
        </div>
      </div>
    </section>`;

    renderCharts();
    root.querySelectorAll('[data-approve-room]').forEach(btn => btn.addEventListener('click', () => handleApprove(+btn.dataset.approveRoom)));
    root.querySelectorAll('[data-reject-room]').forEach(btn => btn.addEventListener('click', () => handleReject(+btn.dataset.rejectRoom)));
    root.querySelectorAll('[data-mark-report]').forEach(btn => btn.addEventListener('click', () => handleReport(+btn.dataset.markReport, false)));
    root.querySelectorAll('[data-remove-report-room]').forEach(btn => btn.addEventListener('click', () => handleReport(+btn.dataset.removeReportRoom, true)));
  }

  async function refresh() {
    try {
      const [ok, nextStats] = await Promise.all([
        AdminAPI.hydrate(['users', 'rooms', 'reports'], root),
        AdminAPI.request('dashboard')
      ]);
      if (!ok) return;
      stats = nextStats;
      render();
    } catch (error) { toast(error.message, 'error'); }
  }

  await refresh();
  window.addEventListener('pagehide', () => destroyCharts(), { once: true });
});
