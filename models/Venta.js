const { QueryTypes } = require('sequelize');

class Venta {
  constructor(db) {
    this.db = db;
  }

  async listarProductos() {
    return this.db.query(
      `SELECT id, nombre_producto, categoria, marca, precio, cantidad, descripcion
       FROM producto WHERE administrador_id = 1 AND cantidad > 0
       ORDER BY categoria, nombre_producto`,
      { type: QueryTypes.SELECT }
    );
  }

  async obtenerProductoPorId(id) {
    const rows = await this.db.query(
      'SELECT id, nombre_producto, precio, cantidad FROM producto WHERE id = ?',
      { replacements: [id], type: QueryTypes.SELECT }
    );
    return rows[0] || null;
  }

  async descontarStock(items) {
    for (const item of items) {
      const [, meta] = await this.db.query(
        `UPDATE producto SET cantidad = cantidad - ?
         WHERE id = ? AND cantidad >= ?`,
        { replacements: [item.cantidad, item.producto_id, item.cantidad], type: QueryTypes.UPDATE }
      );
      if (meta === 0) {
        throw new Error(`Stock insuficiente para el producto ID ${item.producto_id}`);
      }
    }
  }

  async crearVenta(trabajador_id, cliente, total, notas, metodo_pago) {
    const [result] = await this.db.query(
      `INSERT INTO ventas (administrador_id, trabajador_id, cliente, total, notas, metodo_pago)
       VALUES (1, ?, ?, ?, ?, ?)`,
      { replacements: [trabajador_id, cliente, total, notas || 'Venta realizada', metodo_pago || 'Efectivo'],
        type: QueryTypes.INSERT }
    );
    return result; // INSERT devuelve el insertId directamente
  }

  async crearDetalles(venta_id, items) {
    for (const i of items) {
      await this.db.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        { replacements: [venta_id, i.producto_id, i.cantidad, i.precio_unitario, i.subtotal],
          type: QueryTypes.INSERT }
      );
    }
  }

  async listarVentas(trabajador_id, es_admin) {
    const filtro = es_admin ? '' : 'AND v.trabajador_id = ?';
    const repl   = es_admin ? [] : [trabajador_id];
    return this.db.query(
      `SELECT v.id, v.cliente, v.total, v.notas, v.metodo_pago,
              DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') AS fecha_venta,
              t.usuario AS trabajador
       FROM ventas v
       INNER JOIN trabajadores t ON t.id = v.trabajador_id
       WHERE v.administrador_id = 1 ${filtro}
       ORDER BY v.fecha_venta DESC LIMIT 100`,
      { replacements: repl, type: QueryTypes.SELECT }
    );
  }

  async statsVentas(trabajador_id, es_admin) {
    const filtro = es_admin ? '' : 'AND trabajador_id = ?';
    const repl   = es_admin ? [] : [trabajador_id];
    const rows = await this.db.query(
      `SELECT COUNT(*) AS total_ventas,
              COALESCE(SUM(total), 0) AS ingresos_totales,
              COALESCE(AVG(total), 0) AS ticket_promedio
       FROM ventas WHERE administrador_id = 1 ${filtro}`,
      { replacements: repl, type: QueryTypes.SELECT }
    );
    return rows[0];
  }
}

module.exports = Venta;