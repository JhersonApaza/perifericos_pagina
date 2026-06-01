const sequelize = require('./config/database');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected');
    
    const dias = 30;
    const [rows] = await sequelize.query(
      `SELECT p.categoria, COUNT(dv.id) AS total_items, SUM(dv.subtotal) AS total_monto
       FROM detalle_ventas dv
       JOIN producto p ON p.id = dv.producto_id
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${parseInt(dias)} DAY)
       GROUP BY p.categoria ORDER BY total_monto DESC`
    );
    console.log('Query result with NOW():', rows);

    const [rowsCurDate] = await sequelize.query(
      `SELECT p.categoria, COUNT(dv.id) AS total_items, SUM(dv.subtotal) AS total_monto
       FROM detalle_ventas dv
       JOIN producto p ON p.id = dv.producto_id
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ${parseInt(dias)} DAY)
       GROUP BY p.categoria ORDER BY total_monto DESC`
    );
    console.log('Query result with CURDATE():', rowsCurDate);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

test();
