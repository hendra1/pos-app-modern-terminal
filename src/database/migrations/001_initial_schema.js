/**
 * Initial database schema for POS application
 */
exports.up = function (knex) {
  return knex.schema
    // ── Users ──
    .createTable('users', (t) => {
      t.increments('id').primary();
      t.string('username', 50).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.string('name', 100).notNullable();
      t.enu('role', ['admin', 'kasir', 'supervisor']).notNullable().defaultTo('kasir');
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // ── Categories ──
    .createTable('categories', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // ── Products ──
    .createTable('products', (t) => {
      t.increments('id').primary();
      t.string('sku', 50).notNullable().unique();
      t.string('barcode', 50).nullable();
      t.string('name', 200).notNullable();
      t.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      t.decimal('price', 15, 2).notNullable().defaultTo(0);
      t.decimal('cost', 15, 2).notNullable().defaultTo(0);
      t.string('unit', 20).notNullable().defaultTo('pcs');
      t.decimal('stock_qty', 15, 3).notNullable().defaultTo(0);
      t.decimal('min_stock', 15, 3).notNullable().defaultTo(0);
      t.boolean('allow_decimal_qty').notNullable().defaultTo(false);
      t.boolean('active').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })

    // ── Shifts ──
    .createTable('shifts', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable().references('id').inTable('users');
      t.integer('shift_number').notNullable(); // 1 or 2
      t.decimal('opening_cash', 15, 2).notNullable().defaultTo(0);
      t.decimal('closing_cash', 15, 2).nullable();
      t.decimal('total_sales_cash', 15, 2).notNullable().defaultTo(0);
      t.decimal('total_sales_credit', 15, 2).notNullable().defaultTo(0);
      t.integer('total_transactions').notNullable().defaultTo(0);
      t.enu('status', ['open', 'closed']).notNullable().defaultTo('open');
      t.timestamp('opened_at').defaultTo(knex.fn.now());
      t.timestamp('closed_at').nullable();
    })

    // ── Transactions ──
    .createTable('transactions', (t) => {
      t.increments('id').primary();
      t.integer('shift_id').unsigned().notNullable().references('id').inTable('shifts');
      t.integer('user_id').unsigned().notNullable().references('id').inTable('users');
      t.string('receipt_no', 50).notNullable();
      t.enu('payment_type', ['cash', 'credit']).notNullable().defaultTo('cash');
      t.string('customer_name', 200).nullable(); // for credit transactions
      t.decimal('subtotal', 15, 2).notNullable().defaultTo(0);
      t.decimal('discount', 15, 2).notNullable().defaultTo(0);
      t.decimal('total', 15, 2).notNullable().defaultTo(0);
      t.decimal('paid', 15, 2).notNullable().defaultTo(0);
      t.decimal('change_amount', 15, 2).notNullable().defaultTo(0);
      t.enu('status', ['completed', 'voided']).notNullable().defaultTo('completed');
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // ── Transaction Items ──
    .createTable('transaction_items', (t) => {
      t.increments('id').primary();
      t.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products');
      t.string('product_name', 200).notNullable();
      t.string('product_sku', 50).notNullable();
      t.decimal('qty', 15, 3).notNullable();
      t.string('unit', 20).notNullable();
      t.decimal('unit_price', 15, 2).notNullable();
      t.decimal('discount', 15, 2).notNullable().defaultTo(0);
      t.decimal('subtotal', 15, 2).notNullable();
    })

    // ── Receivings (Terima Barang) ──
    .createTable('receivings', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable().references('id').inTable('users');
      t.string('supplier', 200).nullable();
      t.string('reference_no', 100).nullable();
      t.text('notes').nullable();
      t.decimal('total', 15, 2).notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // ── Receiving Items ──
    .createTable('receiving_items', (t) => {
      t.increments('id').primary();
      t.integer('receiving_id').unsigned().notNullable().references('id').inTable('receivings').onDelete('CASCADE');
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products');
      t.decimal('qty', 15, 3).notNullable();
      t.decimal('cost', 15, 2).notNullable();
      t.decimal('subtotal', 15, 2).notNullable();
    })

    // ── Price History ──
    .createTable('price_history', (t) => {
      t.increments('id').primary();
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.decimal('old_price', 15, 2).notNullable();
      t.decimal('new_price', 15, 2).notNullable();
      t.integer('changed_by').unsigned().notNullable().references('id').inTable('users');
      t.timestamp('changed_at').defaultTo(knex.fn.now());
    })

    // ── Credit Payments ──
    .createTable('credit_payments', (t) => {
      t.increments('id').primary();
      t.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions');
      t.decimal('amount', 15, 2).notNullable();
      t.text('notes').nullable();
      t.integer('received_by').unsigned().notNullable().references('id').inTable('users');
      t.timestamp('paid_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('credit_payments')
    .dropTableIfExists('price_history')
    .dropTableIfExists('receiving_items')
    .dropTableIfExists('receivings')
    .dropTableIfExists('transaction_items')
    .dropTableIfExists('transactions')
    .dropTableIfExists('shifts')
    .dropTableIfExists('products')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};
