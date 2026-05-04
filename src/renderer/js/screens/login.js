/**
 * Login Screen
 */
const LoginScreen = (() => {
  function render() {
    const html = `
      <div class="login-container">
        <div class="ascii-art">
╔═══════════════════════════════════════════╗
║     ____   ___  ____                      ║
║    |  _ \\ / _ \\/ ___|                     ║
║    | |_) | | | \\___ \\                     ║
║    |  __/| |_| |___) |                    ║
║    |_|    \\___/|____/  TERMINAL           ║
╚═══════════════════════════════════════════╝
        </div>

        <div class="login-box">
          <div class="login-title">LOGIN</div>
          <div class="login-subtitle">${(window.posConfig && window.posConfig.companyName) || 'Toko Demo'}</div>

          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input form-input-lg" id="login-username" type="text"
                   placeholder="Masukkan username" autofocus>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input form-input-lg" id="login-password" type="password"
                   placeholder="Masukkan password">
          </div>

          <div id="login-error" class="login-error"></div>

          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:10px"
                  onclick="LoginScreen.doLogin()">
            MASUK [Enter]
          </button>

          <div class="login-demo-info">
            <div class="demo-title">Demo Users:</div>
            <div class="demo-row">
              <span class="demo-role">Admin</span>
              <span class="demo-user">admin</span>
              <span class="demo-pass">/ admin123</span>
            </div>
            <div class="demo-row">
              <span class="demo-role">Kasir</span>
              <span class="demo-user">kasir1</span>
              <span class="demo-pass">/ kasir123</span>
            </div>
            <div class="demo-row">
              <span class="demo-role">Supervisor</span>
              <span class="demo-user">super1</span>
              <span class="demo-pass">/ super123</span>
            </div>
          </div>
        </div>
      </div>
    `;

    Helpers.render('app-content', html);
    Components.setFnKeys([
      null, null, null, null, null,
      null, null, null, null,
      { key: 'F10', label: 'Keluar', action: 'window.close()' },
    ]);

    // Focus username
    setTimeout(() => {
      const el = document.getElementById('login-username');
      if (el) el.focus();
    }, 50);

    // Keyboard bindings
    Keyboard.bind({
      'Enter': () => LoginScreen.doLogin(),
    });

    // Tab between fields
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    if (usernameEl) {
      usernameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          passwordEl.focus();
        }
      });
    }
    if (passwordEl) {
      passwordEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          LoginScreen.doLogin();
        }
      });
    }
  }

  async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
      errorEl.textContent = '⚠ Username dan password wajib diisi';
      return;
    }

    errorEl.textContent = 'Memproses...';

    try {
      const result = await API.login(username, password);
      API.setToken(result.token);
      App.setUser(result.user);
      Helpers.setStatusUser(result.user);
      Helpers.toast(`Selamat datang, ${result.user.name}!`, 'success');
      Router.navigate('main-menu');
    } catch (err) {
      errorEl.textContent = `⚠ ${err.message}`;
      document.getElementById('login-password').value = '';
      document.getElementById('login-password').focus();
    }
  }

  return { render, doLogin };
})();
