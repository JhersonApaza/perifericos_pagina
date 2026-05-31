/**
 * features/auth/auth.model.js
 * Modelo de datos de usuarios/trabajadores.
 * Migrado desde models/Usuario.js — lógica 100% preservada.
 */

class Usuario {
  constructor(db) {
    this.db = db;
  }

  async obtenerPorNombre(usuario) {
    const [rows] = await this.db.query(
      `SELECT id, usuario, correo, password, face_descriptor,
        COALESCE(admin_otp_completado, 0) AS admin_otp_completado
       FROM trabajadores WHERE usuario = ?`,
      { replacements: [usuario] }
    );
    return rows[0] || null;
  }

  async obtenerPorId(id) {
    const [rows] = await this.db.query(
      'SELECT id FROM trabajadores WHERE id = ?',
      { replacements: [id] }
    );
    return rows[0] || null;
  }

  async obtenerUsuarioOtpPorId(id) {
    const [rows] = await this.db.query(
      `SELECT id, usuario, correo, COALESCE(admin_otp_completado, 0) AS admin_otp_completado
       FROM trabajadores WHERE id = ?`,
      { replacements: [id] }
    );
    return rows[0] || null;
  }

  async marcarAdminOtpCompletado(id) {
    if (id !== 1) return;
    await this.db.query(
      'UPDATE trabajadores SET admin_otp_completado = 1 WHERE id = 1'
    );
  }

  async existeUsuarioOCorreo(usuario, correo) {
    const [rows] = await this.db.query(
      'SELECT COUNT(*) AS total FROM trabajadores WHERE usuario = ? OR correo = ?',
      { replacements: [usuario, correo] }
    );
    return parseInt(rows[0].total) > 0;
  }

  async actualizarOTP(otp, expiracion, id) {
    await this.db.query(
      'UPDATE trabajadores SET otp_code = ?, otp_expiracion = ? WHERE id = ?',
      { replacements: [otp, expiracion, id] }
    );
  }

  async registrar(usuario, correo, passwordHash, faceDescriptorJson) {
    await this.db.query(
      'INSERT INTO trabajadores (administrador_id, usuario, correo, password, face_descriptor) VALUES (1, ?, ?, ?, ?)',
      { replacements: [usuario, correo, passwordHash, faceDescriptorJson] }
    );
    return true;
  }

  async validarOTP(id, otpIngresado) {
    const [rows] = await this.db.query(
      'SELECT * FROM trabajadores WHERE id = ? AND otp_code = ? AND otp_expiracion > NOW()',
      { replacements: [id, otpIngresado] }
    );
    return rows[0] || null;
  }

  async limpiarOTP(id) {
    await this.db.query(
      'UPDATE trabajadores SET otp_code = NULL, otp_expiracion = NULL WHERE id = ?',
      { replacements: [id] }
    );
  }

  async listarConDescriptorFacial() {
    const [rows] = await this.db.query(
      `SELECT id, usuario, face_descriptor FROM trabajadores
       WHERE face_descriptor IS NOT NULL AND TRIM(face_descriptor) <> ''`
    );
    return rows;
  }

  async listarResumenUsuarios() {
    const [rows] = await this.db.query(
      `SELECT id, usuario, correo,
        IFNULL(fecha_registro, '') AS fecha_registro,
        (CASE WHEN otp_code IS NOT NULL AND otp_expiracion > NOW() THEN 1 ELSE 0 END) AS otp_activo,
        (CASE WHEN face_descriptor IS NOT NULL AND TRIM(face_descriptor) <> '' THEN 1 ELSE 0 END) AS tiene_rostro
       FROM trabajadores ORDER BY id ASC`
    );
    return rows;
  }

  async registrarAcceso(usuarioId, tipoEvento, detalle, ip) {
    try {
      await this.db.query(
        'INSERT INTO accesos_log (usuario_id, tipo_evento, detalle, ip) VALUES (?, ?, ?, ?)',
        { replacements: [usuarioId, tipoEvento, detalle, ip] }
      );
    } catch (e) {}
  }

