const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, brand, search } = req.query;
    let query = 'SELECT * FROM tractors WHERE 1=1';
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (brand) { params.push(brand); query += ` AND brand = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (model ILIKE $${params.length} OR chassis_no ILIKE $${params.length})`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      brand, model, hp, chassis_no, engine_no, color, year,
      purchase_price, purchase_date, selling_price, warranty_expiry,
      rto_done, rc_received, rc_handed, acquisition_type, notes
    } = req.body;
    const result = await pool.query(
      `INSERT INTO tractors (brand, model, hp, chassis_no, engine_no, color, year,
        purchase_price, purchase_date, selling_price, warranty_expiry,
        rto_done, rc_received, rc_handed, acquisition_type, notes, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'in_stock',NOW(),NOW()) RETURNING *`,
      [brand, model, hp, chassis_no, engine_no, color, year,
       purchase_price, purchase_date, selling_price, warranty_expiry,
       rto_done, rc_received, rc_handed, acquisition_type, notes]
    );
    global.broadcast({ type: 'tractor_added', data: result.rows[0] });
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
    const query = `UPDATE tractors SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await pool.query(query, [...values, id]);
    global.broadcast({ type: 'tractor_updated', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tractors WHERE id = $1', [req.params.id]);
    global.broadcast({ type: 'tractor_deleted', id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
