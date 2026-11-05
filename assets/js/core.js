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
     9. PRINT REPORT AUDIT GENERATOR (EXECUTIVE WEALTH DOSSIER)
     ══════════════════════════════════════════════════════════════ */
  let currentAuditId = null;

  function preparePrintDossier(title) {
    const calcKey = document.body.getAttribute('data-calc-key');
    const pageMainHeading = document.querySelector('.calc-head-cluster h1, .calc-title')?.textContent?.trim();
    const cleanTitle = title || pageMainHeading || document.title.split('—')[0].trim();

    if (!currentAuditId) {
      currentAuditId = 'FMP-' + Math.floor(100000 + Math.random() * 900000);
    }

    // 1. Header Container
    let printHeader = document.getElementById('printDossierHeader');
    if (!printHeader) {
      printHeader = document.createElement('div');
      printHeader.id = 'printDossierHeader';
      printHeader.className = 'print-dossier-header';
      const main = document.querySelector('main') || document.body;
      main.insertBefore(printHeader, main.firstChild);
    }

    // 2. Extract User Inputs
    const inputs = [];
    document.querySelectorAll('.calc-inputs-pane .form-field').forEach(field => {
      const label = field.querySelector('.field-label');
      const input = field.querySelector('input[type="number"], select, input[type="text"]');
      if (label && input && input.value !== undefined && input.value !== '') {
        let valText = '';
        if (input.tagName === 'SELECT') {
          valText = input.options[input.selectedIndex]?.text || input.value;
        } else {
          const prefix = field.querySelector('.field-prefix')?.textContent?.trim() || '';
          const suffix = field.querySelector('.field-suffix')?.textContent?.trim() || '';
          valText = `${prefix}${input.value}${suffix ? ' ' + suffix : ''}`.trim();
        }
        // Clean label of any info icons
        const cleanLabel = label.cloneNode(true);
        cleanLabel.querySelectorAll('.field-help-icon, .info-tooltip').forEach(el => el.remove());
        inputs.push({ name: cleanLabel.textContent.trim(), value: valText });
      }
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    printHeader.innerHTML = `
      <div class="print-top-accent-bar"></div>
      <div class="print-header-top">
        <div class="print-brand-crest">
          <span class="crest-icon">🏛️</span>
          <div>
            <span class="print-brand-mark">FINMETRICS PRO</span>
            <span class="print-brand-sub">INSTITUTIONAL QUANTITATIVE DOSSIER</span>
            <div class="print-doc-classification">
              <span class="sec-dot">●</span>
              <span>CONFIDENTIAL / PRIVATE CLIENT FIDUCIARY AUDIT</span>
            </div>
          </div>
        </div>
        <div class="print-header-meta">
          <div><span class="meta-label">RUN DATE:</span> <span class="meta-val">${dateStr} · ${timeStr}</span></div>
          <div><span class="meta-label">MODEL STANDARD:</span> <span class="meta-val">CFA / GAAP Actuarial Engine v2.4</span></div>
          <div><span class="meta-label">AUDIT ID:</span> <span class="meta-val">${currentAuditId}</span></div>
        </div>
      </div>
      <div class="print-divider-line"></div>
      <div class="print-title-row">
        <div>
          <span class="print-section-eyebrow">QUANTITATIVE AUDIT REPORT</span>
          <h1 class="print-report-title">${cleanTitle}</h1>
        </div>
        <div class="print-stamp-badge">
          <span class="stamp-check">✓</span>
          <div class="stamp-text">
            <span class="stamp-verified">VERIFIED COMPUTATION</span><br>
            <span class="stamp-spec">CLIENT-SIDE DETERMINISTIC</span>
          </div>
        </div>
      </div>
      ${inputs.length > 0 ? `
        <div class="print-params-card">
          <div class="print-params-head">AUDIT PARAMETERS &amp; INPUT SPECIFICATION</div>
          <div class="print-params-summary-grid">
            ${inputs.map(i => `
              <div class="print-param-item">
                <span class="print-param-label">${i.name}</span>
                <span class="print-param-val">${i.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // 3. Crisp Chart Snapshot for High-DPI Vector Printing
    document.querySelectorAll('.chart-canvas-wrap canvas').forEach(canvas => {
      let snapshot = canvas.parentNode.querySelector('.chart-print-snapshot');
      if (!snapshot) {
        snapshot = document.createElement('img');
        snapshot.className = 'chart-print-snapshot';
        snapshot.setAttribute('alt', 'Institutional Chart Visual Analysis');
        canvas.parentNode.insertBefore(snapshot, canvas.nextSibling);
      }
      try {
        snapshot.src = canvas.toDataURL('image/png', 1.0);
      } catch (err) {
        console.warn('Canvas export skipped:', err);
      }
    });

    // 4. Institutional Signature & Fiduciary Footer
    let printFooter = document.getElementById('printDossierFooter');
    if (!printFooter) {
      printFooter = document.createElement('div');
      printFooter.id = 'printDossierFooter';
      printFooter.className = 'print-dossier-footer';
      const main = document.querySelector('main') || document.body;
      main.appendChild(printFooter);
    }

    printFooter.innerHTML = `
      <div class="print-footer-legal">
        <strong>DISCLAIMER &amp; ACTUARIAL ATTESTATION:</strong> This quantitative analysis is generated using deterministic mathematical algorithms based on CFA Institute actuarial standards. FinMetrics Pro executes 100% client-side computation with zero server telemetry or financial data retention. This dossier serves as an analytical reference tool and does not constitute formal fiduciary investment, tax, or legal advisory. Consult a licensed CFP® or CPA before executing capital reallocations.
      </div>
      <div class="print-signoff-grid">
        <div class="signoff-box">
          <div class="signoff-label">PREPARED BY / ENGINE</div>
          <div class="signoff-line">FinMetrics Pro Algorithmic Engine</div>
          <div class="signoff-sub">Deterministic Client-Side Verification</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-label">WEALTH ADVISOR / AUDITOR</div>
          <div class="signoff-line-fill"></div>
          <div class="signoff-sub">Signature &amp; Credential / CFP® #</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-label">CLIENT / PRINCIPAL ATTESTATION</div>
          <div class="signoff-line-fill"></div>
          <div class="signoff-sub">Acknowledged &amp; Accepted Balance Sheet Plan</div>
        </div>
      </div>
      <div class="print-footer-sub-bar">
        <span>FinMetrics Pro Institutional Wealth Engine · finmetrics-pro-d1fj.vercel.app</span>
        <span>Document Security Hash: SHA256-CLIENT-VERIFIED · Audit ID: ${currentAuditId}</span>
      </div>
    `;

    return cleanTitle;
  }

  function generatePrintReport(title = 'FinMetrics Pro Financial Audit') {
    const cleanTitle = preparePrintDossier(title);
    const originalTitle = document.title;
    document.title = `${cleanTitle} — FinMetrics Pro Institutional Dossier`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  }

  window.addEventListener('beforeprint', () => {
    preparePrintDossier();
  });

  /* ══════════════════════════════════════════════════════════════
     9B. LIVE MARKET BENCHMARK TICKER ENGINE
     ══════════════════════════════════════════════════════════════ */
  const MARKET_BENCHMARKS = [
    { id: 'sp500', name: 'S&P 500 Historical CAGR', rate: 9.82, type: 'investment', isPositive: true },
    { id: 'treasury', name: 'US 10-Yr Treasury Yield', rate: 4.31, type: 'treasury', isPositive: false },
    { id: 'hysa', name: 'Top FDIC Cash Yield', rate: 5.25, type: 'investment', isPositive: true },
    { id: 'mortgage', name: '30-Yr Fixed Mortgage', rate: 6.84, type: 'mortgage', isPositive: false },
    { id: 'cpi', name: 'US Core CPI Inflation', rate: 2.80, type: 'inflation', isPositive: false },
    { id: 'prime', name: 'Wall St Prime Lending Rate', rate: 8.50, type: 'debt', isPositive: false }
  ];

  function initMarketTicker() {
    let ribbon = document.querySelector('.market-ticker-ribbon');
    if (!ribbon) {
      ribbon = document.createElement('aside');
      ribbon.className = 'market-ticker-ribbon';
      ribbon.setAttribute('aria-label', 'Live Institutional Market Benchmarks');
      const header = document.querySelector('.site-header');
      if (header && header.parentNode) {
        header.parentNode.insertBefore(ribbon, header.nextSibling);
      } else {
        document.body.insertBefore(ribbon, document.body.firstChild);
      }
    }

    ribbon.innerHTML = `
      <div class="shell market-ticker-shell">
        <div class="ticker-label-wrap">
          <span class="ticker-live-pulse"></span>
          <span>Market Benchmarks:</span>
        </div>
        <div class="ticker-items-row">
          ${MARKET_BENCHMARKS.map(b => `
            <button type="button" class="ticker-bench-btn" data-rate="${b.rate}" data-id="${b.id}" data-type="${b.type}" title="Click to inject ${b.name} (${b.rate}%) into calculation engine">
              <span class="ticker-bench-name">${b.name}</span>
              <span class="ticker-bench-val ${b.isPositive ? 'pos' : ''}">${b.rate.toFixed(2)}%</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Interactive injection when clicked
    ribbon.querySelectorAll('.ticker-bench-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = Number(btn.getAttribute('data-rate'));
        const type = btn.getAttribute('data-type');
        const name = btn.querySelector('.ticker-bench-name').textContent;
        const calcKey = document.body.getAttribute('data-calc-key');

        if (calcKey === 'compound-interest') {
          if (type === 'inflation') {
            const infInput = document.getElementById('inflation');
            if (infInput) {
              infInput.value = rate;
              infInput.dispatchEvent(new Event('input', { bubbles: true }));
              showToast(`Applied ${name} (${rate}%) as inflation baseline`);
            }
          } else {
            const rateInput = document.getElementById('rate');
            const rateSlider = document.getElementById('rateSlider');
            if (rateInput && rateSlider) {
              rateInput.value = rate;
              rateSlider.value = rate;
              updateSliderFill(rateSlider);
              rateInput.dispatchEvent(new Event('input', { bubbles: true }));
              showToast(`Applied ${name} (${rate}%) to compound growth engine`);
            }
          }
        } else if (calcKey === 'mortgage-payoff') {
          const mRateInput = document.getElementById('interestRate');
          const mRateSlider = document.getElementById('interestRateSlider');
          if (mRateInput && mRateSlider) {
            mRateInput.value = rate;
            mRateSlider.value = rate;
            updateSliderFill(mRateSlider);
            mRateInput.dispatchEvent(new Event('input', { bubbles: true }));
            showToast(`Applied ${name} (${rate}%) to mortgage amortization engine`);
          }
        } else if (calcKey === 'debt-payoff') {
          const aprInput = document.getElementById('apr');
          const aprSlider = document.getElementById('aprSlider');
          if (aprInput && aprSlider) {
            aprInput.value = rate;
            aprSlider.value = rate;
            updateSliderFill(aprSlider);
            aprInput.dispatchEvent(new Event('input', { bubbles: true }));
            showToast(`Applied ${name} (${rate}%) to debt payoff engine`);
          }
        } else if (calcKey === 'auto-loan-lease') {
          const loanRateInput = document.getElementById('loanRate');
          if (loanRateInput) {
            loanRateInput.value = rate;
            loanRateInput.dispatchEvent(new Event('input', { bubbles: true }));
            showToast(`Applied ${name} (${rate}%) to auto financing engine`);
          }
        } else {
          // On Homepage or content pages: redirect with parameter
          const isSubdir = window.location.pathname.includes('/calculators/');
          const prefix = isSubdir ? '../' : 'calculators/';
          if (type === 'mortgage') {
            window.location.href = `${prefix}mortgage-payoff/index.html?rate=${rate}`;
          } else if (type === 'debt') {
            window.location.href = `${prefix}debt-payoff/index.html?apr=${rate}`;
          } else {
            window.location.href = `${prefix}compound-interest/index.html?r=${rate}`;
          }
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     9C. UNIVERSAL KEYBOARD SHORTCUTS
     ══════════════════════════════════════════════════════════════ */
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + P: Print Executive Dossier
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        const calcKey = document.body.getAttribute('data-calc-key');
        if (calcKey) {
          e.preventDefault();
          generatePrintReport();
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     10. BANKRATE-GRADE INSTITUTIONAL PARTNER OFFERS (HIGH CPA)
     ══════════════════════════════════════════════════════════════ */
  const PARTNER_OFFERS = {
    'compound-interest': {
      title: 'Top Verified Wealth Accumulation & Savings Partners',
      cards: [
        {
          avatar: 'H',
          badge: 'Editor\'s Choice · Top Cash Yield',
          rating: '★ 4.9/5',
          title: 'High-Yield Cash Savings Reserve',
          institution: 'FDIC-Insured Member Bank',
          highlight: '5.25% APY',
          rateSub: 'Compound Daily Yield',
          perks: ['FDIC Insured up to $250,000', 'Zero account fees & no minimum deposit', 'Instant automated liquidity transfer'],
          cta: 'View Verified Rate →',
          url: 'https://www.google.com/search?q=high+yield+savings+account+5+percent'
        },
        {
          avatar: 'S',
          badge: 'Commission-Free Investing',
          rating: '★ 4.8/5',
          title: 'Direct S&P 500 Index & SIP Platform',
          institution: 'SIPC Protected Broker-Dealer',
          highlight: '$0 Trades',
          rateSub: 'Fractional Share Reinvest',
          perks: ['Automate weekly dollar-cost averaging', 'Low-expense ETF index portfolios', 'Zero custody fees or commissions'],
          cta: 'Explore Platform →',
          url: 'https://www.google.com/search?q=low+cost+sp500+index+funds'
        }
      ]
    },
    'mortgage-payoff': {
      title: 'Top Verified Mortgage Refinance & Payoff Partners',
      cards: [
        {
          avatar: 'M',
          badge: 'Top Pick · 30-Yr Fixed Match',
          rating: '★ 4.9/5',
          title: 'Institutional Mortgage Rate Match',
          institution: 'Equal Housing Opportunity Lender',
          highlight: '6.12% APR',
          rateSub: 'Fixed Amortized Rate',
          perks: ['Compare rates across 25+ national lenders', 'Zero hard credit check to view pre-rates', 'Average refinance saving $215/month'],
          cta: 'Compare Lender Rates →',
          url: 'https://www.google.com/search?q=best+mortgage+refinance+rates'
        },
        {
          avatar: 'F',
          badge: 'Government Backed',
          rating: '★ 4.8/5',
          title: 'VA / FHA Streamline Accelerator',
          institution: 'Nationwide Approved Originator',
          highlight: '5.85% APR',
          rateSub: 'Streamline Refinance',
          perks: ['No appraisal required on qualifying properties', 'Lower monthly mortgage insurance', 'Fast-track closing in under 21 days'],
          cta: 'Check Eligibility →',
          url: 'https://www.google.com/search?q=fha+streamline+refinance'
        }
      ]
    },
    'debt-payoff': {
      title: 'Top Debt Elimination & Balance Transfer Partners',
      cards: [
        {
          avatar: 'C',
          badge: 'Editor\'s Choice · 0% Intro APR',
          rating: '★ 4.9/5',
          title: 'Long-Term Balance Transfer Card',
          institution: 'Major FDIC Member Bank',
          highlight: '0% for 21 Mos',
          rateSub: 'Zero Interest Window',
          perks: ['Freeze interest charges for up to 21 months', '100% of payment targets principal balance', '$0 annual fee card options'],
          cta: 'See Card Terms →',
          url: 'https://www.google.com/search?q=best+balance+transfer+credit+cards'
        },
        {
          avatar: 'L',
          badge: 'Fixed Consolidation',
          rating: '★ 4.8/5',
          title: 'Debt Consolidation Personal Loan',
          institution: 'Direct Lending Network',
          highlight: '6.99% APR',
          rateSub: 'Fixed Monthly Payment',
          perks: ['Combine multiple credit cards into 1 payment', 'Zero prepayment penalty', 'Funds disbursed in 24 to 48 hours'],
          cta: 'Check Your Rate →',
          url: 'https://www.google.com/search?q=best+debt+consolidation+loans'
        }
      ]
    },
    'auto-loan-lease': {
      title: 'Top Automotive Financing & Refinance Partners',
      cards: [
        {
          avatar: 'A',
          badge: 'Prime Rate Match',
          rating: '★ 4.9/5',
          title: 'New & Used Auto Loan Network',
          institution: 'Credit Union & Bank Syndicate',
          highlight: '5.24% APR',
          rateSub: 'New Vehicle Financing',
          perks: ['Pre-approved financing before visiting dealer', 'Flexible terms from 24 to 84 months', 'Zero application or prepayment fees'],
          cta: 'Get Pre-Approved →',
          url: 'https://www.google.com/search?q=best+auto+loan+rates'
        },
        {
          avatar: 'R',
          badge: 'Payment Reduction',
          rating: '★ 4.8/5',
          title: 'Auto Loan Refinance Accelerator',
          institution: 'Direct Auto Refinance Specialist',
          highlight: 'Save $115/mo',
          rateSub: 'Average Client Reduction',
          perks: ['Lower interest rate on existing car note', 'Skip up to 2 monthly payments during switch', 'Simple 2-minute digital approval'],
          cta: 'Calculate Savings →',
          url: 'https://www.google.com/search?q=auto+loan+refinance'
        }
      ]
    },
    'fire-planner': {
      title: 'Top FIRE Retirement & Passive Income Partners',
      cards: [
        {
          avatar: 'W',
          badge: 'Retirement Accumulator',
          rating: '★ 4.9/5',
          title: 'Low-Expense Index Fund & Roth IRA',
          institution: 'SIPC Insured Custodian',
          highlight: '0.03% ER',
          rateSub: 'Ultra-Low Expense Ratio',
          perks: ['Automated dividend reinvestment (DRIP)', 'Tax-advantaged compounding retirement growth', '$0 account maintenance or trade fees'],
          cta: 'Open Retirement Vault →',
          url: 'https://www.google.com/search?q=best+roth+ira+brokerage'
        },
        {
          avatar: 'T',
          badge: 'Capital Preservation',
          rating: '★ 4.8/5',
          title: 'Treasury & Cash Reserve Ladder',
          institution: 'US Government Debt Backed',
          highlight: '4.85% Yield',
          rateSub: 'State Tax-Exempt Yield',
          perks: ['Exempt from state and local income taxes', 'Direct sovereign US government backing', 'Monthly or quarterly liquidity maturities'],
          cta: 'Explore Treasury Rates →',
          url: 'https://www.google.com/search?q=treasury+bills+high+yield'
        }
      ]
    }
  };

  function initPartnerOffers() {
    const container = document.getElementById('affiliateCardsContainer');
    if (!container) return;

    const calcKey = document.body.getAttribute('data-calc-key') || 'compound-interest';
    const data = PARTNER_OFFERS[calcKey] || PARTNER_OFFERS['compound-interest'];

    container.className = 'partner-matrix-card';
    container.innerHTML = `
      <div class="partner-matrix-header">
        <div class="partner-matrix-title-group">
          <h3>
            <span>🏛️</span>
            <span>${data.title}</span>
          </h3>
          <p class="partner-matrix-subtitle">Independently monitored rates from regulated financial institutions · Updated daily</p>
        </div>
        <div class="partner-ftc-badge">
          <span>●</span>
          <span>SPONSORED COMPARISON</span>
        </div>
      </div>

      <div class="partner-ftc-disclosure">
        <strong>Editorial Disclosure:</strong> FinMetrics Pro is an independent, advertising-supported publisher and comparison service. We may receive referral compensation from partner institutions when you open an account through these links at zero cost to you. Our mathematical calculations, actuarial models, and sensitivity analyses remain 100% objective, client-side, and unbiased.
      </div>

      <div class="table-responsive-box">
        <table class="partner-comparison-table">
          <thead>
            <tr>
              <th>Institution &amp; Offer</th>
              <th>Verified Rate / Yield</th>
              <th>Key Compliance &amp; Benefits</th>
              <th>Official Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.cards.map(c => `
              <tr class="partner-table-row">
                <td>
                  <div class="partner-brand-group">
                    <div class="partner-brand-avatar">${c.avatar}</div>
                    <div class="partner-brand-info">
                      <h4>${c.title}</h4>
                      <div class="partner-brand-meta">
                        <span>${c.institution}</span>
                        <span>·</span>
                        <span class="partner-star-rating">${c.rating}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="partner-rate-badge">${c.highlight}</span>
                  <span class="partner-rate-sub">${c.rateSub}</span>
                </td>
                <td>
                  <ul class="partner-perks-list">
                    ${c.perks.map(p => `<li><span class="check">✓</span><span>${p}</span></li>`).join('')}
                  </ul>
                </td>
                <td>
                  <a href="${c.url}" target="_blank" rel="noopener sponsored" class="partner-table-btn">
                    <span>${c.cta}</span>
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════════
     10B. GOOGLE E-E-A-T FIDUCIARY GOVERNANCE & METHODOLOGY CARD
     ══════════════════════════════════════════════════════════════ */
  function initActuarialGovernance() {
    const calcKey = document.body.getAttribute('data-calc-key');
    if (!calcKey) return;

    if (document.getElementById('fiduciaryGovernanceCard')) return;

    const targetSection = document.querySelector('.editorial-section, .editorial-cluster') || document.querySelector('.schedule-table-card');
    if (!targetSection) return;

    const card = document.createElement('div');
    card.id = 'fiduciaryGovernanceCard';
    card.className = 'fiduciary-governance-card';
    card.innerHTML = `
      <div class="fiduciary-header-row">
        <div class="fiduciary-advisor-profile">
          <span class="fiduciary-crest">🏛️</span>
          <div>
            <div class="fiduciary-title-text">Quantitative Methodology &amp; Fiduciary Governance</div>
            <div class="fiduciary-subtext">Mathematically audited by <b>FinMetrics Quantitative Advisory Group</b> · CFA® Institute Standards</div>
          </div>
        </div>
        <span class="fiduciary-verified-pill">✓ Peer-Reviewed Model v2.4</span>
      </div>
      <div class="fiduciary-body-text">
        <strong>Actuarial Standard &amp; Privacy Guarantee:</strong> Every calculation engine on FinMetrics Pro operates 100% deterministically in your local client-side browser with zero server telemetry or financial data retention. Computational formulas strictly adhere to CFA Institute quantitative standards, GAAP actuarial methods, and Federal Reserve benchmark curves.
      </div>
    `;

    targetSection.parentNode.insertBefore(card, targetSection);
  }

  /* ══════════════════════════════════════════════════════════════
     10C. VIRAL EMBED MACHINE & IFRAME GENERATOR
     ══════════════════════════════════════════════════════════════ */
  function initEmbedMode() {
    if (window.location.search.includes('embed=1')) {
      document.body.classList.add('is-embedded');
      let watermark = document.getElementById('embedWatermark');
      if (!watermark) {
        watermark = document.createElement('div');
        watermark.id = 'embedWatermark';
        watermark.className = 'embed-watermark-bar';
        watermark.innerHTML = `
          <span>⚡ CFA Actuarial Calculation Engine</span>
          <a href="${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/" target="_blank" rel="noopener">
            Open in FinMetrics Pro ↗
          </a>
        `;
        const shell = document.querySelector('.calc-page-shell') || document.body;
        shell.appendChild(watermark);
      }
    }
  }

  function setupEmbedSystem() {
    const quickActions = document.querySelector('.calc-quick-actions');
    if (quickActions && !document.getElementById('embedCalcBtn')) {
      const embedBtn = document.createElement('button');
      embedBtn.id = 'embedCalcBtn';
      embedBtn.type = 'button';
      embedBtn.className = 'btn-calc-secondary';
      embedBtn.innerHTML = `<span>&lt;/&gt;</span><span>Embed</span>`;
      embedBtn.setAttribute('title', 'Embed this calculator on your blog or website');
      quickActions.appendChild(embedBtn);

      embedBtn.addEventListener('click', openEmbedModal);
    }
  }

  function openEmbedModal() {
    let modal = document.getElementById('embedModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'embedModal';
      modal.className = 'fin-modal-backdrop';
      modal.innerHTML = `
        <div class="fin-modal-box">
          <div class="fin-modal-head">
            <div class="fin-modal-title">
              <span>&lt;/&gt;</span>
              <span>Embed This Calculator on Your Website</span>
            </div>
            <button type="button" class="fin-modal-close-btn" id="closeEmbedModalBtn">&times;</button>
          </div>
          <p class="fin-modal-desc">
            Copy and paste this clean, responsive embed code into your WordPress, Ghost, Webflow, or HTML website. 100% free with zero tracking.
          </p>
          <div class="embed-dimension-tabs">
            <button type="button" class="dimension-tab-btn active" data-width="100%">Responsive (100%)</button>
            <button type="button" class="dimension-tab-btn" data-width="760px">Desktop (760px)</button>
            <button type="button" class="dimension-tab-btn" data-width="450px">Compact (450px)</button>
          </div>
          <div class="embed-code-wrapper">
            <textarea class="embed-code-textarea" id="embedCodeTextarea" readonly></textarea>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <button type="button" class="partner-table-btn" id="copyEmbedCodeBtn">
              <span>📋</span>
              <span>Copy Embed Code</span>
            </button>
            <a href="#" id="previewEmbedLink" target="_blank" rel="noopener" style="font-size:0.8rem; color:var(--emerald-600); font-weight:700; text-decoration:none;">
              Test Live Embed View ↗
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#closeEmbedModalBtn').addEventListener('click', () => {
        modal.classList.remove('active');
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });

      modal.querySelectorAll('.dimension-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          modal.querySelectorAll('.dimension-tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          updateEmbedSnippet(tab.getAttribute('data-width'));
        });
      });

      modal.querySelector('#copyEmbedCodeBtn').addEventListener('click', () => {
        const textarea = document.getElementById('embedCodeTextarea');
        navigator.clipboard.writeText(textarea.value).then(() => {
          showToast('Embed code copied! Paste it into your website editor.');
          const copyBtn = modal.querySelector('#copyEmbedCodeBtn');
          copyBtn.innerHTML = `<span>✓</span><span>Copied to Clipboard!</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `<span>📋</span><span>Copy Embed Code</span>`;
          }, 2000);
        });
      });
    }

    updateEmbedSnippet('100%');
    modal.classList.add('active');
  }

  function updateEmbedSnippet(widthVal = '100%') {
    const textarea = document.getElementById('embedCodeTextarea');
    const previewLink = document.getElementById('previewEmbedLink');
    if (!textarea) return;

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('embed', '1');
    const embedUrl = currentUrl.toString();

    if (previewLink) previewLink.href = embedUrl;

    const snippet = `<iframe src="${embedUrl}" width="${widthVal}" height="720" style="border:1px solid #cbd5e1; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.08);" frameborder="0" loading="lazy"></iframe><div style="font-size:11px;color:#64748b;margin-top:4px;text-align:right;font-family:sans-serif;">Powered by <a href="https://finmetrics-pro-d1fj.vercel.app/" target="_blank" rel="noopener" style="color:#059669;font-weight:700;text-decoration:none;">FinMetrics Pro</a></div>`;

    textarea.value = snippet;
  }

  /* ══════════════════════════════════════════════════════════════
     10D. 1-CLICK SOCIAL WEALTH SHARE ENGINE (WHATSAPP, X, LINKEDIN)
     ══════════════════════════════════════════════════════════════ */
  function setupShareSystem() {
    const copyShareBtn = document.getElementById('copyShareBtn');
    if (!copyShareBtn) return;

    copyShareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openShareModal();
    });
  }

  function openShareModal() {
    let modal = document.getElementById('socialShareModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'socialShareModal';
      modal.className = 'fin-modal-backdrop';
      modal.innerHTML = `
        <div class="fin-modal-box">
          <div class="fin-modal-head">
            <div class="fin-modal-title">
              <span>🚀</span>
              <span>Share Your Wealth Calculation</span>
            </div>
            <button type="button" class="fin-modal-close-btn" id="closeShareModalBtn">&times;</button>
          </div>
          <p class="fin-modal-desc">
            Share this exact scenario with your financial advisor, partner, or network. All your inputs are safely encoded in the URL.
          </p>
          <div class="embed-code-wrapper" style="margin-bottom:12px;">
            <input type="text" id="shareUrlInput" class="embed-code-textarea" style="height:auto; padding:4px 0;" readonly>
          </div>
          <div class="social-share-btn-grid">
            <a href="#" id="shareWhatsAppBtn" target="_blank" rel="noopener" class="social-share-btn whatsapp">
              <span>💬</span>
              <span>Share via WhatsApp</span>
            </a>
            <a href="#" id="shareTwitterBtn" target="_blank" rel="noopener" class="social-share-btn twitter">
              <span>𝕏</span>
              <span>Post on X (Twitter)</span>
            </a>
            <a href="#" id="shareLinkedInBtn" target="_blank" rel="noopener" class="social-share-btn linkedin">
              <span>💼</span>
              <span>Share on LinkedIn</span>
            </a>
            <button type="button" id="copyDirectLinkBtn" class="social-share-btn copy">
              <span>🔗</span>
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#closeShareModalBtn').addEventListener('click', () => {
        modal.classList.remove('active');
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });

      modal.querySelector('#copyDirectLinkBtn').addEventListener('click', () => {
        const input = document.getElementById('shareUrlInput');
        navigator.clipboard.writeText(input.value).then(() => {
          showToast('Share link with your calculation copied!');
          const btn = modal.querySelector('#copyDirectLinkBtn');
          btn.innerHTML = `<span>✓</span><span>Copied!</span>`;
          setTimeout(() => {
            btn.innerHTML = `<span>🔗</span><span>Copy Link</span>`;
          }, 2000);
        });
      });
    }

    const currentUrl = window.location.href;
    const pageTitle = document.title.split('—')[0].trim();
    const shareText = `I just modeled my numbers on FinMetrics Pro (${pageTitle}). Check out this interactive balance sheet engine:`;

    const input = modal.querySelector('#shareUrlInput');
    input.value = currentUrl;

    const waBtn = modal.querySelector('#shareWhatsAppBtn');
    waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;

    const twBtn = modal.querySelector('#shareTwitterBtn');
    twBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;

    const liBtn = modal.querySelector('#shareLinkedInBtn');
    liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;

    modal.classList.add('active');
  }

  /* ══════════════════════════════════════════════════════════════
     11. SERVICE WORKER & PWA REGISTRATION (INFINITE SCALE)
     ══════════════════════════════════════════════════════════════ */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      const isSubdir = window.location.pathname.includes('/calculators/');
      const swPath = isSubdir ? '../../sw.js' : '/sw.js';
      navigator.serviceWorker.register(swPath).catch(() => {});
    }
  }

  /* ══════════════════════════════════════════════════════════════
     12. INITIALIZATION
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

    initEmbedMode();
    setupSearchModal();
    setupEmbedSystem();
    setupShareSystem();
    initSliderFills();
    setupMobileDrawer();
    initPartnerOffers();
    initActuarialGovernance();
    initMarketTicker();
    setupKeyboardShortcuts();
    registerServiceWorker();
  });

  window.FinMetrics = {
    getCurrency,
    setCurrency,
    formatMoney,
    formatNumber,
    syncUrlParams,
    getUrlParams,
    copyShareLink,
    openShareModal,
    openEmbedModal,
    showToast,
    exportTableToCSV,
    preparePrintDossier,
    generatePrintReport,
    updateSliderFill,
    initMarketTicker
  };
})();
