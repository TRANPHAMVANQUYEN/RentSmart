/* Đăng nhập / đăng ký / quên mật khẩu */
(function () {
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const RE_PHONE = /^0\d{9}$/;

  // Hiện/ẩn mật khẩu
  $$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
    const inp = b.previousElementSibling;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.querySelector('i').className = 'bi ' + (show ? 'bi-eye-slash' : 'bi-eye');
  }));

  const setErr = (el, msg) => {
    el.classList.toggle('is-invalid', !!msg);
    const fb = el.closest('div:not(.pw-wrap)')?.querySelector('.invalid-feedback');
    if (fb && msg) fb.textContent = msg;
    return !msg;
  };
  const busy = (btn, on) => { btn.disabled = on; const sp = $('.spinner-border', btn); if (sp) sp.classList.toggle('d-none', !on); };
  const showBanner = (msg) => { const b = $('#formError'); b.textContent = msg; b.classList.remove('d-none'); };

  // Đã đăng nhập thì không cần ở trang này
  const dest = () => Auth.safeRedirect(qs('redirect'));

  /* ----- Đăng nhập ----- */
  const login = $('#loginForm');
  if (login) {
    const u0 = Auth.current();
    if (u0) location.replace(dest() || Auth.homeFor(u0.role));
    if (qs('redirect')) $('#regLink').href = 'dang-ky.html?redirect=' + encodeURIComponent(qs('redirect'));
    login.addEventListener('submit', async e => {
      e.preventDefault();
      const id = $('#identifier'), pw = $('#password');
      $('#formError').classList.add('d-none');
      const ok1 = setErr(id, id.value.trim() ? '' : 'Vui lòng nhập tài khoản.');
      $('#pwErr').textContent = pw.value ? '' : 'Vui lòng nhập mật khẩu.';
      if (!ok1 || !pw.value) return;
      const btn = $('#submitBtn');
      busy(btn, true);
      const res = await Auth.login(id.value, pw.value, $('#remember').checked);
      busy(btn, false);
      if (!res.ok) return showBanner(res.error);
      location.href = dest() || Auth.homeFor(res.user.role);
    });
  }

  /* ----- Đăng ký ----- */
  const reg = $('#registerForm');
  if (reg) {
    const f = id => $('#' + id);
    $$('[name=role]').forEach(r => r.addEventListener('change', () => {
      $('#landlordFields').classList.toggle('d-none', r.value !== 'landlord' || !r.checked);
      $('#roleErr').classList.remove('d-block');
    }));
    f('password').addEventListener('input', e => {
      const v = e.target.value;
      const score = [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
      const bar = $('#strengthBar');
      bar.style.width = (v ? score * 25 : 0) + '%';
      bar.style.background = score <= 1 ? '#B91C1C' : score <= 2 ? '#B45309' : '#15803D';
      $('#strengthText').textContent = !v ? 'Tối thiểu 8 ký tự' : ['Yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][score];
    });

    reg.addEventListener('submit', async e => {
      e.preventDefault();
      $('#formError').classList.add('d-none');
      const role = ($('[name=role]:checked') || {}).value;
      const v = id => f(id).value.trim();
      let ok = true;
      if (!role) { $('#roleErr').classList.add('d-block'); ok = false; }
      ok = setErr(f('fullName'), v('fullName').length >= 2 ? '' : 'Vui lòng nhập họ tên.') && ok;
      ok = setErr(f('username'), /^[\w.]{4,20}$/.test(v('username')) ? '' : 'Tên đăng nhập 4–20 ký tự, chỉ gồm chữ, số, _ hoặc .') && ok;
      ok = setErr(f('email'), RE_EMAIL.test(v('email')) ? '' : 'Email không hợp lệ.') && ok;
      ok = setErr(f('phone'), RE_PHONE.test(v('phone')) ? '' : 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.') && ok;
      ok = setErr(f('password'), f('password').value.length >= 8 ? '' : 'Mật khẩu tối thiểu 8 ký tự.') && ok;
      ok = setErr(f('confirm'), f('confirm').value === f('password').value ? '' : 'Mật khẩu nhập lại không khớp.') && ok;
      f('terms').classList.toggle('is-invalid', !f('terms').checked);
      if (!f('terms').checked) ok = false;
      if (!ok) return;

      const btn = $('#submitBtn');
      busy(btn, true);
      const res = await Auth.register({
        role, fullName: v('fullName'), username: v('username'), email: v('email'), phone: v('phone'), password: f('password').value
      });
      busy(btn, false);
      if (!res.ok) { if (res.field) setErr(f(res.field), res.error); else showBanner(res.error); return; }
      sessionStorage.setItem('rs_flash', 'Đăng ký thành công! Hãy đăng nhập.');
      const r = qs('redirect');
      location.href = 'dang-nhap.html' + (r ? '?redirect=' + encodeURIComponent(r) : '');
    });
  }

  // Thông báo sau đăng ký
  const flash = sessionStorage.getItem('rs_flash');
  if (flash && login) { sessionStorage.removeItem('rs_flash'); toast(flash); }

  /* ----- Quên mật khẩu ----- */
  const forgot = $('#forgotForm');
  if (forgot) forgot.addEventListener('submit', async e => {
    e.preventDefault();
    const em = $('#email');
    if (!setErr(em, RE_EMAIL.test(em.value.trim()) ? '' : 'Email không hợp lệ.')) return;
    $('#formError').classList.add('d-none');
    const btn = forgot.querySelector('[type="submit"]');
    busy(btn, true);
    try {
      await Auth.request('forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em.value.trim() })
      });
      forgot.classList.add('d-none');
      $('#formOk').classList.remove('d-none');
    } catch (error) {
      showBanner(error.message);
    } finally {
      busy(btn, false);
    }
  });

  /* ----- Đặt lại mật khẩu ----- */
  const reset = $('#resetForm');
  if (reset) {
    const token = qs('token') || '';
    const email = $('#email');
    email.value = qs('email') || '';
    if (!token) showBanner('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    reset.addEventListener('submit', async e => {
      e.preventDefault();
      $('#formError').classList.add('d-none');
      const password = $('#password');
      const confirmation = $('#passwordConfirmation');
      let ok = setErr(email, RE_EMAIL.test(email.value.trim()) ? '' : 'Email không hợp lệ.');
      ok = setErr(password, password.value.length >= 8 ? '' : 'Mật khẩu mới tối thiểu 8 ký tự.') && ok;
      ok = setErr(confirmation, confirmation.value === password.value ? '' : 'Mật khẩu nhập lại không khớp.') && ok;
      if (!ok || !token) return;

      const btn = reset.querySelector('[type="submit"]');
      busy(btn, true);
      try {
        await Auth.request('reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            email: email.value.trim(),
            password: password.value,
            password_confirmation: confirmation.value
          })
        });
        reset.classList.add('d-none');
        $('#resetOk').classList.remove('d-none');
      } catch (error) {
        showBanner(error.message);
      } finally {
        busy(btn, false);
      }
    });
  }
})();
