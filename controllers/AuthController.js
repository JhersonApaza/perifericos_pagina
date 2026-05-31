const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
require('dotenv').config();

const UMBRAL_ROSTRO = 0.52;
const ADMIN_USER_ID = 1;
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL;

class AuthController {
  constructor(db) {
    this.modelo = new Usuario(db);
  }

  // ── Utilidades ──────────────────────────────────────────────────────────

  ipCliente(req) {
    return req.ip || req.connection.remoteAddress || '';
  }

  crearTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }

  analizarPassword(p) {
    const ok =
      p.length >= 8 &&
      /[a-z]/.test(p) &&
      /[A-Z]/.test(p) &&
      /[0-9]/.test(p);
    return { ok };
  }

  distanciaDescriptores(a, b) {
    if (a.length !== 128 || b.length !== 128) return null;
    let s = 0;
    for (let i = 0; i < 128; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  normalizarDescriptor(json) {
    if (!json || !json.trim()) return null;
    try {
      const d = JSON.parse(json);
      if (!Array.isArray(d) || d.length !== 128) return null;
      if (!d.every(v => typeof v === 'number' || !isNaN(parseFloat(v)))) return null;
      return d.map(parseFloat);
    } catch {
      return null;
    }
  }

  async notificarIntentoRegistroDuplicado(usuarioIntento, correoIntento, ip) {
    try {
      const transporter = this.crearTransporter();
      const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
      await transporter.sendMail({
        from: `"Sistema Login" <${process.env.SMTP_FROM}>`,
        to: ADMIN_ALERT_EMAIL,
        subject: 'ALERTA: Intento de registro duplicado',
        html: `<h2>Incidente de duplicidad</h2>
               <p>Se intentó registrar un usuario o correo que ya existe.</p>
               <p><b>Usuario intentado:</b> ${usuarioIntento}<br>
               <b>Correo intentado:</b> ${correoIntento}<br>
               <b>Fecha:</b> ${fecha}<br>
               <b>IP:</b> ${ip}</p>`,
      });
    } catch (e) {
      console.error('Mail duplicado admin:', e.message);
    }
  }

  async enviarOtpYRedirigir(req, res, user, detalleLog) {
    const uid = parseInt(user.id);
    const adminOtpHecho = parseInt(user.admin_otp_completado || 0);

    // Admin que ya verificó OTP una vez → entra directo
    if (uid === ADMIN_USER_ID && adminOtpHecho === 1) {
      delete req.session.temp_user_id;
      req.session.user_id = ADMIN_USER_ID;
      await this.modelo.limpiarOTP(ADMIN_USER_ID);
      await this.modelo.registrarAcceso(
        ADMIN_USER_ID, 'login_ok',
        detalleLog + ' (admin, sin OTP tras primera verificación)',
        this.ipCliente(req)
      );
      req.session.toast_ok = 'Sesión iniciada correctamente.';
      return res.redirect('/dashboard');
    }

    delete req.session.user_id;

    // Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiracion = new Date(Date.now() + 5 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    await this.modelo.actualizarOTP(otp, expiracion, uid);
    req.session.temp_user_id = uid;

    const correoDestino = (user.correo || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoDestino || !emailRegex.test(correoDestino)) {
      await this.modelo.limpiarOTP(uid);
      delete req.session.temp_user_id;
      req.session.toast_warn = 'Tu cuenta no tiene un correo válido.';
      return res.redirect('/');
    }

    await this.modelo.registrarAcceso(uid, 'otp_enviado', detalleLog, this.ipCliente(req));

    try {
      const transporter = this.crearTransporter();
      await transporter.sendMail({
        from: `"Sistema Login" <${process.env.SMTP_FROM}>`,
        to: correoDestino,
        subject: 'Codigo de Seguridad OTP',
        html: `Su codigo de seguridad es: <b>${otp}</b>`,
      });
      req.session.toast_ok = 'Te enviamos un código de 6 dígitos. Revísalo en tu correo (también en spam).';
      return res.redirect('/verificar');
    } catch (e) {
      console.error('Nodemailer OTP:', e.message);
      await this.modelo.limpiarOTP(uid);
      delete req.session.temp_user_id;
      req.session.toast_warn = 'Error al enviar el correo. Revisa la contraseña de aplicación de Gmail.';
      return res.redirect('/');
    }
  }

  // ── Acciones ─────────────────────────────────────────────────────────────

  async login(req, res) {
    await this.modelo.eliminarUsuariosSinOtpVerificado();

    if (req.method === 'POST') {
      const { usuario, password } = req.body;
      const user = await this.modelo.obtenerPorNombre(usuario);

      if (user && await bcrypt.compare(password, user.password)) {
        return this.enviarOtpYRedirigir(req, res, user, 'Código OTP tras validar contraseña');
      } else {
        req.session.toast_warn = 'Usuario o contraseña incorrectos.';
        await this.modelo.registrarAcceso(null, 'login_fallido', 'Usuario: ' + (usuario || '').slice(0, 40), this.ipCliente(req));
      }
    }

    const toast_warn = req.session.toast_warn || '';
    const toast_ok = req.session.toast_ok || '';
    delete req.session.toast_warn;
    delete req.session.toast_ok;
    res.render('login/index', { toast_warn, toast_ok });
  }

  async loginFace(req, res) {
    if (req.method !== 'POST') return res.redirect('/');

    const vec = this.normalizarDescriptor(req.body.face_descriptor || '');
    if (!vec) {
      req.session.toast_warn = 'Descriptor facial inválido. Intenta capturar de nuevo.';
    } else {
      const usuarios = await this.modelo.listarConDescriptorFacial();
      let mejorId = null;
      let mejorDist = Infinity;

      for (const fila of usuarios) {
        const almacenado = this.normalizarDescriptor(fila.face_descriptor);
        if (!almacenado) continue;
        const dist = this.distanciaDescriptores(vec, almacenado);
        if (dist !== null && dist < mejorDist) {
          mejorDist = dist;
          mejorId = parseInt(fila.id);
        }
      }

      if (mejorId !== null && mejorDist <= UMBRAL_ROSTRO) {
        const user = await this.modelo.obtenerUsuarioOtpPorId(mejorId);
        if (user) {
          await this.modelo.registrarAcceso(mejorId, 'login_facial_ok', 'Rostro reconocido; OTP enviado', this.ipCliente(req));
          return this.enviarOtpYRedirigir(req, res, user, 'Código OTP tras reconocimiento facial');
        } else {
          req.session.toast_warn = 'No se pudo cargar la cuenta. Intenta de nuevo.';
        }
      } else {
        req.session.toast_warn = 'No se reconoció el rostro o no coincide con ningún usuario registrado.';
        await this.modelo.registrarAcceso(null, 'login_facial_fallido', 'Rostro no reconocido', this.ipCliente(req));
      }
    }

    const toast_warn = req.session.toast_warn || '';
    delete req.session.toast_warn;
    res.render('login/index', { toast_warn, toast_ok: '' });
  }

  async registro(req, res) {
    if (req.method === 'POST') {
      const { usuario, correo, password, confirm_password, face_descriptor } = req.body;
      const usuarioT = (usuario || '').trim();
      const correoT = (correo || '').trim();

      if (password !== confirm_password) {
        req.session.toast_warn = 'Las contraseñas no coinciden.';
      } else {
        const pwdInfo = this.analizarPassword(password);
        if (!pwdInfo.ok) {
          req.session.toast_warn = 'La contraseña no cumple el nivel mínimo requerido.';
        } else if (await this.modelo.existeUsuarioOCorreo(usuarioT, correoT)) {
          await this.notificarIntentoRegistroDuplicado(usuarioT, correoT, this.ipCliente(req));
          await this.modelo.registrarAcceso(null, 'registro_duplicado', `Usuario: ${usuarioT}, correo: ${correoT}`, this.ipCliente(req));
          req.session.toast_warn = 'El usuario o correo ya existen. Se notificó al administrador.';
        } else {
          const vec = this.normalizarDescriptor((face_descriptor || '').trim());
          if (!vec) {
            req.session.toast_warn = 'Debes capturar tu rostro antes de registrarte.';
          } else {
            const passwordHash = await bcrypt.hash(password, 10);
            const descriptorGuardar = JSON.stringify(vec);
            try {
              await this.modelo.registrar(usuarioT, correoT, passwordHash, descriptorGuardar);
              await this.notificarAdmin(usuarioT, correoT);
              await this.modelo.registrarAcceso(null, 'registro_ok', `Usuario: ${usuarioT}`, this.ipCliente(req));
              req.session.toast_ok = 'Registro exitoso. Ya puedes iniciar sesión.';
              return res.redirect('/');
            } catch (e) {
              req.session.toast_warn = e.code === 'ER_DUP_ENTRY'
                ? 'Error en el registro: Usuario duplicado.'
                : 'Error en el registro: Fallo de base de datos.';
            }
          }
        }
      }
    }

    const toast_warn = req.session.toast_warn || '';
    const toast_ok = req.session.toast_ok || '';
    delete req.session.toast_warn;
    delete req.session.toast_ok;
    res.render('registrar/registro', { toast_warn, toast_ok });
  }

  async verificarOtp(req, res) {
    if (!req.session.temp_user_id) return res.redirect('/');

    await this.modelo.eliminarUsuariosSinOtpVerificado();

    const existe = await this.modelo.obtenerPorId(parseInt(req.session.temp_user_id));
    if (!existe) {
      delete req.session.temp_user_id;
      req.session.toast_warn = 'Tu sesión de verificación expiró o la cuenta fue eliminada por no validar el OTP a tiempo.';
      return res.redirect('/');
    }

    if (req.method === 'POST') {
      const otpIngresado = req.body.otp;
      const id = req.session.temp_user_id;

      const user = await this.modelo.validarOTP(id, otpIngresado);
      if (user) {
        await this.modelo.limpiarOTP(id);
        if (id === ADMIN_USER_ID) await this.modelo.marcarAdminOtpCompletado(id);
        req.session.user_id = id;
        delete req.session.temp_user_id;
        await this.modelo.registrarAcceso(id, 'login_otp_ok', 'OTP validado correctamente', this.ipCliente(req));
        req.session.toast_ok = 'Sesión iniciada correctamente.';
        return res.redirect('/dashboard');
      }

      req.session.toast_warn = 'Código inválido o expirado.';
      await this.modelo.registrarAcceso(id, 'otp_fallido', 'Código incorrecto o expirado', this.ipCliente(req));
    }

    const toast_warn = req.session.toast_warn || '';
    const toast_ok = req.session.toast_ok || '';
    delete req.session.toast_warn;
    delete req.session.toast_ok;
    res.render('verificar_OTP/verificar_otp', { toast_warn, toast_ok });
  }

async dashboard(req, res) {
  if (!req.session.user_id) return res.redirect('/');
  const totalProductos = await this.modelo.contarProductos();
  const eliminados = await this.modelo.eliminarUsuariosSinOtpVerificado();
  if (eliminados > 0) {
    req.session.toast_warn = `Se eliminaron ${eliminados} cuenta(s) que no validaron el OTP a tiempo.`;
  }

  const sessionUid = parseInt(req.session.user_id);  // ← se define aquí
  const esAdmin = sessionUid === ADMIN_USER_ID;
  const usuarios = await this.modelo.listarResumenUsuarios();
  const nombreUsuario = (usuarios.find(u => u.id === sessionUid) || {}).usuario || 'Usuario'; 

  // Gráficos originales
  const ventasDia       = await this.modelo.ventasPorDia(30);
  const ventasCategoria = await this.modelo.ventasPorCategoria(30);
  const statsVentas     = await this.modelo.statsVentas();

  // ← Nuevos gráficos VAN AQUÍ, después de sessionUid y esAdmin
  const pareto           = await this.modelo.productosPareto(90);
  const ranking          = await this.modelo.rankingTrabajadores(30);
  const stockAlertas     = await this.modelo.stockCritico(30, 15);
  const heatmap        = await this.modelo.heatmapVentas(sessionUid, true, 60);
  const mlClientes     = await this.modelo.ventasClientes(sessionUid, true, 15);
  const mlTopProductos = await this.modelo.productosMasVendidos(sessionUid, true, 10);
  const mlPrecioStock  = await this.modelo.precioVsStock(sessionUid, true);

  const labelsDia  = ventasDia.map(r => r.dia);
  const dataDia    = ventasDia.map(r => parseFloat(r.total_monto));
  const labelsTipo = ventasCategoria.map(r => r.categoria);
  const dataTipo   = ventasCategoria.map(r => parseFloat(r.total_monto));

  const toast_ok   = req.session.toast_ok   || '';
  const toast_warn = req.session.toast_warn || '';
  delete req.session.toast_ok;
  delete req.session.toast_warn;

  res.render('dashboard/dashboard', {
    es_admin: esAdmin,
    usuarios,
    nombreUsuario,
    labelsDia,
    dataDia,
    labelsTipo,
    dataTipo,
    statsVentas,
    totalProductos: totalProductos,
    pareto,
    heatmap: JSON.stringify(heatmap),
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

  async notificarAdmin(nuevoUsuario, correoUsuario) {
    try {
      const transporter = this.crearTransporter();
      const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
      await transporter.sendMail({
        from: `"Sistema Login" <${process.env.SMTP_FROM}>`,
        to: [ADMIN_ALERT_EMAIL, correoUsuario],
        subject: 'Nuevo Registro en el Sistema',
        html: `Se ha completado un nuevo registro.<br><br>
               <b>Usuario:</b> ${nuevoUsuario}<br>
               <b>Correo:</b> ${correoUsuario}<br>
               <b>Fecha y Hora de registro:</b> ${fecha}`,
      });
    } catch (e) {
      // silencioso
    }
  }
}

module.exports = AuthController;