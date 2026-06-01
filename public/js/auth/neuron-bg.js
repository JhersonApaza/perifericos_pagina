/**
 * public/js/auth/neuron-bg.js
 * Fondo animado e interactivo con diseño de red neuronal / biometría facial.
 * Altamente optimizado con requestAnimationFrame y adaptativo a temas claro/oscuro.
 */
(function () {
  const canvas = document.getElementById('neuron-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];
  let mouse = { x: null, y: null, radius: 150 };

  // Ajustar tamaño del canvas al contenedor
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initParticles();
  }

  // Clase de Partícula (Neurona / Nodo)
  class Particle {
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4; // velocidad lenta para elegancia
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1.5;
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;

      // Rebotar en bordes
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;

      // Interacción leve con el mouse
      if (mouse.x !== null && mouse.y !== null) {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 0.5;
          this.y += (dy / dist) * force * 0.5;
        }
      }
    }

    draw(colors) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = colors.node;
      ctx.shadowBlur = 6;
      ctx.shadowColor = colors.shadow;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  // Inicializar partículas
  function initParticles() {
    particles = [];
    // Número proporcional de nodos según el tamaño
    const particleCount = Math.floor((canvas.width * canvas.height) / 9500) || 40;
    const count = Math.min(Math.max(particleCount, 30), 100); // límites seguros para rendimiento

    for (let i = 0; i < count; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }
  }

  // Obtener colores basados en el modo oscuro activo en el body
  function getThemeColors() {
    const isDark = document.body.classList.contains('dark');
    return isDark ? {
      node: 'rgba(167, 139, 250, 0.5)',     // violet-400
      line: 'rgba(99, 102, 241, 0.16)',      // indigo-500
      shadow: 'rgba(139, 92, 246, 0.3)',
      bg: 'rgba(15, 23, 42, 0.85)'
    } : {
      node: 'rgba(79, 70, 229, 0.35)',       // indigo-600
      line: 'rgba(79, 70, 229, 0.08)',
      shadow: 'rgba(79, 70, 229, 0.1)',
      bg: 'rgba(255, 255, 255, 0.7)'
    };
  }

  // Bucle de animación principal
  function animate() {
    const colors = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Actualizar y dibujar conexiones
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(w, h);
      particles[i].draw(colors);

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Conectar si están lo suficientemente cerca
        if (dist < 110) {
          const alpha = (1 - (dist / 110)) * 0.7;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = colors.line.replace('0.16', alpha * 0.16).replace('0.08', alpha * 0.08);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Registrar listeners de eventos
  window.addEventListener('resize', resizeCanvas);
  
  // Agregar interactividad leve
  canvas.parentElement.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Lanzamiento inicial
  resizeCanvas();
  animate();
})();
