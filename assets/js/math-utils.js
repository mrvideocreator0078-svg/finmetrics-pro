/**
 * FINMETRICS PRO — AUDITED FINANCIAL ALGORITHMS & MATHEMATICAL UTILITIES
 * Exact Institutional Precision for Interest, Amortization & Cash Flow
 */

(function () {
  'use strict';

  const MathUtils = {

    /**
     * COMPOUND INTEREST & SIP ACCUMULATION ENGINE
     */
    calculateCompoundInterest: function (params) {
      const principal = Math.max(0, Number(params.principal) || 0);
      const monthlyContribution = Math.max(0, Number(params.monthlyContribution) || 0);
      const annualRate = Math.max(0, Number(params.annualRate) || 0) / 100;
      const years = Math.max(1, Math.min(60, Number(params.years) || 10));
      const compoundFreq = Number(params.compoundFreq) || 12; // 12 = monthly, 1 = annually, 4 = quarterly
      const inflationRate = (Number(params.inflationRate) || 0) / 100;

      let currentBalance = principal;
      let totalDeposited = principal;
      let totalInterestEarned = 0;

      const schedule = [];
      const labels = [];
      const balanceData = [];
      const depositsData = [];
      const interestData = [];

      for (let y = 1; y <= years; y++) {
        let yearStartingBalance = currentBalance;
        let yearDeposits = 0;
        let yearInterest = 0;

        for (let m = 1; m <= 12; m++) {
          currentBalance += monthlyContribution;
          totalDeposited += monthlyContribution;
          yearDeposits += monthlyContribution;

          // Compound calculation for this step
          const monthlyRate = annualRate / 12;
          const interest = currentBalance * monthlyRate;
          currentBalance += interest;
          yearInterest += interest;
          totalInterestEarned += interest;
        }

        // Purchasing power adjusted for inflation
        const inflationFactor = Math.pow(1 + inflationRate, y);
        const realPurchasingPower = currentBalance / inflationFactor;

        labels.push(`Year ${y}`);
        balanceData.push(Math.round(currentBalance));
        depositsData.push(Math.round(totalDeposited));
        interestData.push(Math.round(totalInterestEarned));

        schedule.push({
          year: y,
          startBalance: yearStartingBalance,
          deposits: yearDeposits,
          interest: yearInterest,
          endBalance: currentBalance,
          totalDeposited: totalDeposited,
          totalInterest: totalInterestEarned,
          purchasingPower: realPurchasingPower
        });
      }

      return {
        finalBalance: currentBalance,
        totalDeposited: totalDeposited,
        totalInterest: totalInterestEarned,
        inflationAdjustedBalance: currentBalance / Math.pow(1 + inflationRate, years),
        labels,
        balanceData,
        depositsData,
        interestData,
        schedule
      };
    },

    /**
     * MORTGAGE AMORTIZATION & EXTRA PAYMENT PAYOFF ENGINE
     */
    calculateMortgage: function (params) {
      const homePrice = Math.max(0, Number(params.homePrice) || 400000);
      const downPayment = Math.max(0, Number(params.downPayment) || 80000);
      const interestRate = Math.max(0.1, Number(params.interestRate) || 6.5) / 100;
      const loanTermYears = Number(params.loanTermYears) || 30;
      const extraMonthly = Math.max(0, Number(params.extraMonthly) || 0);

      const propertyTaxAnnual = Number(params.propertyTaxAnnual) || (homePrice * 0.012);
      const homeInsuranceAnnual = Number(params.homeInsuranceAnnual) || 1200;
      const hoaMonthly = Number(params.hoaMonthly) || 0;

      const principal = Math.max(0, homePrice - downPayment);
      const totalMonths = loanTermYears * 12;
      const monthlyRate = interestRate / 12;

      // Standard monthly P&I formula: M = P * [ r(1+r)^n / ((1+r)^n - 1) ]
      let standardPI = 0;
      if (monthlyRate > 0) {
        const factor = Math.pow(1 + monthlyRate, totalMonths);
        standardPI = principal * ((monthlyRate * factor) / (factor - 1));
      } else {
        standardPI = principal / totalMonths;
      }

      // Baseline Calculation (Without Extra Payments)
      let baselineInterest = 0;
      let baseBalance = principal;
      for (let m = 1; m <= totalMonths; m++) {
        const intPayment = baseBalance * monthlyRate;
        const princPayment = Math.min(baseBalance, standardPI - intPayment);
        baselineInterest += intPayment;
        baseBalance -= princPayment;
        if (baseBalance <= 0) break;
      }

      // Accelerated Amortization (With Extra Payments)
      let balance = principal;
      let totalInterestWithExtra = 0;
      let monthsToPayoff = 0;
      const schedule = [];
      const yearlySummary = [];

      let currentYear = new Date().getFullYear();
      let runningYearInterest = 0;
      let runningYearPrincipal = 0;

      for (let m = 1; m <= totalMonths; m++) {
        if (balance <= 0) break;

        monthsToPayoff++;
        const interestPayment = balance * monthlyRate;
        let principalPayment = standardPI - interestPayment;
        let actualExtra = extraMonthly;

        if (balance < (principalPayment + actualExtra)) {
          actualExtra = Math.max(0, balance - principalPayment);
        }

        const totalPrincipalThisMonth = Math.min(balance, principalPayment + actualExtra);
        balance = Math.max(0, balance - totalPrincipalThisMonth);
        totalInterestWithExtra += interestPayment;

        runningYearInterest += interestPayment;
        runningYearPrincipal += totalPrincipalThisMonth;

        schedule.push({
          month: m,
          year: Math.ceil(m / 12),
          payment: standardPI + actualExtra,
          principal: totalPrincipalThisMonth,
          interest: interestPayment,
          extra: actualExtra,
          balance: balance
        });

        if (m % 12 === 0 || balance <= 0) {
          yearlySummary.push({
            yearNum: Math.ceil(m / 12),
            calendarYear: currentYear + Math.ceil(m / 12) - 1,
            principalPaid: runningYearPrincipal,
            interestPaid: runningYearInterest,
            endBalance: balance
          });
          runningYearInterest = 0;
          runningYearPrincipal = 0;
        }
      }

      const interestSaved = Math.max(0, baselineInterest - totalInterestWithExtra);
      const monthsSaved = Math.max(0, totalMonths - monthsToPayoff);
      const yearsSaved = (monthsSaved / 12).toFixed(1);

      const monthlyTax = propertyTaxAnnual / 12;
      const monthlyInsurance = homeInsuranceAnnual / 12;
      const totalMonthlyOutflow = standardPI + extraMonthly + monthlyTax + monthlyInsurance + hoaMonthly;

      return {
        loanAmount: principal,
        monthlyPI: standardPI,
        totalMonthlyPayment: totalMonthlyOutflow,
        monthlyTax,
        monthlyInsurance,
        hoaMonthly,
        totalInterestStandard: baselineInterest,
        totalInterestAccelerated: totalInterestWithExtra,
        interestSaved,
        monthsToPayoff,
        monthsSaved,
        yearsSaved,
        yearlySummary,
        monthlySchedule: schedule
      };
    },

    /**
     * CREDIT CARD & DEBT PAYOFF ENGINE
     */
    calculateDebtPayoff: function (params) {
      const balance = Math.max(0, Number(params.balance) || 12000);
      const apr = Math.max(0.1, Number(params.apr) || 24.99) / 100;
      const targetMonthly = Math.max(10, Number(params.monthlyPayment) || 450);

      const monthlyRate = apr / 12;
      const minPaymentPct = 0.02; // Standard 2% minimum payment or $35
      const minPaymentFloor = 35;

      // Minimum Payment Trap Simulation
      let minBal = balance;
      let minMonths = 0;
      let minTotalInterest = 0;
      while (minBal > 1 && minMonths < 600) {
        minMonths++;
        const interest = minBal * monthlyRate;
        minTotalInterest += interest;
        const requiredMin = Math.max(minPaymentFloor, minBal * minPaymentPct);
        const princ = Math.min(minBal, requiredMin - interest);
        if (princ <= 0) break; // Negative amortization loop prevention
        minBal -= princ;
      }

      // Target Fixed Payment Simulation
      let targetBal = balance;
      let targetMonths = 0;
      let targetTotalInterest = 0;
      const schedule = [];

      while (targetBal > 0.01 && targetMonths < 600) {
        targetMonths++;
        const interest = targetBal * monthlyRate;
        if (targetMonthly <= interest) {
          // Payment too low to cover interest
          return { error: 'Payment is too low to cover monthly interest. Balance will grow infinitely.' };
        }
        const princ = Math.min(targetBal, targetMonthly - interest);
        targetTotalInterest += interest;
        targetBal -= princ;

        schedule.push({
          month: targetMonths,
          payment: princ + interest,
          principal: princ,
          interest: interest,
          balance: Math.max(0, targetBal)
        });
      }

      const interestSaved = Math.max(0, minTotalInterest - targetTotalInterest);
      const monthsSaved = Math.max(0, minMonths - targetMonths);

      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + targetMonths);

      return {
        initialBalance: balance,
        targetMonths,
        targetTotalInterest,
        payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        minMonths,
        minTotalInterest,
        interestSaved,
        monthsSaved,
        schedule
      };
    },

    /**
     * AUTO LOAN VS LEASE DECISION ENGINE
     */
    calculateAutoLoanVsLease: function (params) {
      const carPrice = Math.max(1000, Number(params.carPrice) || 38000);
      const downPayment = Math.max(0, Number(params.downPayment) || 4000);
      const loanRate = Math.max(0, Number(params.loanRate) || 6.0) / 100;
      const loanTermMonths = Number(params.loanTermMonths) || 60; // 5 years
      const residualValuePct = Math.max(10, Math.min(90, Number(params.residualValuePct) || 52)) / 100;
      const leaseTermMonths = Number(params.leaseTermMonths) || 36; // 3 years
      const moneyFactor = Number(params.moneyFactor) || 0.0025; // Equivalent to ~6% APR (MF * 2400)
      const leaseDown = Math.max(0, Number(params.leaseDown) || 2000);

      // 1. Buy Loan Calculation
      const loanAmount = carPrice - downPayment;
      const r = loanRate / 12;
      let monthlyLoanPayment = 0;
      if (r > 0) {
        const factor = Math.pow(1 + r, loanTermMonths);
        monthlyLoanPayment = loanAmount * ((r * factor) / (factor - 1));
      } else {
        monthlyLoanPayment = loanAmount / loanTermMonths;
      }
      const totalLoanPaid = downPayment + (monthlyLoanPayment * loanTermMonths);
      const totalLoanInterest = totalLoanPaid - carPrice;

      // Estimated car value after 3 years (assuming standard 45% depreciation)
      const valueAfter3Years = carPrice * 0.55;
      // Net cost to own after 3 years (payments made minus remaining equity)
      // Balance after 36 months of 60 month loan
      let bal36 = loanAmount;
      for (let i = 1; i <= 36; i++) {
        const intP = bal36 * r;
        const princP = monthlyLoanPayment - intP;
        bal36 -= princP;
      }
      const net3YearBuyCost = (downPayment + (monthlyLoanPayment * 36)) - Math.max(0, valueAfter3Years - bal36);

      // 2. Lease Calculation
      const residualValue = carPrice * residualValuePct;
      const depreciationFee = (carPrice - leaseDown - residualValue) / leaseTermMonths;
      const financeFee = ((carPrice - leaseDown) + residualValue) * moneyFactor;
      const monthlyLeasePayment = Math.max(0, depreciationFee + financeFee);
      const totalLeasePaid = leaseDown + (monthlyLeasePayment * leaseTermMonths);

      const netDifference = Math.abs(net3YearBuyCost - totalLeasePaid);
      const recommendedOption = net3YearBuyCost < totalLeasePaid ? 'BUY' : 'LEASE';

      return {
        monthlyLoanPayment,
        totalLoanPaid,
        totalLoanInterest,
        monthlyLeasePayment,
        totalLeasePaid,
        net3YearBuyCost,
        residualValue,
        recommendedOption,
        netDifference
      };
    }

  };

  window.FinMath = MathUtils;

})();

