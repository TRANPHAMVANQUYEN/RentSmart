/* Trang chủ: dữ liệu phòng và quận được tải từ Laravel API. */
(async function () {
  const popularAreas = ['Quận 1', 'Quận 7', 'Bình Thạnh', 'Gò Vấp', 'TP. Thủ Đức', 'Tân Bình', 'Phú Nhuận'];
  $('#quickAreas').innerHTML = popularAreas
    .map(d => `<a class="chip" href="phong-tro.html?quan=${encodeURIComponent(d)}">${esc(d)}</a>`).join('');
  $('#quan').innerHTML = `<option value="">Tất cả quận/huyện</option>${DISTRICTS.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}`;

  async function loadHome() {
    const featuredHost = $('#featured');
    featuredHost.innerHTML = '<div class="col-12"><div class="skeleton skeleton-card"></div></div>';
    try {
      const [rooms, districts] = await Promise.all([
        Auth.request('rooms'),
        Auth.request('districts')
      ]);
      if (!Array.isArray(rooms) || !Array.isArray(districts)) {
        throw new Error('Máy chủ trả về dữ liệu trang chủ không hợp lệ.');
      }
      rooms.forEach(room => {
        room.id = Number(room.id);
        room.price = Number(room.price);
        room.area = Number(room.area);
        room.views = Number(room.views);
        room.featured = Boolean(Number(room.featured));
      });
      $('#quan').innerHTML = `<option value="">Tất cả quận/huyện</option>${districts.map(d => `<option value="${esc(d.name)}">${esc(d.name)}</option>`).join('')}`;

      const featured = [...rooms].sort((a, b) => (b.featured - a.featured) || (b.views - a.views)).slice(0, 8);
      featuredHost.innerHTML = featured.length ? featured.map(r => roomCol(r)).join('')
        : '<div class="col-12"><div class="empty-state"><i class="bi bi-house"></i><h3>Chưa có tin nào</h3></div></div>';

      const count = {};
      rooms.forEach(r => count[r.district] = (count[r.district] || 0) + 1);
      $('#districtGrid').innerHTML = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([d, n]) => `<div class="col-6 col-md-4 col-lg-3"><a class="district-tile" href="phong-tro.html?quan=${encodeURIComponent(d)}"><strong>${esc(d)}</strong><span>${n} tin</span></a></div>`).join('');
    } catch (error) {
      console.error('Không thể tải dữ liệu trang chủ từ API:', error);
      featuredHost.innerHTML = `<div class="col-12"><div class="empty-state">
        <i class="bi bi-wifi-off"></i><h3>Chưa kết nối được máy chủ</h3>
        <p class="text-muted">Kiểm tra Laravel đang chạy ở cổng 8001 và tải lại dữ liệu.</p>
        <button class="btn btn-light-border mt-2" type="button" id="retryHome">Thử lại</button>
      </div></div>`;
      $('#districtGrid').innerHTML = '';
    }
  }
  $('#featured').addEventListener('click', event => {
    if (event.target.closest('#retryHome')) loadHome();
  });
  await loadHome();
})();
