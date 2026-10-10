/* ==========================================================
   RentSmart HCM - room-form.js
   Form đăng / sửa tin, dùng chung cho chủ nhà và admin.
   RoomForm.mount(container, { room, mode: 'landlord' | 'admin', onSaved(room) })
   - mode 'landlord': tin mới có trạng thái "Chờ duyệt".
   - mode 'admin'   : có thêm ô chọn chủ tin, tin được duyệt luôn.
   ========================================================== */
const RoomForm = {
  mount(box, opts = {}) {
    const me = Auth.current();
    const room = opts.room || null;
    const admin = opts.mode === 'admin';
    const owners = DB.t('users').filter(u => u.role === 'landlord' && u.status !== 'locked');
    const amenities = DB.t('amenities') || AMENITIES;
    const have = room ? DB.amenitiesOf(room.id).map(a => a.id) : [];
    // images: [{url, primary}] - tối đa 8 ảnh
    let images = room ? DB.images(room.id).map(i => ({ url: i.imageUrl, primary: i.isPrimary })) : [];
    const MAX_IMG = 8;

    box.innerHTML = `<form id="rfForm" novalidate class="box"><div class="row g-3">
      ${admin ? `<div class="col-12"><label class="form-label" for="rfOwner">Chủ tin <span class="text-danger">*</span></label>
        <select id="rfOwner" class="form-select" required><option value="">-- Chọn chủ tin --</option>${owners.map(o => `<option value="${o.id}">${esc(o.fullName)} (${esc(o.username)})</option>`).join('')}</select><div class="invalid-feedback">Vui lòng chọn chủ tin.</div></div>` : ''}
      <div class="col-12"><label class="form-label" for="rfTitle">Tiêu đề <span class="text-danger">*</span></label>
        <input id="rfTitle" class="form-control" maxlength="120" required placeholder="VD: Phòng trọ có ban công gần ĐH Hutech"><div class="invalid-feedback">Tiêu đề từ 10 ký tự trở lên.</div></div>
      <div class="col-md-4"><label class="form-label" for="rfType">Loại hình <span class="text-danger">*</span></label>
        <select id="rfType" class="form-select">${Object.entries(ROOM_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="col-6 col-md-4"><label class="form-label" for="rfPrice">Giá thuê (đ/tháng) <span class="text-danger">*</span></label>
        <input id="rfPrice" type="number" min="500000" step="50000" class="form-control" required><div class="invalid-feedback">Giá tối thiểu 500.000 đ.</div></div>
      <div class="col-6 col-md-4"><label class="form-label" for="rfArea">Diện tích (m²) <span class="text-danger">*</span></label>
        <input id="rfArea" type="number" min="5" max="500" class="form-control" required><div class="invalid-feedback">Diện tích từ 5 đến 500 m².</div></div>
      <div class="col-md-5"><label class="form-label" for="rfDistrict">Quận/Huyện (TP.HCM) <span class="text-danger">*</span></label>
      <select id="rfDistrict" class="form-select" required>${districtOptions('-- Chọn quận --', true)}</select><div class="invalid-feedback">Vui lòng chọn quận.</div></div>
      <div class="col-md-7"><label class="form-label" for="rfAddress">Địa chỉ cụ thể <span class="text-danger">*</span></label>
        <input id="rfAddress" class="form-control" required placeholder="Số nhà, đường, phường/xã"><div class="invalid-feedback">Vui lòng nhập địa chỉ.</div></div>
      <div class="col-12"><label class="form-label" for="rfDesc">Mô tả chi tiết <span class="text-danger">*</span></label>
        <textarea id="rfDesc" class="form-control" rows="5" required></textarea><div class="invalid-feedback">Mô tả từ 20 ký tự trở lên.</div></div>
      <div class="col-12"><span class="form-label d-block">Tiện ích</span><div class="row g-2">
        ${amenities.map(a => `<div class="col-6 col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="rfA${a.id}" value="${a.id}" ${have.includes(a.id) ? 'checked' : ''}><label class="form-check-label" for="rfA${a.id}"><i class="bi ${esc(a.icon || 'bi-check2')} me-1 text-primary-rs"></i>${esc(a.name)}</label></div></div>`).join('')}</div></div>
      <div class="col-12"><span class="form-label d-block">Hình ảnh (tối đa ${MAX_IMG} ảnh)</span>
        <label class="upload-zone" for="rfFiles"><i class="bi bi-cloud-arrow-up fs-3 text-primary-rs"></i><div class="fw-semibold">Bấm để chọn nhiều ảnh</div><small class="text-muted">JPG/PNG, ảnh được nén tự động</small></label>
        <input id="rfFiles" type="file" accept="image/*" multiple class="visually-hidden">
        <div class="preview-grid" id="rfPreview"></div></div>
      <div class="col-md-6"><label class="form-label" for="rfContact">Tên liên hệ <span class="text-danger">*</span></label><input id="rfContact" class="form-control" required><div class="invalid-feedback">Vui lòng nhập tên liên hệ.</div></div>
      <div class="col-md-6"><label class="form-label" for="rfPhone">Số điện thoại <span class="text-danger">*</span></label><input id="rfPhone" class="form-control" inputmode="tel" required><div class="invalid-feedback">SĐT gồm 10 số, bắt đầu bằng 0.</div></div>
      <div class="col-12 d-flex gap-2 flex-wrap pt-2"><button class="btn btn-primary" type="submit"><i class="bi bi-check2-circle"></i> ${room ? 'Lưu thay đổi' : admin ? 'Đăng tin' : 'Gửi tin chờ duyệt'}</button>
        <button type="button" class="btn btn-light-border" id="rfCancel">Hủy</button></div>
    </div></form>`;

    const f = id => $('#' + id, box);
    const owner = room ? DB.user(room.landlordId) : me;
    if (admin) {
      f('rfContact').readOnly = true;
      f('rfPhone').readOnly = true;
    }
    if (admin && room) f('rfOwner').value = room.landlordId;
    f('rfTitle').value = room ? room.title : '';
    f('rfType').value = room ? room.roomType : 'phong-tro';
    f('rfPrice').value = room ? room.price : '';
    f('rfArea').value = room ? room.area : '';
    f('rfDistrict').value = room ? room.districtId : '';
    f('rfAddress').value = room ? room.address : '';
    f('rfDesc').value = room ? room.description : '';
    f('rfContact').value = room ? room.contactName : (owner ? owner.fullName : '');
    f('rfPhone').value = room ? room.contactPhone : (owner ? owner.phone : '');
    if (admin && !room) f('rfOwner').addEventListener('change', e => { const o = DB.user(e.target.value); if (o) { f('rfContact').value = o.fullName; f('rfPhone').value = o.phone; } });

    function drawPreview() {
      if (images.length && !images.some(i => i.primary)) images[0].primary = true;
      f('rfPreview').innerHTML = images.map((im, i) => `<div class="preview ${im.primary ? 'cover' : ''}"><img src="${esc(im.url)}" alt="Ảnh ${i + 1}">
        ${im.primary ? '<span class="cover-tag">Ảnh bìa</span>' : ''}
        <div class="pv-actions"><button type="button" data-cover="${i}" ${im.primary ? 'disabled' : ''}>Đặt bìa</button><button type="button" data-del="${i}" aria-label="Xóa ảnh ${i + 1}"><i class="bi bi-trash"></i></button></div></div>`).join('');
    }
    f('rfPreview').addEventListener('click', e => {
      const c = e.target.closest('[data-cover]'), d = e.target.closest('[data-del]');
      if (c) images.forEach((im, i) => im.primary = i === +c.dataset.cover);
      if (d) images.splice(+d.dataset.del, 1);
      drawPreview();
    });
    f('rfFiles').addEventListener('change', async e => {
      for (const file of [...e.target.files]) {
        if (images.length >= MAX_IMG) { toast(`Tối đa ${MAX_IMG} ảnh.`, 'info'); break; }
        if (!file.type.startsWith('image/')) continue;
        try { images.push({ url: await readImage(file), primary: false }); } catch (err) { toast('Không đọc được ảnh ' + file.name, 'error'); }
      }
      e.target.value = '';
      drawPreview();
    });
    drawPreview();

    const mark = (el, ok) => { el.classList.toggle('is-invalid', !ok); return ok; };
    $('#rfCancel', box).onclick = () => (opts.onCancel ? opts.onCancel() : history.back());

    $('#rfForm', box).addEventListener('submit', async e => {
      e.preventDefault();
      const v = {
        title: f('rfTitle').value.trim(), price: +f('rfPrice').value, area: +f('rfArea').value, district: f('rfDistrict').value,
        address: f('rfAddress').value.trim(), desc: f('rfDesc').value.trim(), contact: f('rfContact').value.trim(), phone: f('rfPhone').value.trim()
      };
      const ok = [
        admin ? mark(f('rfOwner'), !!f('rfOwner').value) : true,
        mark(f('rfTitle'), v.title.length >= 10), mark(f('rfPrice'), v.price >= 500000), mark(f('rfArea'), v.area >= 5 && v.area <= 500),
        mark(f('rfDistrict'), !!v.district), mark(f('rfAddress'), v.address.length >= 5), mark(f('rfDesc'), v.desc.length >= 20),
        mark(f('rfContact'), !!v.contact), mark(f('rfPhone'), /^0\d{9}$/.test(v.phone))
      ].every(Boolean);
      if (!ok) { toast('Vui lòng kiểm tra lại các trường bắt buộc.', 'error'); const bad = $('.is-invalid', box); if (bad) bad.focus(); return; }

      const now = new Date().toISOString();
      const landlordId = admin ? +f('rfOwner').value : (room ? room.landlordId : me.id);
      const data = {
        landlordId, title: v.title, description: v.desc, price: v.price, area: v.area, address: v.address, districtId: +v.district,
        roomType: f('rfType').value, contactName: v.contact, contactPhone: v.phone, updatedAt: now
      };
      if (admin) {
        const button = f('rfForm').querySelector('[type="submit"]');
        button.disabled = true;
        try {
          const result = await AdminAPI.write(room ? 'PUT' : 'POST', room ? `rooms/${room.id}` : 'rooms', {
            ...data,
            amenityIds: $$('input[type=checkbox]:checked', box).map(input => +input.value),
            images
          });
          const saved = room ? { ...room, ...data } : { ...data, id: result.roomId };
          toast(room ? 'Đã lưu thay đổi' : 'Đã đăng tin');
          if (opts.onSaved) opts.onSaved(saved);
        } catch (error) {
          toast(error.message, 'error');
          button.disabled = false;
        }
        return;
      }
      const button = f('rfForm').querySelector('[type="submit"]');
      button.disabled = true;
      try {
        const result = await Auth.request(room ? `landlord/rooms/${room.id}` : 'landlord/rooms', {
          method: room ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: v.title,
            description: v.desc,
            price: v.price,
            area: v.area,
            address: v.address,
            districtId: +v.district,
            roomType: f('rfType').value,
            amenityIds: $$('input[type=checkbox]:checked', box).map(input => +input.value),
            images
          })
        });
        const saved = room ? { ...room, ...data, status: 'pending', statusNote: '' } : { ...data, id: result.roomId, status: 'pending' };
        toast(room ? 'Đã cập nhật tin, đang chờ duyệt' : 'Đã gửi tin, đang chờ duyệt');
        if (opts.onSaved) opts.onSaved(saved);
      } catch (error) {
        toast(error.message, 'error');
        button.disabled = false;
      }
    });
  }
};
