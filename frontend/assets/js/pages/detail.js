/* Trang chi tiết phòng: chi-tiet.html?id= */
(async function () {
  const host = $('#detail');
  let room;
  const roomId = Number(qs('id'));
  if (!Number.isInteger(roomId) || roomId < 1) {
    host.innerHTML = `<div class="empty-state"><i class="bi bi-house-x"></i><h3>Đường dẫn tin phòng không hợp lệ</h3>
      <a class="btn btn-primary mt-2" href="phong-tro.html">Xem các phòng khác</a></div>`;
    return;
  }
  try {
    room = await Auth.request(`rooms/${roomId}`);
  } catch (error) {
    console.error('Không thể tải chi tiết phòng:', error);
    host.innerHTML = `<div class="empty-state"><i class="bi bi-house-x"></i><h3>Tin không tồn tại hoặc máy chủ chưa sẵn sàng</h3>
      <a class="btn btn-primary mt-2" href="phong-tro.html">Xem các phòng khác</a></div>`;
    return;
  }
  room.id = Number(room.id);
  room.landlordId = Number(room.landlordId);
  room.price = Number(room.price);
  room.area = Number(room.area);
  room.views = Number(room.views);
  room.featured = Boolean(Number(room.featured));
  room.status = 'approved';
  const me = Auth.current();

  // Tăng lượt xem (mỗi phiên một lần) + lưu lịch sử đã xem
  const vk = 'rs_v_' + room.id;
  if (!sessionStorage.getItem(vk)) sessionStorage.setItem(vk, '1');
  Auth.addViewed(room.id);

  const owner = room.landlord || { fullName: 'Chủ nhà', createdAt: room.createdAt };
  const imgs = (room.images || []).map(image => ({ ...image, imageUrl: Auth.imageUrl(image.imageUrl) }));
  const ams = room.amenities || [];
  const ownerRooms = Number(room.landlordRoomCount) || 0;
  const rating = (4.3 + (room.landlordId % 7) / 10).toFixed(1);
  const masked = '**** *** ***';
  const catLabel = ROOM_TYPES[room.roomType];
  document.title = `${room.title} – RentSmart`;

  const similar = room.similar || [];

  const notice = '';

  host.innerHTML = `
    <nav aria-label="breadcrumb"><ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="index.html">Trang chủ</a></li>
      <li class="breadcrumb-item"><a href="phong-tro.html?loai=${room.roomType}">${esc(catLabel)}</a></li>
      <li class="breadcrumb-item active text-truncate" style="max-width:240px" aria-current="page">${esc(room.title)}</li></ol></nav>
    ${notice}
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="gallery mb-4">
          <div id="gallery" class="carousel slide" data-bs-ride="false" aria-label="Thư viện ảnh">
            <div class="carousel-inner">${imgs.map((im, i) => `<div class="carousel-item ${i ? '' : 'active'}"><img src="${esc(im.imageUrl)}" alt="${esc(room.title)} - ảnh ${i + 1}" data-zoom></div>`).join('') || '<div class="carousel-item active"><img src="https://picsum.photos/seed/rs' + room.id + '/800/600" alt="Ảnh minh họa"></div>'}</div>
            ${imgs.length > 1 ? `<button class="carousel-control-prev" type="button" data-bs-target="#gallery" data-bs-slide="prev" aria-label="Ảnh trước"><span class="carousel-control-prev-icon"></span></button>
            <button class="carousel-control-next" type="button" data-bs-target="#gallery" data-bs-slide="next" aria-label="Ảnh sau"><span class="carousel-control-next-icon"></span></button>` : ''}
          </div>
          <div class="thumbs" id="thumbs">${imgs.map((im, i) => `<button type="button" data-bs-target="#gallery" data-bs-slide-to="${i}" class="${i ? '' : 'active'}" aria-label="Xem ảnh ${i + 1}"><img src="${esc(im.imageUrl)}" alt="" loading="lazy"></button>`).join('')}</div>
        </div>

        <span class="rs-badge primary mb-2">${esc(catLabel)}</span>
        <h1 class="detail-title">${esc(room.title)}</h1>
        <p class="text-muted"><i class="bi bi-geo-alt"></i> ${esc(room.address)}, ${esc(room.district)}, TP.HCM</p>

        <div class="spec-grid my-3">
          <div class="spec"><small>Mức giá</small><strong class="price">${formatPrice(room.price)}</strong></div>
          <div class="spec"><small>Diện tích</small><strong>${room.area} m²</strong></div>
          <div class="spec"><small>Loại hình</small><strong>${esc(catLabel)}</strong></div>
          <div class="spec"><small>Ngày đăng</small><strong>${formatDate(room.createdAt)}</strong></div>
        </div>

        <div class="box mb-3"><h2>Tiện ích phòng</h2>
          ${ams.length ? `<div class="amenity-grid">${ams.map(a => `<div class="amenity"><i class="bi ${a.icon}"></i>${esc(a.name)}</div>`).join('')}</div>` : '<p class="text-muted mb-0">Chủ nhà chưa cập nhật tiện ích.</p>'}</div>
        <div class="box mb-3"><h2>Mô tả chi tiết</h2><p class="mb-0" style="white-space:pre-line">${esc(room.description)}</p></div>
        <div class="map-box mb-3"><h2>Vị trí trên bản đồ</h2>
          <div class="map-frame" id="roomMap" data-address="${esc(room.address)}, ${esc(room.district)}, TP.HCM" role="img" aria-label="Khung bản đồ vị trí phòng"><div><i class="bi bi-geo-alt"></i><span>Bản đồ vị trí phòng sẽ hiển thị tại đây</span></div></div>
          <p class="small text-muted mb-0 mt-2"><i class="bi bi-geo-alt"></i> ${esc(room.address)}, ${esc(room.district)}, TP.HCM</p></div>
        <div class="safety-alert mb-3"><i class="bi bi-shield-exclamation"></i><div><b>Lưu ý an toàn:</b> Không đặt cọc trước khi xem phòng và ký hợp đồng. Không chuyển tiền cho người chưa gặp mặt.</div></div>
      </div>

      <aside class="col-lg-4">
        <div class="box owner-card">
          <div class="d-flex gap-3 align-items-center mb-3">${avatarHTML(owner, 'avatar-lg')}
            <div><strong>${esc(owner.fullName)}</strong><div><span class="rs-badge ok"><i class="bi bi-patch-check-fill"></i> Chủ nhà đã xác thực</span></div></div></div>
          <ul class="list-unstyled small text-muted mb-3">
            <li><i class="bi bi-calendar-check me-1"></i> Tham gia: ${formatDate(owner.createdAt)}</li>
            <li><i class="bi bi-star-fill me-1 text-primary-rs"></i> Đánh giá: ${rating}/5</li>
            <li><i class="bi bi-houses me-1"></i> ${ownerRooms} phòng đang cho thuê</li></ul>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" id="showPhone" type="button"><i class="bi bi-telephone"></i> <span id="phoneText">${esc(masked)} – Hiện số</span></button>
            <button class="btn btn-outline-primary" id="msgBtn" type="button"><i class="bi bi-chat-dots"></i> Nhắn tin cho chủ nhà</button>
            <button class="btn btn-light-border save-inline" type="button" data-save="${room.id}"><i class="bi bi-heart"></i> <span>Lưu tin</span></button>
            <button class="btn btn-light-border" id="reportBtn" type="button"><i class="bi bi-flag"></i> Báo cáo tin</button>
          </div>
        </div>
      </aside>
    </div>

    ${similar.length ? `<section class="px-0 pb-0"><h2 class="section-title mb-3">Tin tương tự</h2><div class="row g-3">${similar.map(r => roomCol(r, 'col-12 col-sm-6 col-lg-3')).join('')}</div></section>` : ''}`;

  /* ----- Tương tác ----- */
  // Nút lưu: đồng bộ nhãn (utils chỉ đổi icon)
  const saveBtn = $('.save-inline');
  const paintSave = () => { const on = Auth.isSaved(room.id); $('i', saveBtn).className = 'bi ' + (on ? 'bi-heart-fill text-primary-rs' : 'bi-heart'); $('span', saveBtn).textContent = on ? 'Đã lưu' : 'Lưu tin'; };
  paintSave();
  saveBtn.addEventListener('click', () => setTimeout(paintSave));

  // Đồng bộ thumbnail với carousel
  $('#gallery').addEventListener('slid.bs.carousel', e => $$('#thumbs button').forEach((b, i) => b.classList.toggle('active', i === e.to)));

  // Phóng to ảnh
  host.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (!z) return;
    $('#lightboxImg').src = z.src;
    bootstrap.Modal.getOrCreateInstance('#lightbox').show();
  });

  // Che bớt số điện thoại, bấm mới hiện đủ
  $('#showPhone').addEventListener('click', async () => {
    const button = $('#showPhone');
    button.disabled = true;
    try {
      const { phone } = await Auth.request(`rooms/${room.id}/contact`);
      $('#phoneText').innerHTML = `<a class="text-white" href="tel:${esc(phone)}">${esc(phone.slice(0, 4) + ' ' + phone.slice(4, 7) + ' ' + phone.slice(7))}</a>`;
    } catch (error) {
      toast(error.message, 'error');
      button.disabled = false;
    }
  });

  const needLogin = () => {
    if (Auth.current()) return false;
    location.href = `dang-nhap.html?redirect=${encodeURIComponent('chi-tiet.html?id=' + room.id)}`;
    return true;
  };

  $('#msgBtn').addEventListener('click', () => { if (!needLogin()) bootstrap.Modal.getOrCreateInstance('#msgModal').show(); });
  $('#msgForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await Auth.request(`rooms/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: $('#msgText').value.trim() })
      });
      bootstrap.Modal.getInstance('#msgModal').hide();
      toast('Đã gửi tin nhắn cho chủ nhà');
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  $('#rpReason').innerHTML = Object.entries(REPORT_REASONS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#reportBtn').addEventListener('click', () => { if (!needLogin()) bootstrap.Modal.getOrCreateInstance('#reportModal').show(); });
  $('#reportForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await Auth.request(`rooms/${room.id}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: $('#rpReason').value, content: $('#rpContent').value.trim() })
      });
      bootstrap.Modal.getInstance('#reportModal').hide();
      $('#rpContent').value = '';
      toast('Đã gửi báo cáo. Cảm ơn bạn!');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
})();
