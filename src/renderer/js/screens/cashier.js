/**
 * Cashier Screen — the main POS terminal
 * Keyboard-driven: type to search, Enter to add, F-keys for actions
 */
const CashierScreen = (() => {
  let cart = [];
  let products = [];
  let filteredProducts = [];
  let selectedProductIndex = 0;
  let currentShift = null;

  async function render() {
    // Check for open shift
    try {
      currentShift = await API.getCurrentShift();
    } catch {
      currentShift = null;
    }

    if (!currentShift) {
      Helpers.render('app-content', `
        <div class="screen flex-center" style="flex:1">
          <div class="panel panel-double" style="padding:var(--gap-xl);text-align:center">
            <p class="text-yellow text-xl bold">Shift belum dibuka!</p>
            <p class="text-dim mt-md">Buka shift terlebih dahulu sebelum melakukan transaksi.</p>
            <p class="mt-lg"><span class="text-cyan">F2</span> = Buka Shift &nbsp; <span class="text-cyan">Esc</span> = Kembali</p>
          </div>
        </div>
      `);
      Components.setFnKeys([
        null,
        { key: 'F2', label: 'Buka Shift', action: "Router.navigate('shift')" },
        null, null, null, null, null, null,
        { key: 'Esc', label: 'Kembali', action: "Router.navigate('main-menu')" },
        null,
      ]);
      Keyboard.bind({
        'F2': () => Router.navigate('shift'),
        'Escape': () => Router.navigate('main-menu'),
      });
      return;
    }

    App.setShift(currentShift);

    // Load products
    try {
      products = await API.getProducts();
      filteredProducts = [...products];
    } catch (err) {
      Helpers.toast('Gagal memuat produk: ' + err.message, 'error');
      products = [];
      filteredProducts = [];
    }

    cart = [];
    selectedProductIndex = 0;
    renderCashierUI();
    setupKeyboard();
  }

  function renderCashierUI() {
    const html = `
      <div class="cashier-layout">
        <!-- Left: Cart -->
        <div class="cashier-cart panel">
          <div class="panel-title">═ Keranjang ═</div>
          <div class="cart-table-wrap" id="cart-table-wrap" style="margin-top:8px">
            ${renderCartTable()}
          </div>
          <div class="cart-total" id="cart-total">
            ${renderCartTotal()}
          </div>
        </div>

        <!-- Right: Product Search -->
        <div class="panel flex flex-col">
          <div class="panel-title">═ Produk ═</div>
          <div class="cashier-search">
            <input class="form-input" id="product-search" type="text"
                   placeholder="Ketik nama/SKU produk..." autofocus>
          </div>
          <div class="cashier-products" id="product-list">
            ${renderProductList()}
          </div>
        </div>
      </div>
    `;

    Helpers.render('app-content', html);

    Components.setFnKeys([
      null,
      { key: 'F2', label: 'Bayar', action: 'CashierScreen.startPayment()' },
      { key: 'F3', label: 'Kredit', action: 'CashierScreen.startCredit()' },
      { key: 'F4', label: 'Hapus Item', action: 'CashierScreen.removeItem()' },
      { key: 'F5', label: 'Ubah Qty', action: 'CashierScreen.changeQty()' },
      null,
      null,
      { key: 'F8', label: 'Batal Semua', action: 'CashierScreen.clearCart()' },
      { key: 'Esc', label: 'Kembali', action: 'CashierScreen.goBack()' },
      null,
    ]);

    // Focus search
    setTimeout(() => {
      const el = document.getElementById('product-search');
      if (el) {
        el.focus();
        el.addEventListener('input', onSearchInput);
        el.addEventListener('keydown', onSearchKeydown);
      }
    }, 50);
  }

  function renderCartTable() {
    if (cart.length === 0) {
      return '<div class="text-center text-dim p-lg">Keranjang kosong</div>';
    }
    let rows = cart.map((item, i) => `
      <tr class="${i === cart.length - 1 ? 'selected' : ''}" onclick="CashierScreen.selectCartItem(${i})">
        <td class="text-center">${i + 1}</td>
        <td>${item.name}</td>
        <td class="text-right">${Helpers.formatQty(item.qty)} ${item.unit}</td>
        <td class="text-right">${Helpers.formatRupiah(item.price)}</td>
        <td class="text-right text-green">${Helpers.formatRupiah(item.subtotal)}</td>
      </tr>
    `).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:35px">#</th>
            <th>Nama Produk</th>
            <th class="text-right" style="width:80px">Qty</th>
            <th class="text-right" style="width:100px">Harga</th>
            <th class="text-right" style="width:110px">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderCartTotal() {
    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);

    return `
      <div class="cart-total-row">
        <span class="text-dim">${cart.length} item (${Helpers.formatQty(itemCount)} unit)</span>
      </div>
      <div class="cart-total-row grand-total">
        <span>TOTAL:</span>
        <span>${Helpers.formatRupiah(subtotal)}</span>
      </div>
    `;
  }

  function renderProductList() {
    if (filteredProducts.length === 0) {
      return '<div class="text-center text-dim p-lg">Produk tidak ditemukan</div>';
    }
    return filteredProducts.map((p, i) => `
      <div class="product-item ${i === selectedProductIndex ? 'selected' : ''}"
           data-index="${i}"
           onclick="CashierScreen.addProduct(${p.id})">
        <span class="product-name">${p.name}</span>
        <span class="product-price">${Helpers.formatRupiah(p.price)}</span>
        <span class="product-stock">${Helpers.formatQty(p.stock_qty)} ${p.unit}</span>
      </div>
    `).join('');
  }

  function updateCartDisplay() {
    const wrap = document.getElementById('cart-table-wrap');
    if (wrap) wrap.innerHTML = renderCartTable();
    const total = document.getElementById('cart-total');
    if (total) total.innerHTML = renderCartTotal();

    // Scroll to bottom
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }

  function updateProductList() {
    const el = document.getElementById('product-list');
    if (el) el.innerHTML = renderProductList();
  }

  function onSearchInput(e) {
    const search = e.target.value.toLowerCase().trim();
    if (!search) {
      filteredProducts = [...products];
    } else {
      filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        (p.barcode && p.barcode.includes(search))
      );
    }
    selectedProductIndex = 0;
    updateProductList();
  }

  function onSearchKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedProductIndex = Math.min(filteredProducts.length - 1, selectedProductIndex + 1);
      updateProductList();
      scrollProductIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedProductIndex = Math.max(0, selectedProductIndex - 1);
      updateProductList();
      scrollProductIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[selectedProductIndex]) {
        addProduct(filteredProducts[selectedProductIndex].id);
      }
    }
  }

  function scrollProductIntoView() {
    const list = document.getElementById('product-list');
    const item = list && list.children[selectedProductIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

  function setupKeyboard() {
    Keyboard.bind({
      'F2': () => startPayment(),
      'F3': () => startCredit(),
      'F4': () => removeItem(),
      'F5': () => changeQty(),
      'F8': () => clearCart(),
      'Escape': () => goBack(),
    });
  }

  function addProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if already in cart
    const existing = cart.find(c => c.product_id === productId);
    if (existing) {
      if (existing.qty + 1 > product.stock_qty) {
        Helpers.toast('Stok tidak cukup!', 'warning');
        return;
      }
      existing.qty += 1;
      existing.subtotal = existing.qty * existing.price;
    } else {
      if (product.stock_qty <= 0) {
        Helpers.toast('Stok habis!', 'warning');
        return;
      }

      // If product allows decimal qty, prompt for qty
      if (product.allow_decimal_qty) {
        Components.prompt('MASUKKAN JUMLAH', [
          { name: 'qty', label: `Jumlah (${product.unit})`, type: 'number', placeholder: '0.5', value: '1' },
        ], (values) => {
          const qty = parseFloat(values.qty) || 1;
          if (qty <= 0) return;
          if (qty > product.stock_qty) {
            Helpers.toast('Stok tidak cukup!', 'warning');
            return;
          }
          cart.push({
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            price: product.price,
            qty: qty,
            subtotal: qty * product.price,
          });
          updateCartDisplay();
          Helpers.toast(`+ ${product.name}`, 'info', 1500);
          focusSearch();
        });
        return;
      }

      cart.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        price: product.price,
        qty: 1,
        subtotal: product.price,
      });
    }

    updateCartDisplay();
    Helpers.toast(`+ ${product.name}`, 'info', 1500);
    focusSearch();
  }

  function removeItem() {
    if (cart.length === 0) return;
    const lastItem = cart[cart.length - 1];
    Components.confirm(`Hapus "${lastItem.name}" dari keranjang?`, () => {
      cart.pop();
      updateCartDisplay();
      focusSearch();
    }, () => focusSearch());
  }

  function changeQty() {
    if (cart.length === 0) return;
    const lastItem = cart[cart.length - 1];
    Components.prompt('UBAH JUMLAH', [
      { name: 'qty', label: `Qty untuk "${lastItem.name}" (${lastItem.unit})`, type: 'number', value: String(lastItem.qty) },
    ], (values) => {
      const qty = parseFloat(values.qty);
      if (qty <= 0) {
        cart.pop();
      } else {
        lastItem.qty = qty;
        lastItem.subtotal = qty * lastItem.price;
      }
      updateCartDisplay();
      focusSearch();
    });
  }

  function clearCart() {
    if (cart.length === 0) return;
    Components.confirm('Batalkan SEMUA item di keranjang?', () => {
      cart = [];
      updateCartDisplay();
      Helpers.toast('Keranjang dikosongkan', 'warning');
      focusSearch();
    }, () => focusSearch());
  }

  function startPayment() {
    if (cart.length === 0) {
      Helpers.toast('Keranjang kosong!', 'warning');
      return;
    }
    const total = cart.reduce((s, i) => s + i.subtotal, 0);
    Components.prompt('PEMBAYARAN TUNAI', [
      { name: 'paid', label: `Total: ${Helpers.formatRupiah(total)} — Jumlah Bayar (Rp)`, type: 'number', placeholder: String(total), value: String(total), inputClass: 'form-input-lg' },
    ], async (values) => {
      await processPayment('cash', values.paid || total, null);
    });
  }

  function startCredit() {
    if (cart.length === 0) {
      Helpers.toast('Keranjang kosong!', 'warning');
      return;
    }
    const total = cart.reduce((s, i) => s + i.subtotal, 0);
    Components.prompt('PENJUALAN KREDIT (HUTANG)', [
      { name: 'customer_name', label: 'Nama Pelanggan', type: 'text', placeholder: 'Masukkan nama pelanggan', required: true },
    ], async (values) => {
      if (!values.customer_name) {
        Helpers.toast('Nama pelanggan wajib diisi untuk transaksi kredit!', 'warning');
        return;
      }
      await processPayment('credit', total, values.customer_name);
    });
  }

  async function processPayment(paymentType, paid, customerName) {
    const total = cart.reduce((s, i) => s + i.subtotal, 0);

    try {
      const result = await API.createTransaction({
        shift_id: currentShift.id,
        payment_type: paymentType,
        customer_name: customerName,
        paid: paid,
        items: cart.map(c => ({
          product_id: c.product_id,
          qty: c.qty,
          unit_price: c.price,
        })),
      });

      const tx = result.transaction;
      const change = paymentType === 'cash' ? Math.max(0, paid - total) : 0;

      // Show receipt
      const receiptText = Components.buildReceipt(
        { ...tx, user_name: App.getUser().name },
        result.items,
        (window.posConfig && window.posConfig.companyName) || 'Toko Demo'
      );

      Components.showModal(
        paymentType === 'cash' ? 'TRANSAKSI BERHASIL — TUNAI' : 'TRANSAKSI BERHASIL — KREDIT',
        `<pre style="font-size:12px;line-height:1.4;color:var(--text-bright);overflow:auto">${receiptText}</pre>
         ${change > 0 ? `<div class="text-center text-xl bold text-yellow mt-md">Kembalian: ${Helpers.formatRupiah(change)}</div>` : ''}`,
        [
          { label: 'OK / Transaksi Baru (Enter)', class: 'btn-success', action: 'CashierScreen.receiptDone()' },
        ]
      );

      Keyboard.bind({
        'Enter': () => receiptDone(),
        'Escape': () => receiptDone(),
      });

    } catch (err) {
      Helpers.toast('Gagal: ' + err.message, 'error');
    }
  }

  function receiptDone() {
    Components.closeModal();
    cart = [];
    // Reload products (stock updated)
    API.getProducts().then(p => {
      products = p;
      filteredProducts = [...products];
      renderCashierUI();
      setupKeyboard();
    });
  }

  function focusSearch() {
    setTimeout(() => {
      const el = document.getElementById('product-search');
      if (el) { el.value = ''; el.focus(); }
      filteredProducts = [...products];
      selectedProductIndex = 0;
      updateProductList();
    }, 50);
  }

  function selectCartItem(index) {
    // Could highlight for editing
  }

  function goBack() {
    if (cart.length > 0) {
      Components.confirm('Ada item di keranjang. Yakin keluar?', () => {
        Router.navigate('main-menu');
      });
    } else {
      Router.navigate('main-menu');
    }
  }

  return {
    render, addProduct, removeItem, changeQty, clearCart,
    startPayment, startCredit, receiptDone, selectCartItem, goBack,
  };
})();
