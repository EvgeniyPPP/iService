const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'iservice.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                         name TEXT NOT NULL,
                                         email TEXT UNIQUE NOT NULL,
                                         phone TEXT,
                                         password TEXT NOT NULL,
                                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS managers (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            name TEXT NOT NULL,
                                            email TEXT UNIQUE NOT NULL,
                                            password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            category TEXT NOT NULL,
                                            device TEXT NOT NULL,
                                            name TEXT NOT NULL,
                                            price INTEGER NOT NULL,
                                            duration TEXT NOT NULL,
                                            description TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
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
        );

    CREATE TABLE IF NOT EXISTS repair_stages (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 order_id INTEGER NOT NULL,
                                                 stage TEXT NOT NULL,
                                                 completed INTEGER DEFAULT 0,
                                                 completed_at DATETIME,
                                                 FOREIGN KEY (order_id) REFERENCES orders(id)
        );
`);

const existingManager = db.prepare(
    'SELECT * FROM managers WHERE email = ?'
).get('manager@iservice.ua');

if (!existingManager) {
    const hash = bcrypt.hashSync('manager123', 10);
    db.prepare(
        'INSERT INTO managers (name, email, password) VALUES (?, ?, ?)'
    ).run('Менеджер', 'manager@iservice.ua', hash);
}

const existingServices = db.prepare('SELECT * FROM services LIMIT 1').get();

if (!existingServices) {
    const insert = db.prepare(`
    INSERT INTO services (category, device, name, price, duration, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    const models = [
        { name: 'iPhone 11',          mult: 1.0 },
        { name: 'iPhone 11 Pro',      mult: 1.2 },
        { name: 'iPhone 11 Pro Max',  mult: 1.3 },
        { name: 'iPhone 12',          mult: 1.1 },
        { name: 'iPhone 12 mini',     mult: 1.0 },
        { name: 'iPhone 12 Pro',      mult: 1.3 },
        { name: 'iPhone 12 Pro Max',  mult: 1.4 },
        { name: 'iPhone 13',          mult: 1.2 },
        { name: 'iPhone 13 mini',     mult: 1.1 },
        { name: 'iPhone 13 Pro',      mult: 1.4 },
        { name: 'iPhone 13 Pro Max',  mult: 1.5 },
        { name: 'iPhone 14',          mult: 1.3 },
        { name: 'iPhone 14 Plus',     mult: 1.4 },
        { name: 'iPhone 14 Pro',      mult: 1.6 },
        { name: 'iPhone 14 Pro Max',  mult: 1.7 },
        { name: 'iPhone 15',          mult: 1.4 },
        { name: 'iPhone 15 Plus',     mult: 1.5 },
        { name: 'iPhone 15 Pro',      mult: 1.7 },
        { name: 'iPhone 15 Pro Max',  mult: 1.8 },
        { name: 'iPhone 16',          mult: 1.5 },
        { name: 'iPhone 16 Plus',     mult: 1.6 },
        { name: 'iPhone 16 Pro',      mult: 1.8 },
        { name: 'iPhone 16 Pro Max',  mult: 1.9 },
        { name: 'iPhone 17',          mult: 1.6 },
        { name: 'iPhone 17 Air',      mult: 1.7 },
        { name: 'iPhone 17 Pro',      mult: 2.0 },
        { name: 'iPhone 17 Pro Max',  mult: 2.1 },
    ];

    const services = [
        {
            name: 'Діагностика',
            basePrice: 300,
            duration: '30-60 хвилин',
            desc: 'Повна діагностика пристрою та визначення несправності'
        },
        {
            name: 'Заміна АКБ',
            basePrice: 1200,
            duration: '1-2 години',
            desc: 'Заміна акумулятора на оригінальний або сумісний'
        },
        {
            name: 'Заміна екрану',
            basePrice: 2500,
            duration: '2-3 години',
            desc: 'Повна заміна екранного модуля'
        },
        {
            name: 'Заміна дисплея',
            basePrice: 3200,
            duration: '2-3 години',
            desc: 'Заміна дисплейного модуля на оригінальний'
        },
        {
            name: 'Заміна скла екрана',
            basePrice: 1500,
            duration: '1-2 години',
            desc: 'Заміна захисного скла дисплею без заміни матриці'
        },
        {
            name: 'Заміна скла камери',
            basePrice: 500,
            duration: '1 година',
            desc: 'Заміна захисного скла основної камери'
        },
        {
            name: 'Чистка камери',
            basePrice: 400,
            duration: '1 година',
            desc: 'Чистка лінз та сенсора камери від пилу та бруду'
        },
        {
            name: 'Заміна камери',
            basePrice: 2200,
            duration: '2-3 години',
            desc: 'Заміна модуля основної або фронтальної камери'
        },
        {
            name: 'Заміна корпусу',
            basePrice: 2800,
            duration: '3-4 години',
            desc: 'Повна заміна корпусу пристрою'
        },
        {
            name: 'Заміна скла корпусу',
            basePrice: 1000,
            duration: '2-3 години',
            desc: 'Заміна заднього скла корпусу'
        },
    ];

    for (const model of models) {
        for (const service of services) {
            const price = Math.round(service.basePrice * model.mult / 100) * 100;
            insert.run(
                'Apple iPhone',
                model.name,
                service.name,
                price,
                service.duration,
                service.desc
            );
        }
    }

    console.log('✅ Базу даних послуг заповнено');
}

module.exports = db;