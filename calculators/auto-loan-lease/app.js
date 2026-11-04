/**
 * AUTO LOAN VS LEASE CALCULATOR INTERACTIVE LOGIC
 * Dynamic Sliders, Animated Counters, Equity Milestones & Decision Comparison
 */

(function () {
  'use strict';

  // DOM Elements
  const carPriceInput = document.getElementById('carPrice');
  const loanDownInput = document.getElementById('loanDown');
  const loanTermMonthsInput = document.getElementById('loanTermMonths');
  const loanTermChips = document.getElementById('loanTermChips');
  const loanRateInput = document.getElementById('loanRate');
  const leaseDownInput = document.getElementById('leaseDown');
  const residualPctInput = document.getElementById('residualPct');

  const resVerdict = document.getElementById('resVerdict');
  const resVerdictSub = document.getElementById('resVerdictSub');
  const resMonthlyBuy = document.getElementById('resMonthlyBuy');
  const resMonthlyLeaseSub = document.getElementById('resMonthlyLeaseSub');
  const resRetainedEquity = document.getElementById('resRetainedEquity');

  const insLeaseMonthly = document.getElementById('insLeaseMonthly');
  const insBuyMonthly = document.getElementById('insBuyMonthly');
  const insEquity = document.getElementById('insEquity');
  const insNetSavings = document.getElementById('insNetSavings');
  const autoMilestones = document.getElementById('autoMilestones');

  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Scenario & Comparison
  const scenarioNameInput = document.getElementById('scenarioName');
  const comparisonModeBtn = document.getElementById('comparisonModeBtn');
  const comparisonPanel = document.getElementById('comparisonPanel');
  const cmpValA = document.getElementById('cmpValA');
  const cmpValB = document.getElementById('cmpValB');
  const cmpDiff = document.getElementById('cmpDiff');

  const btnAutoBar = document.getElementById('btnAutoBar');
  const btnAutoDonut = document.getElementById('btnAutoDonut');
  const autoExecSummary = document.getElementById('autoExecSummary');
  const autoSensitivityTable = document.getElementById('autoSensitivityTable');

  let currentChartType = 'bar';
  let chartInstance = null;
  let isComparisonActive = false;

  carPriceInput.addEventListener('input', recalculate);
  loanDownInput.addEventListener('input', recalculate);
  loanRateInput.addEventListener('input', recalculate);
  leaseDownInput.addEventListener('input', recalculate);
  residualPctInput.addEventListener('input', recalculate);

  if (scenarioNameInput) {
    scenarioNameInput.addEventListener('input', () => {
      updateChartTitle();
    });
  }

  if (loanTermChips) {
    loanTermChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loanTermChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loanTermMonthsInput.value = btn.getAttribute('data-months');
        recalculate();
      });
    });
  }

  function getInputs() {
    return {
      carPrice: Number(carPriceInput.value) || 42000,
      downPayment: Number(loanDownInput.value) || 5000,
      loanRate: Number(loanRateInput.value) || 6.25,
      loanTermMonths: Number(loanTermMonthsInput.value) || 60,
      leaseDown: Number(leaseDownInput.value) || 2500,
      leaseTermMonths: 36,
      moneyFactor: 0.0026,
      residualValuePct: Number(residualPctInput.value) || 54
    };
  }

  function recalculate() {
    const params = getInputs();
    const res = FinMath.calculateAutoLoanVsLease(params);

    // Update Output Cards
    const curSymbol = FinMetrics.getCurrency().symbol;
    resVerdict.textContent = res.recommendedOption === 'BUY' ? 'BUY VEHICLE' : 'LEASE VEHICLE';
    resVerdict.style.color = res.recommendedOption === 'BUY' ? 'var(--emerald-400)' : 'var(--indigo-400)';
    resVerdictSub.textContent = `Saves ${FinMetrics.formatMoney(res.netDifference)} in net wealth over 3 yrs`;

    if (window.FinCounter) {
      FinCounter.animate(resMonthlyBuy, Math.round(res.monthlyLoanPayment), { prefix: curSymbol, duration: 400 });
      FinCounter.animate(resRetainedEquity, Math.round(res.residualValue), { prefix: curSymbol, duration: 400 });
    } else {
      resMonthlyBuy.textContent = FinMetrics.formatMoney(res.monthlyLoanPayment);
      resRetainedEquity.textContent = FinMetrics.formatMoney(res.residualValue);
    }

    resMonthlyLeaseSub.textContent = `Lease: ${FinMetrics.formatMoney(res.monthlyLeasePayment)}/mo`;

    // Smart Insight
    insLeaseMonthly.textContent = FinMetrics.formatMoney(res.monthlyLeasePayment);
    insBuyMonthly.textContent = FinMetrics.formatMoney(res.monthlyLoanPayment);
    insEquity.textContent = FinMetrics.formatMoney(res.residualValue);
    insNetSavings.textContent = `${FinMetrics.formatMoney(res.netDifference)} cheaper`;

    // Milestones Timeline
    renderAutoMilestones(res, params);

    // Comparison Mode
    const buyPayments36 = params.downPayment + (res.monthlyLoanPayment * 36);
    const buyNetCost = Math.max(0, buyPayments36 - res.residualValue);
    const leaseNetCost = res.totalLeasePaid;

    if (isComparisonActive) {
      cmpValA.textContent = FinMetrics.formatMoney(buyNetCost);
      cmpValB.textContent = FinMetrics.formatMoney(leaseNetCost);
      cmpDiff.textContent = `+${FinMetrics.formatMoney(res.netDifference)}`;
    }

    // Executive Summary & Sensitivity Matrix
    renderAutoExecutiveSummary(res, params, buyPayments36, leaseNetCost);
    renderAutoSensitivityMatrix(params);

    // Chart
    updateChart(res, params, buyPayments36, leaseNetCost);

    // URL Sync
    FinMetrics.syncUrlParams({
      price: params.carPrice,
      ldown: params.downPayment,
      lterm: params.loanTermMonths,
      lrate: params.loanRate,
      leasedown: params.leaseDown,
      res: params.residualValuePct
    });
  }

  function renderAutoMilestones(res, params) {
    if (!autoMilestones) return;
    const targets = [
      { step: 'Start', label: 'Down Payment', sub: FinMetrics.formatMoney(params.downPayment) },
      { step: 'Yr 1', label: '12 Months', sub: 'Depreciation 20%' },
      { step: 'Yr 2', label: '24 Months', sub: 'Principal Paydown' },
      { step: 'Yr 3', label: 'Retained Asset', sub: FinMetrics.formatMoney(res.residualValue) }
    ];

    let html = '';
    targets.forEach((t, i) => {
      html += `
        <div class="milestone-step achieved">
          <div class="milestone-dot">✓</div>
          <div class="milestone-val">${t.label}</div>
          <div class="milestone-sub">${t.sub}</div>
        </div>
      `;
    });

    autoMilestones.innerHTML = html;
  }

  function renderAutoExecutiveSummary(res, params, buyPayments36, leaseNetCost) {
    if (!autoExecSummary) return;
    const isBuy = res.recommendedOption === 'BUY';
    const netSavings = res.netDifference;

    autoExecSummary.innerHTML = `
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div><strong>Strategic Verdict:</strong> ${isBuy ? 'Purchasing (Buying)' : 'Leasing'} is the mathematically superior choice, generating <strong>${FinMetrics.formatMoney(netSavings)}</strong> in net wealth advantage over 36 months.</div>
      </li>
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div>Retained Residual Equity: At month 36, buying leaves you with an estimated <strong>${FinMetrics.formatMoney(res.residualValue)}</strong> in real tangible vehicle equity, whereas a lease leaves you with $0.</div>
      </li>
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div>Monthly Cashflow Delta: Leasing requires <strong>${FinMetrics.formatMoney(res.monthlyLoanPayment - res.monthlyLeasePayment)}/mo less</strong> in immediate cashflow, making it optimal only for business tax deductions or rapid EV turnover.</div>
      </li>
    `;
  }

  function renderAutoSensitivityMatrix(params) {
    if (!autoSensitivityTable) return;
    const terms = [36, 48, 60, 72];

    let headerHtml = `
      <thead>
        <tr>
          <th>Loan Term Horizon</th>
          <th>Monthly Loan Payment</th>
          <th>Total Interest Paid</th>
          <th>Retained Year-3 Equity</th>
          <th>3-Year Net Cost</th>
        </tr>
      </thead>
    `;

    let bodyHtml = '<tbody>';
    terms.forEach(termMonths => {
      const pCopy = Object.assign({}, params, { loanTermMonths: termMonths });
      const aRes = FinMath.calculateAutoLoanVsLease(pCopy);
      const isSelected = params.loanTermMonths === termMonths;
      const payments36 = params.downPayment + (aRes.monthlyLoanPayment * 36);
      const netCost36 = Math.max(0, payments36 - aRes.residualValue);

      bodyHtml += `
        <tr class="${isSelected ? 'matrix-cell-highlight' : ''}">
          <td><strong>${termMonths} Months (${termMonths / 12} yrs)</strong></td>
          <td>${FinMetrics.formatMoney(aRes.monthlyLoanPayment)}/mo</td>
          <td style="color:#ef4444;">${FinMetrics.formatMoney(aRes.totalLoanInterest)}</td>
          <td style="color:var(--emerald-600);font-weight:700;">${FinMetrics.formatMoney(aRes.residualValue)}</td>
          <td><strong>${FinMetrics.formatMoney(netCost36)}</strong></td>
        </tr>
      `;
    });
    bodyHtml += '</tbody>';

    autoSensitivityTable.innerHTML = headerHtml + bodyHtml;
  }

  function updateChart(res, params, buyPayments36, leasePayments36) {
    const canvas = document.getElementById('autoChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    if (currentChartType === 'doughnut') {
      const netBuy = Math.max(0, buyPayments36 - res.residualValue);
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Buy Net Cost (Payments − Equity)', 'Retained Car Equity', 'Lease Net Outflow (Zero Equity)'],
          datasets: [{
            data: [netBuy, res.residualValue, leasePayments36],
            backgroundColor: ['#2563eb', '#059669', '#6366f1'],
            borderWidth: 2,
            borderColor: isDark ? '#111c33' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { color: textColor, font: { weight: '600' } }
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return `${ctx.label}: ${FinMetrics.formatMoney(ctx.parsed)}`;
                }
              }
            }
          }
        }
      });
      return;
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Buy Option (36 Mos)', 'Lease Option (36 Mos)'],
        datasets: [
          {
            label: 'Total Out-of-Pocket Outflow',
            data: [buyPayments36, leasePayments36],
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'Retained Vehicle Equity',
            data: [res.residualValue, 0],
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { weight: '600' } }
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
        },
        plugins: {
          legend: { display: false },
          title: {
            display: scenarioNameInput && !!scenarioNameInput.value,
            text: scenarioNameInput ? scenarioNameInput.value : '',
            color: isDark ? '#f8fafc' : '#0f172a',
            font: { size: 14, weight: 'bold' }
          },
          tooltip: {
            backgroundColor: isDark ? '#0c1222' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? '#1c2742' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (ctx) {
                return `${ctx.dataset.label}: ${FinMetrics.formatMoney(ctx.parsed.y)}`;
              }
            }
          }
        }
      }
    });
  }

  function updateChartTitle() {
    if (chartInstance && scenarioNameInput) {
      chartInstance.options.plugins.title = {
        display: !!scenarioNameInput.value,
        text: scenarioNameInput.value,
        color: document.documentElement.getAttribute('data-theme') !== 'light' ? '#f8fafc' : '#0f172a',
        font: { size: 14, weight: 'bold' }
      };
      chartInstance.update();
    }
  }

  // Comparison Toggle
  if (comparisonModeBtn && comparisonPanel) {
    comparisonModeBtn.addEventListener('click', () => {
      isComparisonActive = !isComparisonActive;
      comparisonPanel.classList.toggle('active', isComparisonActive);
      comparisonModeBtn.classList.toggle('active', isComparisonActive);
      if (isComparisonActive) {
        recalculate();
      }
    });
  }

  // Chart View Toggle
  if (btnAutoBar) {
    btnAutoBar.addEventListener('click', () => {
      currentChartType = 'bar';
      btnAutoBar.classList.add('active');
      if (btnAutoDonut) btnAutoDonut.classList.remove('active');
      recalculate();
    });
  }

  if (btnAutoDonut) {
    btnAutoDonut.addEventListener('click', () => {
      currentChartType = 'doughnut';
      btnAutoDonut.classList.add('active');
      if (btnAutoBar) btnAutoBar.classList.remove('active');
      recalculate();
    });
  }

  // Presets
  const AUTO_PRESETS = {
    sedan: { price: 32000, loanDown: 4000, rate: 5.9, months: 60, leaseDown: 2000, res: 55 },
    suv: { price: 48000, loanDown: 6000, rate: 6.25, months: 60, leaseDown: 3000, res: 52 },
    luxury: { price: 65000, loanDown: 8000, rate: 6.5, months: 60, leaseDown: 4500, res: 49 },
    compact: { price: 22000, loanDown: 2500, rate: 5.5, months: 48, leaseDown: 1500, res: 58 }
  };

  document.querySelectorAll('.preset-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const p = AUTO_PRESETS[btn.getAttribute('data-preset')];
      if (p) {
        carPriceInput.value = p.price;
        loanDownInput.value = p.loanDown;
        loanRateInput.value = p.rate;
        loanTermMonthsInput.value = p.months;
        leaseDownInput.value = p.leaseDown;
        residualPctInput.value = p.res;
        if (loanTermChips) {
          loanTermChips.querySelectorAll('.chip-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-months') === String(p.months));
          });
        }
        recalculate();
        FinMetrics.showToast(`Loaded: ${btn.textContent.trim()} scenario`);
      }
    });
  });

  // Copy link
  copyShareBtn.addEventListener('click', () => {
    FinMetrics.copyShareLink();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    carPriceInput.value = 42000;
    loanDownInput.value = 5000;
    loanRateInput.value = 6.25;
    loanTermMonthsInput.value = 60;
    leaseDownInput.value = 2500;
    residualPctInput.value = 54;
    if (loanTermChips) {
      loanTermChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      loanTermChips.querySelector('[data-months="60"]').classList.add('active');
    }
    recalculate();
  });

  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  // URL Params
  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.price) carPriceInput.value = urlParams.price;
  if (urlParams.ldown) loanDownInput.value = urlParams.ldown;
  if (urlParams.lrate) loanRateInput.value = urlParams.lrate;
  if (urlParams.leasedown) leaseDownInput.value = urlParams.leasedown;
  if (urlParams.res) residualPctInput.value = urlParams.res;
  if (urlParams.lterm) {
    loanTermMonthsInput.value = urlParams.lterm;
    if (loanTermChips) {
      loanTermChips.querySelectorAll('.chip-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-months') === urlParams.lterm);
      });
    }
  }

  recalculate();

})();
