/**
 * Admin Screen — User management
 */
const AdminScreen = (() => {
  let users = [];

  async function render() {
    try { users = await API.getUsers(); } catch { users = []; }

    const rows = users.map(u => `
      <tr>
        <td>${u.username}</td>
        <td>${u.name}</td>
        <td class="text-cyan">${u.role}</td>
        <td class="${u.active ? 'text-green' : 'text-red'}">${u.active ? 'Aktif' : 'Nonaktif'}</td>
      </tr>
    `).join('');

    Helpers.render('app-content', `
      <div class="screen">
        <div class="screen-title">ADMINISTRASI</div>
        <div class="panel flex-1 overflow-auto">
          <div class="panel-title">═ Daftar User ═</div>
          <table class="data-table" style="margin-top:12px">
            <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `);

    Components.setFnKeys([null,
      { key: 'F2', label: 'Tambah User', action: 'AdminScreen.addUser()' },
      null, null, null, null, null, null,
      { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" }, null]);
    Keyboard.bind({ 'F2': () => addUser(), 'Escape': () => Router.navigate('main-menu') });
  }

  function addUser() {
    Components.prompt('TAMBAH USER BARU', [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'text', required: true },
      { name: 'name', label: 'Nama Lengkap', type: 'text', required: true },
      { name: 'role', label: 'Role (admin/kasir/supervisor)', type: 'text', value: 'kasir' },
    ], async (values) => {
      try {
        await API.createUser(values);
        Helpers.toast('User berhasil ditambahkan', 'success');
        render();
      } catch (err) { Helpers.toast(err.message, 'error'); }
    });
  }

  return { render, addUser };
})();
