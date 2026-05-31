(function () {
  function readBootstrap() {
    const el = document.getElementById("dashboard-bootstrap");
    if (!el || !String(el.textContent || "").trim()) {
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [], labelsTipo: [], dataTipo: [] };
    }
    try {
      const data = JSON.parse(el.textContent);
      return data;
    } catch (e) {
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [], labelsTipo: [], dataTipo: [] };
    }
  }

  function showToast(msg, type) {
    if (!msg) return;
    const c = document.getElementById("toast-container");
    if (!c) return;
    
    const isOk = type === "ok";
    const bgClass = isOk ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800";
    const icon = isOk 
      ? `<svg class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : `<svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

    const el = document.createElement("div");
    el.className = `flex items-start gap-3 px-4 py-3 rounded-xl shadow-sm border ${bgClass} transform transition-all duration-300 translate-x-full opacity-0`;
    el.innerHTML = `${icon}<p class="text-sm font-medium pt-0.5">${msg}</p>`;
    
    c.appendChild(el);
    
    // Animate in
    requestAnimationFrame(() => {
      el.classList.remove('translate-x-full', 'opacity-0');
    });

    // Animate out
    setTimeout(() => {
      el.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => el.remove(), 300);
    }, 4500);
  }

  // Common ApexCharts Options
  const commonOptions = {
    chart: {
      fontFamily: "'Inter', sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    theme: { mode: 'light' },
    tooltip: { theme: 'light' },
    grid: {
      borderColor: '#f1f5f9', // slate-100
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    }
  };

  function initCharts(cfg) {
    if (typeof ApexCharts === "undefined") return;

    // 1. Ventas por Día (Area Chart)
    const cd = document.querySelector("#chartDias");
    const emptyDias = document.getElementById("emptyDias");
    if (cd && (cfg.labelsDia || []).length) {
      const options = {
        ...commonOptions,
        series: [{ name: 'Ventas', data: cfg.dataDia }],
        chart: { type: 'area', height: '100%', parentHeightOffset: 0, toolbar: { show: false } },
        colors: ['#6366f1'], // indigo-500
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
          categories: cfg.labelsDia,
          labels: { style: { colors: '#94a3b8' } },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          labels: {
            style: { colors: '#94a3b8' },
            formatter: (value) => 'S/ ' + value
          }
        }
      };
      new ApexCharts(cd, options).render();
    } else if (cd && emptyDias) {
      cd.classList.add("hidden");
      emptyDias.classList.remove("hidden");
    }

    // 2. Ventas por Categoría (Donut Chart)
    const ct = document.querySelector("#chartTipos");
    const emptyTipos = document.getElementById("emptyTipos");
    if (ct && (cfg.labelsTipo || []).length) {
      const options = {
        ...commonOptions,
        series: cfg.dataTipo,
        chart: { type: 'donut', height: '100%' },
        labels: cfg.labelsTipo,
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
        plotOptions: {
          pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total S/.', formatter: function (w) { return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toFixed(2); } } } } }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, colors: '#ffffff', width: 2 },
        legend: { position: 'bottom', horizontalAlign: 'center', markers: { radius: 12 } }
      };
      new ApexCharts(ct, options).render();
    } else if (ct && emptyTipos) {
      ct.classList.add("hidden");
      emptyTipos.classList.remove("hidden");
    }
  }

  // 3. Pareto ABC
  function initPareto() {
    const el = document.getElementById("pareto-data");
    if (!el) return;
    let pareto = [];
    try { pareto = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!pareto.length) return;

    const canvas = document.querySelector("#chartPareto");
    if (!canvas) return;

    const labels = pareto.map(p => p.nombre_producto.length > 14 ? p.nombre_producto.slice(0, 13) + "…" : p.nombre_producto);
    const ingresos = pareto.map(p => parseFloat(p.ingreso));
    const pcts = pareto.map(p => parseFloat(p.pct_acumulado));
    
    // We can't do exact per-bar coloring in ApexCharts easily with mixed charts, so we'll use a single color for bars
    const options = {
      ...commonOptions,
      series: [
        { name: 'Ingreso S/.', type: 'column', data: ingresos },
        { name: '% Acumulado', type: 'line', data: pcts }
      ],
      chart: { height: '100%', type: 'line', toolbar: { show: false } },
      stroke: { width: [0, 2], curve: 'smooth' },
      colors: ['#f59e0b', '#6366f1'], // amber for bars, indigo for line
      labels: labels,
      xaxis: { labels: { style: { colors: '#94a3b8' } } },
      yaxis: [
        { title: { text: 'Ingreso (S/.)' }, labels: { style: { colors: '#94a3b8' }, formatter: (value) => 'S/ ' + value.toFixed(0) } },
        { opposite: true, title: { text: '% Acumulado' }, min: 0, max: 100, labels: { style: { colors: '#94a3b8' }, formatter: (value) => value.toFixed(0) + '%' } }
      ],
      legend: { show: false }
    };
    new ApexCharts(canvas, options).render();
  }

  // 4. Ranking
  function initRanking() {
    const el = document.getElementById("ranking-data");
    if (!el) return;
    let ranking = [];
    try { ranking = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!ranking.length) return;

    const canvas = document.querySelector("#chartRanking");
    if (!canvas) return;

    const labels = ranking.map(r => r.usuario);
    const montos = ranking.map(r => parseFloat(r.total_monto));

    const options = {
      ...commonOptions,
      series: [{ name: 'Ventas S/.', data: montos }],
      chart: { type: 'bar', height: '100%', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
      colors: ['#8b5cf6'], // purple-500
      dataLabels: { enabled: false },
      xaxis: { categories: labels, labels: { style: { colors: '#94a3b8' }, formatter: (value) => 'S/ ' + value } },
      yaxis: { labels: { style: { colors: '#475569', fontWeight: 500 } } }
    };
    new ApexCharts(canvas, options).render();
  }

  // 5. Stock Crítico
  function initStock() {
    const el = document.getElementById("stock-data");
    if (!el) return;
    let stock = [];
    try { stock = JSON.parse(el.textContent || "[]"); } catch (e) { return; }
    if (!stock.length) return;

    const canvas = document.querySelector("#chartStock");
    if (!canvas) return;

    const labels = stock.map(s => s.nombre_producto.length > 16 ? s.nombre_producto.slice(0, 15) + "…" : s.nombre_producto);
    const dias = stock.map(s => parseInt(s.dias_restantes));

    const options = {
      ...commonOptions,
      series: [{ name: 'Días Restantes', data: dias }],
      chart: { type: 'bar', height: '100%', toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 4,
          columnWidth: '40%',
          colors: {
            ranges: [
              { from: 0, to: 5, color: '#ef4444' }, // red
              { from: 6, to: 10, color: '#f59e0b' }, // amber
              { from: 11, to: 15, color: '#eab308' } // yellow
            ]
          }
        }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: labels, labels: { style: { colors: '#64748b', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (value) => value + 'd' } }
    };
    new ApexCharts(canvas, options).render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const cfg = readBootstrap();
    showToast(cfg.toastOk, "ok");
    showToast(cfg.toastWarn, "warn");
    initCharts(cfg);
    initPareto();
    initRanking();
    initStock();
  });
})();