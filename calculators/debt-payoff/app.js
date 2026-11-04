/**
 * DEBT PAYOFF CALCULATOR INTERACTIVE LOGIC
 * Dynamic Sliders, Animated Metrics, Freedom Milestones & Comparison Matrix
 */

(function () {
  'use strict';

  // DOM Elements
  const balanceInput = document.getElementById('balance');
  const balanceSlider = document.getElementById('balanceSlider');
  const aprInput = document.getElementById('apr');
  const aprSlider = document.getElementById('aprSlider');
  const monthlyPaymentInput = document.getElementById('monthlyPayment');
  const monthlyPaymentSlider = document.getElementById('monthlyPaymentSlider');
  const targetPaymentChips = document.getElementById('targetPaymentChips');

  const resPayoffDate = document.getElementById('resPayoffDate');
  const resTotalMonths = document.getElementById('resTotalMonths');
  const resInterestSaved = document.getElementById('resInterestSaved');
  const resTotalInterest = document.getElementById('resTotalInterest');
  const resTotalPaid = document.getElementById('resTotalPaid');

  const insPayment = document.getElementById('insPayment');
  const insTime = document.getElementById('insTime');
  const insSavings = document.getElementById('insSavings');
  const scheduleBody = document.getElementById('scheduleBody');
  const debtMilestones = document.getElementById('debtMilestones');

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

  const btnDebtLine = document.getElementById('btnDebtLine');
  const btnDebtDonut = document.getElementById('btnDebtDonut');
  const debtExecSummary = document.getElementById('debtExecSummary');
  const debtSensitivityTable = document.getElementById('debtSensitivityTable');

  let currentChartType = 'line';
  let chartInstance = null;
  let isComparisonActive = false;

  // Bind inputs and sliders
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

  bindSliderInputPair(balanceInput, balanceSlider);
  bindSliderInputPair(aprInput, aprSlider, true);
  bindSliderInputPair(monthlyPaymentInput, monthlyPaymentSlider);

  if (scenarioNameInput) {
    scenarioNameInput.addEventListener('input', () => {
      updateChartTitle();
    });
  }

  // Target Payment Chips
  if (targetPaymentChips) {
    targetPaymentChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        targetPaymentChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const add = Number(btn.getAttribute('data-add')) || 50;
        monthlyPaymentInput.value = (Number(monthlyPaymentInput.value) || 300) + add;
        monthlyPaymentSlider.value = monthlyPaymentInput.value;
        recalculate();
      });
    });
  }

  function getInputs() {
    return {
      balance: Number(balanceInput.value) || 12000,
      apr: Number(aprInput.value) || 22.9,
      monthlyPayment: Number(monthlyPaymentInput.value) || 450
    };
  }

  function recalculate() {
    const params = getInputs();
    const res = FinMath.calculateDebtPayoff(params);

    if (res.error) {
      FinMetrics.showToast(res.error, true);
      return;
    }

    // Animated Key Metrics
    const curSymbol = FinMetrics.getCurrency().symbol;
    resPayoffDate.textContent = res.payoffDate;
    resTotalMonths.textContent = `In ${res.targetMonths} Months (${(res.targetMonths / 12).toFixed(1)} yrs)`;

    if (window.FinCounter) {
      FinCounter.animate(resInterestSaved, Math.round(res.interestSaved), { prefix: curSymbol, duration: 400 });
      FinCounter.animate(resTotalInterest, Math.round(res.targetTotalInterest), { prefix: curSymbol, duration: 400 });
    } else {
      resInterestSaved.textContent = FinMetrics.formatMoney(res.interestSaved);
      resTotalInterest.textContent = FinMetrics.formatMoney(res.targetTotalInterest);
    }

    resTotalPaid.textContent = `Total paid: ${FinMetrics.formatMoney(params.balance + res.targetTotalInterest)}`;

    // Smart Insight
    insPayment.textContent = `${FinMetrics.formatMoney(params.monthlyPayment)}/mo`;
    insTime.textContent = `${res.targetMonths} months`;
    insSavings.textContent = FinMetrics.formatMoney(res.interestSaved);

    // Milestones Timeline
    renderDebtMilestones(res, params);

    // Comparison Mode
    if (isComparisonActive) {
      cmpValA.textContent = FinMetrics.formatMoney(res.targetTotalInterest);
      cmpValB.textContent = FinMetrics.formatMoney(res.minTotalInterest);
      cmpDiff.textContent = `+${FinMetrics.formatMoney(res.interestSaved)}`;
    }

    // Schedule Table
    renderScheduleTable(res.schedule);

    // Executive Summary & Sensitivity Matrix
    renderDebtExecutiveSummary(res, params);
    renderDebtSensitivityMatrix(params);

    // Chart
    updateChart(res, params);

    // URL Sync
    FinMetrics.syncUrlParams({
      balance: params.balance,
      apr: params.apr,
      payment: params.monthlyPayment
    });
  }

  function renderDebtMilestones(res, params) {
    if (!debtMilestones) return;
    const initial = params.balance;
    const targets = [
      { pct: 0.25, label: '25% Paid' },
      { pct: 0.50, label: '50% Halfway' },
      { pct: 0.75, label: '75% Crushed' },
      { pct: 1.00, label: '100% Free' }
    ];

    let html = '';
    targets.forEach(t => {
      const remainingTarget = initial * (1 - t.pct);
      const row = res.schedule.find(r => r.balance <= remainingTarget);
      const isAchieved = !!row;
      const monthText = isAchieved ? `Month ${row.month}` : `${res.targetMonths} Mo`;

      html += `
        <div class="milestone-step ${isAchieved ? 'achieved' : ''}">
          <div class="milestone-dot">${isAchieved ? '✓' : '○'}</div>
          <div class="milestone-val">${t.label}</div>
          <div class="milestone-sub">${monthText}</div>
        </div>
      `;
    });

    debtMilestones.innerHTML = html;
  }

  function renderDebtExecutiveSummary(res, params) {
    if (!debtExecSummary) return;
    const totalOutflow = params.balance + res.targetTotalInterest;
    const saved = res.interestSaved;
    const months = res.targetMonths;
    const years = (months / 12).toFixed(1);

    debtExecSummary.innerHTML = `
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div>Total Freedom Velocity: At <strong>${FinMetrics.formatMoney(params.monthlyPayment)}/mo</strong>, you become completely debt-free in <strong>${months} months (${years} years)</strong> on <strong>${res.payoffDate}</strong>.</div>
      </li>
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div>Minimum Trap Escape: Compared to minimum payments, this plan saves you <strong>${FinMetrics.formatMoney(saved)}</strong> in cold hard cash interest!</div>
      </li>
      <li class="exec-summary-item">
        <span class="bullet">▸</span>
        <div>Lifetime Outflow: Your total cash to eliminate this debt is <strong>${FinMetrics.formatMoney(totalOutflow)}</strong> (Principal: ${FinMetrics.formatMoney(params.balance)} + Interest: ${FinMetrics.formatMoney(res.targetTotalInterest)}).</div>
      </li>
    `;
  }

  function renderDebtSensitivityMatrix(params) {
    if (!debtSensitivityTable) return;
    const paymentSteps = [250, 350, 500, 750, 1000];

    let headerHtml = `
      <thead>
        <tr>
          <th>Monthly Payment</th>
          <th>Months to Freedom</th>
          <th>Total Interest Paid</th>
          <th>Interest Saved vs Minimum</th>
          <th>Debt-Free Date</th>
        </tr>
      </thead>
    `;

    let bodyHtml = '<tbody>';
    paymentSteps.forEach(pmt => {
      const pCopy = Object.assign({}, params, { monthlyPayment: pmt });
      const dRes = FinMath.calculateDebtPayoff(pCopy);
      if (dRes && !dRes.error) {
        const isSelected = Math.abs(params.monthlyPayment - pmt) < 25;
        bodyHtml += `
          <tr class="${isSelected ? 'matrix-cell-highlight' : ''}">
            <td><strong>${FinMetrics.formatMoney(pmt)}/mo</strong></td>
            <td>${dRes.targetMonths} Months (${(dRes.targetMonths / 12).toFixed(1)} yrs)</td>
            <td style="color:#ef4444;">${FinMetrics.formatMoney(dRes.targetTotalInterest)}</td>
            <td style="color:var(--emerald-600);font-weight:700;">+${FinMetrics.formatMoney(dRes.interestSaved)}</td>
            <td><strong>${dRes.payoffDate}</strong></td>
          </tr>
        `;
      }
    });
    bodyHtml += '</tbody>';

    debtSensitivityTable.innerHTML = headerHtml + bodyHtml;
  }

  function renderScheduleTable(schedule) {
    if (!scheduleBody) return;
    const rows = schedule.slice(0, 120);
    scheduleBody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>Month ${r.month}</strong></td>
        <td>${FinMetrics.formatMoney(r.payment)}</td>
        <td style="color:var(--emerald-400);font-weight:600;">+${FinMetrics.formatMoney(r.principal)}</td>
        <td style="color:#ef4444;">${FinMetrics.formatMoney(r.interest)}</td>
        <td><strong>${FinMetrics.formatMoney(r.balance)}</strong></td>
      </tr>
    `).join('');
  }

  function updateChart(res, params) {
    const canvas = document.getElementById('debtChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    if (currentChartType === 'doughnut') {
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Borrowed Principal Debt', 'Interest Paid', 'Interest Saved vs Minimums'],
          datasets: [{
            data: [params.balance, res.targetTotalInterest, res.interestSaved],
            backgroundColor: ['#2563eb', '#ef4444', '#059669'],
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

    const labels = res.schedule.map(r => `M${r.month}`);
    const data = res.schedule.map(r => Math.round(r.balance));

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Remaining Balance',
          data: data,
          borderColor: '#10b981',
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.25,
          pointRadius: data.length > 36 ? 0 : 3
        }]
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
                return `Balance: ${FinMetrics.formatMoney(ctx.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 12 }
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
  if (btnDebtLine) {
    btnDebtLine.addEventListener('click', () => {
      currentChartType = 'line';
      btnDebtLine.classList.add('active');
      if (btnDebtDonut) btnDebtDonut.classList.remove('active');
      recalculate();
    });
  }

  if (btnDebtDonut) {
    btnDebtDonut.addEventListener('click', () => {
      currentChartType = 'doughnut';
      btnDebtDonut.classList.add('active');
      if (btnDebtLine) btnDebtLine.classList.remove('active');
      recalculate();
    });
  }

  // Presets
  const DEBT_PRESETS = {
    creditCard: { balance: 8500, apr: 24.99, payment: 350 },
    avalanche: { balance: 18000, apr: 21.5, payment: 600 },
    student: { balance: 35000, apr: 6.8, payment: 500 },
    personal: { balance: 12000, apr: 14.5, payment: 450 }
  };

  document.querySelectorAll('.preset-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const p = DEBT_PRESETS[btn.getAttribute('data-preset')];
      if (p) {
        balanceInput.value = p.balance;
        balanceSlider.value = p.balance;
        aprInput.value = p.apr;
        aprSlider.value = p.apr;
        monthlyPaymentInput.value = p.payment;
        monthlyPaymentSlider.value = p.payment;
        if (FinMetrics.updateSliderFill) {
          FinMetrics.updateSliderFill(balanceSlider);
          FinMetrics.updateSliderFill(aprSlider);
          FinMetrics.updateSliderFill(monthlyPaymentSlider);
        }
        recalculate();
        FinMetrics.showToast(`Loaded: ${btn.textContent.trim()} scenario`);
      }
    });
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    FinMetrics.exportTableToCSV('debtTable', 'debt-payoff-schedule.csv');
  });

  // Copy link
  copyShareBtn.addEventListener('click', () => {
    FinMetrics.copyShareLink();
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    balanceInput.value = 12000;
    balanceSlider.value = 12000;
    aprInput.value = 22.9;
    aprSlider.value = 22.9;
    monthlyPaymentInput.value = 450;
    monthlyPaymentSlider.value = 450;
    recalculate();
  });

  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  // URL Params
  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.balance) { balanceInput.value = urlParams.balance; balanceSlider.value = urlParams.balance; }
  if (urlParams.apr) { aprInput.value = urlParams.apr; aprSlider.value = urlParams.apr; }
  if (urlParams.payment) { monthlyPaymentInput.value = urlParams.payment; monthlyPaymentSlider.value = urlParams.payment; }

  recalculate();

})();
