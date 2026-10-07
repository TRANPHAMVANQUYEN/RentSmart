/* ==========================================================
   RentSmart HCM - listing.js
   Trang danh sách: lọc, sắp xếp, phân trang, đồng bộ bộ lọc với URL.
   ========================================================== */
(function () {
  const PAGE_SIZE = 9;
  const PRICE_PRESETS = [['', 'Tất cả'], ['0-3', 'Dưới 3 triệu'], ['3-5', '3 – 5 triệu'], ['5-7', '5 – 7 triệu'], ['7-10', '7 – 10 triệu'], ['10-', 'Trên 10 triệu']];
  const AREA_PRESETS = [['', 'Tất cả'], ['0-20', 'Dưới 20m²'], ['20-30', '20 – 30m²'], ['30-50', '30 – 50m²'], ['50-', 'Trên 50m²']];
  const SLIDER_MAX = 15; // triệu

  // Trạng thái lọc; mọi giá trị đều có thể khôi phục từ URL
  const S = { cat: '', q: '', quan: [], gia: '', gmax: '', dt: '', ti: [], sort: '', view: 'luoi', page: 1 };
  (function readURL() {
    const p = new URLSearchParams(location.search);
    S.cat = ROOM_TYPES[p.get('loai')] ? p.get('loai') : '';
    S.q = p.get('q') || '';
    S.quan = (p.get('quan') || '').split(',').filter(d => DISTRICTS.includes(d));
    S.gia = p.get('gia') || '';
    S.gmax = p.get('gmax') || '';
    S.dt = p.get('dt') || '';
    S.ti = (p.get('ti') || '').split(',').map(Number).filter(Boolean);
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
    if (S.ti.length) p.set('ti', S.ti.join(','));
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
      <div class="filter-group"><h3>Quận/Huyện</h3><div class="filter-scroll">${DISTRICTS.map((d, i) =>
        `<div class="form-check"><input class="form-check-input" type="checkbox" name="quan" id="quan${i}" value="${esc(d)}" ${S.quan.includes(d) ? 'checked' : ''}><label class="form-check-label" for="quan${i}">${esc(d)}</label></div>`).join('')}</div></div>
      <div class="filter-group"><h3>Khoảng giá</h3>${radios('gia', PRICE_PRESETS, S.gmax ? 'custom' : S.gia)}
        <label for="gmax" class="form-label small mt-2 mb-0">Giá tối đa: <b id="gmaxLabel">${S.gmax ? S.gmax + ' triệu' : 'Không giới hạn'}</b></label>
        <input type="range" class="form-range" id="gmax" min="1" max="${SLIDER_MAX}" step="0.5" value="${S.gmax || SLIDER_MAX}"></div>
      <div class="filter-group"><h3>Diện tích</h3>${radios('dt', AREA_PRESETS, S.dt)}</div>
      <div class="filter-group"><h3>Tiện ích</h3><div class="filter-scroll">${AMENITIES.map(a =>
        `<div class="form-check"><input class="form-check-input" type="checkbox" name="ti" id="ti${a.id}" value="${a.id}" ${S.ti.includes(a.id) ? 'checked' : ''}><label class="form-check-label" for="ti${a.id}"><i class="bi ${a.icon} me-1"></i>${esc(a.name)}</label></div>`).join('')}</div></div>
      <button type="button" class="btn btn-light-border w-100 mt-2" id="clearFilters"><i class="bi bi-x-circle"></i> Xóa bộ lọc</button>`;
  }

  /* ----- Lọc + vẽ kết quả ----- */
  function currentList() {
    const f = { cat: S.cat, q: S.q, districts: S.quan, amenities: S.ti };
    if (S.gmax) { f.pmax = +S.gmax * 1e6; }
    else if (S.gia) { const [a, b] = range(S.gia); if (a != null) f.pmin = a * 1e6; if (b != null) f.pmax = b * 1e6; }
    if (S.dt) { const [a, b] = range(S.dt); if (a != null) f.amin = a; if (b != null) f.amax = b; }
    return sortRooms(searchRooms(f), S.sort);
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
      ? items.map(r => roomCol(r, S.view === 'ds' ? 'col-12' : 'col-12 col-sm-6 col-xl-4')).join('')
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
    Object.assign(S, { cat: '', q: '', quan: [], gia: '', gmax: '', dt: '', ti: [], page: 1 });
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
    else if (t.name === 'ti') S.ti = $$('[name=ti]:checked', filters).map(i => +i.value);
    else if (t.name === 'gia') { S.gia = t.value; S.gmax = ''; $('#gmax').value = SLIDER_MAX; $('#gmaxLabel').textContent = 'Không giới hạn'; }
    else if (t.name === 'dt') S.dt = t.value;
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
  render();
  if (qs('nangcao') && window.innerWidth < 992) bootstrap.Offcanvas.getOrCreateInstance('#filterPanel').show();
})();
