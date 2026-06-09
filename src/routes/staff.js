const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, role, salary, join_date, address, aadhaar } = req.body;
    const result = await pool.query(
      `INSERT INTO staff (name, phone, role, salary, join_date, address, aadhaar, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [name, phone, role, salary, join_date, address, aadhaar]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
