/**
 * public/js/auth/login.js
 * Vista login: cámara + captura facial y auto-cierre del toast de aviso.
 * Requiere face-api + face-auth cargados antes.
 * Fix: botón de captura deshabilitado hasta que la cámara esté activa.
 */
document.addEventListener("DOMContentLoaded", function () {
  var viewCredentials = document.getElementById("loginCredentialsView");
  var viewFacial      = document.getElementById("loginFacialView");
  var btnShowFace     = document.getElementById("btnShowFaceLogin");
  var btnHideFace     = document.getElementById("btnHideFaceLogin");
  var btnFace         = document.getElementById("btnFaceLogin");

  // Estado del componente: 'credentials' | 'facial'
  var state = 'credentials';

  function renderState() {
    if (state === 'credentials') {
      if (viewCredentials) viewCredentials.style.display = 'block';
      if (viewFacial) viewFacial.style.display = 'none';
      if (typeof faceAuthStopCamera === "function") {
        faceAuthStopCamera("videoLogin");
      }
      if (btnFace) btnFace.disabled = true;
    } else {
      if (viewCredentials) viewCredentials.style.display = 'none';
      if (viewFacial) viewFacial.style.display = 'block';
      if (btnFace) btnFace.disabled = true;
    }
  }

  if (btnShowFace) {
    btnShowFace.addEventListener("click", function () {
      state = 'facial';
      renderState();
    });
  }

  if (btnHideFace) {
    btnHideFace.addEventListener("click", function () {
      state = 'credentials';
      renderState();
    });
  }

  function encenderLogin() {
    faceAuthStopCamera("videoLogin");
    faceAuthInitCamera("videoLogin")
      .then(function () {
        // Cámara activa: habilitar captura
        if (btnFace) btnFace.disabled = false;
        return faceAuthStartLandmarkOverlay("videoLogin", "canvasFaceLogin");
      })
      .catch(function (e) {
        console.error(e);
        showToast(e.message || String(e), "warn");
        // En caso de error mantener deshabilitado
        if (btnFace) btnFace.disabled = true;
      });
  }

  var btnEnc = document.getElementById("btnEncenderLogin");
  if (btnEnc) btnEnc.addEventListener("click", encenderLogin);

  if (btnFace) {
    btnFace.addEventListener("click", function () {
      var btn = this;
      if (btn.disabled) return;
      var label = btn.querySelector(".btn-cta__label");
      var prevLabel = label ? label.textContent : "";
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      if (label) label.textContent = "Analizando rostro…";
      faceAuthCapture("videoLogin", "#faceDescLogin")
        .then(function () {
          if (label) label.textContent = "Entrando…";
          var f = document.getElementById("formFaceLogin");
          if (f) f.submit();
        })
        .catch(function (e) {
          showToast(e.message || String(e), "warn");
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          if (label) label.textContent = prevLabel;
        });
    });
  }

  var toast = document.querySelector(".login-toast");
  if (toast) {
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 8000);
  }
});
