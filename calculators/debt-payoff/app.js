/**
 * DEBT PAYOFF CALCULATOR INTERACTIVE LOGIC
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

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  let chartInstance = null;

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

    // Update Output Cards
    resPayoffDate.textContent = res.payoffDate;
    resTotalMonths.textContent = `In ${res.targetMonths} Months (${(res.targetMonths / 12).toFixed(1)} yrs)`;

    resInterestSaved.textContent = FinMetrics.formatMoney(res.interestSaved);
    resTotalInterest.textContent = FinMetrics.formatMoney(res.targetTotalInterest);
    resTotalPaid.textContent = `Total paid: ${FinMetrics.formatMoney(params.balance + res.targetTotalInterest)}`;

    // Smart Insight
    insPayment.textContent = `${FinMetrics.formatMoney(params.monthlyPayment)}/mo`;
    insTime.textContent = `${res.targetMonths} months`;
    insSavings.textContent = FinMetrics.formatMoney(res.interestSaved);

    // Schedule Table
    renderScheduleTable(res.schedule);

    // Chart
    updateChart(res);

    // URL Sync
    FinMetrics.syncUrlParams({
      balance: params.balance,
      apr: params.apr,
      payment: params.monthlyPayment
    });
  }

  function renderScheduleTable(schedule) {
    if (!scheduleBody) return;
    // Show up to first 120 months to keep DOM fast
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

  function updateChart(res) {
    const canvas = document.getElementById('debtChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const labels = res.schedule.map(r => `M${r.month}`);
    const data = res.schedule.map(r => Math.round(r.balance));

    const ctx = canvas.getContext('2d');

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
          pointRadius: data.length > 30 ? 0 : 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#0c1222' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: isDark ? '#1c2742' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
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

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    FinMetrics.exportTableToCSV('debtTable', 'debt-payoff-schedule.csv');
  });

  // Share
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

  // Read URL params
  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.balance) { balanceInput.value = urlParams.balance; balanceSlider.value = urlParams.balance; }
  if (urlParams.apr) { aprInput.value = urlParams.apr; aprSlider.value = urlParams.apr; }
  if (urlParams.payment) { monthlyPaymentInput.value = urlParams.payment; monthlyPaymentSlider.value = urlParams.payment; }

  recalculate();

})();
