// Перевірка авторизації при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');
    const navAuth = document.getElementById('navAuth');

    if (!navAuth) return;

    if (token && name) {
        if (role === 'manager') {
            navAuth.innerHTML = `
        <span style="color:#64748b; font-size:0.9rem;">👤 ${name}</span>
        <a href="manager.html" class="btn btn-primary">Панель менеджера</a>
        <button class="btn btn-outline" onclick="logout()">Вийти</button>
      `;
        } else {
            navAuth.innerHTML = `
        <span style="color:#64748b; font-size:0.9rem;">👤 ${name}</span>
        <a href="cabinet.html" class="btn btn-primary">Кабінет</a>
        <button class="btn btn-outline" onclick="logout()">Вийти</button>
      `;
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}