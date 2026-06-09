const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spares ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, part_number, brand, category, hsn_code, purchase_price,
            selling_price, stock_qty, reorder_level, supplier, compatible_models, location } = req.body;
    const result = await pool.query(
      `INSERT INTO spares (name, part_number, brand, category, hsn_code, purchase_price,
        selling_price, stock_qty, reorder_level, supplier, compatible_models, location, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING *`,
      [name, part_number, brand, category, hsn_code, purchase_price,
       selling_price, stock_qty, reorder_level, supplier, compatible_models, location]
    );
    global.broadcast({ type: 'spare_added', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE spares SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM spares WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
