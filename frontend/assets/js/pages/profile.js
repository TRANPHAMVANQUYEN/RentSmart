/* Hồ sơ cá nhân */
(function () {
  const me = Auth.requireRole(['tenant', 'landlord']);
  if (!me) return;
  let pendingAvatar = null;
  const paintAvatar = user => $('#avatarBox').innerHTML = avatarHTML(user, 'avatar-xl');
  paintAvatar(me);
  $('#fullName').value = me.fullName;
  $('#email').value = me.email;
  $('#phone').value = me.phone;

  const bad = (el, msg) => { el.classList.toggle('is-invalid', !!msg); if (msg) el.nextElementSibling.textContent = msg; return !msg; };

  $('#avatarFile').addEventListener('change', async event => {
    const f = event.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Vui lòng chọn file ảnh', 'error');
    try {
      pendingAvatar = await readImage(f, 240, .8);
      paintAvatar({ ...me, avatar: pendingAvatar });
    } catch (error) {
      toast('Không đọc được ảnh đại diện.', 'error');
    }
  });

  $('#profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('#fullName');
    const email = $('#email');
    const phone = $('#phone');
    let valid = bad(name, name.value.trim().length >= 2 ? '' : 'Vui lòng nhập họ tên.');
    valid = bad(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Email không hợp lệ.') && valid;
    valid = bad(phone, /^0\d{9}$/.test(phone.value.trim()) ? '' : 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.') && valid;
    if (!valid) return;

    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const payload = { fullName: name.value.trim(), email: email.value.trim(), phone: phone.value.trim() };
      if (pendingAvatar) payload.avatar = pendingAvatar;
      const result = await Auth.request('profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      Object.assign(me, result.user);
      Auth.saveCurrent(me);
      pendingAvatar = null;
      paintAvatar(me);
      renderHeader();
      toast('Đã lưu thông tin hồ sơ');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });

  $('#pwForm').addEventListener('submit', async event => {
    event.preventDefault();
    const current = $('#oldPw');
    const password = $('#newPw');
    const confirmation = $('#newPw2');
    let valid = bad(current, current.value ? '' : 'Vui lòng nhập mật khẩu hiện tại.');
    valid = bad(password, password.value.length >= 8 ? '' : 'Mật khẩu mới tối thiểu 8 ký tự.') && valid;
    valid = bad(confirmation, confirmation.value === password.value ? '' : 'Mật khẩu nhập lại không khớp.') && valid;
    if (!valid) return;

    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await Auth.request('profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: current.value,
          password: password.value,
          password_confirmation: confirmation.value
        })
      });
      event.currentTarget.reset();
      toast('Đã đổi mật khẩu');
    } catch (error) {
      if (error.message.includes('Mật khẩu hiện tại')) bad(current, error.message);
      else toast(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
