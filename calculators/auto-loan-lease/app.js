/**
 * AUTO LOAN VS LEASE CALCULATOR INTERACTIVE LOGIC
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

  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  let chartInstance = null;

  carPriceInput.addEventListener('input', recalculate);
  loanDownInput.addEventListener('input', recalculate);
  loanRateInput.addEventListener('input', recalculate);
  leaseDownInput.addEventListener('input', recalculate);
  residualPctInput.addEventListener('input', recalculate);

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
      moneyFactor: 0.0026, // ~6.24% APR equivalent
      residualValuePct: Number(residualPctInput.value) || 54
    };
  }

  function recalculate() {
    const params = getInputs();
    const res = FinMath.calculateAutoLoanVsLease(params);

    // Update Output Cards
    resVerdict.textContent = res.recommendedOption === 'BUY' ? 'BUY VEHICLE' : 'LEASE VEHICLE';
    resVerdict.style.color = res.recommendedOption === 'BUY' ? 'var(--emerald-400)' : 'var(--indigo-400)';
    resVerdictSub.textContent = `Saves ${FinMetrics.formatMoney(res.netDifference)} in net wealth over 3 yrs`;

    resMonthlyBuy.textContent = FinMetrics.formatMoney(res.monthlyLoanPayment);
    resMonthlyLeaseSub.textContent = `Lease: ${FinMetrics.formatMoney(res.monthlyLeasePayment)}/mo`;

    resRetainedEquity.textContent = FinMetrics.formatMoney(res.residualValue);

    // Smart Insight
    insLeaseMonthly.textContent = FinMetrics.formatMoney(res.monthlyLeasePayment);
    insBuyMonthly.textContent = FinMetrics.formatMoney(res.monthlyLoanPayment);
    insEquity.textContent = FinMetrics.formatMoney(res.residualValue);
    insNetSavings.textContent = `${FinMetrics.formatMoney(res.netDifference)} cheaper`;

    // Chart
    updateChart(res, params);

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

  function updateChart(res, params) {
    const canvas = document.getElementById('autoChart');
    if (!canvas || !window.Chart) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    if (chartInstance) {
      chartInstance.destroy();
    }

    const buyPayments36 = params.downPayment + (res.monthlyLoanPayment * 36);
    const leasePayments36 = res.totalLeasePaid;

    const ctx = canvas.getContext('2d');

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

  copyShareBtn.addEventListener('click', () => {
    FinMetrics.copyShareLink();
  });

  resetBtn.addEventListener('click', () => {
    carPriceInput.value = 42000;
    loanDownInput.value = 5000;
    loanRateInput.value = 6.25;
    loanTermMonthsInput.value = 60;
    leaseDownInput.value = 2500;
    residualPctInput.value = 54;
    recalculate();
  });

  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  const urlParams = FinMetrics.getUrlParams();
  if (urlParams.price) carPriceInput.value = urlParams.price;
  if (urlParams.ldown) loanDownInput.value = urlParams.ldown;
  if (urlParams.lrate) loanRateInput.value = urlParams.lrate;
  if (urlParams.leasedown) leaseDownInput.value = urlParams.leasedown;
  if (urlParams.res) residualPctInput.value = urlParams.res;

  recalculate();

})();
