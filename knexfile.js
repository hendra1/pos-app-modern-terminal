require('dotenv').config();
const path = require('path');

const dbClient = process.env.DB_CLIENT || 'sqlite3';

const connectionMap = {
  sqlite3: {
    filename: path.resolve(__dirname, process.env.DB_FILE || './data/pos.db'),
  },
  mysql2: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_db',
  },
  pg: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pos_db',
  },
};

module.exports = {
  client: dbClient === 'sqlite3' ? 'better-sqlite3' : dbClient,
  connection: connectionMap[dbClient] || connectionMap.sqlite3,
  useNullAsDefault: true,
  pool: {
    min: 0,
    max: dbClient === 'sqlite3' ? 1 : 10,
    afterCreate: (conn, cb) => {
      if (dbClient === 'sqlite3') {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
      }
      cb(null, conn);
    },
  },
  migrations: {
    directory: path.resolve(__dirname, 'src/database/migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'src/database/seeds'),
  },
};
