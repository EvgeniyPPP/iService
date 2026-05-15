const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Немає доступу' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Невірний токен' });
    }
}

router.post('/create', (req, res) => {
    const { client_name, client_phone, device, problem, service_id, price, user_id } = req.body;

    if (!client_name || !client_phone || !device || !problem) {
        return res.status(400).json({ error: 'Заповніть всі поля' });
    }

    const result = db.prepare(`
    INSERT INTO orders (user_id, client_name, client_phone, device, problem, service_id, price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Прийнято')
  `).run(user_id || null, client_name, client_phone, device, problem, service_id || null, price || null);

    const stages = ['Прийнято', 'Діагностика', 'Очікування запчастин', 'Ремонт', 'Тестування', 'Готово'];
    const insertStage = db.prepare('INSERT INTO repair_stages (order_id, stage, completed) VALUES (?, ?, ?)');

    stages.forEach((stage, index) => {
        insertStage.run(result.lastInsertRowid, stage, index === 0 ? 1 : 0);
    });

    res.json({ success: true, orderId: result.lastInsertRowid });
});

router.get('/my', authMiddleware, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
});

router.get('/status/:id', (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });

    const stages = db.prepare('SELECT * FROM repair_stages WHERE order_id = ?').all(req.params.id);
    res.json({ order, stages });
});

module.exports = router;