var express = require('express')
var router = express.Router()
var db = require('../database')
var jwt = require('jsonwebtoken')

// перевірка що це саме менеджер а не клієнт
function checkManager(req, res, next) {
    var token = req.headers['authorization']
    if (!token) {
        return res.status(401).json({ error: 'Немає доступу' })
    }

    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role !== 'manager') {
            return res.status(403).json({ error: 'Ця сторінка тільки для менеджера' })
        }
        req.user = decoded
        next()
    } catch(e) {
        return res.status(401).json({ error: 'Токен невірний' })
    }
}

// всі замовлення для менеджера
router.get('/orders', checkManager, function(req, res) {
    var orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    res.json(orders)
})

// всі клієнти
router.get('/clients', checkManager, function(req, res) {
    var clients = db.prepare('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC').all()
    res.json(clients)
})

// зміна статусу замовлення
router.put('/orders/:id/status', checkManager, function(req, res) {
    var status = req.body.status
    var id = req.params.id

    // оновлюю статус в замовленні
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)

    // оновлюю етапи ремонту відповідно до нового статусу
    var stages = ['Прийнято', 'Діагностика', 'Очікування запчастин', 'Ремонт', 'Тестування', 'Готово']
    var idx = stages.indexOf(status)

    if (idx !== -1) {
        for (var i = 0; i < stages.length; i++) {
            var done = i <= idx ? 1 : 0
            var doneAt = i <= idx ? new Date().toISOString() : null
            db.prepare('UPDATE repair_stages SET completed = ?, completed_at = ? WHERE order_id = ? AND stage = ?')
                .run(done, doneAt, id, stages[i])
        }
    }

    res.json({ success: true })
})

// редагування даних замовлення
router.put('/orders/:id', checkManager, function(req, res) {
    var d = req.body
    db.prepare(`UPDATE orders SET
                                  client_name = ?,
                                  client_phone = ?,
                                  device = ?,
                                  problem = ?,
                                  price = ?,
                                  comment = ?
                WHERE id = ?`
    ).run(d.client_name, d.client_phone, d.device, d.problem, d.price, d.comment, req.params.id)

    res.json({ success: true })
})

// додавання нової послуги через панель менеджера
router.post('/services', checkManager, function(req, res) {
    var d = req.body
    var result = db.prepare(`INSERT INTO services
                                 (category, device, name, price, duration, description)
                             VALUES (?, ?, ?, ?, ?, ?)`
    ).run(d.category, d.device, d.name, d.price, d.duration, d.description)

    res.json({ success: true, id: result.lastInsertRowid })
})

// видалення послуги
router.delete('/services/:id', checkManager, function(req, res) {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id)
    res.json({ success: true })
})

module.exports = router