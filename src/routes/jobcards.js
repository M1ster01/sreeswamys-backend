const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_id, tractor_id, complaint, mechanic_ids, transport_charges,
            distance_km, visit_date, labour_charges, service_charges, discount, items, status } = req.body;

    const total = (parseFloat(labour_charges) || 0) + (parseFloat(service_charges) || 0) +
                  (parseFloat(transport_charges) || 0) + (parseFloat(items?.reduce((s, i) => s + i.qty * i.price, 0)) || 0) -
                  (parseFloat(discount) || 0);

    const jc = await client.query(
      `INSERT INTO job_cards (customer_id, tractor_id, complaint, transport_charges,
        distance_km, visit_date, labour_charges, service_charges, discount, total_amount, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
      [customer_id, tractor_id, complaint, transport_charges, distance_km, visit_date,
       labour_charges, service_charges, discount, total, status || 'open']
    );

    for (const mechId of mechanic_ids || []) {
      await client.query('INSERT INTO job_card_mechanics (job_card_id, mechanic_id) VALUES ($1, $2)', [jc.rows[0].id, mechId]);
    }

    for (const item of items || []) {
      await client.query(
        'INSERT INTO job_card_items (job_card_id, spare_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [jc.rows[0].id, item.id, item.qty, item.price]
      );
      await client.query('UPDATE spares SET stock_qty = stock_qty - $1 WHERE id = $2', [item.qty, item.id]);
    }

    await client.query('COMMIT');
    global.broadcast({ type: 'jobcard_created', data: jc.rows[0] });
    res.json(jc.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE job_cards SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    global.broadcast({ type: 'jobcard_updated', id, status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
