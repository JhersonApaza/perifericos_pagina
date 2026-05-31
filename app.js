require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./config/conexion');
const AuthController = require('./controllers/AuthController');
const VentaController = require('./controllers/VentaController');

const app = express();

// ── Motor de vistas ────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_dev',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }, // 1 hora
}));

// ── Instancia del controlador ──────────────────────────────────────────────
const auth = new AuthController(sequelize);
const ventas = new VentaController(sequelize);

// ── Rutas ──────────────────────────────────────────────────────────────────

// Login (GET muestra formulario, POST procesa)
app.get('/', (req, res) => auth.login(req, res));
app.post('/', (req, res) => auth.login(req, res));

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Registro
app.get('/registro', (req, res) => auth.registro(req, res));
app.post('/registro', (req, res) => auth.registro(req, res));

// Login facial
app.post('/login_face', (req, res) => auth.loginFace(req, res));

// Verificar OTP
app.get('/verificar', (req, res) => auth.verificarOtp(req, res));
app.post('/verificar', (req, res) => auth.verificarOtp(req, res));

// Dashboard
app.get('/dashboard', (req, res) => auth.dashboard(req, res));

// Ventas
app.get('/ventas',  (req, res) => ventas.index(req, res));
app.post('/ventas', (req, res) => ventas.registrar(req, res));

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
