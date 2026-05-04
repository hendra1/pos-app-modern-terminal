/**
 * Shift Management Screen
 */
const ShiftScreen = (() => {
  let currentShift = null;

  async function render() {
    try {
      currentShift = await API.getCurrentShift();
    } catch {
      currentShift = null;
    }

    const html = currentShift ? renderOpenShift() : renderNoShift();
    Helpers.render('app-content', html);

    if (currentShift) {
      Helpers.setStatusShift(currentShift);
      setupOpenShiftKeys();
    } else {
      Helpers.setStatusShift(null);
      setupNoShiftKeys();
    }
  }

  function renderNoShift() {
    return `
      <div class="screen">
        <div class="screen-title">MANAJEMEN SHIFT</div>

        <div class="panel panel-double" style="max-width:500px;margin:var(--gap-xl) auto">
          <div class="panel-title">═ Status ═</div>
          <div style="padding:var(--gap-xl);text-align:center">
            <p class="text-yellow text-xl bold" style="margin-bottom:var(--gap-lg)">
              Tidak ada shift yang aktif
            </p>
            <p class="text-dim" style="margin-bottom:var(--gap-xl)">
              Tekan F2 untuk membuka shift baru
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function renderOpenShift() {
    return `
      <div class="screen">
        <div class="screen-title">MANAJEMEN SHIFT</div>

        <div class="panel panel-double" style="max-width:550px;margin:var(--gap-xl) auto">
          <div class="panel-title">═ Shift Aktif ═</div>
          <div style="padding:var(--gap-lg)">
            <div class="shift-card">
              <div class="shift-row">
                <span class="text-cyan">Shift:</span>
                <span class="text-bright bold">Shift ${currentShift.shift_number}</span>
              </div>
              <div class="shift-row">
                <span class="text-cyan">Dibuka:</span>
                <span>${Helpers.formatDateTime(currentShift.opened_at)}</span>
              </div>
              <div class="shift-row">
                <span class="text-cyan">Modal Awal:</span>
                <span class="text-green bold">${Helpers.formatRupiah(currentShift.opening_cash)}</span>
              </div>
              <div class="shift-row">
                <span class="text-cyan">Status:</span>
                <span class="text-green bold">● AKTIF</span>
              </div>
            </div>

            <p class="text-dim text-center" style="margin-top:var(--gap-md)">
              F3 = Tutup Shift &nbsp; │ &nbsp; F4 = Lihat Ringkasan
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function setupNoShiftKeys() {
    Components.setFnKeys([
      null,
      { key: 'F2', label: 'Buka Shift', action: 'ShiftScreen.openShift()' },
      null, null, null, null, null, null,
      { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" },
      null,
    ]);

    Keyboard.bind({
      'F2': () => openShift(),
      'Escape': () => Router.navigate('main-menu'),
    });
  }

  function setupOpenShiftKeys() {
    Components.setFnKeys([
      null, null,
      { key: 'F3', label: 'Tutup Shift', action: 'ShiftScreen.closeShift()' },
      { key: 'F4', label: 'Ringkasan', action: 'ShiftScreen.viewSummary()' },
      null, null, null, null,
      { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" },
      null,
    ]);

    Keyboard.bind({
      'F3': () => closeShift(),
      'F4': () => viewSummary(),
      'Escape': () => Router.navigate('main-menu'),
    });
  }

  function openShift() {
    Components.prompt('BUKA SHIFT BARU', [
      { name: 'shift_number', label: 'Nomor Shift (1 atau 2)', type: 'number', placeholder: '1', value: '1' },
      { name: 'opening_cash', label: 'Modal Awal (Rp)', type: 'number', placeholder: '250000', value: '250000', inputClass: 'form-input-lg' },
    ], async (values) => {
      try {
        const shift = await API.openShift({
          shift_number: values.shift_number || 1,
          opening_cash: values.opening_cash || 0,
        });
        currentShift = shift;
        App.setShift(shift);
        Helpers.toast(`Shift ${shift.shift_number} berhasil dibuka`, 'success');
        render();
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  function closeShift() {
    if (!currentShift) return;

    Components.prompt('TUTUP SHIFT', [
      { name: 'closing_cash', label: 'Uang di Laci Kasir (Rp)', type: 'number', placeholder: '0', inputClass: 'form-input-lg' },
    ], async (values) => {
      try {
        const closed = await API.closeShift(currentShift.id, {
          closing_cash: values.closing_cash || 0,
        });
        Helpers.toast(`Shift ${closed.shift_number} berhasil ditutup`, 'success');

        // Show summary
        const report = await API.getShiftReport(closed.id);
        showShiftReport(report);

        currentShift = null;
        App.setShift(null);
        Helpers.setStatusShift(null);
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  async function viewSummary() {
    if (!currentShift) return;
    try {
      const report = await API.getShiftReport(currentShift.id);
      showShiftReport(report);
    } catch (err) {
      Helpers.toast(err.message, 'error');
    }
  }

  function showShiftReport(report) {
    const s = report.shift;
    const sum = report.summary;
    const html = `
      <div class="shift-card">
        <div class="shift-row"><span class="text-cyan">Shift:</span><span class="bold">${s.shift_number}</span></div>
        <div class="shift-row"><span class="text-cyan">Kasir:</span><span>${s.user_name}</span></div>
        <div class="shift-row"><span class="text-cyan">Dibuka:</span><span>${Helpers.formatDateTime(s.opened_at)}</span></div>
        <div class="shift-row"><span class="text-cyan">Ditutup:</span><span>${s.closed_at ? Helpers.formatDateTime(s.closed_at) : 'Masih aktif'}</span></div>
        <div class="shift-row divider"><span class="text-cyan">Modal Awal:</span><span class="text-green">${Helpers.formatRupiah(s.opening_cash)}</span></div>
        <div class="shift-row"><span class="text-cyan">Total Penjualan Cash:</span><span class="text-green">${Helpers.formatRupiah(sum.total_cash)}</span></div>
        <div class="shift-row"><span class="text-cyan">Total Penjualan Kredit:</span><span class="text-yellow">${Helpers.formatRupiah(sum.total_credit)}</span></div>
        <div class="shift-row"><span class="text-cyan">Jumlah Transaksi:</span><span>${sum.total_transactions}</span></div>
        <div class="shift-row"><span class="text-cyan">Transaksi Batal:</span><span class="text-red">${sum.voided_transactions}</span></div>
        ${s.status === 'closed' ? `
        <div class="shift-row divider"><span class="text-cyan">Seharusnya di Laci:</span><span class="text-bright bold">${Helpers.formatRupiah(sum.expected_cash)}</span></div>
        <div class="shift-row"><span class="text-cyan">Aktual di Laci:</span><span class="text-bright bold">${Helpers.formatRupiah(s.closing_cash)}</span></div>
        <div class="shift-row"><span class="text-cyan">Selisih:</span><span class="${sum.difference >= 0 ? 'text-green' : 'text-red'} bold">${Helpers.formatRupiah(sum.difference)}</span></div>
        ` : ''}
      </div>
    `;
    Components.showModal('LAPORAN SHIFT', html, [
      { label: 'Tutup (Esc)', class: 'btn-primary', action: 'Components.closeModal()' },
    ]);
    Keyboard.add('Escape', () => Components.closeModal());
  }

  return { render, openShift, closeShift, viewSummary };
})();
