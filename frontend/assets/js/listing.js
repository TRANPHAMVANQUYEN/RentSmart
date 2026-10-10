/* ==========================================================
   RentSmart HCM - listing.js
   Trang danh sách: lọc, sắp xếp, phân trang, đồng bộ bộ lọc với URL.
   ========================================================== */
(function () {
  const PAGE_SIZE = 9;
  const PRICE_PRESETS = [['', 'Tất cả'], ['0-3', 'Dưới 3 triệu'], ['3-5', '3 – 5 triệu'], ['5-7', '5 – 7 triệu'], ['7-10', '7 – 10 triệu'], ['10-', 'Trên 10 triệu']];
  const AREA_PRESETS = [['', 'Tất cả'], ['0-20', 'Dưới 20m²'], ['20-30', '20 – 30m²'], ['30-50', '30 – 50m²'], ['50-', 'Trên 50m²']];
  const SLIDER_MAX = 15; // triệu
  let apiRooms = [];
  let apiAmenities = [];
  let apiDistricts = DISTRICTS;

  // Trạng thái lọc; mọi giá trị đều có thể khôi phục từ URL
  const S = { cat: '', q: '', quan: [], gia: '', gmax: '', dt: '', amenities: [], sort: '', view: 'luoi', page: 1 };
  (function readURL() {
    const p = new URLSearchParams(location.search);
    S.cat = ROOM_TYPES[p.get('loai')] ? p.get('loai') : '';
    S.q = p.get('q') || '';
    S.quan = (p.get('quan') || '').split(',').filter(d => apiDistricts.includes(d));
    S.gia = p.get('gia') || '';
    S.gmax = p.get('gmax') || '';
    S.dt = p.get('dt') || '';
    S.amenities = (p.get('tien-ich') || '').split(',').map(Number).filter(id => Number.isInteger(id) && id > 0);
    S.sort = p.get('sx') || '';
    S.view = p.get('xem') === 'ds' ? 'ds' : 'luoi';
    S.page = Math.max(1, +p.get('trang') || 1);
  })();

  const range = s => { const [a, b] = String(s).split('-'); return [a === '' || a == null ? null : +a, b === '' || b == null ? null : +b]; };

  function syncURL() {
    const p = new URLSearchParams();
    if (S.cat) p.set('loai', S.cat);
    if (S.q) p.set('q', S.q);
    if (S.quan.length) p.set('quan', S.quan.join(','));
    if (S.gia) p.set('gia', S.gia);
    if (S.gmax) p.set('gmax', S.gmax);
    if (S.dt) p.set('dt', S.dt);
    if (S.amenities.length) p.set('tien-ich', S.amenities.join(','));
    if (S.sort) p.set('sx', S.sort);
    if (S.view === 'ds') p.set('xem', 'ds');
    if (S.page > 1) p.set('trang', S.page);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  /* ----- Vẽ bộ lọc ----- */
  const radios = (name, list, cur) => list.map(([v, l], i) =>
    `<div class="form-check"><input class="form-check-input" type="radio" name="${name}" id="${name}${i}" value="${v}" ${cur === v ? 'checked' : ''}><label class="form-check-label" for="${name}${i}">${l}</label></div>`).join('');

  function drawFilters() {
    $('#filters').innerHTML = `
      <div class="filter-group"><h3>Danh mục</h3>${radios('cat', [['', 'Tất cả'], ...Object.entries(ROOM_TYPES)], S.cat)}</div>
      <div class="filter-group"><h3>Quận/Huyện</h3><div class="filter-scroll">${apiDistricts.map((d, i) =>
        `<div class="form-check"><input class="form-check-input" type="checkbox" name="quan" id="quan${i}" value="${esc(d)}" ${S.quan.includes(d) ? 'checked' : ''}><label class="form-check-label" for="quan${i}">${esc(d)}</label></div>`).join('')}</div></div>
      <div class="filter-group"><h3>Khoảng giá</h3>${radios('gia', PRICE_PRESETS, S.gmax ? 'custom' : S.gia)}
        <label for="gmax" class="form-label small mt-2 mb-0">Giá tối đa: <b id="gmaxLabel">${S.gmax ? S.gmax + ' triệu' : 'Không giới hạn'}</b></label>
        <input type="range" class="form-range" id="gmax" min="1" max="${SLIDER_MAX}" step="0.5" value="${S.gmax || SLIDER_MAX}"></div>
      <div class="filter-group"><h3>Diện tích</h3>${radios('dt', AREA_PRESETS, S.dt)}</div>
      <div class="filter-group"><h3>Tiện ích</h3>${apiAmenities.length ? apiAmenities.map((amenity, index) =>
        `<div class="form-check"><input class="form-check-input" type="checkbox" name="amenity" id="amenity${index}" value="${amenity.id}" ${S.amenities.includes(Number(amenity.id)) ? 'checked' : ''}><label class="form-check-label" for="amenity${index}"><i class="bi ${esc(amenity.icon || 'bi-check2')} me-1"></i>${esc(amenity.name)}</label></div>`).join('') : '<p class="small text-muted mb-0">Đang tải tiện ích…</p>'}</div>
      <button type="button" class="btn btn-light-border w-100 mt-2" id="clearFilters"><i class="bi bi-x-circle"></i> Xóa bộ lọc</button>`;
  }

  /* ----- Lọc + vẽ kết quả ----- */
  function currentList() {
    const q = norm(S.q);
    const [priceMin, priceMax] = S.gia ? range(S.gia) : [null, null];
    const [areaMin, areaMax] = S.dt ? range(S.dt) : [null, null];
    const maxPrice = S.gmax ? +S.gmax * 1e6 : priceMax == null ? null : priceMax * 1e6;

    const list = apiRooms.filter(room => {
      if (S.cat && room.roomType !== S.cat) return false;
      if (S.quan.length && !S.quan.includes(room.district)) return false;
      if (priceMin != null && room.price < priceMin * 1e6) return false;
      if (maxPrice != null && room.price > maxPrice) return false;
      if (areaMin != null && room.area < areaMin) return false;
      if (areaMax != null && room.area > areaMax) return false;
      if (q && !norm(`${room.title} ${room.address} ${room.district}`).includes(q)) return false;
      if (S.amenities.length && !S.amenities.every(id => (room.amenities || []).some(amenity => Number(amenity.id) === id))) return false;
      return true;
    });

    return sortRooms(list, S.sort);
  }

  function apiRoomCol(room, cls) {
    const image = Auth.imageUrl(room.coverImage || `https://picsum.photos/seed/rentsmart-room-${encodeURIComponent(room.id)}/800/600`);
    const roomType = ROOM_TYPES[room.roomType] || room.roomType;
    const createdAt = room.createdAt ? room.createdAt.replace(' ', 'T') : '';

    return `<div class="${cls}">
      <article class="room-card">
        <div class="room-thumb">
          <a href="chi-tiet.html?id=${room.id}" tabindex="-1" aria-hidden="true"><img src="${esc(image)}" alt="Ảnh minh họa cho ${esc(room.title)}" loading="lazy"></a>
          <span class="room-type">${esc(roomType)}</span>
          ${room.featured ? '<span class="room-flag"><i class="bi bi-star-fill"></i> Nổi bật</span>' : ''}
        </div>
        <div class="room-body">
          <div class="room-price">${formatMoney(room.price)} đ<small>/tháng</small></div>
          <h3 class="room-title"><a href="chi-tiet.html?id=${room.id}">${esc(room.title)}</a></h3>
          <p class="room-desc">${esc(room.description)}</p>
          <div class="room-meta">
            <span><i class="bi bi-aspect-ratio"></i>${esc(room.area)} m²</span>
            <span><i class="bi bi-geo-alt"></i>${esc(room.district)}</span>
            <span><i class="bi bi-clock"></i>${createdAt ? timeAgo(createdAt) : ''}</span>
          </div>
        </div>
      </article>
    </div>`;
  }

  async function loadRooms() {
    $('#resultCount').textContent = 'Đang tải phòng...';

    try {
      const [rooms, districts, amenities] = await Promise.all([
        Auth.request('rooms'),
        Auth.request('districts'),
        Auth.request('amenities')
      ]);
      if (!Array.isArray(rooms) || !Array.isArray(districts) || !Array.isArray(amenities)) {
        throw new Error('API không trả về danh sách phòng hợp lệ.');
      }

      apiDistricts = districts.map(district => district.name);
      S.quan = S.quan.filter(district => apiDistricts.includes(district));
      apiAmenities = amenities.map(amenity => ({ ...amenity, id: Number(amenity.id) }));
      S.amenities = S.amenities.filter(id => apiAmenities.some(amenity => amenity.id === id));
      apiRooms = rooms.map(room => ({
        ...room,
        id: Number(room.id),
        price: Number(room.price),
        area: Number(room.area),
        featured: Boolean(Number(room.featured)),
        amenities: (room.amenities || []).map(amenity => ({ ...amenity, id: Number(amenity.id) }))
      }));
      drawFilters();
      render();
    } catch (error) {
      console.error('Không thể tải danh sách phòng từ API:', error);
      $('#resultCount').textContent = 'Không tải được danh sách phòng';
      $('#results').innerHTML = `<div class="col-12"><div class="empty-state">
        <i class="bi bi-wifi-off"></i><h3>Chưa kết nối được máy chủ</h3>
        <p class="text-muted">Kiểm tra xem Laravel đang chạy ở cổng 8001 rồi tải lại trang.</p>
      </div></div>`;
      $('#pager').innerHTML = '';
    }
  }

  function render() {
    const list = currentList();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    S.page = Math.min(S.page, pages);
    const items = list.slice((S.page - 1) * PAGE_SIZE, S.page * PAGE_SIZE);

    $('#crumb').textContent = S.cat ? ROOM_TYPES[S.cat] : 'Tất cả phòng';
    document.title = `${S.cat ? ROOM_TYPES[S.cat] : 'Phòng trọ'} tại TP.HCM – RentSmart`;
    $('#resultCount').innerHTML = `<span class="text-primary-rs">${list.length}</span> kết quả${S.quan.length ? ' tại ' + esc(S.quan.join(', ')) : ' tại TP.HCM'}`;

    const res = $('#results');
    res.classList.toggle('rooms-list', S.view === 'ds');
    res.innerHTML = items.length
      ? items.map(r => apiRoomCol(r, S.view === 'ds' ? 'col-12' : 'col-12 col-sm-6 col-xl-4')).join('')
      : `<div class="col-12"><div class="empty-state"><i class="bi bi-search"></i><h3>Không tìm thấy phòng phù hợp</h3>
         <p class="text-muted">Hãy thử thay đổi hoặc bỏ bớt bộ lọc.</p><button class="btn btn-primary" id="emptyClear">Xóa bộ lọc</button></div></div>`;

    $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === S.view));
    $('#sort').value = S.sort;
    drawPager(pages);
    syncURL();
  }

  function drawPager(pages) {
    if (pages <= 1) { $('#pager').innerHTML = ''; return; }
    const li = (p, label, disabled, active) => `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}" ${active ? 'aria-current="page"' : ''}>${label}</a></li>`;
    let h = li(S.page - 1, '<i class="bi bi-chevron-left"></i><span class="visually-hidden">Trước</span>', S.page === 1);
    for (let p = 1; p <= pages; p++) h += li(p, p, false, p === S.page);
    h += li(S.page + 1, '<i class="bi bi-chevron-right"></i><span class="visually-hidden">Sau</span>', S.page === pages);
    $('#pager').innerHTML = h;
  }

  function clearAll() {
    Object.assign(S, { cat: '', q: '', quan: [], gia: '', gmax: '', dt: '', amenities: [], page: 1 });
    $('#kw').value = '';
    drawFilters();
    render();
  }

  /* ----- Sự kiện ----- */
  const filters = $('#filters');
  filters.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'cat') S.cat = t.value;
    else if (t.name === 'quan') S.quan = $$('[name=quan]:checked', filters).map(i => i.value);
    else if (t.name === 'gia') { S.gia = t.value; S.gmax = ''; $('#gmax').value = SLIDER_MAX; $('#gmaxLabel').textContent = 'Không giới hạn'; }
    else if (t.name === 'dt') S.dt = t.value;
    else if (t.name === 'amenity') S.amenities = $$('[name=amenity]:checked', filters).map(input => +input.value);
    else return;
    S.page = 1;
    render();
  });
  filters.addEventListener('input', e => {
    if (e.target.id !== 'gmax') return;
    const v = +e.target.value;
    S.gmax = v >= SLIDER_MAX ? '' : String(v);
    S.gia = '';
    $$('[name=gia]', filters).forEach(r => r.checked = false);
    $('#gmaxLabel').textContent = S.gmax ? S.gmax + ' triệu' : 'Không giới hạn';
    S.page = 1;
    render();
  });
  filters.addEventListener('click', e => { if (e.target.closest('#clearFilters')) clearAll(); });
  document.addEventListener('click', e => {
    if (e.target.closest('#emptyClear')) clearAll();
    const pg = e.target.closest('[data-page]');
    if (pg) { e.preventDefault(); S.page = +pg.dataset.page; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    const v = e.target.closest('[data-view]');
    if (v) { S.view = v.dataset.view; render(); }
  });
  $('#sort').addEventListener('change', e => { S.sort = e.target.value; S.page = 1; render(); });
  $('#kw').value = S.q;
  $('#kw').addEventListener('input', debounce(e => { S.q = e.target.value.trim(); S.page = 1; render(); }));

  // Giá/diện tích dạng "0-3" từ trang chủ phải khớp preset, nếu không thì bỏ qua
  if (!PRICE_PRESETS.some(p => p[0] === S.gia)) S.gia = '';
  if (!AREA_PRESETS.some(p => p[0] === S.dt)) S.dt = '';

  drawFilters();
  loadRooms();
  if (qs('nangcao') && window.innerWidth < 992) bootstrap.Offcanvas.getOrCreateInstance('#filterPanel').show();
})();