  async conteoAccesosPorDia(dias = 14) {
    try {
      const [rows] = await this.db.query(
        `SELECT DATE(creado) AS dia, COUNT(*) AS total FROM accesos_log
         WHERE creado >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(dias)} DAY)
         GROUP BY DATE(creado) ORDER BY dia ASC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async conteoAccesosPorDiaUsuario(usuarioId, dias = 14) {
    try {
      const [rows] = await this.db.query(
        `SELECT DATE(creado) AS dia, COUNT(*) AS total FROM accesos_log
         WHERE usuario_id = ? AND creado >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(creado) ORDER BY dia ASC`,
        { replacements: [usuarioId, dias] }
      );
      return rows;
    } catch (e) { return []; }
  }

  async conteoAccesosPorTipo(dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT tipo_evento, COUNT(*) AS total FROM accesos_log
         WHERE creado >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
         GROUP BY tipo_evento ORDER BY total DESC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async conteoAccesosPorTipoUsuario(usuarioId, dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT tipo_evento, COUNT(*) AS total FROM accesos_log
         WHERE usuario_id = ? AND creado >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY tipo_evento ORDER BY total DESC`,
        { replacements: [usuarioId, dias] }
      );
      return rows;
    } catch (e) { return []; }
  }

  // ── Ventas ────────────────────────────────────────────────────────────────

