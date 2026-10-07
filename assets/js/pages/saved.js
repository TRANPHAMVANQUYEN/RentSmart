/* Tin đã lưu + lịch sử đã xem */
(function () {
  if (!Auth.requireRole(['tenant', 'landlord'])) return;
  const empty = (icon, text, cta) => `<div class="col-12"><div class="empty-state"><i class="bi ${icon}"></i><h3>${text}</h3>${cta ? '<a class="btn btn-primary mt-2" href="phong-tro.html">Khám phá phòng trọ</a>' : ''}</div></div>`;
  const byIds = ids => ids.map(id => DB.room(id)).filter(r => r && r.status === 'approved');

  function draw() {
    const saved = byIds(Auth.saved()), viewed = byIds(Auth.viewed());
    $('#savedList').innerHTML = saved.length ? saved.map(r => roomCol(r, 'col-12 col-sm-6 col-lg-4 col-xl-3')).join('') : empty('bi-heart', 'Bạn chưa lưu tin nào', true);
    $('#viewedList').innerHTML = viewed.length ? viewed.map(r => roomCol(r, 'col-12 col-sm-6 col-lg-4 col-xl-3')).join('') : empty('bi-clock-history', 'Chưa có lịch sử xem');
  }
  draw();
  // Bỏ lưu: làm mới danh sách sau khi handler chung cập nhật dữ liệu
  document.addEventListener('click', e => { if (e.target.closest('#savedList [data-save]')) setTimeout(draw); });
})();
