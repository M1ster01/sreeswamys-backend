const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { tractor_id, customer_id, sale_date, payment_mode, total_amount,
            finance_company, finance_amount, cheque_no, cheque_bank, cheque_date,
            cheque_status, exchange_tractor_id, items } = req.body;

    const sale = await client.query(
      `INSERT INTO sales (tractor_id, customer_id, sale_date, payment_mode, total_amount,
        finance_company, finance_amount, cheque_no, cheque_bank, cheque_date, cheque_status,
        exchange_tractor_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *`,
      [tractor_id, customer_id, sale_date, payment_mode, total_amount,
       finance_company, finance_amount, cheque_no, cheque_bank, cheque_date, cheque_status,
       exchange_tractor_id]
    );

    await client.query("UPDATE tractors SET status = 'sold' WHERE id = $1", [tractor_id]);

    if (items && items.length) {
      for (const item of items) {
        await client.query(
          'INSERT INTO sale_items (sale_id, item_type, item_id, quantity, price) VALUES ($1,$2,$3,$4,$5)',
          [sale.rows[0].id, item.type, item.id, item.qty, item.price]
        );
        if (item.type === 'spare') {
          await client.query('UPDATE spares SET stock_qty = stock_qty - $1 WHERE id = $2', [item.qty, item.id]);
        }
      }
    }

    await client.query('COMMIT');
    global.broadcast({ type: 'sale_created', data: sale.rows[0] });
    res.json(sale.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
