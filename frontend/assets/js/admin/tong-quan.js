/* ==========================================================
   RentSmart HCM - admin/tong-quan.js
   Tổng quan số liệu và danh sách việc cần xử lý ngay.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const shell = AdminUI.mount('tong-quan', 'Tổng quan');
  if (!shell) return;
  const root = shell.content;
  let charts = [];

  function roomStatusUpdate(room, status, note, actionLabel) {
    room.status = status;
    room.statusNote = note || '';
    room.updatedAt = new Date().toISOString();
    DB.save();
    DB.log(actionLabel, `Tin #${room.id}`, note || room.title);
  }

  async function handleApprove(id) {
    const room = DB.room(id);
    if (!room) return;
    roomStatusUpdate(room, 'approved', '', 'Duyệt tin');
    toast('Đã duyệt tin thành công.');
    render();
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
    roomStatusUpdate(room, 'rejected', result.reason, 'Từ chối tin');
    toast('Đã từ chối tin đăng.', 'info');
    render();
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
    if (removeRoom && room) {
      room.status = 'removed';
      room.statusNote = result.reason;
      room.updatedAt = new Date().toISOString();
      DB.log('Gỡ tin', `Tin #${room.id}`, `Từ báo cáo #${report.id}: ${result.reason}`);
    }
    report.status = 'done';
    report.note = result.reason || 'Đã kiểm tra thủ công';
    DB.save();
    DB.log('Xử lý báo cáo', `Báo cáo #${report.id}`, report.note);
    toast(removeRoom ? 'Đã gỡ tin từ báo cáo.' : 'Đã cập nhật báo cáo.');
    render();
  }

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
  }

  function buildTrendSeries(days = 30) {
    let base = 620;
    return Array.from({ length: days }, (_, idx) => {
      base += Math.round(Math.sin(idx / 3) * 18 + (idx % 5 === 0 ? 24 : -8));
      return Math.max(420, base + (idx % 4) * 6);
    });
  }

  function renderCharts() {
    destroyCharts();
    const rooms = DB.t('rooms');
    const users = DB.t('users');
    const visitsSeries = buildTrendSeries(30);
    const visitsLabels = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - idx));
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const weeks = Array.from({ length: 8 }, (_, idx) => idx);
    const weeklyNewRooms = weeks.map(offset => {
      const start = new Date();
      start.setDate(start.getDate() - (7 * (7 - offset)));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return rooms.filter(room => new Date(room.createdAt) >= start && new Date(room.createdAt) <= end).length;
    });

    const roomTypeCounts = Object.keys(ROOM_TYPES).map(key => rooms.filter(room => room.roomType === key).length);
    const roleCounts = ['tenant', 'landlord', 'admin'].map(role => users.filter(user => user.role === role).length);
    const topDistricts = [...DISTRICTS]
      .map(name => ({ name, count: rooms.filter(room => room.district === name).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    charts.push(new Chart(document.getElementById('ovVisitsChart'), {
      type: 'line',
      data: {
        labels: visitsLabels,
        datasets: [{
          label: 'Lượt truy cập',
          data: visitsSeries,
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
        labels: weeks.map(i => `Tuần ${i + 1}`),
        datasets: [{ label: 'Tin mới', data: weeklyNewRooms, backgroundColor: AdminUI.CHART_COLORS.primarySoft, borderRadius: 10 }]
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
        datasets: [{ label: 'Số tin', data: topDistricts.map(item => item.count), backgroundColor: AdminUI.CHART_COLORS.primary, borderRadius: 10 }]
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
    const todayViews = rooms.reduce((sum, room) => sum + (room.views || 0), 0) + 480;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newAccounts = users.filter(user => new Date(user.createdAt) >= sevenDaysAgo).length;

    root.innerHTML = `<section class="kpi-grid mb-4">
      ${[
        ['bi-people', 'Tổng tài khoản', users.length],
        ['bi-person-hearts', 'Người thuê', users.filter(user => user.role === 'tenant').length],
        ['bi-house-door', 'Chủ nhà', users.filter(user => user.role === 'landlord').length],
        ['bi-card-list', 'Tổng tin đăng', rooms.length],
        ['bi-hourglass-split', 'Tin chờ duyệt', pendingRooms.length],
        ['bi-flag', 'Tin vi phạm / bị gỡ', rooms.filter(room => ['removed', 'rejected'].includes(room.status)).length],
        ['bi-graph-up-arrow', 'Lượt truy cập hôm nay', formatMoney(todayViews)],
        ['bi-person-plus', 'Tài khoản mới 7 ngày', newAccounts]
      ].map(item => `<article class="metric-card"><div class="metric-icon"><i class="bi ${item[0]}"></i></div><div><small>${item[1]}</small><strong>${item[2]}</strong></div></article>`).join('')}
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head"><div><h2 class="h5 mb-1">Lượt truy cập 30 ngày gần nhất</h2><p class="card-subtle mb-0">Dữ liệu mô phỏng theo xu hướng tăng ổn định.</p></div></div>
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

  render();
  window.addEventListener('pagehide', () => destroyCharts(), { once: true });
});
