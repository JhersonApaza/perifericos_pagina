/**
 * features/auth/auth.routes.js
 * Enrutador del módulo de autenticación.
 * Instancia el controlador una única vez al cargar el módulo.
 */

const router = require('express').Router();
const AuthController = require('./auth.controller');
const database = require('../../config/database');

const authController = new AuthController(database);

router.get('/', (req, res, next) => authController.login(req, res).catch(next));
router.post('/', (req, res, next) => authController.login(req, res).catch(next));

router.post('/login_face', (req, res, next) => authController.loginFace(req, res).catch(next));

router.get('/registro', (req, res, next) => authController.registro(req, res).catch(next));
router.post('/registro', (req, res, next) => authController.registro(req, res).catch(next));

router.get('/verificar', (req, res, next) => authController.verificarOtp(req, res).catch(next));
router.post('/verificar', (req, res, next) => authController.verificarOtp(req, res).catch(next));

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
