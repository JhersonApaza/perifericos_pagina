/**
 * shared/middleware/auth.middleware.js
 * Guards de sesión reutilizables entre features.
 */

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user_id) {
    return next();
  }
  req.session.toast_warn = 'Debes iniciar sesión para acceder.';
  res.redirect('/');
}

module.exports = { isAuthenticated };
