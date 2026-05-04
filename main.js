const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./src/database/db');
const { createServer } = require('./src/server/index');

let mainWindow;
let server;

const API_PORT = parseInt(process.env.API_PORT || '3351');

async function initDatabase() {
  // Ensure data directory exists
  const dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Run migrations
  console.log('Running database migrations...');
  await db.migrate.latest();
  console.log('Migrations complete.');

  // Check if we need to seed
  const users = await db('users').count('* as count').first();
  if (users.count === 0) {
    console.log('Seeding demo data...');
    await db.seed.run();
    console.log('Seeding complete.');
  }
}

async function startServer() {
  const expressApp = createServer(db);
  return new Promise((resolve) => {
    server = expressApp.listen(API_PORT, '0.0.0.0', () => {
      console.log(`API server running on port ${API_PORT}`);
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: process.env.APP_NAME || 'POS Terminal',
    backgroundColor: '#0a0a2e',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Start maximized for POS use
    // show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  // Maximize on show
  mainWindow.maximize();

  // Prevent accidental close
  mainWindow.on('close', (e) => {
    // Could add confirmation dialog here
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    await initDatabase();
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (server) server.close();
  db.destroy();
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
