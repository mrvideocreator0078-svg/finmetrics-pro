/**
 * FINMETRICS PRO — INSTITUTIONAL CORE RUNTIME
 * Theme Switcher, Multi-Currency Engine, Global Search & URL Sync
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
     6. SEARCH MODAL ENGINE (CTRL + K)
     ══════════════════════════════════════════════════════════════ */
  const CALCULATOR_CATALOG = [
    { title: 'Compound Interest & SIP Wealth Engine', path: '/calculators/compound-interest/index.html', cat: 'Investing', desc: 'Simulate compounding returns, inflation impact, and milestone timeline.' },
    { title: 'Mortgage Payoff with Extra Payments', path: '/calculators/mortgage-payoff/index.html', cat: 'Real Estate', desc: 'See how extra principal payments slash interest and shave years off your loan.' },
    { title: 'Credit Card Debt Avalanche / Snowball', path: '/calculators/debt-payoff/index.html', cat: 'Debt Elimination', desc: 'Compare payoff strategies and get a debt-free target date.' },
    { title: 'Auto Loan vs Lease Decision Engine', path: '/calculators/auto-loan-lease/index.html', cat: 'Automotive', desc: 'Determine the exact true cost of buying vs leasing over 3 to 5 years.' }
  ];

  function initSearchModal() {
    let modal = document.getElementById('searchModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'searchModal';
      modal.className = 'search-modal-backdrop';
      modal.innerHTML = `
        <div class="search-modal-card">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="globalSearchInput" placeholder="Search calculators (e.g. mortgage, SIP, loan, debt)..." autocomplete="off">
            <button class="search-close-btn" id="closeSearchModal">ESC</button>
          </div>
          <div class="search-results-list" id="searchResultsList"></div>
        </div>
      `;
      document.body.appendChild(modal);

      const style = document.createElement('style');
      style.textContent = `
        .search-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(3, 6, 17, 0.75);
          backdrop-filter: blur(12px);
          display: none; align-items: flex-start; justify-content: center;
          padding-top: 10vh;
        }
        .search-modal-backdrop.open { display: flex; }
        .search-modal-card {
          width: 90%; max-width: 620px;
          background: var(--bg-surface);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .search-input-wrap {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .search-icon { font-size: 1.2rem; color: var(--text-muted); }
        #globalSearchInput {
          flex: 1; font-size: 1.05rem; font-weight: 500;
          color: var(--text-primary); outline: none;
        }
        .search-close-btn {
          font-size: 0.75rem; font-family: var(--font-mono);
          padding: 3px 8px; border-radius: 4px;
          background: var(--bg-card); color: var(--text-muted);
          border: 1px solid var(--border-subtle); cursor: pointer;
        }
        .search-results-list {
          max-height: 380px; overflow-y: auto; padding: 12px;
        }
        .search-result-item {
          display: block; padding: 12px 14px;
          border-radius: var(--radius-md);
          transition: background 0.15s;
        }
        .search-result-item:hover, .search-result-item.selected {
          background: var(--bg-card);
        }
        .s-res-title { font-weight: 600; font-size: 0.95rem; color: var(--text-primary); }
        .s-res-meta { font-size: 0.75rem; color: var(--emerald-400); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        .s-res-desc { font-size: 0.85rem; color: var(--text-muted); }
      `;
      document.head.appendChild(style);
    }

    const input = document.getElementById('globalSearchInput');
    const list = document.getElementById('searchResultsList');
    const closeBtn = document.getElementById('closeSearchModal');

    function renderResults(q) {
      const query = (q || '').toLowerCase().trim();
      const matches = CALCULATOR_CATALOG.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) ||
        c.cat.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        list.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">No calculators found for "${query}"</div>`;
        return;
      }

      list.innerHTML = matches.map((m, idx) => `
        <a href="${m.path}" class="search-result-item ${idx === 0 ? 'selected' : ''}">
          <div class="s-res-meta">${m.cat}</div>
          <div class="s-res-title">${m.title}</div>
          <div class="s-res-desc">${m.desc}</div>
        </a>
      `).join('');
    }

    function openModal() {
      modal.classList.add('open');
      input.value = '';
      renderResults('');
      setTimeout(() => input.focus(), 50);
    }

    function closeModal() {
      modal.classList.remove('open');
    }

    input.addEventListener('input', (e) => renderResults(e.target.value));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.querySelectorAll('.search-trigger-btn').forEach(btn => {
      btn.addEventListener('click', openModal);
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('open')) closeModal();
        else openModal();
      }
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     7. INITIALIZATION
     ══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
    updateCurrencyAffixes();

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const curSelect = document.getElementById('currencySelect');
    if (curSelect) {
      curSelect.addEventListener('change', (e) => setCurrency(e.target.value));
    }

    initSearchModal();
  });

  // Expose global FinMetrics API
  window.FinMetrics = {
    getCurrency,
    setCurrency,
    formatMoney,
    formatNumber,
    syncUrlParams,
    getUrlParams,
    copyShareLink,
    exportTableToCSV,
    showToast
  };

})();
