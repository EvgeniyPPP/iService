var express = require('express')
var router = express.Router()
var db = require('../database')
var jwt = require('jsonwebtoken')

// перевірка токена - чи залогінений користувач
function checkToken(req, res, next) {
    var token = req.headers['authorization']
    if (!token) {
        return res.status(401).json({ error: 'Потрібна авторизація' })
    }

    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch(e) {
        return res.status(401).json({ error: 'Токен невірний або прострочений' })
    }
}

// створення нового замовлення
router.post('/create', function(req, res) {
    var client_name = req.body.client_name
    var client_phone = req.body.client_phone
    var device = req.body.device
    var problem = req.body.problem
    var service_id = req.body.service_id
    var price = req.body.price
    var user_id = req.body.user_id

    if (!client_name || !client_phone || !device || !problem) {
        return res.status(400).json({ error: 'Заповніть всі обовязкові поля' })
    }

    // зберігаю замовлення в базу
    var result = db.prepare(`INSERT INTO orders
        (user_id, client_name, client_phone, device, problem, service_id, price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Прийнято')`
    ).run(user_id || null, client_name, client_phone, device, problem, service_id || null, price || null)

    var orderId = result.lastInsertRowid

    // автоматично створюю всі етапи ремонту для цього замовлення
    var stages = ['Прийнято', 'Діагностика', 'Очікування запчастин', 'Ремонт', 'Тестування', 'Готово']
    var addStage = db.prepare('INSERT INTO repair_stages (order_id, stage, completed) VALUES (?, ?, ?)')

    for (var i = 0; i < stages.length; i++) {
        // перший етап одразу позначаю як виконаний
        addStage.run(orderId, stages[i], i === 0 ? 1 : 0)
    }

    res.json({ success: true, orderId: orderId })
})

// замовлення конкретного клієнта
router.get('/my', checkToken, function(req, res) {
    var orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
    res.json(orders)
})

// перевірка статусу замовлення по номеру без авторизації
router.get('/status/:id', function(req, res) {
    var order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)

    if (!order) {
        return res.status(404).json({ error: 'Замовлення не знайдено' })
    }

    var stages = db.prepare('SELECT * FROM repair_stages WHERE order_id = ?').all(req.params.id)

    res.json({ order: order, stages: stages })
})

module.exports = router