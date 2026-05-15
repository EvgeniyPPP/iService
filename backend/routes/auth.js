const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

router.post('/register', (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Заповніть всі поля' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(400).json({ error: 'Email вже зареєстровано' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)').run(name, email, phone, hash);

    const token = jwt.sign({ id: result.lastInsertRowid, role: 'client' }, process.env.JWT_SECRET);
    res.json({ token, name, role: 'client' });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Користувача не знайдено' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Невірний пароль' });

    const token = jwt.sign({ id: user.id, role: 'client' }, process.env.JWT_SECRET);
    res.json({ token, name: user.name, role: 'client' });
});

router.post('/manager-login', (req, res) => {
    const { email, password } = req.body;

    const manager = db.prepare('SELECT * FROM managers WHERE email = ?').get(email);
    if (!manager) return res.status(400).json({ error: 'Менеджера не знайдено' });

    const valid = bcrypt.compareSync(password, manager.password);
    if (!valid) return res.status(400).json({ error: 'Невірний пароль' });

    const token = jwt.sign({ id: manager.id, role: 'manager' }, process.env.JWT_SECRET);
    res.json({ token, name: manager.name, role: 'manager' });
});

module.exports = router;