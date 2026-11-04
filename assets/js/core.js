/**
 * FINMETRICS PRO — INSTITUTIONAL CORE RUNTIME
 * Real Multi-Currency Engine, Global Search, Slider Fills, Mobile Navigation
 * Pure Client-Side Privacy & Standard Financial Utilities
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. MULTI-CURRENCY CONVERSION & FORMATTING ENGINE
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
     2. THEME ENGINE (LIGHT DEFAULT / DARK OPTIONAL)
     ══════════════════════════════════════════════════════════════ */
  function getPreferredTheme() {
    const stored = localStorage.getItem('finmetrics_theme');
    if (stored) return stored;
    // Default to light for clean institutional trust
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finmetrics_theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
    }
    window.dispatchEvent(new CustomEvent('finmetrics:themeChanged', { detail: { theme } }));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  /* ══════════════════════════════════════════════════════════════
     3. SHAREABLE URL PARAMETERS
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
      showToast('Calculation parameters link copied to clipboard.');
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
      background: ${isError ? '#e11d48' : '#059669'};
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      transform: translateY(16px);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(16px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  /* ══════════════════════════════════════════════════════════════
     5. CSV EXPORT UTILITY
     ══════════════════════════════════════════════════════════════ */
  function exportTableToCSV(tableId, filename = 'financial-schedule.csv') {
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
    showToast(`Exported ${filename} successfully.`);
  }

  /* ══════════════════════════════════════════════════════════════
     6. SEARCH MODAL ENGINE (CTRL + K)
     ══════════════════════════════════════════════════════════════ */
  const CALCULATOR_CATALOG = [
    { title: 'Compound Interest & SIP Wealth Engine', path: 'calculators/compound-interest/index.html', cat: 'Investing', desc: 'Simulate compounding returns, inflation impact, and milestone timeline.' },
    { title: 'Mortgage Payoff with Extra Payments', path: 'calculators/mortgage-payoff/index.html', cat: 'Real Estate', desc: 'See how extra principal payments slash interest and shave years off your loan.' },
    { title: 'Credit Card Debt Avalanche / Snowball', path: 'calculators/debt-payoff/index.html', cat: 'Debt Elimination', desc: 'Compare payoff strategies and get a debt-free target date.' },
    { title: 'Auto Loan vs Lease Decision Engine', path: 'calculators/auto-loan-lease/index.html', cat: 'Automotive', desc: 'Determine the exact true cost of buying vs leasing over 3 to 5 years.' }
  ];

  function getCatalogUrl(relPath) {
    const isSubdir = window.location.pathname.includes('/calculators/');
    return isSubdir ? `../../${relPath}` : relPath;
  }

  function setupSearchModal() {
    const trigger = document.querySelector('.search-trigger-btn');
    if (!trigger) return;

    let modal = document.getElementById('searchModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'searchModal';
      modal.className = 'search-modal-backdrop';
      modal.innerHTML = `
        <div class="search-modal-box">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchModalInput" placeholder="Search calculators (e.g. compound, mortgage, debt)..." autocomplete="off">
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
        results.innerHTML = `<div style="padding:16px;color:var(--text-muted);text-align:center;">No matching calculators found for "${query}"</div>`;
        return;
      }

      results.innerHTML = filtered.map(c => `
        <a href="${getCatalogUrl(c.path)}" class="search-item">
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
     7. NATIVE RANGE SLIDER DYNAMIC TRACK FILL
     ══════════════════════════════════════════════════════════════ */
  function updateSliderFill(slider) {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const val = Number(slider.value) || 0;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.background = `linear-gradient(to right, #059669 0%, #059669 ${pct}%, var(--border-light) ${pct}%, var(--border-light) 100%)`;
  }

  function initSliderFills() {
    document.querySelectorAll('.calc-range-slider').forEach(slider => {
      updateSliderFill(slider);
      slider.addEventListener('input', () => updateSliderFill(slider));
    });
  }

  /* ══════════════════════════════════════════════════════════════
     8. MOBILE NAVIGATION DRAWER
     ══════════════════════════════════════════════════════════════ */
  function setupMobileDrawer() {
    const navCluster = document.querySelector('.nav-actions-cluster');
    if (!navCluster) return;

    let toggle = document.querySelector('.mobile-menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('aria-label', 'Toggle Navigation Menu');
      toggle.innerHTML = '☰';
      navCluster.appendChild(toggle);
    }

    let drawer = document.getElementById('mobileNavDrawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'mobileNavDrawer';
      drawer.className = 'mobile-nav-drawer';
      const isSubdir = window.location.pathname.includes('/calculators/');
      const rootPrefix = isSubdir ? '../../' : '';

      drawer.innerHTML = `
        <a href="${rootPrefix}index.html#investing">Investing & Compound Interest</a>
        <a href="${rootPrefix}index.html#real-estate">Real Estate & Mortgage Payoff</a>
        <a href="${rootPrefix}index.html#debt">Debt Avalanche & Snowball</a>
        <a href="${rootPrefix}methodology.html">Mathematical Methodology</a>
        <a href="${rootPrefix}about.html">About FinMetrics Pro</a>
      `;
      document.body.appendChild(drawer);
    }

    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('active');
      toggle.innerHTML = isOpen ? '✕' : '☰';
    });

    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('active');
        toggle.innerHTML = '☰';
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     9. PRINT REPORT AUDIT GENERATOR
     ══════════════════════════════════════════════════════════════ */
  function generatePrintReport(title = 'FinMetrics Pro Financial Audit') {
    document.title = `${title} — FinMetrics Report`;
    window.print();
  }

  /* ══════════════════════════════════════════════════════════════
     10. INITIALIZATION
     ══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    updateCurrencyAffixes();
    const curSelect = document.getElementById('currencySelect');
    if (curSelect) {
      curSelect.addEventListener('change', (e) => setCurrency(e.target.value));
    }

    setupSearchModal();
    initSliderFills();
    setupMobileDrawer();
  });

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
    generatePrintReport,
    updateSliderFill
  };
})();
