const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'sreeswamys',
  password: process.env.DB_PASSWORD || 'ChangeThisPassword123!',
  database: process.env.DB_NAME || 'sreeswamys_db',
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('DB Pool Error:', err);
});

pool.waitForDB = async function (retries = 30, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Connected to PostgreSQL');
      return;
    } catch (err) {
      console.log(`Waiting for DB (${i}/${retries})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to database');
};

pool.runSchema = async function () {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
    const tablesExist = result.rows[0].exists;
    if (tablesExist) {
      console.log('Database schema already exists');
      client.release();
      return;
    }
    console.log('Initializing database schema...');
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (e) {
        console.error('Schema statement failed (skipping):', e.message.substring(0, 100));
      }
    }
    console.log('Database schema initialized');
    client.release();
  } catch (err) {
    console.error('Schema init error:', err.message);
    client.release();
  }
};

module.exports = pool;
