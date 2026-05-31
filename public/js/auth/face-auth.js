(function () {
  /**
   * Muestra una notificación tipo toast en pantalla.
   * @param {string} msg Mensaje a mostrar.
   * @param {'warn'|'ok'} type Tipo de mensaje (estilo ámbar o verde).
   */
  window.showToast = function (msg, type) {
    var toast = document.createElement("div");
    toast.className = "login-toast custom-toast";
    toast.role = "alert";
    toast.textContent = msg;

    // Estilos base (emulando login.css pero inline para asegurar funcionamiento en toda vista)
    toast.style.position = "fixed";
    toast.style.bottom = "1.25rem";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "9999";
    toast.style.padding = "0.85rem 1.1rem";
    toast.style.borderRadius = "4px";
    toast.style.fontSize = "0.875rem";
    toast.style.fontWeight = "500";
    toast.style.boxShadow = "0 12px 40px rgba(0,0,0,0.45)";
    toast.style.backdropFilter = "blur(8px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.maxWidth = "min(380px, 92vw)";

    if (type === "ok") {
      toast.style.background = "rgba(6, 78, 59, 0.95)";
      toast.style.color = "#d1fae5";
      toast.style.border = "1px solid rgba(16, 185, 129, 0.35)";
    } else {
      toast.style.background = "rgba(120, 53, 15, 0.95)";
      toast.style.color = "#fde68a";
      toast.style.border = "1px solid rgba(251, 191, 36, 0.35)";
    }

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(function () {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 5000);
  };
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
  let modelsLoaded = false;

  // 1. Cargar los modelos (Solo lo necesario)
  async function loadModels() {
    if (modelsLoaded) return;
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  }

  // 2. Encender la cámara de forma simple
  window.faceAuthInitCamera = async function (videoId) {
    const video = document.getElementById(videoId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      // Esperar a que el video esté listo para evitar errores de detección
      return new Promise((resolve) => (video.onloadedmetadata = () => resolve(video.play())));
    } catch (err) {
      if (typeof showToast === "function") {
        showToast("Error al abrir la cámara: " + err.message, "warn");
      } else {
        alert("Error al abrir la cámara: " + err.message);
      }
    }
  };

  // 3. Capturar el rostro y guardarlo en un input
  window.faceAuthCapture = async function (videoId, inputSelector) {
    const video = document.getElementById(videoId);
    const input = document.querySelector(inputSelector || 'input[name="face_descriptor"]');
    
    await loadModels();
    
    // Detectar un solo rostro con landmarks y descriptor
    const detection = await faceapi.detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      if (typeof showToast === "function") {
        showToast("No se detecta ningún rostro claro. Intenta ajustar la luz o posición.", "warn");
      } else {
        alert("No se ve ningún rostro.");
      }
      return;
    }

    // Convertir a array simple y guardar como texto JSON
    const descriptorArray = Array.from(detection.descriptor);
    input.value = JSON.stringify(descriptorArray);
    return descriptorArray;
  };

  // 4. Dibujar los puntos (Overlay) de forma sencilla
  window.faceAuthStartLandmarkOverlay = async function (videoId, canvasId) {
    const video = document.getElementById(videoId);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    await loadModels();

    async function loop() {
      // Ajustar tamaño del canvas al video actual
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detection = await faceapi.detectSingleFace(video).withFaceLandmarks();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        // Dibujar cada punto de los landmarks de forma básica
        detection.landmarks.positions.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = "lime";
          ctx.fill();
        });
      }
      // Repetir la función en el próximo frame
      requestAnimationFrame(loop);
    }
    loop();
  };

  // 5. Apagar cámara
  window.faceAuthStopCamera = function (videoId) {
    const video = document.getElementById(videoId);
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };
})();