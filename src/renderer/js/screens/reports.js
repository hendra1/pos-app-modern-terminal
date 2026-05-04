/**
 * Reports Screen
 */
const ReportsScreen = (() => {
  const menus = [
    { key: '1', text: 'Laporan Shift', action: 'shiftReport' },
    { key: '2', text: 'Laporan Harian', action: 'dailyReport' },
    { key: '3', text: 'Piutang / Kredit', action: 'credits' },
  ];

  function render() {
    const menuHtml = menus.map((m, i) => `
      <div class="menu-item ${i === 0 ? 'selected' : ''}" onclick="ReportsScreen.go('${m.action}')">
        <span class="menu-hotkey">${m.key}</span>
        <span class="menu-text">${m.text}</span>
      </div>
    `).join('');

    Helpers.render('app-content', `
      <div class="screen">
        <div class="screen-title">LAPORAN</div>
        <div class="panel panel-double" style="max-width:500px;margin:var(--gap-lg) auto">
          <div class="panel-title">═ Pilih Laporan ═</div>
          <div class="menu-list" style="padding-top:12px">${menuHtml}</div>
        </div>
        <div class="panel flex-1 overflow-auto" id="report-content">
          <div class="text-center text-dim p-lg">Pilih laporan dari menu di atas</div>
        </div>
      </div>
    `);

    Components.setFnKeys([null, null, null, null, null, null, null, null,
      { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" }, null]);
    Keyboard.bind({ '1': () => go('shiftReport'), '2': () => go('dailyReport'), '3': () => go('credits'), 'Escape': () => Router.navigate('main-menu') });
  }

  async function go(action) {
    const el = document.getElementById('report-content');
    if (!el) return;
    el.innerHTML = '<div class="loading">Memuat</div>';
    try {
      if (action === 'shiftReport') { let s; try { s = await API.getCurrentShift(); } catch { s = null; } if (!s) { el.innerHTML = '<div class="text-center text-dim p-lg">Tidak ada shift aktif</div>'; return; } const r = await API.getShiftReport(s.id); const sum = r.summary; const txR = r.transactions.map(tx => `<tr><td>${tx.receipt_no}</td><td>${Helpers.formatTime(tx.created_at)}</td><td class="${tx.payment_type === 'cash' ? 'text-green' : 'text-yellow'}">${tx.payment_type === 'cash' ? 'Tunai' : 'Kredit'}</td><td class="text-right">${Helpers.formatRupiah(tx.total)}</td><td class="${tx.status === 'voided' ? 'text-red' : 'text-green'}">${tx.status === 'voided' ? 'BATAL' : 'OK'}</td></tr>`).join(''); el.innerHTML = `<div class="report-header"><div class="text-cyan bold">LAPORAN SHIFT ${r.shift.shift_number}</div><div class="text-dim">${r.shift.user_name} — ${Helpers.formatDateTime(r.shift.opened_at)}</div></div><div class="shift-card" style="max-width:500px;margin:0 auto var(--gap-md)"><div class="shift-row"><span class="text-cyan">Modal:</span><span>${Helpers.formatRupiah(r.shift.opening_cash)}</span></div><div class="shift-row"><span class="text-cyan">Cash:</span><span class="text-green">${Helpers.formatRupiah(sum.total_cash)}</span></div><div class="shift-row"><span class="text-cyan">Kredit:</span><span class="text-yellow">${Helpers.formatRupiah(sum.total_credit)}</span></div><div class="shift-row"><span class="text-cyan">Transaksi:</span><span>${sum.total_transactions}</span></div></div><table class="data-table"><thead><tr><th>No. Struk</th><th>Waktu</th><th>Bayar</th><th class="text-right">Total</th><th>Status</th></tr></thead><tbody>${txR || '<tr><td colspan="5" class="text-center text-dim">Belum ada</td></tr>'}</tbody></table>`; }
      else if (action === 'dailyReport') { const today = new Date().toISOString().slice(0, 10); const r = await API.getDailyReport(today); const sR = r.shifts.map(s => `<tr><td>Shift ${s.shift_number}</td><td>${s.user_name}</td><td>${s.status === 'open' ? '<span class="text-green">Aktif</span>' : 'Tutup'}</td><td class="text-right">${Helpers.formatRupiah(s.total_sales_cash)}</td><td class="text-right">${Helpers.formatRupiah(s.total_sales_credit)}</td><td class="text-right">${s.total_transactions}</td></tr>`).join(''); el.innerHTML = `<div class="report-header"><div class="text-cyan bold">LAPORAN HARIAN</div><div class="text-dim">${Helpers.formatDate(today)}</div></div><div class="shift-card" style="max-width:500px;margin:0 auto var(--gap-md)"><div class="shift-row"><span class="text-cyan">Total Cash:</span><span class="text-green bold">${Helpers.formatRupiah(r.totals.total_cash)}</span></div><div class="shift-row"><span class="text-cyan">Total Kredit:</span><span class="text-yellow bold">${Helpers.formatRupiah(r.totals.total_credit)}</span></div><div class="shift-row divider"><span class="text-cyan bold">Grand Total:</span><span class="text-bright bold text-xl">${Helpers.formatRupiah(r.totals.grand_total)}</span></div></div><table class="data-table"><thead><tr><th>Shift</th><th>Kasir</th><th>Status</th><th class="text-right">Cash</th><th class="text-right">Kredit</th><th class="text-right">Trx</th></tr></thead><tbody>${sR || '<tr><td colspan="6" class="text-center text-dim">Belum ada</td></tr>'}</tbody></table>`; }
      else if (action === 'credits') { const credits = await API.getCredits(); if (credits.length === 0) { el.innerHTML = '<div class="text-center text-green p-lg bold">✓ Tidak ada piutang</div>'; return; } const rows = credits.map(c => `<tr><td>${c.receipt_no}</td><td>${Helpers.formatDateTime(c.created_at)}</td><td>${c.customer_name || '-'}</td><td class="text-right">${Helpers.formatRupiah(c.total)}</td><td class="text-right text-red bold">${Helpers.formatRupiah(c.remaining)}</td></tr>`).join(''); const tot = credits.reduce((s, c) => s + c.remaining, 0); el.innerHTML = `<div class="report-header"><div class="text-cyan bold">LAPORAN PIUTANG</div><div class="text-yellow bold text-lg">Total: ${Helpers.formatRupiah(tot)}</div></div><table class="data-table"><thead><tr><th>No. Struk</th><th>Tanggal</th><th>Pelanggan</th><th class="text-right">Total</th><th class="text-right">Sisa</th></tr></thead><tbody>${rows}</tbody></table>`; }
    } catch (err) { el.innerHTML = `<div class="text-center text-red p-lg">Error: ${err.message}</div>`; }
  }

  return { render, go };
})();
