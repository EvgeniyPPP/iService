const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
    const services = db.prepare('SELECT * FROM services ORDER BY category, device').all();
    res.json(services);
});

router.get('/device/:device', (req, res) => {
    const services = db.prepare('SELECT * FROM services WHERE device = ?').all(req.params.device);
    res.json(services);
});

router.get('/devices/list', (req, res) => {
    const devices = db.prepare('SELECT DISTINCT device FROM services ORDER BY device').all();
    res.json(devices);
});

module.exports = router;