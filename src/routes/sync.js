const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/pull', async (req, res) => {
  try {
    const [tractors, spares, customers, sales, jobcards, staff, roles] = await Promise.all([
      pool.query('SELECT * FROM tractors'),
      pool.query('SELECT * FROM spares'),
      pool.query('SELECT * FROM customers'),
      pool.query('SELECT * FROM sales'),
      pool.query('SELECT * FROM job_cards'),
      pool.query('SELECT * FROM staff'),
      pool.query('SELECT * FROM roles'),
    ]);
    res.json({
      tractors: tractors.rows,
      spares: spares.rows,
      customers: customers.rows,
      sales: sales.rows,
      jobcards: jobcards.rows,
      staff: staff.rows,
      roles: roles.rows,
      sync_time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/push', async (req, res) => {
  try {
    const { changes } = req.body;
    for (const change of changes || []) {
      const { table, action, data } = change;
      if (action === 'insert') {
        const cols = Object.keys(data);
        const vals = Object.values(data);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
        await pool.query(
          `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          vals
        );
      } else if (action === 'update') {
        const cols = Object.keys(data).filter(k => k !== 'id');
        const vals = cols.map(k => data[k]);
        const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(',');
        await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = $${cols.length + 1}`, [...vals, data.id]);
      }
    }
    global.broadcast({ type: 'sync_completed', count: changes?.length || 0 });
    res.json({ success: true, applied: changes?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
