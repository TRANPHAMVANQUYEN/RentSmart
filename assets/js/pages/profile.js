/* Hồ sơ cá nhân */
(function () {
  const me = Auth.requireRole(['tenant', 'landlord']);
  if (!me) return;
  const paintAvatar = () => $('#avatarBox').innerHTML = avatarHTML(me, 'avatar-xl');
  paintAvatar();
  $('#fullName').value = me.fullName;
  $('#email').value = me.email;
  $('#phone').value = me.phone;

  const bad = (el, msg) => { el.classList.toggle('is-invalid', !!msg); if (msg) el.nextElementSibling.textContent = msg; return !msg; };

  $('#avatarFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Vui lòng chọn file ảnh', 'error');
    me.avatar = await readImage(f, 240, .8);
    if (DB.save()) { paintAvatar(); renderHeader(); toast('Đã cập nhật ảnh đại diện'); }
  });

  $('#profileForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fullName');
    if (!bad(n, n.value.trim().length >= 2 ? '' : 'Vui lòng nhập họ tên.')) return;
    me.fullName = n.value.trim();
    DB.save();
    renderHeader();
    toast('Đã lưu thông tin');
  });

  $('#pwForm').addEventListener('submit', e => {
    e.preventDefault();
    const o = $('#oldPw'), n = $('#newPw'), n2 = $('#newPw2');
    let ok = bad(o, o.value === me.password ? '' : 'Mật khẩu hiện tại không đúng.');
    ok = bad(n, n.value.length >= 8 ? '' : 'Mật khẩu mới tối thiểu 8 ký tự.') && ok;
    ok = bad(n2, n2.value === n.value ? '' : 'Mật khẩu nhập lại không khớp.') && ok;
    if (!ok) return;
    me.password = n.value;
    DB.save();
    e.target.reset();
    toast('Đã đổi mật khẩu');
  });
})();
