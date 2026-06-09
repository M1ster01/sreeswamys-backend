const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/daily-sales', async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await pool.query(
      `SELECT DATE(sale_date) as date, COUNT(*) as count, SUM(total_amount) as total
       FROM sales WHERE sale_date BETWEEN $1 AND $2 GROUP BY DATE(sale_date) ORDER BY date DESC`,
      [from, to]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profit', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.brand, t.model, t.purchase_price, t.selling_price,
             (t.selling_price - t.purchase_price) as profit,
             s.sale_date, c.name as customer
      FROM tractors t
      JOIN sales s ON s.tractor_id = t.id
      JOIN customers c ON c.id = s.customer_id
      WHERE t.status = 'sold'
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name as customer, t.brand, t.model
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN tractors t ON t.id = s.tractor_id
      WHERE s.payment_mode IN ('cheque', 'finance') AND (s.cheque_status IS NULL OR s.cheque_status != 'cleared')
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gst', async (req, res) => {
  try {
    const { from, to } = req.query;
    const result = await pool.query(
      `SELECT DATE(sale_date) as date, COUNT(*) as invoices, SUM(total_amount) as total
       FROM sales WHERE sale_date BETWEEN $1 AND $2 GROUP BY DATE(sale_date)`,
      [from, to]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
