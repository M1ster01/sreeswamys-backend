const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salary ORDER BY month DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { staff_id, month, basic, allowances, deductions, advance, bonus, net_salary, paid_on } = req.body;
    const result = await pool.query(
      `INSERT INTO salary (staff_id, month, basic, allowances, deductions, advance, bonus, net_salary, paid_on, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [staff_id, month, basic, allowances, deductions, advance, bonus, net_salary, paid_on]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