  async ventasPorDia(dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT DATE(fecha_venta) AS dia, COUNT(*) AS total_ventas, SUM(total) AS total_monto
         FROM ventas
         WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(dias)} DAY)
         GROUP BY DATE(fecha_venta) ORDER BY dia ASC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async ventasPorDiaTrabajador(trabajadorId, dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT DATE(fecha_venta) AS dia, COUNT(*) AS total_ventas, SUM(total) AS total_monto
         FROM ventas
         WHERE trabajador_id = ? AND fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(fecha_venta) ORDER BY dia ASC`,
        { replacements: [trabajadorId, dias] }
      );
      return rows;
    } catch (e) { return []; }
  }

  async ventasPorCategoria(dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT p.categoria, COUNT(dv.id) AS total_items, SUM(dv.subtotal) AS total_monto
         FROM detalle_ventas dv
         JOIN producto p ON p.id = dv.producto_id
         JOIN ventas v ON v.id = dv.venta_id
         WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
         GROUP BY p.categoria ORDER BY total_monto DESC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async ventasPorCategoriaTrabajador(trabajadorId, dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT p.categoria, COUNT(dv.id) AS total_items, SUM(dv.subtotal) AS total_monto
         FROM detalle_ventas dv
         JOIN producto p ON p.id = dv.producto_id
         JOIN ventas v ON v.id = dv.venta_id
         WHERE v.trabajador_id = ? AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY p.categoria ORDER BY total_monto DESC`,
        { replacements: [trabajadorId, dias] }
      );
      return rows;
    } catch (e) { return []; }
  }

  async statsVentas() {
    try {
      const [rows] = await this.db.query(
        `SELECT COUNT(*) AS total_ventas, IFNULL(SUM(total), 0) AS total_monto FROM ventas`
      );
      return rows[0];
    } catch (e) { return { total_ventas: 0, total_monto: 0 }; }
  }

  async statsVentasTrabajador(trabajadorId) {
    try {
      const [rows] = await this.db.query(
        `SELECT COUNT(*) AS total_ventas, IFNULL(SUM(total), 0) AS total_monto FROM ventas WHERE trabajador_id = ?`,
        { replacements: [trabajadorId] }
      );
      return rows[0];
    } catch (e) { return { total_ventas: 0, total_monto: 0 }; }
  }

  async eliminarUsuariosSinOtpVerificado() {
    try {
      const [result] = await this.db.query(
        'DELETE FROM trabajadores WHERE otp_code IS NOT NULL AND otp_expiracion < NOW() AND id <> 1'
      );
      return result.affectedRows || 0;
    } catch (e) { return 0; }
  }

  // ── Analítica avanzada ────────────────────────────────────────────────────

  async productosPareto(dias = 90) {
    try {
      const [rows] = await this.db.query(
        `SELECT p.nombre_producto, p.categoria,
           SUM(dv.subtotal) AS ingreso,
           SUM(dv.cantidad) AS unidades
         FROM detalle_ventas dv
         JOIN producto p ON p.id = dv.producto_id
         JOIN ventas v ON v.id = dv.venta_id
         WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
         GROUP BY p.id, p.nombre_producto, p.categoria
         ORDER BY ingreso DESC`
      );
      const total = rows.reduce((s, r) => s + parseFloat(r.ingreso), 0);
      let acum = 0;
      return rows.map(r => {
        acum += parseFloat(r.ingreso);
        return { ...r, pct_acumulado: ((acum / total) * 100).toFixed(1) };
      });
    } catch (e) { return []; }
  }

  async heatmapVentas(trabajadorId, esAdmin, dias = 60) {
    try {
      const whereExtra = esAdmin ? '' : `AND trabajador_id = ${parseInt(trabajadorId)}`;
      const [rows] = await this.db.query(
        `SELECT DAYOFWEEK(fecha_venta) AS dia_semana,
                HOUR(fecha_venta) AS hora,
                COUNT(*) AS total_ventas
         FROM ventas
         WHERE fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
         ${whereExtra}
         GROUP BY dia_semana, hora`
      );
      return rows;
    } catch (e) { return []; }
  }

  async rankingTrabajadores(dias = 30) {
    try {
      const [rows] = await this.db.query(
        `SELECT t.id, t.usuario,
           COUNT(v.id) AS num_ventas,
           IFNULL(SUM(v.total), 0) AS total_monto,
           IFNULL(AVG(v.total), 0) AS ticket_promedio
         FROM trabajadores t
         LEFT JOIN ventas v ON v.trabajador_id = t.id
           AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
         WHERE t.id <> 1
         GROUP BY t.id, t.usuario
         ORDER BY total_monto DESC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async stockCritico(diasVenta = 30, diasUmbral = 15) {
    try {
      const [rows] = await this.db.query(
        `SELECT p.id, p.nombre_producto, p.categoria, p.cantidad AS stock_actual,
           IFNULL(SUM(dv.cantidad), 0) AS vendido_periodo,
           ROUND(IFNULL(SUM(dv.cantidad), 0) / ${parseInt(diasVenta)}, 2) AS vel_dia,
           CASE
             WHEN IFNULL(SUM(dv.cantidad), 0) = 0 THEN 999
             ELSE ROUND(p.cantidad / (IFNULL(SUM(dv.cantidad), 0) / ${parseInt(diasVenta)}))
           END AS dias_restantes
         FROM producto p
         LEFT JOIN detalle_ventas dv ON dv.producto_id = p.id
         LEFT JOIN ventas v ON v.id = dv.venta_id
           AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(diasVenta)} DAY)
         GROUP BY p.id, p.nombre_producto, p.categoria, p.cantidad
         HAVING dias_restantes <= ${parseInt(diasUmbral)}
         ORDER BY dias_restantes ASC`
      );
      return rows;
    } catch (e) { return []; }
  }

  async ventasClientes(trabajadorId, esAdmin, limite = 15) {
    try {
      const where = esAdmin ? '' : `AND v.trabajador_id = ${parseInt(trabajadorId)}`;
      const [rows] = await this.db.query(
        `SELECT v.cliente,
           SUM(v.total) AS total_venta
         FROM ventas v
         WHERE 1=1 ${where}
         GROUP BY v.cliente
         ORDER BY total_venta DESC
         LIMIT ${parseInt(limite)}`
      );
      return rows;
    } catch (e) { return []; }
  }

  async productosMasVendidos(trabajadorId, esAdmin, limite = 10) {
    try {
      const where = esAdmin ? '' : `AND v.trabajador_id = ${parseInt(trabajadorId)}`;
      const [rows] = await this.db.query(
        `SELECT p.nombre_producto, p.categoria,
           SUM(dv.cantidad) AS unidades,
           SUM(dv.subtotal) AS ingreso
         FROM detalle_ventas dv
         JOIN producto p ON p.id = dv.producto_id
         JOIN ventas v ON v.id = dv.venta_id
         WHERE 1=1 ${where}
         GROUP BY p.id, p.nombre_producto, p.categoria
         ORDER BY unidades DESC
         LIMIT ${parseInt(limite)}`
      );
      return rows;
    } catch (e) { return []; }
  }

  async precioVsStock(trabajadorId, esAdmin) {
    try {
      const vendidoSubquery = esAdmin
        ? `SELECT dv.producto_id, SUM(dv.cantidad) AS vendido
             FROM detalle_ventas dv
             GROUP BY dv.producto_id`
        : `SELECT dv.producto_id, SUM(dv.cantidad) AS vendido
             FROM detalle_ventas dv
             JOIN ventas v ON v.id = dv.venta_id
             WHERE v.trabajador_id = ${parseInt(trabajadorId)}
             GROUP BY dv.producto_id`;
      const [rows] = await this.db.query(
        `SELECT p.nombre_producto, p.precio, p.cantidad AS stock, p.categoria,
           IFNULL(vd.vendido, 0) AS vendido
         FROM producto p
         LEFT JOIN (${vendidoSubquery}) vd ON vd.producto_id = p.id
         WHERE p.cantidad > 0
         ORDER BY p.precio DESC
         LIMIT 20`
      );
      return rows;
    } catch (e) { return []; }
  }

  async contarProductos() {
    try {
      const [rows] = await this.db.query('SELECT COUNT(*) AS total FROM producto');
      return rows[0]?.total || 0;
    } catch (e) { return 0; }
  }
}

module.exports = Usuario;
