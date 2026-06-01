/**
 * public/js/dashboard/dashboard.js
 * Script de inicialización de gráficos y toasts del Dashboard.
 * Optimizado para rendimiento, corrección de bugs de redimensionamiento y soporte dinámico de modo oscuro.
 */
(function () {
  // Registro global de gráficos para sincronización con modo oscuro
  window.chartInstances = [];

  function readBootstrap() {
    const el = document.getElementById("dashboard-bootstrap");
    if (!el || !String(el.textContent || "").trim()) {
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [] };
    }
    try {
      const data = JSON.parse(el.textContent);
      return data;
    } catch (e) {
      return { toastOk: "", toastWarn: "", labelsDia: [], dataDia: [] };
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

  // Opciones base compartidas para ApexCharts
  function getCommonOptions() {
    const isDark = document.body.classList.contains('dark');
    return {
      chart: {
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent'
      },
      theme: { mode: isDark ? 'dark' : 'light' },
      tooltip: { theme: isDark ? 'dark' : 'light' },
      grid: {
        borderColor: isDark ? '#334155' : '#f1f5f9', // slate-700 en modo oscuro, slate-100 en claro
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } }
      }
    };
  }

  function initCharts(cfg) {
    if (typeof ApexCharts === "undefined") return;

    // 1. Ventas por Día (Area Chart) - Altura fija de 300px
    try {
      const cd = document.querySelector("#chartDias");
      const emptyDias = document.getElementById("emptyDias");
      if (cd && (cfg.labelsDia || []).length) {
        const options = {
          ...getCommonOptions(),
          series: [{ name: 'Ventas', data: cfg.dataDia }],
          chart: { ...getCommonOptions().chart, type: 'area', height: 300, parentHeightOffset: 0 },
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
        const chart = new ApexCharts(cd, options);
        chart.render();
        window.chartInstances.push(chart);
      } else if (cd && emptyDias) {
        cd.classList.add("hidden");
        emptyDias.classList.remove("hidden");
      }
    } catch (e) {
      console.error("Error rendering chartDias:", e);
    }
  }

  // 3. Pareto ABC - Altura fija de 320px
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
    
    const options = {
      ...getCommonOptions(),
      series: [
        { name: 'Ingreso S/.', type: 'column', data: ingresos },
        { name: '% Acumulado', type: 'line', data: pcts }
      ],
      chart: { ...getCommonOptions().chart, height: 320, type: 'line' },
      stroke: { width: [0, 2], curve: 'smooth' },
      colors: ['#f59e0b', '#6366f1'], // amber para barras, indigo para línea
      labels: labels,
      xaxis: { labels: { style: { colors: '#94a3b8' } } },
      yaxis: [
        { title: { text: 'Ingreso (S/.)' }, labels: { style: { colors: '#94a3b8' }, formatter: (value) => 'S/ ' + value.toFixed(0) } },
        { opposite: true, title: { text: '% Acumulado' }, min: 0, max: 100, labels: { style: { colors: '#94a3b8' }, formatter: (value) => value.toFixed(0) + '%' } }
      ],
      legend: { show: false }
    };
    const chart = new ApexCharts(canvas, options);
    chart.render();
    window.chartInstances.push(chart);
  }

  // 4. Ranking - Altura fija de 300px
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
      ...getCommonOptions(),
      series: [{ name: 'Ventas S/.', data: montos }],
      chart: { ...getCommonOptions().chart, type: 'bar', height: 300 },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
      colors: ['#8b5cf6'], // purple-500
      dataLabels: { enabled: false },
      xaxis: { categories: labels, labels: { style: { colors: '#94a3b8' }, formatter: (value) => 'S/ ' + value } },
      yaxis: { labels: { style: { colors: document.body.classList.contains('dark') ? '#cbd5e1' : '#475569', fontWeight: 500 } } }
    };
    const chart = new ApexCharts(canvas, options);
    chart.render();
    window.chartInstances.push(chart);
  }

  // 5. Stock Crítico - Altura fija de 240px
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
      ...getCommonOptions(),
      series: [{ name: 'Días Restantes', data: dias }],
      chart: { ...getCommonOptions().chart, type: 'bar', height: 240 },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 4,
          columnWidth: '40%',
          colors: {
            ranges: [
              { from: 0, to: 5, color: '#ef4444' }, // rojo
              { from: 6, to: 10, color: '#f59e0b' }, // ambar
              { from: 11, to: 15, color: '#eab308' } // amarillo
            ]
          }
        }
      },
      dataLabels: { enabled: false },
      xaxis: { categories: labels, labels: { style: { colors: '#64748b', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (value) => value + 'd' } }
    };
    const chart = new ApexCharts(canvas, options);
    chart.render();
    window.chartInstances.push(chart);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const cfg = readBootstrap();
    showToast(cfg.toastOk, "ok");
    showToast(cfg.toastWarn, "warn");
    
    try { initCharts(cfg); } catch (e) { console.error("initCharts failed:", e); }
    try { initPareto(); } catch (e) { console.error("initPareto failed:", e); }
    try { initRanking(); } catch (e) { console.error("initRanking failed:", e); }
    try { initStock(); } catch (e) { console.error("initStock failed:", e); }
    try { initAdvVentas(); } catch (e) { console.error("initAdvVentas failed:", e); }
    window._advVentasInit = true;
  });

  // ══════════════════════════════════════════════════════════
  //  ANÁLISIS AVANZADO  –  tabs + charts
  // ══════════════════════════════════════════════════════════

  window.advTab = function(btn, id) {
    document.querySelectorAll('.adv-tab').forEach(t => t.classList.remove('adv-tab--active'));
    document.querySelectorAll('.adv-panel').forEach(p => p.classList.remove('adv-panel--active'));
    btn.classList.add('adv-tab--active');
    const panel = document.getElementById('adv-panel-' + id);
    if (panel) panel.classList.add('adv-panel--active');
    if (id === 'ventas'    && !window._advVentasInit)    { initAdvVentas();    window._advVentasInit    = true; }
    if (id === 'productos' && !window._advProductosInit) { initAdvProductos(); window._advProductosInit = true; }
    if (id === 'ml'        && !window._advMLInit)        { initAdvML();        window._advMLInit        = true; }
  };

  const ADV = {
    textColor:  '#6b7280',
    gridColor:  '#f3f4f6',
    chartBg:    'transparent',
    fontFamily: 'inherit',
  };

  function readJSON(id) {
    try { return JSON.parse(document.getElementById(id)?.textContent || '[]'); } catch(e) { return []; }
  }

  function advBaseOptions() {
    const isDark = document.body.classList.contains('dark');
    return {
      chart: { background: ADV.chartBg, toolbar: { show: false }, fontFamily: ADV.fontFamily },
      grid:  { borderColor: isDark ? '#334155' : ADV.gridColor, strokeDashArray: 4 },
      theme: { mode: isDark ? 'dark' : 'light' },
      tooltip: { theme: isDark ? 'dark' : 'light' },
      dataLabels: { enabled: false },
    };
  }

  function initAdvVentas() {
    const clientes = readJSON('ml-clientes-data');
    if (!clientes.length) return;
    const labels  = clientes.map(r => r.cliente);
    const totales = clientes.map(r => parseFloat(r.total_venta));
    const colors  = totales.map(v => v > 5000 ? '#8b5cf6' : v > 2500 ? '#10b981' : '#9ca3af');

    // Métricas
    const sum = totales.reduce((a,b) => a+b, 0);
    const avg = totales.length ? sum / totales.length : 0;
    const max = totales.length ? Math.max(...totales) : 0;
    const fmt = n => 'S/' + n.toLocaleString('es-PE', {minimumFractionDigits:2});
    if (document.getElementById('adv-stat-avg')) document.getElementById('adv-stat-avg').textContent = fmt(avg);
    if (document.getElementById('adv-stat-max')) document.getElementById('adv-stat-max').textContent = fmt(max);

    // Barras por cliente - Altura fija
    const elV = document.getElementById('advChartVentas');
    if (elV) {
      const chart = new ApexCharts(elV, {
        ...advBaseOptions(),
        series: [{ name: 'S/.', data: totales }],
        chart: { ...advBaseOptions().chart, type: 'bar', height: 220 },
        colors: colors,
        plotOptions: { bar: { borderRadius: 5, distributed: true, columnWidth: '60%' } },
        legend: { show: false },
        xaxis: { categories: labels, labels: { style: { colors: ADV.textColor, fontSize: '10px' }, rotate: -35 }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: ADV.textColor }, formatter: v => 'S/'+v.toLocaleString() } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // Donut distribución - Altura fija
    const alta  = totales.filter(v => v > 5000).length;
    const media = totales.filter(v => v >= 2000 && v <= 5000).length;
    const baja  = totales.filter(v => v < 2000).length;
    const elD = document.getElementById('advChartDist');
    if (elD) {
      const chart = new ApexCharts(elD, {
        ...advBaseOptions(),
        series: [alta, media, baja],
        chart: { ...advBaseOptions().chart, type: 'donut', height: 200 },
        labels: ['Alta (>S/5000)', 'Media (S/2000–5000)', 'Baja (<S/2000)'],
        colors: ['#8b5cf6', '#10b981', '#9ca3af'],
        legend: { position: 'bottom', fontSize: '11px', labels: { colors: ADV.textColor } },
        plotOptions: { pie: { donut: { size: '58%' } } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }
  }

  function initAdvProductos() {
    const rawTop     = readJSON('ml-topproductos-data');
    const rawScatter = readJSON('ml-preciostock-data');

    // Ingresos por categoría - Altura fija
    const catMap = {};
    rawTop.forEach(r => { const c = r.categoria || 'Otros'; catMap[c] = (catMap[c]||0) + parseFloat(r.ingreso); });
    const catLabels = Object.keys(catMap);
    const catData   = catLabels.map(k => catMap[k]);
    const palette   = ['#8b5cf6','#10b981','#f59e0b','#f87171','#818cf8','#22d3ee','#fb923c','#e879f9'];
    const elC = document.getElementById('advChartCat');
    if (elC && catLabels.length) {
      const chart = new ApexCharts(elC, {
        ...advBaseOptions(),
        series: [{ name: 'S/.', data: catData }],
        chart: { ...advBaseOptions().chart, type: 'bar', height: 240 },
        colors: catLabels.map((_, i) => palette[i % palette.length]),
        plotOptions: { bar: { borderRadius: 5, distributed: true, columnWidth: '55%' } },
        legend: { show: false },
        xaxis: { categories: catLabels, labels: { style: { colors: ADV.textColor, fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: ADV.textColor }, formatter: v => 'S/'+v.toLocaleString() } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // Scatter precio vs stock - Altura fija
    const elS = document.getElementById('advChartScatter');
    if (elS && rawScatter.length) {
      const chart = new ApexCharts(elS, {
        ...advBaseOptions(),
        series: [{ name: 'Producto', data: rawScatter.map(r => ({ x: parseFloat(r.precio), y: parseInt(r.stock), z: r.nombre_producto })) }],
        chart: { ...advBaseOptions().chart, type: 'scatter', height: 240 },
        colors: ['#8b5cf6'],
        markers: { size: 8, hover: { size: 11 } },
        xaxis: { title: { text: 'Precio (S/.)', style: { color: ADV.textColor } }, labels: { style: { colors: ADV.textColor } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { title: { text: 'Stock', style: { color: ADV.textColor } }, labels: { style: { colors: ADV.textColor } } },
        tooltip: { ...advBaseOptions().tooltip, custom: ({ seriesIndex, dataPointIndex, w }) => {
          const p = w.config.series[seriesIndex].data[dataPointIndex];
          return `<div class="p-2 text-xs text-gray-900 bg-white border border-gray-100 rounded-lg shadow-sm">${p.z}<br>S/${p.x} · Stock: ${p.y}</div>`;
        }},
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // Top productos horizontal - Altura dinámica adaptada pero fija en el render
    const elT = document.getElementById('advChartTopProd');
    if (elT && rawTop.length) {
      const topLabels = rawTop.map(r => r.nombre_producto.length > 18 ? r.nombre_producto.slice(0,17)+'…' : r.nombre_producto);
      const topUnids  = rawTop.map(r => parseInt(r.unidades));
      const dynH = Math.max(topLabels.length * 40 + 60, 240);
      elT.style.height = dynH + 'px';
      const chart = new ApexCharts(elT, {
        ...advBaseOptions(),
        series: [{ name: 'Unidades', data: topUnids }],
        chart: { ...advBaseOptions().chart, type: 'bar', height: dynH },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
        colors: ['#8b5cf6'],
        xaxis: { categories: topLabels, labels: { style: { colors: ADV.textColor, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: document.body.classList.contains('dark') ? '#cbd5e1' : '#374151', fontSize: '11px' } } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }
  }

  function initAdvML() {
    const rawClientes    = readJSON('ml-clientes-data');
    const rawPrecioStock = readJSON('ml-preciostock-data');
    const rawTop         = readJSON('ml-topproductos-data');

    // Métricas RFM
    const montos = rawClientes.map(r => parseFloat(r.total_venta));
    const vip  = montos.filter(v => v > 5000).length;
    const freq = montos.filter(v => v >= 2000 && v <= 5000).length;
    const ocas = montos.filter(v => v < 2000).length;
    if (document.getElementById('adv-rfm-vip'))   document.getElementById('adv-rfm-vip').textContent  = vip;
    if (document.getElementById('adv-rfm-freq'))  document.getElementById('adv-rfm-freq').textContent = freq;
    if (document.getElementById('adv-rfm-ocas'))  document.getElementById('adv-rfm-ocas').textContent = ocas;

    // Stock risk
    const stockLabels = rawPrecioStock.map(r => { const n=r.nombre_producto; return n.length>16?n.slice(0,15)+'…':n; });
    const stockVals   = rawPrecioStock.map(r => parseInt(r.stock));
    const riesgo = stockVals.filter(v => v <= 10).length;
    if (document.getElementById('adv-stock-risk')) document.getElementById('adv-stock-risk').textContent = riesgo;

    const elSR = document.getElementById('advChartStockRisk');
    if (elSR && stockLabels.length) {
      const dynH = Math.max(stockLabels.length * 36 + 60, 260);
      elSR.style.height = dynH + 'px';
      const chart = new ApexCharts(elSR, {
        ...advBaseOptions(),
        series: [{ name: 'Stock', data: stockVals }],
        chart: { ...advBaseOptions().chart, type: 'bar', height: dynH },
        colors: stockVals.map(v => v <= 5 ? '#ef4444' : v <= 10 ? '#f59e0b' : '#10b981'),
        plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true, barHeight: '60%' } },
        legend: { show: false },
        xaxis: { categories: stockLabels, labels: { style: { colors: ADV.textColor, fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: document.body.classList.contains('dark') ? '#cbd5e1' : '#374151', fontSize: '10px' } } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // RFM barras - Altura fija
    const elRFM = document.getElementById('advChartRFM');
    if (elRFM && rawClientes.length) {
      const rfmColors = montos.map(v => v > 5000 ? '#8b5cf6' : v >= 2000 ? '#10b981' : '#9ca3af');
      const chart = new ApexCharts(elRFM, {
        ...advBaseOptions(),
        series: [{ name: 'S/.', data: montos }],
        chart: { ...advBaseOptions().chart, type: 'bar', height: 220 },
        colors: rfmColors,
        plotOptions: { bar: { borderRadius: 4, distributed: true, columnWidth: '60%' } },
        legend: { show: false },
        xaxis: { categories: rawClientes.map(r => r.cliente), labels: { style: { colors: ADV.textColor, fontSize: '9px' }, rotate: -35 }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: ADV.textColor }, formatter: v => 'S/'+v.toLocaleString() } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // Proyección - Altura fija
    let dataDia = [];
    try { const bd = JSON.parse(document.getElementById('dashboard-bootstrap')?.textContent || '{}'); dataDia = (bd.dataDia || []).slice(-4); } catch(e){}
    const avgD = dataDia.length ? dataDia.reduce((a,b)=>a+b,0)/dataDia.length : 0;
    const semLabels = ['Sem-4','Sem-3','Sem-2','Sem-1','Proy+1','Proy+2','Proy+3'];
    const reales  = [...dataDia, null, null, null];
    const proyec  = [null, null, null, dataDia[dataDia.length-1]||avgD, avgD*1.05, avgD*1.08, avgD*1.12];
    const elPr = document.getElementById('advChartProyec');
    if (elPr) {
      const chart = new ApexCharts(elPr, {
        ...advBaseOptions(),
        series: [
          { name: 'Reales',     data: reales },
          { name: 'Proyección', data: proyec }
        ],
        chart: { ...advBaseOptions().chart, type: 'line', height: 180 },
        colors: ['#6366f1', '#10b981'],
        stroke: { width: 2, curve: 'smooth', dashArray: [0, 6] },
        markers: { size: 3 },
        xaxis: { categories: semLabels, labels: { style: { colors: ADV.textColor, fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: ADV.textColor }, formatter: v => v ? 'S/'+v.toLocaleString() : '' } },
        legend: { fontSize: '11px', labels: { colors: ADV.textColor } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }

    // ABC donut - Altura fija
    const totalIng = rawTop.reduce((a,r) => a+parseFloat(r.ingreso), 0);
    let acum=0, cA=0, cB=0, cC=0;
    rawTop.forEach(r => {
      acum += parseFloat(r.ingreso);
      const pct = totalIng > 0 ? acum/totalIng*100 : 0;
      if (pct<=80) cA++; else if(pct<=95) cB++; else cC++;
    });
    const elABC = document.getElementById('advChartABC');
    if (elABC) {
      const chart = new ApexCharts(elABC, {
        chart: {
          type: 'donut',
          height: 180,
          fontFamily: advBaseOptions().chart.fontFamily,
          background: advBaseOptions().chart.background,
          toolbar: { show: false }
        },
        theme: advBaseOptions().theme,
        tooltip: advBaseOptions().tooltip,
        series: [cA, cB, cC],
        labels: [`A (${cA} prod)`, `B (${cB} prod)`, `C (${cC} prod)`],
        colors: ['#10b981', '#f59e0b', '#ef4444'],
        legend: { position: 'bottom', fontSize: '11px', labels: { colors: ADV.textColor } },
        plotOptions: { pie: { donut: { size: '58%' } } },
      });
      chart.render();
      window.chartInstances.push(chart);
    }
  }
})();