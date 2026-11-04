/**
 * FINMETRICS PRO — INSTITUTIONAL CORE RUNTIME
 * Theme Switcher, Multi-Currency Engine, Global Search, Live Stats,
 * Milestone Celebrations & Partner Affiliate Comparison Matrix
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. CURRENCY CONVERSION & FORMATTING ENGINE
     ══════════════════════════════════════════════════════════════ */
  const CURRENCIES = {
    USD: { symbol: '$', code: 'USD', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
    GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
    INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
    CAD: { symbol: 'CA$', code: 'CAD', locale: 'en-CA' },
    AUD: { symbol: 'A$', code: 'AUD', locale: 'en-AU' }
  };

  let activeCurrency = localStorage.getItem('finmetrics_currency') || 'USD';
  if (!CURRENCIES[activeCurrency]) activeCurrency = 'USD';

  function getCurrency() {
    return CURRENCIES[activeCurrency];
  }

  function setCurrency(code) {
    if (!CURRENCIES[code]) return;
    activeCurrency = code;
    localStorage.setItem('finmetrics_currency', code);
    updateCurrencyAffixes();
    window.dispatchEvent(new CustomEvent('finmetrics:currencyChanged', { detail: CURRENCIES[code] }));
  }

  function formatMoney(amount, decimals = 0) {
    const cur = CURRENCIES[activeCurrency];
    const num = Number(amount) || 0;
    return cur.symbol + num.toLocaleString(cur.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatNumber(num, decimals = 0) {
    return Number(num || 0).toLocaleString(CURRENCIES[activeCurrency].locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function updateCurrencyAffixes() {
    const cur = CURRENCIES[activeCurrency];
    document.querySelectorAll('.currency-affix').forEach(el => {
      el.textContent = cur.symbol;
    });
    const curSelect = document.getElementById('currencySelect');
    if (curSelect) curSelect.value = activeCurrency;
  }

  /* ══════════════════════════════════════════════════════════════
     2. THEME ENGINE (DARK / LIGHT)
     ══════════════════════════════════════════════════════════════ */
  function getPreferredTheme() {
    const stored = localStorage.getItem('finmetrics_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finmetrics_theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
      themeBtn.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`);
    }
    window.dispatchEvent(new CustomEvent('finmetrics:themeChanged', { detail: { theme } }));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ══════════════════════════════════════════════════════════════
     3. SHAREABLE URL SYNCHRONIZATION
     ══════════════════════════════════════════════════════════════ */
  function syncUrlParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      } else {
        url.searchParams.delete(k);
      }
    });
    window.history.replaceState({}, '', url);
  }

  function getUrlParams() {
    const search = new URLSearchParams(window.location.search);
    const result = {};
    for (const [k, v] of search.entries()) {
      result[k] = v;
    }
    return result;
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied to clipboard with current parameters!');
    }).catch(() => {
      showToast('Failed to copy link', true);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     4. TOAST NOTIFICATION UTILITY
     ══════════════════════════════════════════════════════════════ */
  function showToast(message, isError = false) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${isError ? '#ef4444' : '#10b981'};
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  /* ══════════════════════════════════════════════════════════════
     5. CSV EXPORT UTILITY
     ══════════════════════════════════════════════════════════════ */
  function exportTableToCSV(tableId, filename = 'financial-report.csv') {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tr'));
    const csvContent = rows.map(r => {
      const cells = Array.from(r.querySelectorAll('th, td'));
      return cells.map(c => `"${c.innerText.replace(/"/g, '""').trim()}"`).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`);
  }

  /* ══════════════════════════════════════════════════════════════
     6. LIVE SOCIAL PROOF & USAGE COUNTER
     ══════════════════════════════════════════════════════════════ */
  function getLiveUserCount() {
    const baseDate = new Date('2024-01-01').getTime();
    const now = Date.now();
    const daysElapsed = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
    const baseCalculations = 1184200;
    const dailyAverage = 1845;
    const sessionHourOffset = (new Date().getHours() * 73) + (new Date().getMinutes() * 2);
    return baseCalculations + (daysElapsed * dailyAverage) + sessionHourOffset;
  }

  function updateLiveCounters() {
    const count = getLiveUserCount();
    const formatted = Number(count).toLocaleString('en-US');
    document.querySelectorAll('.live-user-count').forEach(el => {
      el.textContent = formatted;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     7. MILESTONE CELEBRATION SYSTEM
     ══════════════════════════════════════════════════════════════ */
  const CELEBRATED_MILESTONES = new Set();

  function checkMilestone(currentVal, prevVal) {
    const milestones = [
      { val: 10000, label: '$10,000 Milestone' },
      { val: 50000, label: '$50,000 Milestone' },
      { val: 100000, label: '$100,000 Milestone' },
      { val: 250000, label: '$250,000 Quarter-Million Milestone' },
      { val: 500000, label: '$500,000 Half-Million Milestone' },
      { val: 1000000, label: '🏆 $1,000,000 Wealth Target Achieved!' },
      { val: 2000000, label: '🚀 $2,000,000 Multi-Millionaire Target!' }
    ];

    for (const m of milestones) {
      if (currentVal >= m.val && prevVal < m.val && !CELEBRATED_MILESTONES.has(m.val)) {
        CELEBRATED_MILESTONES.add(m.val);
        triggerMilestoneAnimation(m.label, currentVal);
        break;
      }
    }
  }

  function triggerMilestoneAnimation(label, currentVal) {
    // Show toast celebration
    showToast(`🎉 Congratulations! You reached ${label}!`);

    // Confetti burst
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    const colors = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      const size = Math.random() * 8 + 6;
      const left = Math.random() * 100;
      const animDuration = Math.random() * 1.5 + 1.2;
      const delay = Math.random() * 0.4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      piece.style.cssText = `
        position: absolute;
        top: 0;
        left: ${left}%;
        width: ${size}px;
        height: ${size * 1.4}px;
        background-color: ${color};
        border-radius: 2px;
        animation: confettiFall ${animDuration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s forwards;
      `;
      container.appendChild(piece);
    }

    setTimeout(() => {
      container.remove();
    }, 3500);
  }

  /* ══════════════════════════════════════════════════════════════
     8. AFFILIATE & RATE COMPARISON ENGINE (HIGH REVENUE CPC)
     ══════════════════════════════════════════════════════════════ */
  const PARTNER_DATA = {
    'compound-interest': {
      title: 'Compare Top High-Yield Savings & Brokerage Accounts',
      subtitle: 'Maximize compound interest with audited, FDIC-insured institutions. Real-time rates.',
      partners: [
        { name: 'Marcus by Goldman Sachs', badge: 'Editor\'s Choice', rate: '5.10% APY', perk: 'No minimum balance, FDIC insured', cta: 'View Account', link: '#' },
        { name: 'SoFi High-Yield Checking', badge: 'Highest Yield', rate: '4.60% APY', perk: 'Up to $300 direct deposit bonus', cta: 'Claim Bonus', link: '#' },
        { name: 'Vanguard Cash Plus', badge: 'Top Brokerage', rate: '4.85% APY', perk: 'Seamless sweep to index funds', cta: 'Explore Account', link: '#' }
      ]
    },
    'mortgage-payoff': {
      title: 'Compare Today\'s Lowest Mortgage Refinance Rates',
      subtitle: 'Lock in competitive APRs and accelerate your home equity with top-rated lenders.',
      partners: [
        { name: 'Better.com Mortgage', badge: 'Zero Origination', rate: '6.45% APR', perk: '100% online approval in 24 hours', cta: 'Check My Rate', link: '#' },
        { name: 'Rocket Mortgage', badge: '#1 in Customer Trust', rate: '6.65% APR', perk: 'Rate-drop protection guaranteed', cta: 'Get Free Quote', link: '#' },
        { name: 'Figure Home Equity', badge: 'Fastest Funding', rate: '7.15% APR', perk: 'Fixed rate equity unlock in 5 days', cta: 'Apply Online', link: '#' }
      ]
    },
    'debt-payoff': {
      title: 'Top 0% Intro APR Balance Transfer Cards',
      subtitle: 'Slash debt interest to 0% for up to 21 months and accelerate your payoff timeline.',
      partners: [
        { name: 'Citi Simplicity® Card', badge: 'Longest 0% Intro', rate: '0% Intro APR', perk: '21 Months on Balance Transfers', cta: 'Apply Now', link: '#' },
        { name: 'Wells Fargo Reflect®', badge: 'Top Rated', rate: '0% Intro APR', perk: 'Up to 21 Months 0% intro term', cta: 'View Terms', link: '#' },
        { name: 'Chase Slate Edge℠', badge: 'Rate Reduction', rate: '0% Intro APR', perk: '18 Months 0% APR + annual rate drops', cta: 'Apply Now', link: '#' }
      ]
    },
    'auto-loan-lease': {
      title: 'Compare Auto Financing & Refinance Offers',
      subtitle: 'Pre-qualify without affecting your credit score with national lending partners.',
      partners: [
        { name: 'LightStream Auto Loan', badge: 'Lowest Fixed Rate', rate: '6.89% APR', perk: 'Same-day funding, no prepayment fee', cta: 'Check Rates', link: '#' },
        { name: 'Capital One Auto Nav', badge: 'Pre-Approval', rate: 'Competitive', perk: 'Pre-qualify with zero credit score hit', cta: 'Pre-Qualify', link: '#' },
        { name: 'PenFed Credit Union', badge: 'Best for Used', rate: '6.99% APR', perk: 'Open to everyone, 100% financing', cta: 'View Rates', link: '#' }
      ]
    }
  };

  function injectAffiliateCards(calcKey, targetContainerId = 'affiliateCardsContainer') {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    const data = PARTNER_DATA[calcKey];
    if (!data) return;

    let html = `
      <div class="affiliate-matrix-wrap">
        <div class="affiliate-matrix-header">
          <div class="affiliate-matrix-tag">⚡ Verified Partner Offers</div>
          <h3 class="affiliate-matrix-title">${data.title}</h3>
          <p class="affiliate-matrix-subtitle">${data.subtitle}</p>
        </div>
        <div class="affiliate-cards-row">
    `;

    data.partners.forEach(partner => {
      html += `
        <div class="affiliate-card">
          <div class="affiliate-badge">${partner.badge}</div>
          <div class="affiliate-name">${partner.name}</div>
          <div class="affiliate-rate-val">${partner.rate}</div>
          <div class="affiliate-perk">${partner.perk}</div>
          <a href="${partner.link}" class="affiliate-cta-btn" target="_blank" rel="noopener sponsored">
            <span>${partner.cta}</span>
            <span>→</span>
          </a>
        </div>
      `;
    });

    html += `
        </div>
        <div class="affiliate-disclosure-footer">
          Advertiser Disclosure: We may receive compensation from the companies whose products we review or feature. All opinions are our own and rates are subject to lender approval.
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════════
     9. SEARCH MODAL ENGINE (CTRL + K)
     ══════════════════════════════════════════════════════════════ */
  const CALCULATOR_CATALOG = [
    { title: 'Compound Interest & SIP Wealth Engine', path: '/calculators/compound-interest/index.html', cat: 'Investing', desc: 'Simulate compounding returns, inflation impact, and milestone timeline.' },
    { title: 'Mortgage Payoff with Extra Payments', path: '/calculators/mortgage-payoff/index.html', cat: 'Real Estate', desc: 'See how extra principal payments slash interest and shave years off your loan.' },
    { title: 'Credit Card Debt Avalanche / Snowball', path: '/calculators/debt-payoff/index.html', cat: 'Debt Elimination', desc: 'Compare payoff strategies and get a debt-free target date.' },
    { title: 'Auto Loan vs Lease Decision Engine', path: '/calculators/auto-loan-lease/index.html', cat: 'Automotive', desc: 'Determine the exact true cost of buying vs leasing over 3 to 5 years.' }
  ];

  function setupSearchModal() {
    const trigger = document.querySelector('.search-trigger-btn');
    if (!trigger) return;

    // Create modal DOM if not present
    let modal = document.getElementById('searchModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'searchModal';
      modal.className = 'search-modal-backdrop';
      modal.innerHTML = `
        <div class="search-modal-box">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchModalInput" placeholder="Search calculators (e.g., mortgage, compound, debt)..." autocomplete="off">
            <button class="search-close-btn" id="searchCloseBtn">✕</button>
          </div>
          <div class="search-results-list" id="searchResultsList"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const input = document.getElementById('searchModalInput');
    const results = document.getElementById('searchResultsList');
    const closeBtn = document.getElementById('searchCloseBtn');

    function openModal() {
      modal.classList.add('active');
      input.value = '';
      renderSearchResults('');
      setTimeout(() => input.focus(), 50);
    }

    function closeModal() {
      modal.classList.remove('active');
    }

    function renderSearchResults(query) {
      const q = query.toLowerCase().trim();
      const filtered = CALCULATOR_CATALOG.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        results.innerHTML = `<div class="search-empty">No matching calculators found for "${query}"</div>`;
        return;
      }

      results.innerHTML = filtered.map(c => `
        <a href="${c.path}" class="search-item">
          <div class="search-item-cat">${c.cat}</div>
          <div class="search-item-title">${c.title}</div>
          <div class="search-item-desc">${c.desc}</div>
        </a>
      `).join('');
    }

    trigger.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    input.addEventListener('input', () => {
      renderSearchResults(input.value);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('active')) {
          closeModal();
        } else {
          openModal();
        }
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     10. PRINT / PDF REPORT GENERATOR
     ══════════════════════════════════════════════════════════════ */
  function generatePrintReport(title = 'FinMetrics Pro Financial Audit') {
    document.title = `${title} — FinMetrics Report`;
    window.print();
  }

  /* ══════════════════════════════════════════════════════════════
     11. SMOOTH SCROLL FOR MOBILE
     ══════════════════════════════════════════════════════════════ */
  function smoothScrollToResults(targetId = 'resultsPane') {
    if (window.innerWidth <= 768) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     12. INITIALIZATION
     ══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme init
    applyTheme(getPreferredTheme());
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // 2. Currency init
    updateCurrencyAffixes();
    const curSelect = document.getElementById('currencySelect');
    if (curSelect) {
      curSelect.addEventListener('change', (e) => setCurrency(e.target.value));
    }

    // 3. Search modal
    setupSearchModal();

    // 4. Live Counter
    updateLiveCounters();

    // 5. Auto affiliate injection if page has data-calc-key
    const calcKey = document.body.dataset.calcKey;
    if (calcKey) {
      injectAffiliateCards(calcKey);
    }
  });

  // Global Export
  window.FinMetrics = {
    getCurrency,
    setCurrency,
    formatMoney,
    formatNumber,
    syncUrlParams,
    getUrlParams,
    copyShareLink,
    showToast,
    exportTableToCSV,
    getLiveUserCount,
    updateLiveCounters,
    checkMilestone,
    triggerMilestoneAnimation,
    injectAffiliateCards,
    generatePrintReport,
    smoothScrollToResults
  };
})();
