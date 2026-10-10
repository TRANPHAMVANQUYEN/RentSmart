/* ==========================================================
   RentSmart HCM - admin/dang-nhap.js
   Đăng nhập riêng cho quản trị viên.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('admin-login-body');
  const current = Auth.current();
  if (current && current.role === 'admin') {
    location.replace('tong-quan.html');
    return;
  }

  const app = document.getElementById('admin-login-app');
  app.innerHTML = `<main class="admin-login-page">
    <section class="admin-login-card" aria-labelledby="adminLoginTitle">
      <div class="brand-lock"><i class="bi bi-shield-lock"></i></div>
      <h1 class="h3 mb-2" id="adminLoginTitle">Đăng nhập quản trị</h1>
      <p class="text-muted mb-4">Chỉ tài khoản quản trị viên mới có quyền truy cập khu vực này.</p>
      <form id="adminLoginForm" novalidate>
        <div class="mb-3">
          <label class="form-label" for="adminIdentifier">Tên đăng nhập / Email / Số điện thoại</label>
          <input id="adminIdentifier" class="form-control" autocomplete="username" required>
        </div>
        <div class="mb-3">
          <label class="form-label" for="adminPassword">Mật khẩu</label>
          <input id="adminPassword" type="password" class="form-control" autocomplete="current-password" required>
        </div>
        <div class="form-check mb-3">
          <input class="form-check-input" type="checkbox" id="adminRemember">
          <label class="form-check-label" for="adminRemember">Ghi nhớ đăng nhập trên thiết bị này</label>
        </div>
        <div class="alert alert-danger d-none" id="adminLoginError" role="alert"></div>
        <button class="btn btn-primary w-100" type="submit"><i class="bi bi-box-arrow-in-right"></i> Đăng nhập quản trị</button>
      </form>
    </section>
  </main>`;

  const form = document.getElementById('adminLoginForm');
  const errorBox = document.getElementById('adminLoginError');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.classList.add('d-none');
    const identifier = document.getElementById('adminIdentifier').value.trim();
    const password = document.getElementById('adminPassword').value;
    const remember = document.getElementById('adminRemember').checked;
    if (!identifier || !password) {
      errorBox.textContent = 'Vui lòng nhập đầy đủ thông tin đăng nhập.';
      errorBox.classList.remove('d-none');
      return;
    }
    const result = await Auth.login(identifier, password, remember);
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.remove('d-none');
      return;
    }
    if (!result.user || result.user.role !== 'admin') {
      await Auth.logout();
      errorBox.textContent = 'Tài khoản này không có quyền truy cập khu vực quản trị.';
      errorBox.classList.remove('d-none');
      return;
    }
    toast('Đăng nhập quản trị thành công.');
    location.replace('tong-quan.html');
  });
});
