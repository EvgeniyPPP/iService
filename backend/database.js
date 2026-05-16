var Database = require('better-sqlite3')
var path = require('path')
var bcrypt = require('bcryptjs')

// підключаюсь до бази даних
var db = new Database(path.join(__dirname, 'iservice.db'))

// створюю таблицю користувачів
db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`)

// таблиця менеджерів окремо від клієнтів
db.exec(`CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`)

// таблиця послуг сервісу
db.exec(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    device TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    description TEXT
)`)

// головна таблиця замовлень
db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    device TEXT NOT NULL,
    problem TEXT NOT NULL,
    service_id INTEGER,
    status TEXT DEFAULT 'Прийнято',
    price INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
)`)

// таблиця для відображення етапів ремонту
db.exec(`CREATE TABLE IF NOT EXISTS repair_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
)`)

// перевіряю чи є вже менеджер в базі
var manager = db.prepare('SELECT * FROM managers WHERE email = ?').get('manager@iservice.ua')

if (!manager) {
    // хешую пароль перед збереженням
    var hash = bcrypt.hashSync('manager123', 10)
    db.prepare('INSERT INTO managers (name, email, password) VALUES (?, ?, ?)').run('Менеджер', 'manager@iservice.ua', hash)
    console.log('Менеджера створено')
}

// перевіряю чи є послуги в базі
var check = db.prepare('SELECT * FROM services LIMIT 1').get()

if (!check) {
    console.log('Заповнюю базу послугами...')

    var ins = db.prepare('INSERT INTO services (category, device, name, price, duration, description) VALUES (?, ?, ?, ?, ?, ?)')

    // всі моделі айфонів від 11 до 17 з коефіцієнтами цін
    var models = [
        { name: 'iPhone 11',         k: 1.0 },
        { name: 'iPhone 11 Pro',     k: 1.2 },
        { name: 'iPhone 11 Pro Max', k: 1.3 },
        { name: 'iPhone 12',         k: 1.1 },
        { name: 'iPhone 12 mini',    k: 1.0 },
        { name: 'iPhone 12 Pro',     k: 1.3 },
        { name: 'iPhone 12 Pro Max', k: 1.4 },
        { name: 'iPhone 13',         k: 1.2 },
        { name: 'iPhone 13 mini',    k: 1.1 },
        { name: 'iPhone 13 Pro',     k: 1.4 },
        { name: 'iPhone 13 Pro Max', k: 1.5 },
        { name: 'iPhone 14',         k: 1.3 },
        { name: 'iPhone 14 Plus',    k: 1.4 },
        { name: 'iPhone 14 Pro',     k: 1.6 },
        { name: 'iPhone 14 Pro Max', k: 1.7 },
        { name: 'iPhone 15',         k: 1.4 },
        { name: 'iPhone 15 Plus',    k: 1.5 },
        { name: 'iPhone 15 Pro',     k: 1.7 },
        { name: 'iPhone 15 Pro Max', k: 1.8 },
        { name: 'iPhone 16',         k: 1.5 },
        { name: 'iPhone 16 Plus',    k: 1.6 },
        { name: 'iPhone 16 Pro',     k: 1.8 },
        { name: 'iPhone 16 Pro Max', k: 1.9 },
        { name: 'iPhone 17',         k: 1.6 },
        { name: 'iPhone 17 Air',     k: 1.7 },
        { name: 'iPhone 17 Pro',     k: 2.0 },
        { name: 'iPhone 17 Pro Max', k: 2.1 },
    ]

    // список послуг з базовими цінами для iPhone 11
    var послуги = [
        { name: 'Діагностика',          price: 300,  duration: '30-60 хвилин', desc: 'Повна діагностика та визначення несправності' },
        { name: 'Заміна АКБ',           price: 1200, duration: '1-2 години',   desc: 'Заміна акумулятора на оригінальний або сумісний' },
        { name: 'Заміна екрану',        price: 2500, duration: '2-3 години',   desc: 'Повна заміна екранного модуля' },
        { name: 'Заміна дисплея',       price: 3200, duration: '2-3 години',   desc: 'Заміна дисплейного модуля на оригінальний' },
        { name: 'Заміна скла екрана',   price: 1500, duration: '1-2 години',   desc: 'Заміна захисного скла без заміни матриці' },
        { name: 'Заміна скла камери',   price: 500,  duration: '1 година',     desc: 'Заміна захисного скла основної камери' },
        { name: 'Чистка камери',        price: 400,  duration: '1 година',     desc: 'Чистка лінз та сенсора від пилу та бруду' },
        { name: 'Заміна камери',        price: 2200, duration: '2-3 години',   desc: 'Заміна модуля основної або фронтальної камери' },
        { name: 'Заміна корпусу',       price: 2800, duration: '3-4 години',   desc: 'Повна заміна корпусу пристрою' },
        { name: 'Заміна скла корпусу',  price: 1000, duration: '2-3 години',   desc: 'Заміна заднього скла корпусу' },
    ]

    // вставляю всі комбінації
    for (var i = 0; i < models.length; i++) {
        for (var j = 0; j < послуги.length; j++) {
            var ціна = Math.round(послуги[j].price * models[i].k / 100) * 100
            ins.run('Apple iPhone', models[i].name, послуги[j].name, ціна, послуги[j].duration, послуги[j].desc)
        }
    }

    console.log('Послуги додано успішно')
}

module.exports = db