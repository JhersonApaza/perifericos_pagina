/**
 * features/dashboard/dashboard.routes.js
 * Enrutador del módulo de dashboard.
 * Instancia el controlador una única vez al cargar el módulo.
 */

const router = require('express').Router();
const DashboardController = require('./dashboard.controller');
const { isAuthenticated } = require('../../shared/middleware/auth.middleware');
const database = require('../../config/database');

const dashboardController = new DashboardController(database);

router.get('/', isAuthenticated, (req, res, next) => dashboardController.showDashboard(req, res).catch(next));

module.exports = router;
