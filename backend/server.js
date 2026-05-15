const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

require('./database');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const servicesRoutes = require('./routes/services');
const managerRoutes = require('./routes/manager');

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/manager', managerRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено: http://localhost:${PORT}`);
});