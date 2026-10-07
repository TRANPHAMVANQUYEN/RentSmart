/* ==========================================================
   RentSmart HCM - admin/luu-luong.js
   Mô phỏng dữ liệu lưu lượng, mạng và hạ tầng theo thời gian thực.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const shell = AdminUI.mount('luu-luong', 'Lưu lượng & Mạng');
  if (!shell) return;
  const root = shell.content;
  let timer = null;
  let charts = [];

  const state = {
    period: 'day',
    statusFilter: '',
    metrics: createSimulator()
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomWalk(prev, min, max, step, decimals = 0) {
    const next = clamp(prev + (Math.random() * 2 - 1) * step, min, max);
    return Number(next.toFixed(decimals));
  }

  function randomIp() {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.');
  }

  function createSimulator() {
    const labels = Array.from({ length: 20 }, (_, idx) => {
      const d = new Date(Date.now() - (19 - idx) * 60000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const pages = ['/', '/phong-tro.html', '/chi-tiet.html?id=5', '/dang-nhap.html', '/chu-nha/quan-ly-tin.html', '/admin/tong-quan.html', '/tin-da-luu.html', '/admin/tin-dang.html'];
    const keywords = ['phòng trọ quận 7', 'phòng trọ bình thạnh', 'ở ghép tân bình', 'căn hộ mini quận 1', 'nhà nguyên căn thủ đức', 'phòng gần đại học', 'trọ giá rẻ gò vấp', 'phòng full nội thất'];
    return {
      onlineUsers: 124,
      pageViewsHour: 1840,
      bounceRate: 37.5,
      avgSession: 6.8,
      responseMs: 482,
      rps: 46,
      bandwidthIn: 28.4,
      bandwidthOut: 34.9,
      err4xx: 1.3,
      err5xx: 0.7,
      latency: 38,
      packetLoss: 0.4,
      cpu: 58,
      ram: 62,
      disk: 46,
      connections: 318,
      uptime: 99.92,
      serverOnline: true,
      labels,
      responseSeries: labels.map((_, idx) => 430 + idx * 4 + (idx % 3) * 6),
      rpsSeries: labels.map((_, idx) => 40 + (idx % 5) * 2),
      bandwidthSeries: labels.map((_, idx) => 26 + (idx % 4) * 1.6),
      errorSeries: labels.map((_, idx) => 0.4 + (idx % 5) * 0.12),
      dayVisits: Array.from({ length: 30 }, (_, idx) => ({ label: `${idx + 1}`, value: 780 + idx * 13 + (idx % 4) * 16 })),
      weekVisits: Array.from({ length: 12 }, (_, idx) => ({ label: `Tuần ${idx + 1}`, value: 4800 + idx * 110 + (idx % 3) * 120 })),
      monthVisits: Array.from({ length: 12 }, (_, idx) => ({ label: `Tháng ${idx + 1}`, value: 19400 + idx * 420 + (idx % 3) * 550 })),
      sources: { 'Tìm kiếm': 46, 'Trực tiếp': 24, 'Mạng xã hội': 18, 'Giới thiệu': 12 },
      devices: { Mobile: 61, Desktop: 31, Tablet: 8 },
      browsers: { Chrome: 57, Safari: 19, Edge: 13, Firefox: 7, 'Cốc Cốc': 4 },
      topPages: pages.map((path, idx) => ({ path, views: 3200 - idx * 180 })),
      topKeywords: keywords.map((text, idx) => ({ text, value: 540 - idx * 32 })),
      accessLogs: Array.from({ length: 12 }, (_, idx) => ({
        time: new Date(Date.now() - idx * 90000).toISOString(),
        ip: randomIp(),
        path: pages[idx % pages.length],
        status: [200, 200, 200, 301, 304, 404, 500][idx % 7],
        device: ['Mobile', 'Desktop', 'Tablet'][idx % 3]
      }))
    };
  }

  function tickSimulator(sim) {
    sim.onlineUsers = Math.round(randomWalk(sim.onlineUsers, 82, 260, 18));
    sim.pageViewsHour = Math.round(randomWalk(sim.pageViewsHour, 1100, 2800, 180));
    sim.bounceRate = randomWalk(sim.bounceRate, 24, 62, 2.6, 1);
    sim.avgSession = randomWalk(sim.avgSession, 3.2, 9.5, .4, 1);
    sim.responseMs = Math.round(randomWalk(sim.responseMs, 260, 980, 110));
    sim.rps = Math.round(randomWalk(sim.rps, 18, 88, 7));
    sim.bandwidthIn = randomWalk(sim.bandwidthIn, 12, 52, 3.4, 1);
    sim.bandwidthOut = randomWalk(sim.bandwidthOut, 16, 60, 4.1, 1);
    sim.err4xx = randomWalk(sim.err4xx, 0.2, 4.9, .35, 1);
    sim.err5xx = randomWalk(sim.err5xx, 0.1, 3.8, .32, 1);
    sim.latency = Math.round(randomWalk(sim.latency, 20, 150, 14));
    sim.packetLoss = randomWalk(sim.packetLoss, 0, 4, .28, 1);
    sim.cpu = Math.round(randomWalk(sim.cpu, 18, 95, 7));
    sim.ram = Math.round(randomWalk(sim.ram, 24, 92, 6));
    sim.disk = Math.round(randomWalk(sim.disk, 28, 83, 3));
    sim.connections = Math.round(randomWalk(sim.connections, 140, 540, 36));
    sim.uptime = randomWalk(sim.uptime, 98.2, 100, .04, 2);
    sim.serverOnline = sim.err5xx < 3.4;

    const nextLabelDate = new Date();
    const nextLabel = `${String(nextLabelDate.getHours()).padStart(2, '0')}:${String(nextLabelDate.getMinutes()).padStart(2, '0')}`;
    sim.labels.push(nextLabel);
    sim.labels.shift();
    [['responseSeries', sim.responseMs], ['rpsSeries', sim.rps], ['bandwidthSeries', sim.bandwidthOut], ['errorSeries', sim.err5xx]].forEach(item => {
      sim[item[0]].push(item[1]);
      sim[item[0]].shift();
    });

    ['dayVisits', 'weekVisits', 'monthVisits'].forEach(key => {
      sim[key] = sim[key].map((item, idx) => ({ ...item, value: Math.max(0, Math.round(item.value + Math.sin((Date.now() / 100000) + idx) * 22 + (Math.random() * 26 - 13))) }));
    });

    Object.keys(sim.sources).forEach(key => sim.sources[key] = Math.max(8, Math.round(sim.sources[key] + (Math.random() * 6 - 3))));
    Object.keys(sim.devices).forEach(key => sim.devices[key] = Math.max(4, Math.round(sim.devices[key] + (Math.random() * 5 - 2))));
    Object.keys(sim.browsers).forEach(key => sim.browsers[key] = Math.max(2, Math.round(sim.browsers[key] + (Math.random() * 4 - 2))));
    sim.topPages = sim.topPages.map(item => ({ ...item, views: Math.max(100, item.views + Math.round(Math.random() * 90 - 24)) })).sort((a, b) => b.views - a.views).slice(0, 10);
    sim.topKeywords = sim.topKeywords.map(item => ({ ...item, value: Math.max(60, item.value + Math.round(Math.random() * 40 - 10)) })).sort((a, b) => b.value - a.value).slice(0, 10);
    sim.accessLogs.unshift({
      time: new Date().toISOString(),
      ip: randomIp(),
      path: sim.topPages[Math.floor(Math.random() * sim.topPages.length)].path,
      status: [200, 200, 200, 200, 301, 304, 404, 500, 502][Math.floor(Math.random() * 9)],
      device: ['Mobile', 'Desktop', 'Tablet'][Math.floor(Math.random() * 3)]
    });
    sim.accessLogs = sim.accessLogs.slice(0, 18);
  }

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
  }

  function currentVisitSeries() {
    if (state.period === 'week') return state.metrics.weekVisits;
    if (state.period === 'month') return state.metrics.monthVisits;
    return state.metrics.dayVisits;
  }

  function renderCharts() {
    destroyCharts();
    const visits = currentVisitSeries();
    charts.push(new Chart(document.getElementById('trafficVisitsChart'), {
      type: 'line',
      data: {
        labels: visits.map(item => item.label),
        datasets: [{
          label: 'Lượt truy cập',
          data: visits.map(item => item.value),
          borderColor: AdminUI.CHART_COLORS.primary,
          backgroundColor: 'rgba(194, 65, 12, .12)',
          fill: true,
          pointRadius: 0,
          tension: .35
        }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: AdminUI.CHART_COLORS.grid } } } }
    }));

    charts.push(new Chart(document.getElementById('trafficSourceChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(state.metrics.sources),
        datasets: [{ data: Object.values(state.metrics.sources), backgroundColor: [AdminUI.CHART_COLORS.primary, AdminUI.CHART_COLORS.primarySoft, AdminUI.CHART_COLORS.stone, AdminUI.CHART_COLORS.stoneLight] }]
      },
      options: { maintainAspectRatio: false, cutout: '62%' }
    }));

    charts.push(new Chart(document.getElementById('deviceChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(state.metrics.devices),
        datasets: [{ label: 'Thiết bị', data: Object.values(state.metrics.devices), backgroundColor: [AdminUI.CHART_COLORS.primary, AdminUI.CHART_COLORS.primarySoft, AdminUI.CHART_COLORS.stoneLight], borderRadius: 10 }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: AdminUI.CHART_COLORS.grid } } } }
    }));

    charts.push(new Chart(document.getElementById('browserChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(state.metrics.browsers),
        datasets: [{ label: 'Trình duyệt', data: Object.values(state.metrics.browsers), backgroundColor: AdminUI.CHART_COLORS.stone, borderRadius: 10 }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: AdminUI.CHART_COLORS.grid } } } }
    }));

    charts.push(new Chart(document.getElementById('infraResponseChart'), {
      type: 'line',
      data: {
        labels: state.metrics.labels,
        datasets: [{ label: 'Phản hồi (ms)', data: state.metrics.responseSeries, borderColor: AdminUI.CHART_COLORS.primary, pointRadius: 0, tension: .3 }, { label: 'RPS', data: state.metrics.rpsSeries, borderColor: AdminUI.CHART_COLORS.stone, pointRadius: 0, tension: .3 }]
      },
      options: { maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: AdminUI.CHART_COLORS.grid } } } }
    }));

    charts.push(new Chart(document.getElementById('infraBandwidthChart'), {
      type: 'line',
      data: {
        labels: state.metrics.labels,
        datasets: [{ label: 'Băng thông ra (Mbps)', data: state.metrics.bandwidthSeries, borderColor: AdminUI.CHART_COLORS.primarySoft, pointRadius: 0, tension: .3 }, { label: 'Lỗi 5xx (%)', data: state.metrics.errorSeries, borderColor: AdminUI.CHART_COLORS.stoneLight, pointRadius: 0, tension: .3 }]
      },
      options: { maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { color: AdminUI.CHART_COLORS.grid } } } }
    }));
  }

  function logsForRender() {
    return state.metrics.accessLogs.filter(log => !state.statusFilter || String(log.status).startsWith(state.statusFilter));
  }

  function warningBanners() {
    const list = [];
    if (state.metrics.responseMs > 800) list.push({ title: 'Phản hồi trung bình đang cao', text: `Thời gian phản hồi hiện ở mức ${state.metrics.responseMs} ms, vượt ngưỡng 800 ms.` });
    if (state.metrics.err5xx > 2) list.push({ title: 'Tỷ lệ lỗi 5xx tăng', text: `Tỷ lệ lỗi 5xx đang ở mức ${state.metrics.err5xx}%, cần kiểm tra hạ tầng.` });
    return list;
  }

  function render() {
    const warnings = warningBanners();
    const visits = currentVisitSeries();
    root.innerHTML = `${warnings.length ? `<div class="alert-strip">${warnings.map(item => `<div class="alert-soft"><strong>${item.title}</strong><span>${item.text}</span></div>`).join('')}</div>` : ''}

    <section class="kpi-grid mb-4">
      ${[
        ['bi-people', 'Người dùng đang online', state.metrics.onlineUsers],
        ['bi-eye', 'Lượt xem trang / giờ', formatMoney(state.metrics.pageViewsHour)],
        ['bi-arrow-return-left', 'Tỷ lệ thoát', `${state.metrics.bounceRate}%`],
        ['bi-stopwatch', 'Thời gian ở lại TB', `${state.metrics.avgSession} phút`]
      ].map(item => `<article class="metric-card"><div class="metric-icon"><i class="bi ${item[0]}"></i></div><div><small>${item[1]}</small><strong>${item[2]}</strong></div></article>`).join('')}
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head">
          <div><h2 class="h5 mb-1">Lượt truy cập theo ${state.period === 'day' ? 'ngày' : state.period === 'week' ? 'tuần' : 'tháng'}</h2><p class="card-subtle mb-0">Dữ liệu mô phỏng được làm mượt theo random walk.</p></div>
          <div>
            <label class="visually-hidden" for="visitPeriod">Chọn chu kỳ hiển thị</label>
            <select id="visitPeriod" class="form-select form-select-sm">
              <option value="day" ${state.period === 'day' ? 'selected' : ''}>30 ngày</option>
              <option value="week" ${state.period === 'week' ? 'selected' : ''}>12 tuần</option>
              <option value="month" ${state.period === 'month' ? 'selected' : ''}>12 tháng</option>
            </select>
          </div>
        </div>
        <div class="chart-canvas-wrap"><canvas id="trafficVisitsChart" role="img" aria-label="Biểu đồ lượt truy cập theo thời gian"></canvas></div>
        <div class="chart-summary">
          <span class="chip">Đỉnh gần nhất: <strong>${formatMoney(Math.max(...visits.map(item => item.value)))}</strong></span>
          <span class="chip">Trung bình: <strong>${formatMoney(Math.round(visits.reduce((sum, item) => sum + item.value, 0) / visits.length))}</strong></span>
        </div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><div><h2 class="h5 mb-1">Nguồn truy cập</h2><p class="card-subtle mb-0">Tỷ trọng phiên theo kênh vào trang.</p></div></div>
        <div class="chart-canvas-wrap short"><canvas id="trafficSourceChart" role="img" aria-label="Biểu đồ donut nguồn truy cập"></canvas></div>
      </article>
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Thiết bị truy cập</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="deviceChart" role="img" aria-label="Biểu đồ thiết bị truy cập"></canvas></div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Trình duyệt phổ biến</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="browserChart" role="img" aria-label="Biểu đồ trình duyệt phổ biến"></canvas></div>
      </article>
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="list-card">
        <div class="list-head"><h2 class="h5 mb-0">Top 10 trang được xem nhiều</h2></div>
        <div class="top-page-list">${state.metrics.topPages.slice(0, 10).map((item, idx) => `<div class="rank-item"><div class="d-flex align-items-center gap-3 min-w-0"><strong>${idx + 1}</strong><div><div class="fw-semibold text-break">${esc(item.path)}</div><small>${formatMoney(item.views)} lượt xem</small></div></div><span class="rs-badge neutral">Top</span></div>`).join('')}</div>
      </article>
      <article class="list-card">
        <div class="list-head"><h2 class="h5 mb-0">Top 10 từ khóa tìm kiếm</h2></div>
        <div class="keyword-list">${state.metrics.topKeywords.slice(0, 10).map((item, idx) => `<div class="rank-item"><div class="d-flex align-items-center gap-3 min-w-0"><strong>${idx + 1}</strong><div><div class="fw-semibold text-break">${esc(item.text)}</div><small>${formatMoney(item.value)} lượt tìm kiếm</small></div></div><span class="rs-badge primary">Xu hướng</span></div>`).join('')}</div>
      </article>
    </section>

    <section class="infra-grid mb-4">
      ${[
        ['Trạng thái server', state.metrics.serverOnline ? 'Online' : 'Offline', state.metrics.serverOnline ? 'ok' : 'bad'],
        ['Uptime', `${state.metrics.uptime}%`, 'primary'],
        ['Phản hồi TB', `${state.metrics.responseMs} ms`, 'neutral'],
        ['RPS hiện tại', `${state.metrics.rps}`, 'neutral'],
        ['Băng thông vào', `${state.metrics.bandwidthIn} Mbps`, 'neutral'],
        ['Băng thông ra', `${state.metrics.bandwidthOut} Mbps`, 'neutral'],
        ['Lỗi HTTP 4xx', `${state.metrics.err4xx}%`, 'warn'],
        ['Lỗi HTTP 5xx', `${state.metrics.err5xx}%`, state.metrics.err5xx > 2 ? 'bad' : 'warn'],
        ['Độ trễ mạng', `${state.metrics.latency} ms`, 'neutral'],
        ['Packet loss', `${state.metrics.packetLoss}%`, state.metrics.packetLoss > 1.5 ? 'warn' : 'ok'],
        ['Kết nối hoạt động', `${formatMoney(state.metrics.connections)}`, 'neutral'],
        ['CPU / RAM / Ổ đĩa', `${state.metrics.cpu}% / ${state.metrics.ram}% / ${state.metrics.disk}%`, 'neutral']
      ].map(item => `<article class="panel-card infra-card"><div class="label">${item[0]}</div><div class="value">${item[1]}</div><div class="mt-2">${item[2] === 'neutral' ? '<span class="rs-badge neutral">Ổn định</span>' : `<span class="rs-badge ${item[2]}">${item[1]}</span>`}</div></article>`).join('')}
    </section>

    <section class="chart-grid-2 mb-4">
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Phản hồi & RPS thời gian thực</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="infraResponseChart" role="img" aria-label="Biểu đồ phản hồi và RPS thời gian thực"></canvas></div>
      </article>
      <article class="chart-card">
        <div class="chart-head"><h2 class="h5 mb-0">Băng thông ra & lỗi 5xx</h2></div>
        <div class="chart-canvas-wrap short"><canvas id="infraBandwidthChart" role="img" aria-label="Biểu đồ băng thông và lỗi 5xx"></canvas></div>
      </article>
    </section>

    <section class="panel-card mb-4">
      <div class="section-head"><div><h2 class="h5 mb-1">Tải tài nguyên hiện tại</h2><p class="card-subtle mb-0">Theo dõi nhanh CPU, RAM và ổ đĩa.</p></div></div>
      <div class="progress-stack">
        ${[
          ['CPU', state.metrics.cpu],
          ['RAM', state.metrics.ram],
          ['Ổ đĩa', state.metrics.disk]
        ].map(item => `<div><div class="d-flex justify-content-between mb-1"><strong>${item[0]}</strong><span class="text-muted">${item[1]}%</span></div><div class="progress"><div class="progress-bar" style="width:${item[1]}%"></div></div></div>`).join('')}
      </div>
    </section>

    <section class="panel-card">
      <div class="section-head">
        <div><h2 class="h5 mb-1">Log truy cập gần đây</h2><p class="card-subtle mb-0">Tự động cập nhật mỗi vài giây.</p></div>
        <div>
          <label class="visually-hidden" for="trafficStatusFilter">Lọc mã trạng thái</label>
          <select id="trafficStatusFilter" class="form-select form-select-sm">
            <option value="">Tất cả mã trạng thái</option>
            <option value="2" ${state.statusFilter === '2' ? 'selected' : ''}>2xx</option>
            <option value="3" ${state.statusFilter === '3' ? 'selected' : ''}>3xx</option>
            <option value="4" ${state.statusFilter === '4' ? 'selected' : ''}>4xx</option>
            <option value="5" ${state.statusFilter === '5' ? 'selected' : ''}>5xx</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table align-middle">
          <thead><tr><th>Thời gian</th><th>IP</th><th>Đường dẫn</th><th>Mã phản hồi</th><th>Thiết bị</th></tr></thead>
          <tbody>
            ${logsForRender().length ? logsForRender().map(log => `<tr><td>${formatDateTime(log.time)}</td><td>${esc(log.ip)}</td><td class="text-break">${esc(log.path)}</td><td><span class="rs-badge ${String(log.status).startsWith('5') ? 'bad' : String(log.status).startsWith('4') ? 'warn' : 'ok'}">${log.status}</span></td><td>${esc(log.device)}</td></tr>`).join('') : `<tr><td colspan="5">${AdminUI.emptyState('Không có log phù hợp', 'Bộ lọc hiện tại chưa có bản ghi nào.', 'bi-search')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;

    root.querySelector('#visitPeriod').addEventListener('change', e => {
      state.period = e.target.value;
      render();
    });
    root.querySelector('#trafficStatusFilter').addEventListener('change', e => {
      state.statusFilter = e.target.value;
      render();
    });
    renderCharts();
  }

  function startRealtime() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      tickSimulator(state.metrics);
      render();
    }, 4000);
  }

  function stopRealtime() {
    if (timer) clearInterval(timer);
    timer = null;
    destroyCharts();
  }

  render();
  startRealtime();
  window.addEventListener('pagehide', stopRealtime, { once: true });
});
