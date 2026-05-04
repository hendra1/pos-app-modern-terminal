# POS Terminal Desktop App

A fast, keyboard-first, DOS-style Point of Sale (POS) desktop application built with **Electron**, **Node.js**, **Express**, and **Knex.js**. Designed for high efficiency and minimal mouse usage, this application brings the speed of legacy terminal interfaces to modern hardware with a robust relational database backend.

## ✨ Features

- **Keyboard-First DOS-Style UI**: Navigate entirely using F-keys, numbers, and arrows. High-contrast terminal aesthetics.
- **Embedded API Server**: Runs its own Express.js API server, ready for multi-device setups (Server/Client architecture).
- **Configurable Database**: Defaults to SQLite for zero-configuration local usage, but fully supports MySQL and PostgreSQL via environment variables for centralized data.
- **Role-Based Access Control**: Different access levels for Admin, Supervisor, and Kasir (Cashier).
- **Shift Management**: Track opening/closing cash drawers and reconcile expected vs. actual cash.
- **Transactions & Cart**: Quick product lookup, decimal quantity support, cash/credit payments, and receipt generation.
- **Inventory & Receiving**: Manage product pricing, stock levels, and incoming goods from suppliers.
- **Comprehensive Reporting**: View shift summaries, daily sales aggregates, and outstanding receivables (piutang).

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, Custom DOS-style CSS
- **Backend**: Express.js, JSON Web Tokens (JWT) for authentication
- **Desktop Framework**: Electron
- **Database**: Knex.js query builder, `better-sqlite3` (default driver)
- **Security**: `bcryptjs` for password hashing

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd POS-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Rebuild native modules** (required for `better-sqlite3` in Electron):
   ```bash
   npx @electron/rebuild
   ```

4. **Environment Setup**:
   Copy `.env.example` to `.env` (or create one) and configure it. By default, it runs on SQLite.
   ```env
   # Database Configuration (sqlite, mysql2, pg)
   DB_CLIENT=sqlite
   DB_FILENAME=./data/pos.sqlite
   
   # Server Configuration
   PORT=3351
   JWT_SECRET=supersecretkey_change_in_production
   
   # App Configuration
   COMPANY_NAME=Toko Demo
   ```

5. **Database Initialization**:
   Run the migrations and seed the demo data.
   ```bash
   npm run db:reset
   ```

### Running the Application

To start the application in development mode (with DevTools):
```bash
npm run dev
```

To start the application in standard mode:
```bash
npm start
```

## 👥 Demo Accounts

The database comes pre-seeded with the following demo accounts:

| Role       | Username | Password | Access Level                                         |
|------------|----------|----------|------------------------------------------------------|
| Admin      | `admin`  | admin123 | Full access + User Management                        |
| Supervisor | `super1` | super123 | POS, Shifts, Inventory, Receiving, Reports           |
| Kasir      | `kasir1` | kasir123 | POS, Shifts                                          |
| Kasir      | `kasir2` | kasir123 | POS, Shifts                                          |

## ⌨️ Keyboard Navigation

- **Number Keys (1-9)**: Quick selection in menus.
- **F-Keys (F1-F12)**: Context-sensitive actions indicated at the bottom of the screen.
- **Arrow Keys**: Navigate lists and tables.
- **Enter**: Confirm selection, add item, or submit form.
- **Escape**: Go back, cancel, or close modal.

## 📁 Project Structure

```
POS-app/
├── main.js                  # Electron main process
├── preload.js               # IPC bridge
├── knexfile.js              # Database configuration
├── src/
│   ├── database/            # Migrations, seeds, and db instance
│   ├── server/              # Express API (Routes, Middleware)
│   └── renderer/            # Frontend (HTML, CSS, JS, Screens)
├── data/                    # Local SQLite database storage
└── assets/                  # Images and static assets
```
