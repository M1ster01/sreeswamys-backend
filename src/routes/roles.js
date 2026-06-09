const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const result = await pool.query(
      'INSERT INTO roles (name, permissions, created_at) VALUES ($1,$2,NOW()) RETURNING *',
      [name, JSON.stringify(permissions)]
    );
    global.broadcast({ type: 'role_added', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
