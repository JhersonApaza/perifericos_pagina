require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./config/database');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// ── Motor de vistas (busca en features/ y shared/) ─────────────────────────
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'features'),
  path.join(__dirname, 'shared'),
]);

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/apexcharts', express.static(path.join(__dirname, 'node_modules/apexcharts/dist')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_dev',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }, // 1 hora
}));

// ── Rutas modulares ────────────────────────────────────────────────────────
app.use('/',          require('./features/auth/auth.routes'));
app.use('/dashboard', require('./features/dashboard/dashboard.routes'));
app.use('/ventas',    require('./features/ventas/ventas.routes'));
app.use('/productos', require('./features/productos/productos.routes'));

// ── Manejador de errores global (debe ir DESPUÉS de todas las rutas) ───────
app.use(errorHandler);

// ── Iniciar servidor ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a MySQL');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error de conexión a BD:', err.message);
    process.exit(1);
  });
