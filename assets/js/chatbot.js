/* ==========================================================
   RentSmart HCM - chatbot.js
   Nút AI nổi + cửa sổ chat. Logic trả lời giả lập (rule-based).
   ========================================================== */
(function () {
  const B = RS.base;
  const HISTORY_KEY = 'rs_chat';
  const QUICK = ['Cách liên hệ an toàn?', 'Giá phòng TP.HCM?', 'Khu vực nào gần trường đại học?', 'Tiện ích nên có?'];
  const GREETING = 'Xin chào! Tôi là trợ lý ảo hỗ trợ tìm phòng trọ tại TP.HCM. Bạn có thể chọn câu hỏi nhanh bên dưới hoặc gõ câu hỏi.';

  // Mức giá tham khảo theo quận (triệu đồng/tháng)
  const PRICE_GUIDE = {
    'Quận 1': '6–10', 'Quận 7': '4–8', 'Bình Thạnh': '3–5', 'Gò Vấp': '2,5–4', 'TP. Thủ Đức': '2–4', 'Tân Bình': '3–5', 'Phú Nhuận': '4–6'
  };

  /* ----- Phân tích câu hỏi tìm phòng ----- */
  function parseCriteria(text) {
    const m = norm(text), c = {};
    const num = s => parseFloat(String(s).replace(',', '.'));
    let x;
    if ((x = m.match(/(?:duoi|toi da|khong qua|<)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m)?/))) c.pmax = num(x[1]) * 1e6;
    else if ((x = m.match(/(?:tren|tu|>)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m)/))) c.pmin = num(x[1]) * 1e6;
    else if ((x = m.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)\b/))) { c.pmin = num(x[1]) * 1e6 * .8; c.pmax = num(x[1]) * 1e6 * 1.2; }
    const ds = DISTRICTS.filter(d => new RegExp('(^|\\W)' + norm(d).replace('tp. ', '').replace('huyen ', '') + '(\\W|$)').test(m));
    if (ds.length) c.districts = ds;
    if (/can ho/.test(m)) c.cat = 'can-ho';
    else if (/nguyen can/.test(m)) c.cat = 'nha-nguyen-can';
    else if (/o ghep/.test(m)) c.cat = 'o-ghep';
    else if (/phong tro|phong/.test(m)) c.cat = c.districts || c.pmax || c.pmin ? 'phong-tro' : undefined;
    return c;
  }

  /* ----- askAI: THAY HÀM NÀY bằng lời gọi API LLM thật khi có backend -----
     Ví dụ: const res = await fetch('/api/chat', {method:'POST', body: JSON.stringify({message})});
            return await res.json(); // dạng { text, rooms: [roomId, ...] }
     Hiện tại trả lời bằng quy tắc từ khóa tiếng Việt (không phân biệt hoa thường/dấu). */
  async function askAI(message) {
    await new Promise(r => setTimeout(r, 700));
    const m = norm(message);
    const c = parseCriteria(message);
    const hasSearch = c.pmax != null || c.pmin != null || c.districts || c.cat;
    if (hasSearch && /phong|can ho|nha|tim|o ghep|duoi|tren/.test(m)) {
      const found = sortRooms(searchRooms(c), 'moi-nhat').slice(0, 3);
      if (found.length) return { text: `Tôi tìm thấy ${found.length} phòng phù hợp với yêu cầu của bạn:`, rooms: found.map(r => r.id) };
      return { text: 'Hiện chưa có phòng đúng yêu cầu. Bạn thử nới khoảng giá hoặc chọn quận lân cận nhé.' };
    }
    if (/an toan|lua dao|coc|lien he/.test(m)) return { text: 'Để thuê trọ an toàn:\n• Xem phòng trực tiếp trước khi đặt cọc\n• Kiểm tra giấy tờ chủ nhà\n• Ký hợp đồng ghi rõ giá, cọc, điện nước\n• Không chuyển tiền cho người chưa gặp mặt\n• Báo cáo tin đáng ngờ cho RentSmart.' };
    if (/gia|bao nhieu/.test(m)) return { text: 'Giá tham khảo (triệu đồng/tháng):\n' + Object.entries(PRICE_GUIDE).map(([k, v]) => `• ${k}: ${v}`).join('\n') + '\nBạn có thể hỏi cụ thể, ví dụ "phòng dưới 4 triệu ở Gò Vấp".' };
    if (/gan truong|dai hoc|sinh vien/.test(m)) return { text: 'Khu vực gần trường đại học:\n• TP. Thủ Đức: ĐH Quốc gia, Sư phạm Kỹ thuật\n• Bình Thạnh: Hutech, UEF\n• Quận 10: Bách Khoa\n• Gò Vấp: ĐH Công nghiệp\nGiá thường từ 1,5–4 triệu.' };
    if (/tien ich|dieu hoa|may giat|noi that/.test(m)) return { text: 'Tiện ích nên có: điều hòa, nước nóng, WC riêng, chỗ để xe, internet, khóa vân tay, bảo vệ 24/7. Tùy nhu cầu, máy giặt và nhà bếp cũng rất tiện.' };
    if (/xin chao|hello|chao/.test(m)) return { text: 'Chào bạn! Bạn đang tìm phòng ở khu vực nào của TP.HCM?' };
    return { text: 'Xin lỗi, tôi chưa hiểu rõ câu hỏi. Bạn hãy thử một trong các câu hỏi nhanh bên dưới, hoặc gõ ví dụ "phòng dưới 4 triệu ở Gò Vấp" nhé.' };
  }
  window.askAI = askAI;

  /* ----- Giao diện ----- */
  const root = document.createElement('div');
  root.innerHTML = `
    <button class="chat-fab" id="chatFab" type="button" data-tip="Hỏi AI tìm trọ" aria-label="Mở trợ lý AI tìm trọ"><i class="bi bi-robot"></i></button>
    <section class="chat-box" id="chatBox" role="dialog" aria-label="AI Trợ Lý Tìm Trọ" aria-hidden="true">
      <div class="chat-head"><i class="bi bi-robot fs-5"></i> AI Trợ Lý Tìm Trọ
        <button type="button" class="spacer" id="chatMin" aria-label="Thu nhỏ"><i class="bi bi-dash-lg"></i></button>
        <button type="button" id="chatClose" aria-label="Đóng chat"><i class="bi bi-x-lg"></i></button></div>
      <div class="chat-msgs" id="chatMsgs" aria-live="polite"></div>
      <div class="chat-quick">${QUICK.map(q => `<button class="chip" type="button">${q}</button>`).join('')}</div>
      <form class="chat-form" id="chatForm"><input type="text" id="chatInput" class="form-control" placeholder="Nhập câu hỏi..." aria-label="Nhập câu hỏi" autocomplete="off">
        <button class="btn btn-primary" type="submit" aria-label="Gửi"><i class="bi bi-send"></i></button></form>
      <button class="chat-support" type="button" id="chatSupport"><i class="bi bi-headset"></i> Liên hệ nhân viên hỗ trợ trực tiếp</button>
    </section>`;
  document.body.append(...root.children);

  const box = $('#chatBox'), msgs = $('#chatMsgs'), input = $('#chatInput'), fab = $('#chatFab');
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch (e) { }
  const save = () => sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
  const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };

  function draw(item) {
    const d = document.createElement('div');
    if (item.type === 'rooms') {
      d.className = 'chat-rooms';
      d.innerHTML = item.ids.map(id => DB.room(id)).filter(Boolean).map(r =>
        `<a class="mini-room" href="${B}chi-tiet.html?id=${r.id}"><img src="${esc(DB.cover(r.id))}" alt="${esc(r.title)}"><div><b>${esc(r.title)}</b><span>${formatMoney(r.price)} đ/tháng</span><small>${r.area} m² · ${esc(r.district)}</small></div></a>`).join('');
    } else {
      d.className = 'msg ' + item.who;
      d.textContent = item.text;
    }
    msgs.appendChild(d);
    scroll();
  }
  function push(item) { history.push(item); save(); draw(item); }

  if (!history.length) history = [{ who: 'ai', text: GREETING }];
  history.forEach(draw);

  const setOpen = open => {
    box.classList.toggle('open', open);
    box.setAttribute('aria-hidden', !open);
    fab.style.display = open && window.innerWidth < 992 ? 'none' : '';
    sessionStorage.setItem('rs_chat_open', open ? '1' : '');
    if (open) { input.focus(); scroll(); }
  };
  fab.onclick = () => setOpen(true);
  $('#chatClose').onclick = $('#chatMin').onclick = () => setOpen(false);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) setOpen(false); });
  if (sessionStorage.getItem('rs_chat_open')) setOpen(true);

  async function send(text) {
    text = text.trim();
    if (!text) return;
    push({ who: 'user', text });
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = '<span class="typing" aria-label="Đang trả lời"><i></i><i></i><i></i></span>';
    msgs.appendChild(typing); scroll();
    const res = await askAI(text);
    typing.remove();
    push({ who: 'ai', text: res.text });
    if (res.rooms && res.rooms.length) push({ type: 'rooms', ids: res.rooms });
  }
  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
  $$('.chat-quick .chip').forEach(c => c.onclick = () => send(c.textContent));
  $('#chatSupport').onclick = () => { push({ who: 'ai', text: 'Đã chuyển yêu cầu của bạn cho nhân viên hỗ trợ. Chúng tôi sẽ liên hệ trong thời gian sớm nhất.' }); toast('Đã gửi yêu cầu tới nhân viên hỗ trợ', 'info'); };
})();
