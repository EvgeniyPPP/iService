var express = require('express')
var cors = require('cors')
var path = require('path')
require('dotenv').config()

// створюю головний обєкт серверу
var app = express()

// спочатку підключаю базу даних щоб таблиці створились
require('./database')

// налаштовую middleware
app.use(cors())
app.use(express.json())

// вказую де лежать html файли
app.use(express.static(path.join(__dirname, '../frontend')))

// підключаю всі маршрути
var authRoutes = require('./routes/auth')
var ordersRoutes = require('./routes/orders')
var servicesRoutes = require('./routes/services')
var managerRoutes = require('./routes/manager')

app.use('/api/auth', authRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/manager', managerRoutes)

// головна сторінка
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// запускаю сервер на порту з .env або 8080
var PORT = process.env.PORT || 8080
app.listen(PORT, function() {
    console.log('Сервер запущено на порту ' + PORT)
    console.log('http://127.0.0.1:' + PORT)
})