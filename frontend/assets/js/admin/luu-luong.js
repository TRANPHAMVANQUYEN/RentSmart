/* ==========================================================
   RentSmart HCM - admin/luu-luong.js
   Lưu lượng được ghi nhận từ các page view thực tế.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const shell = AdminUI.mount('luu-luong', 'Lưu lượng & Mạng');
  if (!shell) return;
  const root = shell.content;
  let charts = [];
  let period = 'day';

  function render(data) {
    root.innerHTML = `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <p class="text-muted mb-0">Thống kê lượt xem ẩn danh đã được ghi nhận; không lưu địa chỉ IP.</p>
      <div class="d-flex gap-2">
        <select id="trafficPeriod" class="form-select" aria-label="Khoảng thời gian">
          <option value="day" ${period === 'day' ? 'selected' : ''}>30 ngày</option>
          <option value="week" ${period === 'week' ? 'selected' : ''}>12 tuần</option>
          <option value="month" ${period === 'month' ? 'selected' : ''}>12 tháng</option>
        </select>
        <button type="button" class="btn btn-light-border" id="trafficRefresh"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Làm mới</button>
      </div>
    </div>
    <section class="kpi-grid mb-4">
      ${[
        ['bi-eye', 'Lượt xem hôm nay', data.counts.today],
        ['bi-clock-history', '24 giờ gần nhất', data.counts.last24Hours],
        ['bi-calendar3', '30 ngày gần nhất', data.counts.last30Days]
      ].map(item => `<article class="metric-card"><div class="metric-icon"><i class="bi ${item[0]}" aria-hidden="true"></i></div><div><small>${item[1]}</small><strong>${formatMoney(item[2])}</strong></div></article>`).join('')}
    </section>
    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Lượt xem theo ${period === 'week' ? 'tuần' : period === 'month' ? 'tháng' : 'ngày'}</h2></div>
        ${data.dailyViews.length
          ? '<div class="chart-canvas-wrap"><canvas id="trafficPeriodChart" role="img" aria-label="Biểu đồ lượt xem theo khoảng thời gian"></canvas></div>'
          : '<div class="empty-state">Chưa có lượt xem nào trong khoảng thời gian này.</div>'}
      </article>
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Thiết bị truy cập</h2></div>
        ${Object.keys(data.devices).length
          ? '<div class="chart-canvas-wrap"><canvas id="trafficDeviceChart" role="img" aria-label="Biểu đồ lượt xem theo thiết bị"></canvas></div>'
          : '<div class="empty-state">Chưa có dữ liệu thiết bị.</div>'}
      </article>
    </section>
    <section class="chart-grid-2 mb-4">
      <article class="panel-card p-3">
        <h2 class="h5">Trang được xem nhiều</h2>
        ${data.topPages.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Đường dẫn</th><th class="text-end">Lượt xem</th></tr></thead><tbody>
          ${data.topPages.map(row => `<tr><td class="text-break">${esc(row.path)}</td><td class="text-end">${formatMoney(row.total)}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty-state">Chưa có dữ liệu trang được xem.</div>'}
      </article>
      <article class="panel-card p-3">
        <h2 class="h5">Nguồn truy cập</h2>
        ${data.sources.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Nguồn</th><th class="text-end">Lượt xem</th></tr></thead><tbody>
          ${data.sources.map(row => `<tr><td class="text-break">${esc(row.source)}</td><td class="text-end">${formatMoney(row.total)}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty-state">Chưa có thông tin nguồn truy cập.</div>'}
      </article>
    </section>
    <section class="panel-card p-3">
      <h2 class="h5">Truy cập gần đây</h2>
      ${data.accessLogs.length ? `<div class="table-wrap"><table class="table align-middle"><thead><tr><th>Thời gian</th><th>Trang</th><th>Thiết bị</th><th>Nguồn</th></tr></thead><tbody>
        ${data.accessLogs.map(row => `<tr><td>${formatDateTime(row.createdAt)}</td><td class="text-break">${esc(row.path)}</td><td>${esc(row.device)}</td><td class="text-break">${esc(row.source || 'Trực tiếp')}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty-state">Chưa ghi nhận lượt truy cập. Khi khách mở các trang công khai, số liệu sẽ xuất hiện tại đây.</div>'}
    </section>`;

    charts.forEach(item => item.destroy());
    charts = [];
    const periodCanvas = root.querySelector('#trafficPeriodChart');
    if (periodCanvas) {
      charts.push(new Chart(periodCanvas, {
        type: 'line',
        data: {
          labels: data.periodViews.map(row => row.label),
          datasets: [{
            label: 'Lượt xem',
            data: data.periodViews.map(row => Number(row.total)),
            borderColor: AdminUI.CHART_COLORS.primary,
            backgroundColor: 'rgba(194, 65, 12, .12)',
            fill: true,
            tension: .3,
            pointRadius: 2
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      }));
    }
    const deviceCanvas = root.querySelector('#trafficDeviceChart');
    if (deviceCanvas) {
      charts.push(new Chart(deviceCanvas, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.devices),
          datasets: [{ data: Object.values(data.devices).map(Number), backgroundColor: [AdminUI.CHART_COLORS.primary, AdminUI.CHART_COLORS.primarySoft, AdminUI.CHART_COLORS.stone] }]
        },
        options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: true, position: 'bottom' } } }
      }));
    }
    root.querySelector('#trafficPeriod').addEventListener('change', event => {
      period = event.target.value;
      load();
    });
    root.querySelector('#trafficRefresh').addEventListener('click', load);
  }

  async function load() {
    root.innerHTML = '<div class="alert alert-info" role="status">Đang tải số liệu lưu lượng…</div>';
    try {
      render(await AdminAPI.request(`traffic?period=${encodeURIComponent(period)}`));
    } catch (error) {
      root.innerHTML = `<div class="alert alert-danger" role="alert">${esc(error.message)} <button class="btn btn-sm btn-outline-danger ms-2" type="button" data-retry>Thử lại</button></div>`;
      root.querySelector('[data-retry]').addEventListener('click', load);
    }
  }

  window.addEventListener('pagehide', () => charts.forEach(item => item.destroy()), { once: true });
  load();
});
