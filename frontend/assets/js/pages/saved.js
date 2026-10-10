/* Tin đã lưu + lịch sử đã xem */
(async function () {
  if (!Auth.requireRole(['tenant', 'landlord'])) return;
  const empty = (icon, text, cta) => `<div class="col-12"><div class="empty-state"><i class="bi ${icon}"></i><h3>${text}</h3>${cta ? '<a class="btn btn-primary mt-2" href="phong-tro.html">Khám phá phòng trọ</a>' : ''}</div></div>`;

  async function draw() {
    let saved, rooms;
    try {
      [saved, rooms] = await Promise.all([
        Auth.request('saved-rooms'),
        Auth.request('rooms')
      ]);
    } catch (error) {
      console.error('Không thể tải tin đã lưu:', error);
      $('#savedList').innerHTML = empty('bi-wifi-off', 'Không tải được tin đã lưu', true);
      return;
    }
    saved.forEach(room => {
      room.id = Number(room.id);
      room.price = Number(room.price);
      room.area = Number(room.area);
      room.featured = Boolean(Number(room.featured));
    });
    rooms.forEach(room => {
      room.id = Number(room.id);
      room.price = Number(room.price);
      room.area = Number(room.area);
      room.featured = Boolean(Number(room.featured));
    });
    const viewedIds = new Set(Auth.viewed().map(Number));
    const viewed = rooms.filter(room => viewedIds.has(room.id));
    $('#savedList').innerHTML = saved.length ? saved.map(r => roomCol(r, 'col-12 col-sm-6 col-lg-4 col-xl-3')).join('') : empty('bi-heart', 'Bạn chưa lưu tin nào', true);
    $('#viewedList').innerHTML = viewed.length ? viewed.map(r => roomCol(r, 'col-12 col-sm-6 col-lg-4 col-xl-3')).join('') : empty('bi-clock-history', 'Chưa có lịch sử xem');
  }
  await draw();
  // Bỏ lưu: làm mới danh sách sau khi handler chung cập nhật dữ liệu
  document.addEventListener('click', e => { if (e.target.closest('#savedList [data-save]')) setTimeout(draw); });
})();
