/**
 * Vista login: cámara + captura facial y auto-cierre del toast de aviso.
 * Requiere face-api + face-auth cargados antes.
 */
document.addEventListener("DOMContentLoaded", function () {
  var classic = document.getElementById("loginClassicPanel");
  var facePanel = document.getElementById("loginFacePanel");
  var btnShowFace = document.getElementById("btnShowFaceLogin");
  var btnHideFace = document.getElementById("btnHideFaceLogin");

  if (btnShowFace && facePanel && classic) {
    btnShowFace.addEventListener("click", function () {
      classic.setAttribute("hidden", "");
      facePanel.removeAttribute("hidden");
      btnShowFace.setAttribute("aria-expanded", "true");
      facePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
  if (btnHideFace && facePanel && classic) {
    btnHideFace.addEventListener("click", function () {
      if (typeof faceAuthStopCamera === "function") {
        faceAuthStopCamera("videoLogin");
      }
      facePanel.setAttribute("hidden", "");
      classic.removeAttribute("hidden");
      if (btnShowFace) btnShowFace.setAttribute("aria-expanded", "false");
    });
  }

  function encenderLogin() {
    faceAuthStopCamera("videoLogin");
    faceAuthInitCamera("videoLogin")
      .then(function () {
        return faceAuthStartLandmarkOverlay("videoLogin", "canvasFaceLogin");
      })
      .catch(function (e) {
        console.error(e);
        showToast(e.message || String(e), "warn");
      });
  }

  var btnEnc = document.getElementById("btnEncenderLogin");
  if (btnEnc) btnEnc.addEventListener("click", encenderLogin);

  var btnFace = document.getElementById("btnFaceLogin");
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
