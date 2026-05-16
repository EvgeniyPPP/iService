var express = require('express')
var router = express.Router()
var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var db = require('../database')

// реєстрація нового клієнта
router.post('/register', function(req, res) {
    var name = req.body.name
    var email = req.body.email
    var phone = req.body.phone
    var password = req.body.password

    // перевіряю чи заповнені поля
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Заповніть всі поля' })
    }

    // перевіряю чи немає вже такого email
    var existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (existing) {
        return res.status(400).json({ error: 'Цей email вже зареєстровано' })
    }

    // хешую пароль щоб не зберігати у відкритому вигляді
    var hash = bcrypt.hashSync(password, 10)

    var result = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)').run(name, email, phone, hash)

    // створюю токен для автоматичного входу після реєстрації
    var token = jwt.sign({ id: result.lastInsertRowid, role: 'client' }, process.env.JWT_SECRET)

    res.json({ token: token, name: name, role: 'client' })
})

// вхід клієнта
router.post('/login', function(req, res) {
    var email = req.body.email
    var password = req.body.password

    var user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
        return res.status(400).json({ error: 'Користувача з таким email не знайдено' })
    }

    // порівнюю пароль з хешем
    var ok = bcrypt.compareSync(password, user.password)
    if (!ok) {
        return res.status(400).json({ error: 'Невірний пароль' })
    }

    var token = jwt.sign({ id: user.id, role: 'client' }, process.env.JWT_SECRET)

    res.json({ token: token, name: user.name, role: 'client' })
})

// окремий вхід для менеджера
router.post('/manager-login', function(req, res) {
    var email = req.body.email
    var password = req.body.password

    var manager = db.prepare('SELECT * FROM managers WHERE email = ?').get(email)
    if (!manager) {
        return res.status(400).json({ error: 'Менеджера не знайдено' })
    }

    var ok = bcrypt.compareSync(password, manager.password)
    if (!ok) {
        return res.status(400).json({ error: 'Невірний пароль' })
    }

    var token = jwt.sign({ id: manager.id, role: 'manager' }, process.env.JWT_SECRET)

    res.json({ token: token, name: manager.name, role: 'manager' })
})

module.exports = router