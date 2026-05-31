/**
 * shared/middleware/errorHandler.js
 * Middleware de manejo de errores centralizado.
 * Debe registrarse DESPUÉS de todas las rutas en app.js.
 */

function errorHandler(err, req, res, next) {
  console.error('[Global Error Handler]:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ha ocurrido un error inesperado en el servidor.';

  res.status(statusCode).render('components/error', {
    message,
    statusCode,
  });
}

module.exports = errorHandler;
