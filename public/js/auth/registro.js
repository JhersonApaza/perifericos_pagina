/**
 * Vista registro: medidor de contraseña y flujo facial.
 * Requiere face-api + face-auth cargados antes.
 */
function analizarPasswordReg(p) {
  var n = 0;
  if (p.length >= 8) n++;
  if (p.length >= 12) n++;
  if (/[a-z]/.test(p)) n++;
  if (/[A-Z]/.test(p)) n++;
  if (/[0-9]/.test(p)) n++;
  if (/[^a-zA-Z0-9]/.test(p)) n++;
  var nivel = 0;
  if (n >= 2) nivel = 1;
  if (n >= 3) nivel = 2;
  if (n >= 4) nivel = 3;
  if (n >= 5) nivel = 4;
  var ok = p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p);
  return { nivel: nivel, ok: ok };
}

document.addEventListener("DOMContentLoaded", function () {
  var pwd = document.getElementById("regPassword");
  var fill = document.getElementById("pwdMeterFill");
  var txt = document.getElementById("pwdMeterText");
  if (pwd && fill && txt) {
    var labels = ["Muy débil", "Débil", "Media", "Buena", "Fuerte"];
    pwd.addEventListener("input", function () {
      if (!pwd.value) {
        fill.className = "pwd-meter-fill";
        txt.textContent = "—";
        return;
      }
      var r = analizarPasswordReg(pwd.value);
      var lv = Math.min(4, Math.max(0, r.nivel));
      fill.className = "pwd-meter-fill n" + lv;
      txt.textContent = labels[lv];
    });
  }

  var btnCam = document.getElementById("btnEncenderReg");
  if (btnCam) {
    btnCam.addEventListener("click", function () {
      faceAuthStopCamera("videoRegistro");
      faceAuthInitCamera("videoRegistro")
        .then(function () {
          return faceAuthStartLandmarkOverlay("videoRegistro", "canvasFaceRegistro");
        })
        .catch(function (e) {
          console.error(e);
          showToast(e.message || String(e), "warn");
        });
    });
  }

  var btnCap = document.getElementById("btnCapturarReg");
  if (btnCap) {
    btnCap.addEventListener("click", function () {
      faceAuthCapture("videoRegistro", "#faceDescReg")
        .then(function () {
          showToast("Rostro capturado con éxito.", "ok");
        })
        .catch(function (e) {
          showToast(e.message || String(e), "warn");
        });
    });
  }

  var form = document.getElementById("formRegistro");
  if (form && pwd) {
    form.addEventListener("submit", function (e) {
      var v = document.getElementById("faceDescReg");
      var val = v ? v.value : "";
      if (!val || val.length < 10) {
        e.preventDefault();
        showToast("Primero debes capturar tu rostro con el botón verde.", "warn");
        return;
      }
      var pr = analizarPasswordReg(pwd.value);
      if (!pr.ok) {
        e.preventDefault();
        showToast("La contraseña no cumple el nivel mínimo requerido.", "warn");
      }
    });
  }
});
