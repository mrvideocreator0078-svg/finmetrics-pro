/**
 * MORTGAGE PAYOFF CALCULATOR INTERACTIVE LOGIC
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

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const resetBtn = document.getElementById('resetBtn');

  let chartInstance = null;

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

    // Update Output Cards
    resInterestSaved.textContent = FinMetrics.formatMoney(res.interestSaved);
    resTimeSaved.textContent = res.yearsSaved > 0 
      ? `Pay off ${res.yearsSaved} years earlier`
      : 'Standard loan schedule';

    resMonthlyPayment.textContent = FinMetrics.formatMoney(res.totalMonthlyPayment);
    const escrowTotal = (res.monthlyTax + res.monthlyInsurance + res.hoaMonthly);
    resPISplit.textContent = `P&I: ${FinMetrics.formatMoney(res.monthlyPI + params.extraMonthly)} | Escrow: ${FinMetrics.formatMoney(escrowTotal)}`;

    resLoanAmount.textContent = FinMetrics.formatMoney(res.loanAmount);

    // Smart Insight Text
    insExtra.textContent = `${FinMetrics.formatMoney(params.extraMonthly)}/mo`;
    const payoffYears = (res.monthsToPayoff / 12).toFixed(1);
    insYears.textContent = `${payoffYears} years`;
    insSavings.textContent = FinMetrics.formatMoney(res.interestSaved);

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
            label: 'Principal',
            data: [res.loanAmount, res.loanAmount],
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'Interest Paid',
            data: [res.totalInterestStandard, res.totalInterestAccelerated],
            backgroundColor: '#ef4444',
            borderRadius: 6
          },
          {
            label: 'Interest Saved',
            data: [0, res.interestSaved],
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
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { weight: '600' } }
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

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    FinMetrics.exportTableToCSV('mortgageTable', 'mortgage-payoff-schedule.csv');
  });

  // Share
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
    updateDownPaymentPct();
    recalculate();
  });

  window.addEventListener('finmetrics:currencyChanged', recalculate);
  window.addEventListener('finmetrics:themeChanged', recalculate);

  // Read URL params
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
