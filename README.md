# FinMetrics Pro — Institutional Financial Intelligence & Calculation Suite

> High-Yield, Zero-Overhead, Evergreen Web Asset engineered for maximum Google AdSense CPC ($3 – $35+) and Lifetime Financial Affiliate Wealth.

---

## 1. Project Architecture & Standards

- **Zero Framework Bloat:** 100% pure vanilla HTML5, CSS3, and modern ECMAScript.
- **Client-Side Compute:** 100% of amortization schedules, compound formulas, and graphs run locally inside the user's browser (sub-16ms execution).
- **Zero Server Costs:** Deploys freely on Vercel or Cloudflare Pages with zero compute bills, even under millions of monthly requests.
- **Institutional Design System:**
  - Modern slate/navy fintech dark mode + daylight light mode with auto-persisted preferences.
  - Multi-Currency engine supporting USD ($), EUR (€), GBP (£), INR (₹), CAD ($), and AUD ($).
  - Quick Search Modal triggered via `Ctrl + K`.
  - Shareable URL parameters (`?p=10000&m=500&y=20&r=9.5`) for instant viral sharing.
  - CSV Export & 1-page clean PDF print reports.

---

## 2. Directory Structure

```
c:\finmetrics-pro\
├── index.html                   # High-converting portal homepage with search and category navigation
├── assets\
│   ├── css\
│   │   ├── main.css             # Design tokens, typography, dark/light theme, navbar, footer
│   │   └── calculator.css       # Two-column workbench, sliders, metrics, tables, print styles
│   └── js\
│       ├── core.js              # Theme switcher, currency engine, search modal, share links
│       ├── math-utils.js        # Audited formulas for compounding, mortgage, and debt
│       └── chart.min.js         # Local, zero-dependency Chart.js distribution
├── calculators\
│   ├── compound-interest\       # Compound Wealth & SIP Calculator with inflation adjustments
│   │   ├── index.html
│   │   └── app.js
│   ├── mortgage-payoff\         # Mortgage Payoff with Extra Monthly Principal
│   │   ├── index.html
│   │   └── app.js
│   ├── debt-payoff\             # Credit Card Debt Avalanche / Snowball Payoff
│   │   ├── index.html
│   │   └── app.js
│   └── auto-loan-lease\         # Auto Loan vs. Lease Decision Engine
│       ├── index.html
│       └── app.js
├── about.html                   # Mission & organizational background
├── methodology.html             # Mathematical proofs & formula audits
├── disclaimer.html              # Non-advisory financial disclosures
├── privacy.html                 # 100% client-side privacy policy
├── terms.html                   # Terms of service
├── contact.html                 # Feedback & formula audit inquiries
├── robots.txt                   # Search crawler directives
├── sitemap.xml                  # Canonical XML sitemap for Google Search Console
└── ads.txt                      # Authorized digital seller tag for Google AdSense
```

---

## 3. Deployment Instructions (Vercel)

This application requires **no build step** and **no package manager**.

1. **Initialize Git inside `c:\finmetrics-pro`:**
   ```bash
   cd c:\finmetrics-pro
   git init
   git add .
   git commit -m "Initial commit of FinMetrics Pro institutional financial suite"
   git branch -M main
   ```
2. **Push to a new private or public GitHub repository:**
   ```bash
   git remote add origin https://github.com/<your-username>/finmetrics-pro.git
   git push -u origin main
   ```
3. **Import into Vercel ([vercel.com/new](https://vercel.com/new)):**
   - Framework Preset: **Other**
   - Build Command: *None (toggle OFF)*
   - Output Directory: *`./` (leave blank)*
   - Click **Deploy**.

---

## 4. Google AdSense & Monetization Blueprint

1. **Attach a Custom Domain:** Connect a brandable domain (e.g. `WealthCalcHub.com` or `FinMetricsPro.com`).
2. **Submit to Google Search Console:** Add your custom domain and submit `https://yourdomain.com/sitemap.xml`.
3. **High-CPC Ad Units:**
   - **Sticky Bottom Anchor Ad:** High visibility on mobile screens while users adjust sliders.
   - **In-Content Banner:** Placed immediately beneath the dynamic smart insight banner.
   - **Vignette Ad:** Triggered when users navigate between calculators.
4. **Financial Affiliate Partnerships:**
   - **High-Yield Savings / Brokerages:** Add comparison cards (e.g., Robinhood, eToro, Zerodha, Wise) yielding \$40 – \$150 per qualified referral.

