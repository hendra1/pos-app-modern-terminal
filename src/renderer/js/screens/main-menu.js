/**
 * Main Menu Screen — DOS-style numbered menu
 */
const MainMenuScreen = (() => {
  const MENUS = {
    kasir: [
      { key: '1', icon: '💰', text: 'Kasir / Penjualan', screen: 'cashier', desc: 'Transaksi penjualan' },
      { key: '2', icon: '🔄', text: 'Shift', screen: 'shift', desc: 'Buka / Tutup shift' },
    ],
    supervisor: [
      { key: '1', icon: '💰', text: 'Kasir / Penjualan', screen: 'cashier', desc: 'Transaksi penjualan' },
      { key: '2', icon: '🔄', text: 'Shift', screen: 'shift', desc: 'Buka / Tutup shift' },
      { key: '3', icon: '📦', text: 'Produk & Harga', screen: 'products', desc: 'Kelola produk dan ubah harga' },
      { key: '4', icon: '📥', text: 'Terima Barang', screen: 'receiving', desc: 'Penerimaan barang dari supplier' },
      { key: '5', icon: '📊', text: 'Laporan', screen: 'reports', desc: 'Laporan penjualan & piutang' },
    ],
    admin: [
      { key: '1', icon: '💰', text: 'Kasir / Penjualan', screen: 'cashier', desc: 'Transaksi penjualan' },
      { key: '2', icon: '🔄', text: 'Shift', screen: 'shift', desc: 'Buka / Tutup shift' },
      { key: '3', icon: '📦', text: 'Produk & Harga', screen: 'products', desc: 'Kelola produk dan ubah harga' },
      { key: '4', icon: '📥', text: 'Terima Barang', screen: 'receiving', desc: 'Penerimaan barang dari supplier' },
      { key: '5', icon: '📊', text: 'Laporan', screen: 'reports', desc: 'Laporan penjualan & piutang' },
      { key: '6', icon: '⚙️', text: 'Administrasi', screen: 'admin', desc: 'Manajemen user & pengaturan' },
    ],
  };

  let selectedIndex = 0;
  let menuItems = [];

  function render() {
    const user = App.getUser();
    menuItems = MENUS[user.role] || MENUS.kasir;

    const menuHtml = menuItems.map((item, i) => `
      <div class="menu-item ${i === selectedIndex ? 'selected' : ''}"
           data-index="${i}"
           onclick="MainMenuScreen.selectItem(${i})">
        <span class="menu-hotkey">${item.key}</span>
        <span class="menu-icon">${item.icon}</span>
        <span class="menu-text">${item.text}</span>
        <span class="menu-badge">${item.desc}</span>
      </div>
    `).join('');

    const html = `
      <div class="screen">
        <div class="screen-title">MENU UTAMA</div>
        <div class="screen-subtitle">Pilih menu dengan menekan angka atau ↑↓ + Enter</div>

        <div class="panel panel-double" style="max-width:700px;margin:0 auto;flex:1">
          <div class="panel-title">═ Menu ═</div>
          <div id="main-menu-list" class="menu-list" style="padding-top:16px">
            ${menuHtml}
          </div>
        </div>
      </div>
    `;

    Helpers.render('app-content', html);
    Components.setFnKeys([
      { key: 'F1', label: 'Bantuan' },
      null, null, null, null, null, null, null, null,
      { key: 'F10', label: 'Logout', action: 'MainMenuScreen.logout()' },
    ]);

    setupKeyboard();
  }

  function setupKeyboard() {
    const keys = {};

    // Number keys for quick selection
    menuItems.forEach((item) => {
      keys[item.key] = () => {
        const mi = menuItems.find(m => m.key === item.key);
        if (mi) Router.navigate(mi.screen);
      };
    });

    // Arrow navigation
    keys['ArrowUp'] = () => {
      selectedIndex = Math.max(0, selectedIndex - 1);
      updateSelection();
    };
    keys['ArrowDown'] = () => {
      selectedIndex = Math.min(menuItems.length - 1, selectedIndex + 1);
      updateSelection();
    };
    keys['Enter'] = () => {
      if (menuItems[selectedIndex]) {
        Router.navigate(menuItems[selectedIndex].screen);
      }
    };
    keys['F10'] = () => logout();

    Keyboard.bind(keys);
  }

  function updateSelection() {
    const items = document.querySelectorAll('#main-menu-list .menu-item');
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
    });
  }

  function selectItem(index) {
    selectedIndex = index;
    if (menuItems[index]) {
      Router.navigate(menuItems[index].screen);
    }
  }

  function logout() {
    Components.confirm('Apakah Anda yakin ingin logout?', () => {
      API.clearToken();
      App.setUser(null);
      Helpers.setStatusUser(null);
      Helpers.setStatusShift(null);
      Router.navigate('login');
    });
  }

  return { render, selectItem, logout };
})();
