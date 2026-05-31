/**
 * features/ventas/ventas.routes.js
 * Enrutador del módulo de ventas.
 * Instancia el controlador una única vez al cargar el módulo.
 */

const router = require('express').Router();
const VentaController = require('./ventas.controller');
const { isAuthenticated } = require('../../shared/middleware/auth.middleware');
const database = require('../../config/database');

const ventaController = new VentaController(database);

router.get('/', isAuthenticated, (req, res, next) => ventaController.index(req, res).catch(next));
router.post('/', isAuthenticated, (req, res, next) => ventaController.registrar(req, res).catch(next));

module.exports = router;
