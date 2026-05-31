const Venta = require('../models/Venta');

const ADMIN_USER_ID = 1;

class VentaController {
  constructor(db) {
    this.modelo = new Venta(db);
  }

  sesionActiva(req, res) {
    if (!req.session.user_id) { res.redirect('/'); return false; }
    return true;
  }

  async index(req, res) {
    if (!this.sesionActiva(req, res)) return;
    try {
      const trabajador_id = parseInt(req.session.user_id);
      const es_admin      = trabajador_id === ADMIN_USER_ID;
      const productos = await this.modelo.listarProductos();
        const ventas = await this.modelo.listarVentas(trabajador_id, true);
        const stats  = await this.modelo.statsVentas(trabajador_id, true);
      const toast_ok   = req.session.toast_ok   || '';
      const toast_warn = req.session.toast_warn || '';
      delete req.session.toast_ok;
      delete req.session.toast_warn;
      res.render('ventas/index', { productos, ventas, stats, es_admin, toast_ok, toast_warn });
    } catch (err) {
      console.error('VentaController.index:', err.message);
      res.status(500).send('Error al cargar ventas.');
    }
  }

  async registrar(req, res) {
    if (!this.sesionActiva(req, res)) return;
    try {
      const trabajador_id = parseInt(req.session.user_id);
        const { cliente, notas, items, metodo_pago } = req.body;
      const detalle = typeof items === 'string' ? JSON.parse(items) : items;

      if (!cliente?.trim()) {
        req.session.toast_warn = 'El nombre del cliente es obligatorio.';
        return res.redirect('/ventas');
      }
      if (!detalle?.length) {
        req.session.toast_warn = 'Debes agregar al menos un producto.';
        return res.redirect('/ventas');
      }

      // Verificar stock en BD antes de confirmar
      for (const item of detalle) {
        const prod = await this.modelo.obtenerProductoPorId(item.producto_id);
        if (!prod) {
          req.session.toast_warn = `Producto ID ${item.producto_id} no encontrado.`;
          return res.redirect('/ventas');
        }
        if (prod.cantidad < item.cantidad) {
          req.session.toast_warn = `Stock insuficiente para "${prod.nombre_producto}". Disponible: ${prod.cantidad}.`;
          return res.redirect('/ventas');
        }
      }

      const subtotal = detalle.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
      const total = +subtotal.toFixed(2);

        const detallePreparado = detalle.map(i => {
        const pu = parseFloat(i.precio_unitario);
        const qty = parseInt(i.cantidad);
        return {
            producto_id:     parseInt(i.producto_id),
            cantidad:        qty,
            precio_unitario: pu,
            subtotal:        +( pu * qty ).toFixed(2),
        };
        });

      await this.modelo.descontarStock(detallePreparado);
      const venta_id = await this.modelo.crearVenta(trabajador_id, cliente.trim(), total, notas, metodo_pago);
      await this.modelo.crearDetalles(venta_id, detallePreparado);


      // ── Notificación WhatsApp nueva venta ──────────────────
        try {
        const WEBHOOK_N8N = 'https://jhersonpe.app.n8n.cloud/webhook/nueva-venta';
        await fetch(WEBHOOK_N8N, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venta_id })
        });
        } catch (e) {
        console.warn('WhatsApp webhook error:', e.message);
        }
        // ───────────────────────────────────────────────────────

      req.session.toast_ok = `Venta #${venta_id} registrada. Total: S/ ${total.toFixed(2)}`;
        res.redirect('/dashboard'); 
    } catch (err) {
      console.error('VentaController.registrar:', err.message);
      req.session.toast_warn = 'Error: ' + err.message;
      res.redirect('/ventas');
    }
  }
}

module.exports = VentaController;