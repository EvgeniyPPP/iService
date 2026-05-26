var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')

var TEST_SECRET = 'test_secret_key'

describe('Тести модуля авторизації', function() {

    test('bcrypt повинен хешувати пароль', function() {
        var password = 'testpassword123'
        var hash = bcrypt.hashSync(password, 10)
        expect(hash).not.toBe(password)
        expect(hash.startsWith('$2')).toBe(true)
    })

    test('bcrypt повинен правильно порівнювати пароль з хешем', function() {
        var password = 'testpassword123'
        var hash = bcrypt.hashSync(password, 10)
        var correctResult = bcrypt.compareSync(password, hash)
        expect(correctResult).toBe(true)
        var wrongResult = bcrypt.compareSync('wrongpassword', hash)
        expect(wrongResult).toBe(false)
    })

    test('JWT повинен створювати токен', function() {
        var payload = { id: 1, role: 'client' }
        var token = jwt.sign(payload, TEST_SECRET)
        expect(token).toBeTruthy()
        expect(token.split('.').length).toBe(3)
    })

    test('JWT повинен правильно розшифровувати токен', function() {
        var payload = { id: 1, role: 'client' }
        var token = jwt.sign(payload, TEST_SECRET)
        var decoded = jwt.verify(token, TEST_SECRET)
        expect(decoded.id).toBe(1)
        expect(decoded.role).toBe('client')
    })

    test('JWT повинен відхиляти невірний токен', function() {
        expect(function() {
            jwt.verify('invalid.token.here', TEST_SECRET)
        }).toThrow()
    })

})

describe('Тести валідації даних замовлення', function() {

    function validateOrder(data) {
        if (!data.client_name) return false
        if (!data.client_phone) return false
        if (!data.device) return false
        if (!data.problem) return false
        return true
    }

    test('коректне замовлення повинно пройти валідацію', function() {
        var order = {
            client_name: 'Іван Іваненко',
            client_phone: '+380501234567',
            device: 'iPhone 14',
            problem: 'не заряджається'
        }
        expect(validateOrder(order)).toBe(true)
    })

    test('замовлення без імені не повинно пройти валідацію', function() {
        var order = {
            client_name: '',
            client_phone: '+380501234567',
            device: 'iPhone 14',
            problem: 'не заряджається'
        }
        expect(validateOrder(order)).toBe(false)
    })

    test('замовлення без телефону не повинно пройти валідацію', function() {
        var order = {
            client_name: 'Іван Іваненко',
            client_phone: '',
            device: 'iPhone 14',
            problem: 'не заряджається'
        }
        expect(validateOrder(order)).toBe(false)
    })

})

describe('Тести калькулятора вартості', function() {

    function calcTotal(services) {
        var total = 0
        for (var i = 0; i < services.length; i++) {
            total += services[i].price
        }
        return total
    }

    test('калькулятор повинен правильно рахувати одну послугу', function() {
        var services = [{ name: 'Заміна АКБ', price: 2000 }]
        expect(calcTotal(services)).toBe(2000)
    })

    test('калькулятор повинен правильно рахувати кілька послуг', function() {
        var services = [
            { name: 'Заміна АКБ', price: 2000 },
            { name: 'Заміна скла', price: 1500 },
            { name: 'Чистка камери', price: 400 }
        ]
        expect(calcTotal(services)).toBe(3900)
    })

    test('порожній список послуг повинен повертати 0', function() {
        var services = []
        expect(calcTotal(services)).toBe(0)
    })

})