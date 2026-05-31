/**
 * Panel dashboard: toasts y gráficos Chart.js.
 * Datos en <script type="application/json" id="dashboard-bootstrap">.
 */
(function () {

  function readBootstrap() {
    var el = document.getElementById("dashboard-bootstrap");
    if (!el || !String(el.textContent || "").trim()) {
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [], labelsTipo: [], dataTipo: [] };
    }
    try {
      var data = JSON.parse(el.textContent);
      el.remove();
      return data;
    } catch (e) {
      el.remove();
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [], labelsTipo: [], dataTipo: [] };
    }
  }

  function showToast(msg, type) {
    if (!msg) return;
    var c = document.getElementById("toast-container");
    if (!c) return;
    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "ok");
    el.textContent = msg;
    c.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("toast--show"); });
    setTimeout(function () {
      el.classList.remove("toast--show");
      setTimeout(function () { el.remove(); }, 300);
    }, 4500);
  }

  // ─── Gráficos originales ──────────────────────────────────────────────────

  function initCharts(cfg) {
    if (typeof Chart === "undefined") return;

    var chartFont = "'Plus Jakarta Sans', system-ui, sans-serif";
    var tickColor = "#a1a1aa";
    var gridColor = "rgba(255,255,255,0.06)";

    // Ventas por día
    var cd = document.getElementById("chartDias");
    var emptyDias = document.getElementById("emptyDias");
    if (cd && (cfg.labelsDia || []).length) {
      var g = cd.getContext("2d");
      var grad = g.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, "rgba(139, 92, 246, 0.85)");
      grad.addColorStop(1, "rgba(99, 102, 241, 0.35)");
      new Chart(cd, {
        type: "bar",
        data: {
          labels: cfg.labelsDia,
          datasets: [{ label: "Monto S/.", data: cfg.dataDia, backgroundColor: grad, borderRadius: 8, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: "rgba(24,24,27,.95)", padding: 10, cornerRadius: 8, borderColor: "rgba(139,92,246,.4)", borderWidth: 1 }
          },
          scales: {
            x: { ticks: { color: tickColor, font: { family: chartFont, size: 10 } }, grid: { color: gridColor } },
            y: { beginAtZero: true, ticks: { color: tickColor, font: { family: chartFont, size: 10 } }, grid: { color: gridColor } }
          }
        }
      });
    } else if (cd && emptyDias) {
      cd.setAttribute("hidden", "");
      emptyDias.removeAttribute("hidden");
    }

    // Ventas por categoría
    var ct = document.getElementById("chartTipos");
    var emptyTipos = document.getElementById("emptyTipos");
    if (ct && (cfg.labelsTipo || []).length) {
      var palette = ["#8b5cf6","#34d399","#fbbf24","#f87171","#818cf8","#22d3ee","#fb923c","#e879f9"];
      new Chart(ct, {
        type: "doughnut",
        data: {
          labels: cfg.labelsTipo,
          datasets: [{
            data: cfg.dataTipo,
            backgroundColor: cfg.labelsTipo.map(function (_, i) { return palette[i % palette.length]; }),
            borderWidth: 2, borderColor: "#18181b"
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: true, cutout: "58%",
          plugins: {
            legend: { position: "bottom", labels: { color: tickColor, font: { family: chartFont, size: 11 }, padding: 14, usePointStyle: true, pointStyle: "circle" } },
            tooltip: { backgroundColor: "rgba(24,24,27,.95)", padding: 10, cornerRadius: 8 }
          }
        }
      });
    } else if (ct && emptyTipos) {
      ct.setAttribute("hidden", "");
      emptyTipos.removeAttribute("hidden");
    }
  }

  // ─── Pareto ABC ───────────────────────────────────────────────────────────

  function initPareto() {
    var el = document.getElementById("pareto-data");
    if (!el) return;
    var pareto = [];
    try { pareto = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!pareto.length) return;

    var canvas = document.getElementById("chartPareto");
    if (!canvas) return;

    var labels  = pareto.map(function (p) { return p.nombre_producto.length > 14 ? p.nombre_producto.slice(0, 13) + "…" : p.nombre_producto; });
    var ingresos = pareto.map(function (p) { return parseFloat(p.ingreso); });
    var pcts    = pareto.map(function (p) { return parseFloat(p.pct_acumulado); });
    var zonas   = pareto.map(function (p) { return parseFloat(p.pct_acumulado) <= 80 ? "#22c55e" : parseFloat(p.pct_acumulado) <= 95 ? "#f59e0b" : "#ef4444"; });

    var tickColor = "#a1a1aa";
    var gridColor = "rgba(255,255,255,0.06)";

    new Chart(canvas, {
      data: {
        labels: labels,
        datasets: [
          {
            type: "bar",
            label: "Ingreso S/.",
            data: ingresos,
            backgroundColor: zonas,
            borderRadius: 5,
            borderSkipped: false,
            yAxisID: "y",
            order: 2
          },
          {
            type: "line",
            label: "% Acumulado",
            data: pcts,
            borderColor: "#a78bfa",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#a78bfa",
            yAxisID: "y2",
            order: 1,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "rgba(24,24,27,.95)", padding: 10, cornerRadius: 8 }
        },
        scales: {
          x: { ticks: { color: tickColor, font: { size: 10 }, maxRotation: 45, autoSkip: false }, grid: { color: gridColor } },
          y: { position: "left",  ticks: { color: tickColor, font: { size: 10 }, callback: function (v) { return "S/" + v.toLocaleString(); } }, grid: { color: gridColor } },
          y2: { position: "right", min: 0, max: 100, ticks: { color: "#a78bfa", font: { size: 10 }, callback: function (v) { return v + "%"; } }, grid: { display: false } }
        }
      }
    });
  }

  // ─── Ranking trabajadores ─────────────────────────────────────────────────

  function initRanking() {
    var el = document.getElementById("ranking-data");
    if (!el) return;
    var ranking = [];
    try { ranking = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!ranking.length) return;

    var canvas = document.getElementById("chartRanking");
    if (!canvas) return;

    var labels  = ranking.map(function (r) { return r.usuario; });
    var montos  = ranking.map(function (r) { return parseFloat(r.total_monto); });
    var maxM    = montos[0] || 1;
    var colors  = montos.map(function (m, i) {
      var alpha = (0.4 + 0.6 * (m / maxM)).toFixed(2);
      return "rgba(99,102,241," + alpha + ")";
    });

    var tickColor = "#a1a1aa";
    var gridColor = "rgba(255,255,255,0.06)";
    var wrapperH  = Math.max(ranking.length * 48 + 60, 140);
    var wrapper = canvas.parentElement;
    if (wrapper) wrapper.style.height = wrapperH + "px";

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Total S/.",
          data: montos,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(24,24,27,.95)", padding: 10, cornerRadius: 8,
            callbacks: { label: function (ctx) { return "S/ " + ctx.parsed.x.toLocaleString("es-PE", { minimumFractionDigits: 2 }); } }
          }
        },
        scales: {
          x: { ticks: { color: tickColor, font: { size: 10 }, callback: function (v) { return "S/" + v.toLocaleString(); } }, grid: { color: gridColor } },
          y: { ticks: { color: "#e5e7eb", font: { size: 13, weight: "500" } }, grid: { display: false } }
        }
      }
    });
  }

  // ─── Stock crítico ────────────────────────────────────────────────────────

  function initStock() {
    var el = document.getElementById("stock-data");
    if (!el) return;
    var stock = [];
    try { stock = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!stock.length) return;

    var canvas = document.getElementById("chartStock");
    if (!canvas) return;

    var labels  = stock.map(function (s) { return s.nombre_producto.length > 16 ? s.nombre_producto.slice(0, 15) + "…" : s.nombre_producto; });
    var dias    = stock.map(function (s) { return parseInt(s.dias_restantes); });
    var colors  = dias.map(function (d) { return d <= 5 ? "#ef4444" : d <= 10 ? "#f59e0b" : "#eab308"; });

    var tickColor = "#a1a1aa";
    var gridColor = "rgba(255,255,255,0.06)";
    var wrapperH  = Math.max(stock.length * 44 + 60, 120);
    var wrapper = canvas.parentElement;
    if (wrapper) wrapper.style.height = wrapperH + "px";

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Días restantes",
          data: dias,
          backgroundColor: colors,
          borderRadius: 5,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(24,24,27,.95)", padding: 10, cornerRadius: 8,
            callbacks: { label: function (ctx) { return ctx.parsed.y + " días restantes"; } }
          }
        },
        scales: {
          x: { ticks: { color: "#e5e7eb", font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: tickColor, font: { size: 10 }, callback: function (v) { return v + "d"; } }, grid: { color: gridColor } }
        }
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    var cfg = readBootstrap();
    showToast(cfg.toastOk, "ok");
    showToast(cfg.toastWarn, "warn");
    initCharts(cfg);
    initPareto();
    initRanking();
    initStock();
  });

  // ─── ML Tabs ──────────────────────────────────────────────────────────────

