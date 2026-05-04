/**
 * Reusable UI Components
 */
const Components = (() => {
  // Render function key bar
  function setFnKeys(keys) {
    const bar = document.getElementById('fn-bar');
    if (!bar) return;

    bar.innerHTML = keys.map(k => {
      if (!k) return '<div class="fn-item"></div>';
      return `
        <div class="fn-item" onclick="${k.action || ''}">
          <span class="fn-key">${k.key}</span>
          <span class="fn-label">${k.label}</span>
        </div>`;
    }).join('');
  }

  // Show modal
  function showModal(title, bodyHtml, actions = []) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const actionsEl = document.getElementById('modal-actions');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    actionsEl.innerHTML = actions.map(a =>
      `<button class="btn ${a.class || 'btn-primary'}" onclick="${a.action}">${a.label}</button>`
    ).join('');

    overlay.classList.remove('hidden');
    Keyboard.push();

    // Focus first input if any
    setTimeout(() => {
      const firstInput = bodyEl.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  // Close modal
  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    Keyboard.pop();
  }

  // Confirm dialog
  function confirm(message, onYes, onNo) {
    showModal('KONFIRMASI', `<p style="text-align:center;padding:8px">${message}</p>`, [
      { label: 'Ya (Y)', class: 'btn-success', action: `Components._confirmYes()` },
      { label: 'Tidak (N)', class: 'btn-danger', action: `Components._confirmNo()` },
    ]);

    Components._confirmYes = () => { closeModal(); if (onYes) onYes(); };
    Components._confirmNo = () => { closeModal(); if (onNo) onNo(); };

    Keyboard.bind({
      'y': () => { closeModal(); if (onYes) onYes(); },
      'Y': () => { closeModal(); if (onYes) onYes(); },
      'n': () => { closeModal(); if (onNo) onNo(); },
      'N': () => { closeModal(); if (onNo) onNo(); },
      'Escape': () => { closeModal(); if (onNo) onNo(); },
      'Enter': () => { closeModal(); if (onYes) onYes(); },
    });
  }

  // Input dialog
  function prompt(title, fields, onSubmit) {
    const fieldsHtml = fields.map((f, i) => `
      <div class="form-group">
        <label class="form-label">${f.label}</label>
        <input class="form-input ${f.inputClass || ''}"
               id="prompt-field-${i}"
               type="${f.type || 'text'}"
               value="${f.value || ''}"
               placeholder="${f.placeholder || ''}"
               ${f.required ? 'required' : ''}
               ${f.autofocus || i === 0 ? 'autofocus' : ''}>
      </div>
    `).join('');

    showModal(title, fieldsHtml, [
      { label: 'OK (Enter)', class: 'btn-success', action: `Components._promptSubmit()` },
      { label: 'Batal (Esc)', class: 'btn-danger', action: `Components.closeModal()` },
    ]);

    Components._promptSubmit = () => {
      const values = {};
      fields.forEach((f, i) => {
        const el = document.getElementById(`prompt-field-${i}`);
        values[f.name] = f.type === 'number' ? parseFloat(el.value) || 0 : el.value;
      });
      closeModal();
      if (onSubmit) onSubmit(values);
    };

    // Handle Enter in inputs
    fields.forEach((f, i) => {
      setTimeout(() => {
        const el = document.getElementById(`prompt-field-${i}`);
        if (el) {
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              Components._promptSubmit();
            }
          });
        }
      }, 100);
    });

    Keyboard.add('Escape', () => closeModal());
  }

  // Build receipt text (for print)
  function buildReceipt(transaction, items, companyName) {
    const w = 40; // receipt width in chars
    const line = '─'.repeat(w);
    const dline = '═'.repeat(w);
    const center = (text) => {
      const pad = Math.max(0, Math.floor((w - text.length) / 2));
      return ' '.repeat(pad) + text;
    };
    const row = (left, right) => {
      const space = Math.max(1, w - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    let r = '';
    r += center(companyName || 'TOKO') + '\n';
    r += line + '\n';
    r += row('No:', transaction.receipt_no) + '\n';
    r += row('Tanggal:', Helpers.formatDateTime(transaction.created_at)) + '\n';
    r += row('Kasir:', transaction.user_name || '-') + '\n';
    r += line + '\n';

    items.forEach(item => {
      r += `${item.product_name}\n`;
      r += row(
        `  ${Helpers.formatQty(item.qty)} ${item.unit} x ${Helpers.formatRupiah(item.unit_price)}`,
        Helpers.formatRupiah(item.subtotal)
      ) + '\n';
    });

    r += line + '\n';
    r += row('Subtotal:', Helpers.formatRupiah(transaction.subtotal)) + '\n';
    if (transaction.discount > 0) {
      r += row('Diskon:', Helpers.formatRupiah(transaction.discount)) + '\n';
    }
    r += dline + '\n';
    r += row('TOTAL:', Helpers.formatRupiah(transaction.total)) + '\n';
    r += dline + '\n';
    r += row('Bayar:', Helpers.formatRupiah(transaction.paid)) + '\n';
    r += row('Kembali:', Helpers.formatRupiah(transaction.change_amount)) + '\n';
    r += row('Pembayaran:', transaction.payment_type === 'cash' ? 'TUNAI' : 'KREDIT') + '\n';
    if (transaction.customer_name) {
      r += row('Pelanggan:', transaction.customer_name) + '\n';
    }
    r += line + '\n';
    r += center('Terima Kasih') + '\n';

    return r;
  }

  return {
    setFnKeys,
    showModal,
    closeModal,
    confirm,
    prompt,
    buildReceipt,
    _confirmYes: null,
    _confirmNo: null,
    _promptSubmit: null,
  };
})();
