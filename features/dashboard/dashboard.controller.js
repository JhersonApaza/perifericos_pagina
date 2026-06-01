/**
 * features/dashboard/dashboard.controller.js
 * Controlador del dashboard analítico.
 * Extraído de controllers/AuthController.js (método dashboard).
 * Lógica 100% preservada.
 *
 * DEUDA TÉCNICA: Importa auth.model.js para las consultas de estadísticas.
 * En el futuro debería migrar a un servicio compartido en shared/.
 */

const Usuario = require('../auth/auth.model');

const ADMIN_USER_ID = 1;

class DashboardController {
  constructor(db) {
    this.modelo = new Usuario(db);
  }

  async showDashboard(req, res) {
    if (!req.session.user_id) return res.redirect('/');
    const totalProductos = await this.modelo.contarProductos();
    const eliminados = await this.modelo.eliminarUsuariosSinOtpVerificado();
    if (eliminados > 0) {
      req.session.toast_warn = `Se eliminaron ${eliminados} cuenta(s) que no validaron el OTP a tiempo.`;
    }

    const sessionUid = parseInt(req.session.user_id);
    const esAdmin = sessionUid === ADMIN_USER_ID;
    const usuarios = await this.modelo.listarResumenUsuarios();
    const nombreUsuario = (usuarios.find(u => u.id === sessionUid) || {}).usuario || 'Usuario';

    // Gráficos originales
    const ventasDia       = await this.modelo.ventasPorDia(30);
    const statsVentas     = await this.modelo.statsVentas();

    // Nuevos gráficos
    const pareto          = await this.modelo.productosPareto(90);
    const ranking         = await this.modelo.rankingTrabajadores(30);
    const stockAlertas    = await this.modelo.stockCritico(30, 15);
    const heatmap         = await this.modelo.heatmapVentas(sessionUid, true, 60);
    const mlClientes      = await this.modelo.ventasClientes(sessionUid, true, 15);
    const mlTopProductos  = await this.modelo.productosMasVendidos(sessionUid, true, 10);
    const mlPrecioStock   = await this.modelo.precioVsStock(sessionUid, true);

    const labelsDia  = ventasDia.map(r => r.dia);
    const dataDia    = ventasDia.map(r => parseFloat(r.total_monto) || 0);

    const toast_ok   = req.session.toast_ok   || '';
    const toast_warn = req.session.toast_warn || '';
    delete req.session.toast_ok;
    delete req.session.toast_warn;

    res.render('dashboard/pages/dashboard', {
      es_admin: esAdmin,
      usuarios,
      nombreUsuario,
      labelsDia,
      dataDia,
      statsVentas,
      totalProductos,
      pareto,
      heatmap,
      ranking,
      stockAlertas,
      trabajador_id_actual: sessionUid,
      toast_ok,
      toast_warn,
      mlClientes:     JSON.stringify(mlClientes),
      mlTopProductos: JSON.stringify(mlTopProductos),
      mlPrecioStock:  JSON.stringify(mlPrecioStock),
    });
  }
}

module.exports = DashboardController;
