(function (global) {
  const TAX_TABLES = {
    2026: {
      label: '2026 tax year (1 Mar 2025 – 28 Feb 2026)',
      thresholds: {
        under65: 95750,
        '65to74': 148217,
        '75plus': 165689
      },
      rebates: {
        primary: 17235,
        secondary: 9444,
        tertiary: 3145
      },
      brackets: [
        { min: 0, upTo: 237100, rate: 0.18, baseTax: 0, label: 'R0 – R237,100' },
        { min: 237100, upTo: 370500, rate: 0.26, baseTax: 42678, label: 'R237,101 – R370,500' },
        { min: 370500, upTo: 512800, rate: 0.31, baseTax: 77362, label: 'R370,501 – R512,800' },
        { min: 512800, upTo: 673000, rate: 0.36, baseTax: 121475, label: 'R512,801 – R673,000' },
        { min: 673000, upTo: 857900, rate: 0.39, baseTax: 179147, label: 'R673,001 – R857,900' },
        { min: 857900, upTo: 1817000, rate: 0.41, baseTax: 251258, label: 'R857,901 – R1,817,000' },
        { min: 1817000, upTo: Infinity, rate: 0.45, baseTax: 644489, label: 'R1,817,001 and above' }
      ]
    },
    2027: {
      label: '2027 tax year (1 Mar 2026 – 28 Feb 2027)',
      thresholds: {
        under65: 99000,
        '65to74': 153250,
        '75plus': 171300
      },
      rebates: {
        primary: 17820,
        secondary: 9765,
        tertiary: 3249
      },
      brackets: [
        { min: 0, upTo: 245100, rate: 0.18, baseTax: 0, label: 'R0 – R245,100' },
        { min: 245100, upTo: 383100, rate: 0.26, baseTax: 44118, label: 'R245,101 – R383,100' },
        { min: 383100, upTo: 530200, rate: 0.31, baseTax: 79998, label: 'R383,101 – R530,200' },
        { min: 530200, upTo: 695800, rate: 0.36, baseTax: 125599, label: 'R530,201 – R695,800' },
        { min: 695800, upTo: 887000, rate: 0.39, baseTax: 185215, label: 'R695,801 – R887,000' },
        { min: 887000, upTo: 1878600, rate: 0.41, baseTax: 259783, label: 'R887,001 – R1,878,600' },
        { min: 1878600, upTo: Infinity, rate: 0.45, baseTax: 666339, label: 'R1,878,601 and above' }
      ]
    }
  };

  function roundCurrency(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function clampNumber(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return 0;
    }
    return amount;
  }

  function normaliseYear(taxYear) {
    return TAX_TABLES[taxYear] ? String(taxYear) : '2027';
  }

  function normaliseAgeGroup(ageGroup) {
    if (ageGroup === '65to74' || ageGroup === '75plus') {
      return ageGroup;
    }
    return 'under65';
  }

  function getTaxTable(taxYear) {
    return TAX_TABLES[normaliseYear(taxYear)];
  }

  function calculateTaxableIncome(income, options) {
    const amount = Math.max(clampNumber(income), 0);
    const bonus = Math.max(clampNumber(options && options.bonus), 0);
    const retirementContribution = Math.max(clampNumber(options && options.retirementContribution), 0);
    return roundCurrency(Math.max(amount + bonus - retirementContribution, 0));
  }

  function getAnnualRebate(ageGroup, taxYear) {
    const group = normaliseAgeGroup(ageGroup);
    const table = getTaxTable(taxYear);
    let rebate = table.rebates.primary;

    if (group === '65to74' || group === '75plus') {
      rebate += table.rebates.secondary;
    }

    if (group === '75plus') {
      rebate += table.rebates.tertiary;
    }

    return rebate;
  }

  function getThreshold(ageGroup, taxYear) {
    const group = normaliseAgeGroup(ageGroup);
    const table = getTaxTable(taxYear);
    return table.thresholds[group];
  }

  function getBracketDetails(taxableIncome, taxYear) {
    const income = Math.max(clampNumber(taxableIncome), 0);
    const table = getTaxTable(taxYear);

    for (let i = 0; i < table.brackets.length; i += 1) {
      const bracket = table.brackets[i];
      if (income <= bracket.upTo) {
        return {
          label: bracket.label,
          marginalRate: roundCurrency(bracket.rate * 100),
          index: i
        };
      }
    }

    const last = table.brackets[table.brackets.length - 1];
    return {
      label: last.label,
      marginalRate: roundCurrency(last.rate * 100),
      index: table.brackets.length - 1
    };
  }

  function calculateGrossTax(taxableIncome, options) {
    const year = normaliseYear(options && options.taxYear);
    const income = Math.max(clampNumber(taxableIncome), 0);
    const table = getTaxTable(year);

    if (income <= 0) {
      return 0;
    }

    for (let i = 0; i < table.brackets.length; i += 1) {
      const bracket = table.brackets[i];
      if (income <= bracket.upTo) {
        return roundCurrency(bracket.baseTax + ((income - bracket.min) * bracket.rate));
      }
    }

    return 0;
  }

  function calculateTax(income, options) {
    const year = normaliseYear(options && options.taxYear);
    const group = normaliseAgeGroup(options && options.ageGroup);
    const taxableIncome = calculateTaxableIncome(income, options);
    const grossTax = calculateGrossTax(taxableIncome, { taxYear: year });
    const rebate = getAnnualRebate(group, year);
    return roundCurrency(Math.max(grossTax - rebate, 0));
  }

  function calculateEffectiveTaxRate(income, options) {
    const taxableIncome = calculateTaxableIncome(income, options);
    if (taxableIncome <= 0) {
      return 0;
    }

    const rate = (calculateTax(income, options) / taxableIncome) * 100;
    return roundCurrency(rate);
  }

  function calculateSummary(income, options) {
    const year = normaliseYear(options && options.taxYear);
    const group = normaliseAgeGroup(options && options.ageGroup);
    const taxableIncome = calculateTaxableIncome(income, options);
    const grossTax = calculateGrossTax(taxableIncome, { taxYear: year });
    const annualRebate = getAnnualRebate(group, year);
    const netTax = roundCurrency(Math.max(grossTax - annualRebate, 0));
    const takeHome = roundCurrency(Math.max(taxableIncome - netTax, 0));
    const monthlyTakeHome = roundCurrency(takeHome / 12);
    const monthlyTax = roundCurrency(netTax / 12);
    const threshold = getThreshold(group, year);
    const bracketDetails = getBracketDetails(taxableIncome, year);

    return {
      taxYear: year,
      ageGroup: group,
      threshold,
      taxableIncome,
      grossTax,
      annualRebate,
      taxDue: netTax,
      effectiveRate: calculateEffectiveTaxRate(income, options),
      takeHome,
      monthlyTakeHome,
      monthlyTax,
      bracket: bracketDetails,
      isBelowThreshold: taxableIncome <= threshold
    };
  }

  const api = {
    TAX_TABLES,
    getTaxTable,
    calculateTaxableIncome,
    calculateGrossTax,
    calculateTax,
    calculateEffectiveTaxRate,
    calculateSummary,
    calculateAnnualRebate: getAnnualRebate,
    getThreshold,
    getBracketDetails
  };

  global.TaxCalculator = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
