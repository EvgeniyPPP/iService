// перевіряю авторизацію при кожному завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    checkAuth()
})

// функція перевірки чи залогінений користувач
function checkAuth() {
    var token = localStorage.getItem('token')
    var name = localStorage.getItem('name')
    var role = localStorage.getItem('role')
    var navAuth = document.getElementById('navAuth')

    // якщо блок навігації не знайдено - виходимо
    if (!navAuth) return

    // якщо є токен - показуємо кабінет замість кнопок входу
    if (token && name) {
        if (role === 'manager') {
            navAuth.innerHTML = '<span style="color:#64748b; font-size:0.9rem;">👤 ' + name + '</span>' +
                '<a href="manager.html" class="btn btn-primary">Панель менеджера</a>' +
                '<button class="btn btn-outline" onclick="logout()">Вийти</button>'
        } else {
            navAuth.innerHTML = '<span style="color:#64748b; font-size:0.9rem;">👤 ' + name + '</span>' +
                '<a href="cabinet.html" class="btn btn-primary">Кабінет</a>' +
                '<button class="btn btn-outline" onclick="logout()">Вийти</button>'
        }
    }
}

// вихід з акаунту - чищу локальне сховище
function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('role')
    window.location.href = 'index.html'
}