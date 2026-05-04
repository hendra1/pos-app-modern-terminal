/**
 * Products Management Screen
 */
const ProductsScreen = (() => {
  let products = [];
  let selectedIndex = 0;

  async function render() {
    try {
      products = await API.getProducts();
    } catch (err) {
      Helpers.toast('Gagal memuat produk: ' + err.message, 'error');
      products = [];
    }

    const html = `
      <div class="screen">
        <div class="screen-title">PRODUK & HARGA</div>
        <div class="flex gap-md mb-md">
          <input class="form-input" id="product-mgmt-search" type="text"
                 placeholder="Cari produk... (ketik untuk filter)" style="max-width:400px" autofocus>
          <span class="text-dim" style="align-self:center">${products.length} produk</span>
        </div>
        <div class="panel flex-1 overflow-auto" id="products-table-wrap">
          ${renderTable()}
        </div>
      </div>
    `;

    Helpers.render('app-content', html);
    Components.setFnKeys([
      null,
      { key: 'F2', label: 'Tambah', action: 'ProductsScreen.addProduct()' },
      { key: 'F3', label: 'Ubah Harga', action: 'ProductsScreen.changePrice()' },
      { key: 'F4', label: 'Edit', action: 'ProductsScreen.editProduct()' },
      null, null, null, null,
      { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" },
      null,
    ]);

    Keyboard.bind({
      'F2': () => addProduct(),
      'F3': () => changePrice(),
      'F4': () => editProduct(),
      'ArrowUp': () => { selectedIndex = Math.max(0, selectedIndex - 1); highlightRow(); },
      'ArrowDown': () => { selectedIndex = Math.min(products.length - 1, selectedIndex + 1); highlightRow(); },
      'Escape': () => Router.navigate('main-menu'),
    });

    // Search
    setTimeout(() => {
      const el = document.getElementById('product-mgmt-search');
      if (el) el.addEventListener('input', onSearch);
    }, 50);
  }

  function renderTable() {
    if (products.length === 0) {
      return '<div class="text-center text-dim p-lg">Tidak ada produk</div>';
    }

    const rows = products.map((p, i) => `
      <tr class="${i === selectedIndex ? 'selected' : ''}" onclick="ProductsScreen.selectRow(${i})">
        <td>${p.sku}</td>
        <td>${p.name}</td>
        <td>${p.category_name || '-'}</td>
        <td class="text-right text-green">${Helpers.formatRupiah(p.price)}</td>
        <td class="text-right">${Helpers.formatRupiah(p.cost)}</td>
        <td class="text-right">${Helpers.formatQty(p.stock_qty)}</td>
        <td class="text-center">${p.unit}</td>
      </tr>
    `).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:80px">SKU</th>
            <th>Nama Produk</th>
            <th style="width:100px">Kategori</th>
            <th class="text-right" style="width:110px">Harga</th>
            <th class="text-right" style="width:100px">Modal</th>
            <th class="text-right" style="width:70px">Stok</th>
            <th class="text-center" style="width:50px">Unit</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function highlightRow() {
    const rows = document.querySelectorAll('#products-table-wrap tbody tr');
    rows.forEach((r, i) => r.classList.toggle('selected', i === selectedIndex));
    if (rows[selectedIndex]) rows[selectedIndex].scrollIntoView({ block: 'nearest' });
  }

  function selectRow(i) {
    selectedIndex = i;
    highlightRow();
  }

  function onSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    const allProducts = products; // use cached full list
    const wrap = document.getElementById('products-table-wrap');
    if (!wrap) return;

    const filtered = q ? allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ) : allProducts;

    const rows = filtered.map((p, i) => `
      <tr class="${i === 0 ? 'selected' : ''}" onclick="ProductsScreen.selectRow(${i})">
        <td>${p.sku}</td>
        <td>${p.name}</td>
        <td>${p.category_name || '-'}</td>
        <td class="text-right text-green">${Helpers.formatRupiah(p.price)}</td>
        <td class="text-right">${Helpers.formatRupiah(p.cost)}</td>
        <td class="text-right">${Helpers.formatQty(p.stock_qty)}</td>
        <td class="text-center">${p.unit}</td>
      </tr>
    `).join('');

    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th style="width:80px">SKU</th><th>Nama Produk</th><th style="width:100px">Kategori</th>
          <th class="text-right" style="width:110px">Harga</th><th class="text-right" style="width:100px">Modal</th>
          <th class="text-right" style="width:70px">Stok</th><th class="text-center" style="width:50px">Unit</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    selectedIndex = 0;
  }

  function changePrice() {
    const product = products[selectedIndex];
    if (!product) return;

    Components.prompt('UBAH HARGA', [
      { name: 'price', label: `Harga baru untuk "${product.name}" (sekarang: ${Helpers.formatRupiah(product.price)})`, type: 'number', value: String(product.price), inputClass: 'form-input-lg' },
    ], async (values) => {
      try {
        await API.updateProduct(product.id, { price: values.price });
        Helpers.toast(`Harga ${product.name} diubah ke ${Helpers.formatRupiah(values.price)}`, 'success');
        render();
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  function addProduct() {
    Components.prompt('TAMBAH PRODUK BARU', [
      { name: 'sku', label: 'SKU / Kode', type: 'text', placeholder: 'ABC001', required: true },
      { name: 'name', label: 'Nama Produk', type: 'text', placeholder: 'Nama produk', required: true },
      { name: 'price', label: 'Harga Jual (Rp)', type: 'number', placeholder: '0' },
      { name: 'cost', label: 'Harga Modal (Rp)', type: 'number', placeholder: '0' },
      { name: 'unit', label: 'Satuan (pcs/kg/btl)', type: 'text', value: 'pcs' },
      { name: 'stock_qty', label: 'Stok Awal', type: 'number', value: '0' },
    ], async (values) => {
      try {
        await API.createProduct(values);
        Helpers.toast('Produk berhasil ditambahkan', 'success');
        render();
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  function editProduct() {
    const product = products[selectedIndex];
    if (!product) return;

    Components.prompt(`EDIT: ${product.name}`, [
      { name: 'name', label: 'Nama Produk', type: 'text', value: product.name },
      { name: 'price', label: 'Harga Jual (Rp)', type: 'number', value: String(product.price) },
      { name: 'cost', label: 'Harga Modal (Rp)', type: 'number', value: String(product.cost) },
      { name: 'unit', label: 'Satuan', type: 'text', value: product.unit },
    ], async (values) => {
      try {
        await API.updateProduct(product.id, values);
        Helpers.toast('Produk berhasil diupdate', 'success');
        render();
      } catch (err) {
        Helpers.toast(err.message, 'error');
      }
    });
  }

  return { render, selectRow, addProduct, changePrice, editProduct };
})();
