/**
 * COMPOUND INTEREST CALCULATOR INTERACTIVE LOGIC
 */

(function () {
  'use strict';

  // DOM Elements
  const initialDepositInput = document.getElementById('initialDeposit');
  const initialDepositSlider = document.getElementById('initialDepositSlider');
  const monthlyDepositInput = document.getElementById('monthlyDeposit');
  const monthlyDepositSlider = document.getElementById('monthlyDepositSlider');
  const yearsInput = document.getElementById('years');
  const yearsSlider = document.getElementById('yearsSlider');
  const yearsDisplay = document.getElementById('yearsDisplay');
  const rateInput = document.getElementById('rate');
  const rateSlider = document.getElementById('rateSlider');
  const inflationInput = document.getElementById('inflation');

  const resEndingBalance = document.getElementById('resEndingBalance');
  const resTotalInterest = document.getElementById('resTotalInterest');
  const resInterestRatio = document.getElementById('resInterestRatio');
  const resRealBalance = document.getElementById('resRealBalance');
  const insInterest = document.getElementById('insInterest');
  const insDeposits = document.getElementById('insDeposits');
  const scheduleBody = document.getElementById('scheduleBody');

  const btnChartArea = document.getElementById('btnChartArea');
  const btnChartBar = document.getElementById('btnChartBar');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  let currentChartType = 'line'; // 'line' (area) or 'bar'
  let chartInstance = null;

  // Sync inputs & sliders
  function bindSliderInputPair(input, slider, isFloat = false) {
    input.addEventListener('input', () => {
      slider.value = input.value;
      recalculate();
    });
    slider.addEventListener('input', () => {
      input.value = isFloat ? Number(slider.value).toFixed(1) : slider.value;
      recalculate();
    });
  }

  bindSliderInputPair(initialDepositInput, initialDepositSlider);
  bindSliderInputPair(monthlyDepositInput, monthlyDepositSlider);
  bindSliderInputPair(yearsInput, yearsSlider);
  bindSliderInputPair(rateInput, rateSlider, true);
  inflationInput.addEventListener('input', recalculate);

  function getInputs() {
    return {
      principal: Number(initialDepositInput.value) || 0,
      monthlyContribution: Number(monthlyDepositInput.value) || 0,
      years: Number(yearsInput.value) || 10,
      annualRate: Number(rateInput.value) || 8.0,
      inflationRate: Number(inflationInput.value) || 2.5,
      compoundFreq: 12
    };
  }

  function recalculate() {
    const params = getInputs();
    yearsDisplay.textContent = `${params.years} Years`;

    const res = FinMath.calculateCompoundInterest(params);

    // Update Output Cards
    resEndingBalance.textContent = FinMetrics.formatMoney(res.finalBalance);
    resTotalInterest.textContent = FinMetrics.formatMoney(res.totalInterest);
    
    const intRatio = res.finalBalance > 0 ? ((res.totalInterest / res.finalBalance) * 100).toFixed(1) : 0;
    resInterestRatio.textContent = `${intRatio}% of portfolio`;

    resRealBalance.textContent = FinMetrics.formatMoney(res.inflationAdjustedBalance);

    insInterest.textContent = FinMetrics.formatMoney(res.totalInterest);
    insDeposits.textContent = FinMetrics.formatMoney(res.totalDeposited);

    // Update Schedule Table
    renderScheduleTable(res.schedule);

    // Update Chart
    updateChart(res);

    // Sync URL params
    FinMetrics.syncUrlParams({
      p: params.principal,
      m: params.monthlyContribution,
      y: params.years,
      r: params.annualRate,
      inf: params.inflationRate
    });
  }

  function renderScheduleTable(schedule) {
    if (!scheduleBody) return;
    scheduleBody.innerHTML = schedule.map(row => `
      <tr>
        <td><strong>Year ${row.year}</strong></td>
        <td>${FinMetrics.formatMoney(row.startBalance)}</td>
        <td>${FinMetrics.formatMoney(row.deposits)}</td>
        <td style="color:var(--emerald-400);font-weight:600;">+${FinMetrics.formatMoney(row.interest)}</td>
        <td><strong>${FinMetrics.formatMoney(row.endBalance)}</strong></td>
        <td style="color:var(--text-secondary);">${FinMetrics.formatMoney(row.purchasingPower)}</td>
      </tr>
    `).join('');
  }

  function updateChart(res) {
    const canvas = document.getElementById('growthChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    const datasets = currentChartType === 'line' ? [
      {
        label: 'Total Balance',
        data: res.balanceData,
        borderColor: '#10b981',
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: res.balanceData.length > 30 ? 0 : 3
      },
      {
        label: 'Total Principal',
        data: res.depositsData,
        borderColor: '#3b82f6',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: res.depositsData.length > 30 ? 0 : 3
      }
    ] : [
      {
        label: 'Principal',
        data: res.depositsData,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'Interest Earned',
        data: res.interestData,
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ];

    chartInstance = new Chart(ctx, {
      type: currentChartType,
      data: {
        labels: res.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#0c1222' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? '#1c2742' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            callbacks: {
              label: function (ctx) {
                return `${ctx.dataset.label}: ${FinMetrics.formatMoney(ctx.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 10 }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: function (val) {
                return FinMetrics.formatMoney(val);
              }
            }
          }
        }
      }
    });
  }

  // Toggle chart style
  btnChartArea.addEventListener('click', () => {
    currentChartType = 'line';
    btnChartArea.classList.add('active');
    btnChartBar.classList.remove('active');
    recalculate();
  });

  btnChartBar.addEventListener('click', () => {
    currentChartType = 'bar';
    btnChartBar.classList.add('active');
    btnChartArea.classList.remove('active');
    recalculate();
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    FinMetrics.exportTableToCSV('growthTable', 'compound-interest-schedule.csv');
  });

  // Copy link
  copyShareBtn.addEventListener('click', () => {
    FinMetrics.copyShareLink();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    initialDepositInput.value = 10000;
    initialDepositSlider.value = 10000;
    monthlyDepositInput.value = 500;
    monthlyDepositSlider.value = 500;
    yearsInput.value = 20;
    yearsSlider.value = 20;
    rateInput.value = 9.5;
    rateSlider.value = 9.5;
    inflationInput.value = 2.8;
    recalculate();
  });

  // Listen to currency & theme changes
  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  // Read URL params if any
  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.p) { initialDepositInput.value = urlParams.p; initialDepositSlider.value = urlParams.p; }
  if (urlParams.m) { monthlyDepositInput.value = urlParams.m; monthlyDepositSlider.value = urlParams.m; }
  if (urlParams.y) { yearsInput.value = urlParams.y; yearsSlider.value = urlParams.y; }
  if (urlParams.r) { rateInput.value = urlParams.r; rateSlider.value = urlParams.r; }
  if (urlParams.inf) { inflationInput.value = urlParams.inf; }

  // Initial Calculation
  recalculate();

})();