function mlTab(btn, id) {
  document.querySelectorAll('.ml-tab').forEach(function(t) {
    t.classList.remove('ml-tab--active');
  });
  document.querySelectorAll('.ml-panel').forEach(function(p) {
    p.classList.remove('ml-panel--active');
  });
  btn.classList.add('ml-tab--active');
  var panel = document.getElementById('ml-tab-' + id);
  if (panel) panel.classList.add('ml-panel--active');

  if (id === 'ventas'    && !window._mlVentasInit)    { initMLVentas();    window._mlVentasInit    = true; }
  if (id === 'productos' && !window._mlProductosInit) { initMLProductos(); window._mlProductosInit = true; }
  if (id === 'ml' && !window._mlMLInit) { initMLCharts(); window._mlMLInit = true; }
}

function mlChartDefaults() {
  return {
    tickColor: '#a1a1aa',
    gridColor: 'rgba(255,255,255,0.06)',
    tooltipCfg: { backgroundColor: 'rgba(24,24,27,.95)', padding: 10, cornerRadius: 8 }
  };
}
function initMLVentas() {
  var d = mlChartDefaults();

  var rawClientes = [];
  try { rawClientes = JSON.parse(document.getElementById('ml-clientes-data').textContent || '[]'); } catch(e){}

  var clientes = rawClientes.map(function(r){ return r.cliente; });
  var totales  = rawClientes.map(function(r){ return parseFloat(r.total_venta); });
  var colors   = totales.map(function(v){ return v > 5000 ? '#8b5cf6' : v > 2500 ? '#34d399' : '#a1a1aa'; });

  var maxVal = totales.length ? Math.max.apply(null, totales) : 0;

  // Métricas dinámicas
  var totalSum  = totales.reduce(function(a,b){ return a+b; }, 0);
  var avgTicket = totales.length ? totalSum / totales.length : 0;
  document.getElementById('ml-stat-total')  && (document.getElementById('ml-stat-total').textContent  = 'S/' + totalSum.toLocaleString('es-PE', {minimumFractionDigits:2}));
  document.getElementById('ml-stat-avg')    && (document.getElementById('ml-stat-avg').textContent    = 'S/' + avgTicket.toLocaleString('es-PE', {minimumFractionDigits:2}));
  document.getElementById('ml-stat-max')    && (document.getElementById('ml-stat-max').textContent    = 'S/' + maxVal.toLocaleString('es-PE', {minimumFractionDigits:2}));

  if (clientes.length) {
    new Chart(document.getElementById('mlChartVentas'), {
      type: 'bar',
      data: { labels: clientes, datasets: [{ label: 'S/.', data: totales, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: d.tooltipCfg },
        scales: {
          x: { ticks: { color: d.tickColor, font: { size: 10 }, maxRotation: 35 }, grid: { color: d.gridColor } },
          y: { ticks: { color: d.tickColor, font: { size: 10 }, callback: function(v){ return 'S/'+v.toLocaleString(); } }, grid: { color: d.gridColor } }
        }
      }
    });
  }

  // Donut distribución por rango (dinámico)
  var alta  = totales.filter(function(v){ return v > 5000; }).length;
  var media = totales.filter(function(v){ return v >= 2000 && v <= 5000; }).length;
  var baja  = totales.filter(function(v){ return v < 2000; }).length;

  new Chart(document.getElementById('mlChartDist'), {
    type: 'doughnut',
    data: {
      labels: ['Alta (>S/5000)', 'Media (S/2000–5000)', 'Baja (<S/2000)'],
      datasets: [{ data: [alta, media, baja], backgroundColor: ['#8b5cf6','#34d399','#a1a1aa'], borderWidth: 2, borderColor: '#18181b' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'bottom', labels: { color: d.tickColor, font: { size: 11 }, padding: 14, usePointStyle: true } },
        tooltip: d.tooltipCfg
      }
    }
  });
}

function initMLProductos() {
  var d = mlChartDefaults();

  var rawTop = [];
  try { rawTop = JSON.parse(document.getElementById('ml-topproductos-data').textContent || '[]'); } catch(e){}

  var rawScatter = [];
  try { rawScatter = JSON.parse(document.getElementById('ml-preciostock-data').textContent || '[]'); } catch(e){}

  // Ingresos por categoría (agrupado desde topProductos)
  var catMap = {};
  rawTop.forEach(function(r){
    var cat = r.categoria || 'Otros';
    catMap[cat] = (catMap[cat] || 0) + parseFloat(r.ingreso);
  });
  var catLabels  = Object.keys(catMap);
  var catData    = catLabels.map(function(k){ return catMap[k]; });
  var palette    = ['#8b5cf6','#34d399','#f59e0b','#f87171','#818cf8','#22d3ee','#fb923c','#e879f9'];

  if (catLabels.length) {
    new Chart(document.getElementById('mlChartCat'), {
      type: 'bar',
      data: {
        labels: catLabels,
        datasets: [{ label: 'S/.', data: catData, backgroundColor: catLabels.map(function(_,i){ return palette[i%palette.length]; }), borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: d.tooltipCfg },
        scales: {
          x: { ticks: { color: d.tickColor, font: { size: 10 }, maxRotation: 35 }, grid: { color: d.gridColor } },
          y: { ticks: { color: d.tickColor, font: { size: 10 }, callback: function(v){ return 'S/'+v.toLocaleString(); } }, grid: { color: d.gridColor } }
        }
      }
    });
  }

  // Scatter precio vs stock (desde BD)
  if (rawScatter.length) {
    var scatterData = rawScatter.map(function(r){
      return { x: parseFloat(r.precio), y: parseInt(r.stock), label: r.nombre_producto };
    });
    new Chart(document.getElementById('mlChartScatter'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Producto',
          data: scatterData,
          backgroundColor: 'rgba(139,92,246,.6)', pointRadius: 9, pointHoverRadius: 12
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: Object.assign({}, d.tooltipCfg, { callbacks: { label: function(ctx){ return ctx.raw.label+' | S/'+ctx.raw.x+' | Stock: '+ctx.raw.y; } } })
        },
        scales: {
          x: { title: { display: true, text: 'Precio (S/.)', color: d.tickColor }, ticks: { color: d.tickColor, font: { size: 10 } }, grid: { color: d.gridColor } },
          y: { title: { display: true, text: 'Stock', color: d.tickColor }, ticks: { color: d.tickColor, font: { size: 10 } }, grid: { color: d.gridColor } }
        }
      }
    });
  }

  // Top productos más vendidos (desde BD)
  var topLabels = rawTop.map(function(r){ return r.nombre_producto.length > 18 ? r.nombre_producto.slice(0,17)+'…' : r.nombre_producto; });
  var topUnids  = rawTop.map(function(r){ return parseInt(r.unidades); });
  var wh = Math.max(topLabels.length * 40 + 80, 200);
  document.getElementById('mlChartTopProd').parentElement.style.height = wh + 'px';

  if (topLabels.length) {
    new Chart(document.getElementById('mlChartTopProd'), {
      type: 'bar',
      data: {
        labels: topLabels,
        datasets: [{ label: 'Unidades', data: topUnids, backgroundColor: 'rgba(139,92,246,.7)', borderRadius: 5, borderSkipped: false }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: d.tooltipCfg },
        scales: {
          x: { ticks: { color: d.tickColor, font: { size: 10 }, stepSize: 1 }, grid: { color: d.gridColor } },
          y: { ticks: { color: '#e5e7eb', font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }
}

// Inicializar tab ventas al cargar
window.mlTab = mlTab;  // ← exponer globalmente
initMLVentas();
window._mlVentasInit = true;

function initMLCharts() {
  var d = mlChartDefaults();

  var rawClientes = [];
  try { rawClientes = JSON.parse(document.getElementById('ml-clientes-data').textContent || '[]'); } catch(e){}
  var rawStock = [];
  try { rawStock = JSON.parse(document.getElementById('stock-data').textContent || '[]'); } catch(e){}
  var rawTop = [];
  try { rawTop = JSON.parse(document.getElementById('ml-topproductos-data').textContent || '[]'); } catch(e){}

  // --- Métricas RFM ---
  var montos = rawClientes.map(function(r){ return parseFloat(r.total_venta); });
  var vip    = montos.filter(function(v){ return v > 5000; }).length;
  var freq   = montos.filter(function(v){ return v >= 2000 && v <= 5000; }).length;
  var ocas   = montos.filter(function(v){ return v < 2000; }).length;
  document.getElementById('ml-rfm-vip')  && (document.getElementById('ml-rfm-vip').textContent  = vip);
  document.getElementById('ml-rfm-freq') && (document.getElementById('ml-rfm-freq').textContent = freq);
  document.getElementById('ml-rfm-ocas') && (document.getElementById('ml-rfm-ocas').textContent = ocas);

  // --- Stock risk ---
  var rawPrecioStock = [];
  try { rawPrecioStock = JSON.parse(document.getElementById('ml-preciostock-data').textContent || '[]'); } catch(e){}

  var stockLabels = rawPrecioStock.map(function(r){ var n = r.nombre_producto; return n.length > 16 ? n.slice(0,15)+'…' : n; });
  var stockVals   = rawPrecioStock.map(function(r){ return parseInt(r.stock); });
  var stockColors = stockVals.map(function(v){ return v <= 5 ? '#ef4444' : v <= 10 ? '#f59e0b' : '#22c55e'; });
  var riesgo = stockVals.filter(function(v){ return v <= 10; }).length;
  document.getElementById('ml-stock-risk') && (document.getElementById('ml-stock-risk').textContent = riesgo);

  var wh1 = Math.max(stockLabels.length * 38 + 60, 200);
  var wrap1 = document.getElementById('mlChartStockRisk');
  if (wrap1) wrap1.parentElement.style.height = wh1 + 'px';

  if (stockLabels.length) {
    new Chart(document.getElementById('mlChartStockRisk'), {
      type: 'bar',
      data: { labels: stockLabels, datasets: [{ label: 'Stock actual', data: stockVals, backgroundColor: stockColors, borderRadius: 4, borderSkipped: false }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: d.tooltipCfg },
        scales: {
          x: { ticks: { color: d.tickColor, font: { size: 10 } }, grid: { color: d.gridColor } },
          y: { ticks: { color: '#e5e7eb', font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }

  // --- RFM barras ---
  var rfmLabels = rawClientes.map(function(r){ return r.cliente; });
  var rfmData   = rawClientes.map(function(r){ return parseFloat(r.total_venta); });
  var rfmColors = rfmData.map(function(v){ return v > 5000 ? '#8b5cf6' : v >= 2000 ? '#22c55e' : '#a1a1aa'; });

  if (rfmLabels.length) {
    new Chart(document.getElementById('mlChartRFM'), {
      type: 'bar',
      data: { labels: rfmLabels, datasets: [{ label: 'S/.', data: rfmData, backgroundColor: rfmColors, borderRadius: 4, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: Object.assign({}, d.tooltipCfg, { callbacks: { label: function(c){ return 'S/' + c.raw.toFixed(2); } } }) },
        scales: {
          x: { ticks: { color: d.tickColor, font: { size: 9 }, maxRotation: 35 }, grid: { color: d.gridColor } },
          y: { ticks: { color: d.tickColor, font: { size: 10 }, callback: function(v){ return 'S/' + v.toLocaleString(); } }, grid: { color: d.gridColor } }
        }
      }
    });
  }

  // --- Proyección (promedio móvil simple) ---
  var totalPorDia = [];
  try {
    var bd = JSON.parse(document.getElementById('dashboard-bootstrap').textContent || '{}');
    if (bd.dataDia) totalPorDia = bd.dataDia.slice(-4);
  } catch(e){}
  var avg = totalPorDia.length ? totalPorDia.reduce(function(a,b){ return a+b; }, 0) / totalPorDia.length : 0;
  var semLabels = ['Sem-4','Sem-3','Sem-2','Sem-1','Proy+1','Proy+2','Proy+3'];
  var reales    = totalPorDia.concat([null, null, null]);
  var proyec    = [null, null, null, totalPorDia[totalPorDia.length-1] || avg, avg * 1.05, avg * 1.08, avg * 1.12];

  new Chart(document.getElementById('mlChartProyec'), {
    type: 'line',
    data: { labels: semLabels, datasets: [
      { label: 'Reales', data: reales, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.12)', borderWidth: 2, pointRadius: 3, fill: true, tension: .3, spanGaps: false },
      { label: 'Proyección', data: proyec, borderColor: '#34d399', borderDash: [6,4], borderWidth: 2, pointRadius: 3, fill: false, tension: .3, spanGaps: false }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: d.tooltipCfg },
      scales: {
        x: { ticks: { color: d.tickColor, font: { size: 10 } }, grid: { color: d.gridColor } },
        y: { ticks: { color: d.tickColor, font: { size: 10 }, callback: function(v){ return 'S/' + v.toLocaleString(); } }, grid: { color: d.gridColor } }
      }
    }
  });

  // --- ABC donut ---
  var totalIngreso = rawTop.reduce(function(a, r){ return a + parseFloat(r.ingreso); }, 0);
  var acum = 0; var cA = 0, cB = 0, cC = 0;
  rawTop.forEach(function(r){
    acum += parseFloat(r.ingreso);
    var pct = totalIngreso > 0 ? (acum / totalIngreso) * 100 : 0;
    if (pct <= 80) cA++; else if (pct <= 95) cB++; else cC++;
  });

  new Chart(document.getElementById('mlChartABC'), {
    type: 'doughnut',
    data: {
      labels: ['A (' + cA + ' prod)', 'B (' + cB + ' prod)', 'C (' + cC + ' prod)'],
      datasets: [{ data: [cA, cB, cC], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 2, borderColor: '#18181b' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'bottom', labels: { color: d.tickColor, font: { size: 11 }, padding: 10, usePointStyle: true } },
        tooltip: d.tooltipCfg
      }
    }
  });
}
})();