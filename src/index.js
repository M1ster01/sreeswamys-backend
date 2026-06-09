require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const pool = require('./db/pool');

const authRoutes = require('./routes/auth');
const tractorRoutes = require('./routes/tractors');
const spareRoutes = require('./routes/spares');
const customerRoutes = require('./routes/customers');
const salesRoutes = require('./routes/sales');
const jobCardRoutes = require('./routes/jobcards');
const staffRoutes = require('./routes/staff');
const salaryRoutes = require('./routes/salary');
const roleRoutes = require('./routes/roles');
const reportRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/sreeswamys', express.static(path.join(__dirname, '../frontend')));

wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  ws.on('message', (msg) => console.log('WS:', msg.toString()));
  ws.send(JSON.stringify({ type: 'connected', message: 'Sree Swamys server connected' }));
});

global.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.use('/api/auth', authRoutes);
app.use('/api/tractors', tractorRoutes);
app.use('/api/spares', spareRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/jobcards', jobCardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (req, res) => {
  res.json({ app: "Sree Swamys Tractors", status: 'running', version: '1.0.0' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
    res.json({ status: 'ok', users_table: result.rows[0].exists, timestamp: new Date().toISOString() });
  } catch (e) {
    res.json({ status: 'degraded', error: e.message, timestamp: new Date().toISOString() });
  }
});

app.get('/sreeswamys*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await pool.waitForDB();
    await pool.runSchema();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Sree Swamys Tractors Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
