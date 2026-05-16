var express = require('express')
var router = express.Router()
var db = require('../database')

// всі послуги
router.get('/', function(req, res) {
    var services = db.prepare('SELECT * FROM services ORDER BY device, name').all()
    res.json(services)
})

// послуги для конкретного пристрою - використовується в калькуляторі
router.get('/device/:device', function(req, res) {
    var services = db.prepare('SELECT * FROM services WHERE device = ?').all(req.params.device)
    res.json(services)
})

// список унікальних моделей для калькулятора
router.get('/devices/list', function(req, res) {
    var devices = db.prepare('SELECT DISTINCT device FROM services ORDER BY device').all()
    res.json(devices)
})

module.exports = router