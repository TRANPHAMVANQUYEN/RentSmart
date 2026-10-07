/* Trang chủ: đổ dữ liệu động từ DB (chỉ tin đã duyệt) */
(function () {
  const rooms = publicRooms();
  $('#quan').innerHTML = districtOptions();

  // Chip khu vực phổ biến
  $('#quickAreas').innerHTML = ['Quận 1', 'Quận 7', 'Bình Thạnh', 'Gò Vấp', 'TP. Thủ Đức', 'Tân Bình', 'Phú Nhuận']
    .map(d => `<a class="chip" href="phong-tro.html?quan=${encodeURIComponent(d)}">${esc(d)}</a>`).join('');

  // Tin nổi bật: ưu tiên tin ghim, sau đó theo lượt xem
  const featured = [...rooms].sort((a, b) => (b.featured - a.featured) || (b.views - a.views)).slice(0, 8);
  $('#featured').innerHTML = featured.length ? featured.map(r => roomCol(r)).join('')
    : '<div class="col-12"><div class="empty-state"><i class="bi bi-house"></i><h3>Chưa có tin nào</h3></div></div>';

  // Quận có nhiều tin nhất
  const count = {};
  rooms.forEach(r => count[r.district] = (count[r.district] || 0) + 1);
  $('#districtGrid').innerHTML = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([d, n]) => `<div class="col-6 col-md-4 col-lg-3"><a class="district-tile" href="phong-tro.html?quan=${encodeURIComponent(d)}"><strong>${esc(d)}</strong><span>${n} tin</span></a></div>`).join('');
})();
