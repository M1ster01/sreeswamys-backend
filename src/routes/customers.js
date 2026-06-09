const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, address, aadhaar, pan } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (name, phone, address, aadhaar, pan, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [name, phone, address, aadhaar, pan]
    );
    global.broadcast({ type: 'customer_added', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
