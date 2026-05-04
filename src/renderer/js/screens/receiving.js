/**
 * Goods Receiving Screen (Terima Barang)
 */
const ReceivingScreen = (() => {
  let products = [];
  let items = [];

  async function render() {
    try {
      products = await API.getProducts();
    } catch (err) {
      products = [];
    }

    items = [];

    const html = `
      <div class="screen">
        <div class="screen-title">TERIMA BARANG</div>

        <div class="flex gap-md flex-1 overflow-hidden">
          <!-- Left: Receiving form -->
          <div class="panel flex-1 flex flex-col">
            <div class="panel-title">═ Barang Diterima ═</div>
            <div class="flex gap-md p-md">
              <div class="form-group flex-1">
                <label class="form-label">Supplier</label>
                <input class="form-input" id="recv-supplier" type="text" placeholder="Nama supplier">
              </div>
              <div class="form-group flex-1">
                <label class="form-label">No. Referensi</label>
                <input class="form-input" id="recv-refno" type="text" placeholder="No. faktur/PO">
              </div>
            </div>
            <div class="flex-1 overflow-auto p-md" id="recv-table-wrap">
              ${renderItemsTable()}
            </div>
            <div class="p-md" style="border-top:1px solid var(--border-color)">
              <div class="cart-total-row grand-total">
                <span>TOTAL:</span>
                <span id="recv-total">${Helpers.formatRupiah(0)}</span>
              </div>
            </div>
          </div>

          <!-- Right: Add items -->
          <div class="panel" style="width:350px;display:flex;flex-direction:column">
            <div class="panel-title">═ Cari Produk ═</div>
            <div class="cashier-search">
              <input class="form-input" id="recv-search" type="text"
                     placeholder="Ketik nama/SKU..." autofocus>
            </div>
            <div class="cashier-products flex-1 overflow-auto" id="recv-product-list">
              ${renderProductList('')}
            </div>
          </div>
        </div>
      </div>
    `;

    Helpers.render('app-content', html);
    Components.setFnKeys([
      null, null, null,
      { key: 'F4', label: 'Hapus Item', action: 'ReceivingScreen.removeItem()' },
      null, null, null,
      { key: 'F8', label: 'Simpan', action: 'ReceivingScreen.save()' },
      { key: 'Esc', label: 'Kembali', action: 'ReceivingScreen.goBack()' },
      null,
    ]);

    Keyboard.bind({
      'F4': () => removeItem(),
      'F8': () => save(),
      'Escape': () => goBack(),
    });

    setTimeout(() => {
      const el = document.getElementById('recv-search');
      if (el) {
        el.addEventListener('input', (e) => {
          const list = document.getElementById('recv-product-list');
          if (list) list.innerHTML = renderProductList(e.target.value);
        });
      }
    }, 50);
  }

  function renderItemsTable() {
    if (items.length === 0) {
      return '<div class="text-center text-dim p-lg">Belum ada barang</div>';
    }
    const rows = items.map((item, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>${item.name}</td>
        <td class="text-right">${Helpers.formatQty(item.qty)} ${item.unit}</td>
        <td class="text-right">${Helpers.formatRupiah(item.cost)}</td>
        <td class="text-right text-green">${Helpers.formatRupiah(item.subtotal)}</td>
      </tr>
    `).join('');
    return `
      <table class="data-table">
        <thead><tr>
          <th style="width:35px">#</th><th>Nama Produk</th>
          <th class="text-right" style="width:80px">Qty</th>
          <th class="text-right" style="width:100px">Harga Beli</th>
          <th class="text-right" style="width:110px">Subtotal</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderProductList(search) {
    const q = (search || '').toLowerCase().trim();
    const filtered = q ? products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ) : products;

    return filtered.map(p => `
      <div class="product-item" onclick="ReceivingScreen.addItem(${p.id})">
        <span class="product-name">${p.name}</span>
        <span class="product-stock">${p.unit}</span>
      </div>
    `).join('') || '<div class="text-center text-dim p-md">Tidak ditemukan</div>';
  }

  function addItem(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    Components.prompt(`TERIMA: ${product.name}`, [
      { name: 'qty', label: `Jumlah (${product.unit})`, type: 'number', placeholder: '1', value: '1' },
      { name: 'cost', label: 'Harga Beli per Unit (Rp)', type: 'number', placeholder: String(product.cost), value: String(product.cost) },
    ], (values) => {
      const qty = parseFloat(values.qty) || 0;
      const cost = parseFloat(values.cost) || 0;
      if (qty <= 0) return;

      items.push({
        product_id: product.id,
        name: product.name,
        unit: product.unit,
        qty,
        cost,
        subtotal: qty * cost,
      });

      updateDisplay();
    });
  }

  function removeItem() {
    if (items.length === 0) return;
    items.pop();
    updateDisplay();
  }

  function updateDisplay() {
    const wrap = document.getElementById('recv-table-wrap');
    if (wrap) wrap.innerHTML = renderItemsTable();
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const el = document.getElementById('recv-total');
    if (el) el.textContent = Helpers.formatRupiah(total);
  }

  async function save() {
    if (items.length === 0) {
      Helpers.toast('Tambahkan barang terlebih dahulu', 'warning');
      return;
    }

    const supplier = document.getElementById('recv-supplier').value;
    const reference_no = document.getElementById('recv-refno').value;

    Components.confirm('Simpan penerimaan barang ini?', async () => {
      try {
        await API.createReceiving({
          supplier,
          reference_no,
          items: items.map(i => ({
            product_id: i.product_id,
            qty: i.qty,
            cost: i.cost,
          })),
        });
        Helpers.toast('Penerimaan barang berhasil disimpan', 'success');
        render();
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  function goBack() {
    if (items.length > 0) {
      Components.confirm('Ada item yang belum disimpan. Yakin keluar?', () => Router.navigate('main-menu'));
    } else {
      Router.navigate('main-menu');
    }
  }

  return { render, addItem, removeItem, save, goBack };
})();
