const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

function managerAuth(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Немає доступу' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'manager') return res.status(403).json({ error: 'Тільки для менеджера' });
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Невірний токен' });
    }
}

router.get('/orders', managerAuth, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
});

router.get('/clients', managerAuth, (req, res) => {
    const clients = db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC').all();
    res.json(clients);
});

router.put('/orders/:id/status', managerAuth, (req, res) => {
    const { status } = req.body;
    const stages = ['Прийнято', 'Діагностика', 'Очікування запчастин', 'Ремонт', 'Тестування', 'Готово'];

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    const stageIndex = stages.indexOf(status);
    if (stageIndex !== -1) {
        stages.forEach((stage, index) => {
            const completed = index <= stageIndex ? 1 : 0;
            const completedAt = index <= stageIndex ? new Date().toISOString() : null;
            db.prepare('UPDATE repair_stages SET completed = ?, completed_at = ? WHERE order_id = ? AND stage = ?')
                .run(completed, completedAt, req.params.id, stage);
        });
    }

    res.json({ success: true });
});

router.put('/orders/:id', managerAuth, (req, res) => {
    const { client_name, client_phone, device, problem, price, comment } = req.body;
    db.prepare(`
    UPDATE orders SET client_name = ?, client_phone = ?, device = ?, problem = ?, price = ?, comment = ?
    WHERE id = ?
  `).run(client_name, client_phone, device, problem, price, comment, req.params.id);
    res.json({ success: true });
});

router.post('/services', managerAuth, (req, res) => {
    const { category, device, name, price, duration, description } = req.body;
    const result = db.prepare(`
    INSERT INTO services (category, device, name, price, duration, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(category, device, name, price, duration, description);
    res.json({ success: true, id: result.lastInsertRowid });
});

router.delete('/services/:id', managerAuth, (req, res) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;