/**
 * MORTGAGE PAYOFF CALCULATOR INTERACTIVE LOGIC
 * Dynamic Sliders, Animated Counters, Equity Milestones & Comparison Matrix
 */

(function () {
  'use strict';

  // DOM Elements
  const homePriceInput = document.getElementById('homePrice');
  const downPaymentInput = document.getElementById('downPayment');
  const downPaymentPctBadge = document.getElementById('downPaymentPctBadge');
  const loanTermYearsInput = document.getElementById('loanTermYears');
  const loanTermChips = document.getElementById('loanTermChips');
  const interestRateInput = document.getElementById('interestRate');
  const interestRateSlider = document.getElementById('interestRateSlider');
  const extraMonthlyInput = document.getElementById('extraMonthly');
  const extraMonthlySlider = document.getElementById('extraMonthlySlider');
  const propTaxInput = document.getElementById('propTax');
  const homeInsInput = document.getElementById('homeIns');
  const hoaInput = document.getElementById('hoa');

  const resInterestSaved = document.getElementById('resInterestSaved');
  const resTimeSaved = document.getElementById('resTimeSaved');
  const resMonthlyPayment = document.getElementById('resMonthlyPayment');
  const resPISplit = document.getElementById('resPISplit');
  const resLoanAmount = document.getElementById('resLoanAmount');

  const insExtra = document.getElementById('insExtra');
  const insYears = document.getElementById('insYears');
  const insSavings = document.getElementById('insSavings');
  const scheduleBody = document.getElementById('scheduleBody');
  const mortgageMilestones = document.getElementById('mortgageMilestones');

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Scenario & Comparison
  const scenarioNameInput = document.getElementById('scenarioName');
  const comparisonModeBtn = document.getElementById('comparisonModeBtn');
  const comparisonPanel = document.getElementById('comparisonPanel');
  const cmpValA = document.getElementById('cmpValA');
  const cmpValB = document.getElementById('cmpValB');
  const cmpDiff = document.getElementById('cmpDiff');

  let chartInstance = null;
  let isComparisonActive = false;

  // Sync inputs & sliders
  function bindSliderInputPair(input, slider, isFloat = false) {
    input.addEventListener('input', () => {
      slider.value = input.value;
      recalculate();
    });
    slider.addEventListener('input', () => {
      input.value = isFloat ? Number(slider.value).toFixed(2) : slider.value;
      recalculate();
    });
  }

  bindSliderInputPair(interestRateInput, interestRateSlider, true);
  bindSliderInputPair(extraMonthlyInput, extraMonthlySlider);

  homePriceInput.addEventListener('input', () => {
    updateDownPaymentPct();
    recalculate();
  });

  downPaymentInput.addEventListener('input', () => {
    updateDownPaymentPct();
    recalculate();
  });

  propTaxInput.addEventListener('input', recalculate);
  homeInsInput.addEventListener('input', recalculate);
  hoaInput.addEventListener('input', recalculate);

  if (scenarioNameInput) {
    scenarioNameInput.addEventListener('input', () => {
      updateChartTitle();
    });
  }

  function updateDownPaymentPct() {
    const price = Number(homePriceInput.value) || 1;
    const down = Number(downPaymentInput.value) || 0;
    const pct = ((down / price) * 100).toFixed(1);
    downPaymentPctBadge.textContent = `${pct}%`;
  }

  // Loan Term Chips
  if (loanTermChips) {
    loanTermChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loanTermChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loanTermYearsInput.value = btn.getAttribute('data-years');
        recalculate();
      });
    });
  }

  function getInputs() {
    return {
      homePrice: Number(homePriceInput.value) || 450000,
      downPayment: Number(downPaymentInput.value) || 90000,
      interestRate: Number(interestRateInput.value) || 6.75,
      loanTermYears: Number(loanTermYearsInput.value) || 30,
      extraMonthly: Number(extraMonthlyInput.value) || 0,
      propertyTaxAnnual: Number(propTaxInput.value) || 5400,
      homeInsuranceAnnual: Number(homeInsInput.value) || 1400,
      hoaMonthly: Number(hoaInput.value) || 0
    };
  }

  function recalculate() {
    const params = getInputs();
    const res = FinMath.calculateMortgage(params);

    // Animated Key Metrics
    const curSymbol = FinMetrics.getCurrency().symbol;
    if (window.FinCounter) {
      FinCounter.animate(resInterestSaved, Math.round(res.interestSaved), { prefix: curSymbol, duration: 400 });
      FinCounter.animate(resMonthlyPayment, Math.round(res.totalMonthlyPayment), { prefix: curSymbol, duration: 400 });
      FinCounter.animate(resLoanAmount, Math.round(res.loanAmount), { prefix: curSymbol, duration: 400 });
    } else {
      resInterestSaved.textContent = FinMetrics.formatMoney(res.interestSaved);
      resMonthlyPayment.textContent = FinMetrics.formatMoney(res.totalMonthlyPayment);
      resLoanAmount.textContent = FinMetrics.formatMoney(res.loanAmount);
    }

    resTimeSaved.textContent = res.yearsSaved > 0 
      ? `Pay off ${res.yearsSaved} years earlier`
      : 'Standard loan schedule';

    const escrowTotal = (res.monthlyTax + res.monthlyInsurance + res.hoaMonthly);
    resPISplit.textContent = `P&I: ${FinMetrics.formatMoney(res.monthlyPI + params.extraMonthly)} | Escrow: ${FinMetrics.formatMoney(escrowTotal)}`;

    // Smart Insight Text
    insExtra.textContent = `${FinMetrics.formatMoney(params.extraMonthly)}/mo`;
    const payoffYears = (res.monthsToPayoff / 12).toFixed(1);
    insYears.textContent = `${payoffYears} years`;
    insSavings.textContent = FinMetrics.formatMoney(res.interestSaved);

    // Milestones Timeline
    renderMortgageMilestones(res, params);

    // Comparison Mode
    if (isComparisonActive) {
      cmpValA.textContent = FinMetrics.formatMoney(res.totalInterest);
      cmpValB.textContent = FinMetrics.formatMoney(res.standardTotalInterest);
      cmpDiff.textContent = `+${FinMetrics.formatMoney(res.interestSaved)}`;
    }

    // Schedule Table
    renderScheduleTable(res.yearlySummary);

    // Chart
    updateChart(res, params);

    // URL Sync
    FinMetrics.syncUrlParams({
      price: params.homePrice,
      down: params.downPayment,
      term: params.loanTermYears,
      rate: params.interestRate,
      extra: params.extraMonthly
    });
  }

  function renderMortgageMilestones(res, params) {
    if (!mortgageMilestones) return;
    const loan = res.loanAmount;
    const targets = [
      { pct: 0.25, label: '25% Equity' },
      { pct: 0.50, label: '50% Halfway' },
      { pct: 0.75, label: '75% Equity' },
      { pct: 1.00, label: '100% Debt-Free' }
    ];

    let html = '';
    targets.forEach(t => {
      const targetBalance = loan * (1 - t.pct);
      const row = res.yearlySummary.find(r => r.endBalance <= targetBalance);
      const isAchieved = !!row;
      const yearText = isAchieved ? `Year ${row.yearNum}` : `${(res.monthsToPayoff / 12).toFixed(1)} Yrs`;

      html += `
        <div class="milestone-step ${isAchieved ? 'achieved' : ''}">
          <div class="milestone-dot">${isAchieved ? '✓' : '○'}</div>
          <div class="milestone-val">${t.label}</div>
          <div class="milestone-sub">${yearText}</div>
        </div>
      `;
    });

    mortgageMilestones.innerHTML = html;
  }

  function renderScheduleTable(summary) {
    if (!scheduleBody) return;
    scheduleBody.innerHTML = summary.map(row => `
      <tr>
        <td><strong>Year ${row.yearNum}</strong></td>
        <td>${row.calendarYear}</td>
        <td>${FinMetrics.formatMoney(row.principalPaid)}</td>
        <td style="color:#ef4444;">${FinMetrics.formatMoney(row.interestPaid)}</td>
        <td><strong>${FinMetrics.formatMoney(row.endBalance)}</strong></td>
      </tr>
    `).join('');
  }

  function updateChart(res, params) {
    const canvas = document.getElementById('mortgageChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Standard Loan', 'Accelerated (With Extra)'],
        datasets: [
          {
            label: 'Original Principal',
            data: [res.loanAmount, res.loanAmount],
            backgroundColor: '#3b82f6',
            stack: 'Stack 0'
          },
          {
            label: 'Total Interest Paid',
            data: [res.standardTotalInterest, res.totalInterest],
            backgroundColor: '#ef4444',
            stack: 'Stack 0'
          },
          {
            label: 'Interest Saved',
            data: [0, res.interestSaved],
            backgroundColor: '#10b981',
            stack: 'Stack 0'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            callbacks: {
              label: function (ctx) {
                return `${ctx.dataset.label}: ${FinMetrics.formatMoney(ctx.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            stacked: true,
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

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    FinMetrics.exportTableToCSV('mortgageTable', 'mortgage-payoff-schedule.csv');
  });

  // Copy link
  copyShareBtn.addEventListener('click', () => {
    FinMetrics.copyShareLink();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    homePriceInput.value = 450000;
    downPaymentInput.value = 90000;
    interestRateInput.value = 6.75;
    interestRateSlider.value = 6.75;
    extraMonthlyInput.value = 250;
    extraMonthlySlider.value = 250;
    loanTermYearsInput.value = 30;
    if (loanTermChips) {
      loanTermChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      loanTermChips.querySelector('[data-years="30"]').classList.add('active');
    }
    updateDownPaymentPct();
    recalculate();
  });

  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  // URL Params
  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.price) homePriceInput.value = urlParams.price;
  if (urlParams.down) downPaymentInput.value = urlParams.down;
  if (urlParams.rate) { interestRateInput.value = urlParams.rate; interestRateSlider.value = urlParams.rate; }
  if (urlParams.extra) { extraMonthlyInput.value = urlParams.extra; extraMonthlySlider.value = urlParams.extra; }
  if (urlParams.term) {
    loanTermYearsInput.value = urlParams.term;
    if (loanTermChips) {
      loanTermChips.querySelectorAll('.chip-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-years') === urlParams.term);
      });
    }
  }

  updateDownPaymentPct();
  recalculate();

})();
