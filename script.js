(function () {
  const STORAGE_KEY = 'sa-tax-studio-settings-v1';

  const defaultState = {
    activeField: 'income',
    expression: '0',
    values: {
      income: 0,
      bonus: 0,
      retirementContribution: 0
    },
    options: {
      taxYear: '2027',
      ageGroup: 'under65',
      theme: 'neo',
      displayStyle: 'mint',
      displaySize: 'standard'
    },
    history: []
  };

  const state = JSON.parse(JSON.stringify(defaultState));

  const fieldLabels = {
    income: 'Annual income',
    bonus: 'Annual bonus',
    retirementContribution: 'Retirement deduction'
  };

  const displayStyleLabels = {
    mint: 'Mint matrix',
    amber: 'Amber LED',
    ice: 'Ice blue',
    rose: 'Rose neon'
  };

  const displaySizeLabels = {
    compact: 'compact',
    standard: 'standard',
    large: 'large'
  };

  const elements = {};

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatPercent(value) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  function roundValue(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed && parsed.options) {
        state.options = Object.assign({}, state.options, parsed.options);
      }
      if (parsed && parsed.history && Array.isArray(parsed.history)) {
        state.history = parsed.history.slice(0, 5);
      }
    } catch (error) {
      // Ignore broken local storage values.
    }
  }

  function persistPreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        options: state.options,
        history: state.history
      }));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function applyLook() {
    document.body.setAttribute('data-theme', state.options.theme);
    document.body.setAttribute('data-display-style', state.options.displayStyle);
    document.body.setAttribute('data-display-size', state.options.displaySize);
    if (elements.themeSelect) {
      elements.themeSelect.value = state.options.theme;
    }
    if (elements.displayStyleSelect) {
      elements.displayStyleSelect.value = state.options.displayStyle;
    }
    if (elements.displaySizeSelect) {
      elements.displaySizeSelect.value = state.options.displaySize;
    }
    if (elements.displayModeBadge) {
      elements.displayModeBadge.textContent = `${displayStyleLabels[state.options.displayStyle]} • ${displaySizeLabels[state.options.displaySize]}`;
    }
  }

  function setExpression(value) {
    const next = String(value ?? '').trim();
    state.expression = next === '' ? '0' : next;
    elements.expressionDisplay.value = state.expression;
    elements.displayValuePreview.textContent = getExpressionPreview();
  }

  function getExpressionPreview() {
    const parsed = evaluateExpression(state.expression, { silent: true });
    return parsed === null ? 'Invalid expression' : formatCurrency(parsed);
  }

  function sanitiseExpression(expression) {
    const clean = String(expression || '').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '').trim();
    if (!clean) {
      return '0';
    }
    if (!/^[0-9+\-*/().\s]+$/.test(clean)) {
      return null;
    }
    return clean;
  }

  function evaluateExpression(expression, options) {
    const clean = sanitiseExpression(expression);
    if (clean === null) {
      return null;
    }

    try {
      const result = Function(`"use strict"; return (${clean});`)();
      if (!Number.isFinite(result)) {
        return null;
      }
      return roundValue(Math.max(result, 0));
    } catch (error) {
      if (!options || !options.silent) {
        flashMessage('That expression could not be calculated.');
      }
      return null;
    }
  }

  function flashMessage(message) {
    elements.insightMessage.textContent = message;
  }

  function selectField(fieldName) {
    state.activeField = fieldName;
    document.querySelectorAll('.entry-field').forEach(function (button) {
      button.classList.toggle('active', button.dataset.field === fieldName);
    });
    elements.activeFieldBadge.textContent = `Editing ${fieldLabels[fieldName].toLowerCase()}`;
    elements.displayTargetLabel.textContent = fieldLabels[fieldName];
    elements.displayHint.textContent = 'Tap numbers or type an expression';
    setExpression(String(state.values[fieldName] || 0));
  }

  function syncFieldCards() {
    elements.incomeValue.textContent = formatCurrency(state.values.income);
    elements.bonusValue.textContent = formatCurrency(state.values.bonus);
    elements.retirementContributionValue.textContent = formatCurrency(state.values.retirementContribution);
  }

  function appendToExpression(value) {
    const current = state.expression === '0' ? '' : state.expression;
    setExpression(current + value);
  }

  function handleKeypadPress(button) {
    const action = button.dataset.action;
    const value = button.dataset.value;

    if (action === 'clear') {
      setExpression('0');
      return;
    }

    if (action === 'backspace') {
      const sliced = state.expression.slice(0, -1);
      setExpression(sliced || '0');
      return;
    }

    if (typeof value === 'string') {
      appendToExpression(value);
    }
  }

  function saveExpressionToField() {
    const evaluated = evaluateExpression(state.expression);
    if (evaluated === null) {
      return;
    }

    state.values[state.activeField] = evaluated;
    syncFieldCards();
    setExpression(String(evaluated));
    flashMessage(`${fieldLabels[state.activeField]} saved as ${formatCurrency(evaluated)}.`);
  }

  function getInsight(summary) {
    if (summary.taxableIncome <= 0) {
      return 'Start by entering your annual income in rands. You can also add a bonus or subtract retirement contributions to customise the result.';
    }

    if (summary.isBelowThreshold) {
      return `This setup stays below the ${formatCurrency(summary.threshold)} tax threshold for the selected age group, so no income tax is due after rebates.`;
    }

    if (summary.bracket.marginalRate <= 18) {
      return 'You are in the entry bracket for the selected tax year. Your rebate softens the impact nicely, keeping the effective rate much lower than the marginal rate.';
    }

    if (summary.bracket.marginalRate <= 31) {
      return `This is a solid middle-income range. Only the upper portion of your taxable income is taxed at ${summary.bracket.marginalRate}%, while the lower slices stay in lower brackets.`;
    }

    if (summary.bracket.marginalRate <= 39) {
      return 'Your income reaches the upper middle brackets. The calculator highlights how your rebate, tax year, deductions, and custom display settings change the overall experience.';
    }

    return 'This is a high-income scenario with several brackets in play. The visual breakdown helps show how much of your income goes to tax versus take-home pay.';
  }

  function drawChart(taxValue, takeHomeValue) {
    const canvas = elements.taxChart;
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const styles = getComputedStyle(document.body);
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 102;
    const lineWidth = 30;
    const total = Math.max(taxValue + takeHomeValue, 1);
    const taxAngle = (Math.PI * 2) * (taxValue / total);
    const startAngle = -Math.PI / 2;
    const primary = styles.getPropertyValue('--primary').trim() || '#5b6cff';
    const secondary = styles.getPropertyValue('--secondary').trim() || '#12c7b1';
    const text = styles.getPropertyValue('--text').trim() || '#162038';
    const muted = styles.getPropertyValue('--muted').trim() || '#617097';

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'rgba(180,188,224,0.22)';
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = secondary;
    ctx.arc(centerX, centerY, radius, startAngle + taxAngle, startAngle + Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = primary;
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + taxAngle);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = muted;
    ctx.font = '700 16px Inter, Arial, sans-serif';
    ctx.fillText('Take-home share', centerX, centerY - 10);

    ctx.fillStyle = text;
    ctx.font = '900 30px Inter, Arial, sans-serif';
    ctx.fillText(`${Math.round((takeHomeValue / total) * 100)}%`, centerX, centerY + 28);
  }

  function updateBracketsTable() {
    const table = window.TaxCalculator.getTaxTable(state.options.taxYear);
    elements.tableTitle.textContent = `${state.options.taxYear} SARS tax brackets`;
    elements.bracketsTableBody.innerHTML = table.brackets.map(function (bracket, index) {
      const formula = index === 0
        ? `${Math.round(bracket.rate * 100)}% of taxable income`
        : `${formatCurrency(bracket.baseTax)} + ${Math.round(bracket.rate * 100)}% above ${formatCurrency(bracket.min)}`;
      return `<tr><td>${bracket.label}</td><td>${Math.round(bracket.rate * 100)}%</td><td>${formula}</td></tr>`;
    }).join('');
  }

  function addHistoryEntry(summary) {
    const entry = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      taxableIncome: summary.taxableIncome,
      taxDue: summary.taxDue,
      taxYear: summary.taxYear,
      ageGroup: summary.ageGroup
    };

    state.history.unshift(entry);
    state.history = state.history.slice(0, 5);
    persistPreferences();
    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      elements.historyList.innerHTML = '<li class="history-empty">No calculations yet.</li>';
      return;
    }

    elements.historyList.innerHTML = state.history.map(function (item) {
      return `
        <li>
          <div class="history-item-top">
            <span>${formatCurrency(item.taxableIncome)}</span>
            <span>${formatCurrency(item.taxDue)}</span>
          </div>
          <div class="history-item-bottom">
            ${item.taxYear} • ${item.ageGroup.replace('under65', 'under 65').replace('65to74', '65–74').replace('75plus', '75+')} • ${item.timestamp}
          </div>
        </li>
      `;
    }).join('');
  }

  function calculateAndRender(options) {
    const summary = window.TaxCalculator.calculateSummary(state.values.income, {
      bonus: state.values.bonus,
      retirementContribution: state.values.retirementContribution,
      ageGroup: state.options.ageGroup,
      taxYear: state.options.taxYear
    });

    const taxShare = summary.taxableIncome > 0 ? Math.min((summary.taxDue / summary.taxableIncome) * 100, 100) : 0;
    const takeHomeShare = summary.taxableIncome > 0 ? Math.max(100 - taxShare, 0) : 100;

    elements.taxDue.textContent = formatCurrency(summary.taxDue);
    elements.effectiveRate.textContent = formatPercent(summary.effectiveRate);
    elements.takeHome.textContent = formatCurrency(summary.takeHome);
    elements.monthlyTakeHome.textContent = formatCurrency(summary.monthlyTakeHome);
    elements.taxableIncome.textContent = formatCurrency(summary.taxableIncome);
    elements.annualRebate.textContent = formatCurrency(summary.annualRebate);
    elements.monthlyTax.textContent = formatCurrency(summary.monthlyTax);
    elements.thresholdValue.textContent = formatCurrency(summary.threshold);
    elements.taxShareLabel.textContent = formatPercent(taxShare);
    elements.takeHomeShareLabel.textContent = formatPercent(takeHomeShare);
    elements.taxShareBar.style.width = `${taxShare}%`;
    elements.takeHomeShareBar.style.width = `${takeHomeShare}%`;
    elements.marginalRate.textContent = `${summary.bracket.marginalRate}% marginal`;
    elements.highestBracket.textContent = summary.bracket.label;
    elements.bracketBadge.textContent = `${summary.bracket.marginalRate}% bracket`;
    elements.insightMessage.textContent = getInsight(summary);

    elements.needsBudget.textContent = formatCurrency(summary.monthlyTakeHome * 0.5);
    elements.wantsBudget.textContent = formatCurrency(summary.monthlyTakeHome * 0.3);
    elements.savingsBudget.textContent = formatCurrency(summary.monthlyTakeHome * 0.2);

    drawChart(summary.taxDue, summary.takeHome);
    updateBracketsTable();

    if (!options || !options.skipHistory) {
      addHistoryEntry(summary);
    }

    return summary;
  }

  function bindElements() {
    Object.assign(elements, {
      expressionDisplay: document.getElementById('expressionDisplay'),
      activeFieldBadge: document.getElementById('activeFieldBadge'),
      displayTargetLabel: document.getElementById('displayTargetLabel'),
      displayHint: document.getElementById('displayHint'),
      displayValuePreview: document.getElementById('displayValuePreview'),
      calculateBtn: document.getElementById('calculateBtn'),
      saveExpressionBtn: document.getElementById('saveExpressionBtn'),
      taxYearSelect: document.getElementById('taxYearSelect'),
      ageGroupSelect: document.getElementById('ageGroupSelect'),
      themeSelect: document.getElementById('themeSelect'),
      displayStyleSelect: document.getElementById('displayStyleSelect'),
      displaySizeSelect: document.getElementById('displaySizeSelect'),
      saveLookBtn: document.getElementById('saveLookBtn'),
      resetDisplayBtn: document.getElementById('resetDisplayBtn'),
      displayModeBadge: document.getElementById('displayModeBadge'),
      taxDue: document.getElementById('taxDue'),
      effectiveRate: document.getElementById('effectiveRate'),
      takeHome: document.getElementById('takeHome'),
      monthlyTakeHome: document.getElementById('monthlyTakeHome'),
      taxableIncome: document.getElementById('taxableIncome'),
      annualRebate: document.getElementById('annualRebate'),
      monthlyTax: document.getElementById('monthlyTax'),
      thresholdValue: document.getElementById('thresholdValue'),
      taxShareLabel: document.getElementById('taxShareLabel'),
      takeHomeShareLabel: document.getElementById('takeHomeShareLabel'),
      taxShareBar: document.getElementById('taxShareBar'),
      takeHomeShareBar: document.getElementById('takeHomeShareBar'),
      marginalRate: document.getElementById('marginalRate'),
      highestBracket: document.getElementById('highestBracket'),
      bracketBadge: document.getElementById('bracketBadge'),
      insightMessage: document.getElementById('insightMessage'),
      needsBudget: document.getElementById('needsBudget'),
      wantsBudget: document.getElementById('wantsBudget'),
      savingsBudget: document.getElementById('savingsBudget'),
      historyList: document.getElementById('historyList'),
      clearHistoryBtn: document.getElementById('clearHistoryBtn'),
      copySummaryBtn: document.getElementById('copySummaryBtn'),
      taxChart: document.getElementById('taxChart'),
      tableTitle: document.getElementById('tableTitle'),
      bracketsTableBody: document.getElementById('bracketsTableBody'),
      incomeValue: document.getElementById('incomeValue'),
      bonusValue: document.getElementById('bonusValue'),
      retirementContributionValue: document.getElementById('retirementContributionValue')
    });
  }

  function wireEvents() {
    document.querySelectorAll('.entry-field').forEach(function (button) {
      button.addEventListener('click', function () {
        selectField(button.dataset.field);
      });
    });

    document.querySelectorAll('.calc-key').forEach(function (button) {
      button.addEventListener('click', function () {
        handleKeypadPress(button);
      });
    });

    document.querySelectorAll('.preset-chip').forEach(function (button) {
      button.addEventListener('click', function () {
        state.values.income = Number(button.dataset.preset || 0);
        syncFieldCards();
        selectField('income');
        calculateAndRender();
      });
    });

    elements.expressionDisplay.addEventListener('input', function (event) {
      state.expression = event.target.value || '0';
      elements.displayValuePreview.textContent = getExpressionPreview();
    });

    elements.expressionDisplay.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveExpressionToField();
      }
    });

    elements.saveExpressionBtn.addEventListener('click', saveExpressionToField);
    elements.calculateBtn.addEventListener('click', function () {
      calculateAndRender();
    });

    elements.taxYearSelect.addEventListener('change', function (event) {
      state.options.taxYear = event.target.value;
      persistPreferences();
      calculateAndRender({ skipHistory: true });
    });

    elements.ageGroupSelect.addEventListener('change', function (event) {
      state.options.ageGroup = event.target.value;
      persistPreferences();
      calculateAndRender({ skipHistory: true });
    });

    elements.themeSelect.addEventListener('change', function (event) {
      state.options.theme = event.target.value;
      applyLook();
      persistPreferences();
      calculateAndRender({ skipHistory: true });
    });

    elements.displayStyleSelect.addEventListener('change', function (event) {
      state.options.displayStyle = event.target.value;
      applyLook();
      persistPreferences();
      calculateAndRender({ skipHistory: true });
    });

    elements.displaySizeSelect.addEventListener('change', function (event) {
      state.options.displaySize = event.target.value;
      applyLook();
      persistPreferences();
      calculateAndRender({ skipHistory: true });
    });

    elements.saveLookBtn.addEventListener('click', function () {
      persistPreferences();
      flashMessage(`Saved look: ${displayStyleLabels[state.options.displayStyle]} with ${displaySizeLabels[state.options.displaySize]} sizing.`);
    });

    elements.resetDisplayBtn.addEventListener('click', function () {
      state.options.displayStyle = defaultState.options.displayStyle;
      state.options.displaySize = defaultState.options.displaySize;
      applyLook();
      persistPreferences();
      flashMessage('Display settings were reset to the default calculator screen.');
      calculateAndRender({ skipHistory: true });
    });

    elements.clearHistoryBtn.addEventListener('click', function () {
      state.history = [];
      persistPreferences();
      renderHistory();
    });

    elements.copySummaryBtn.addEventListener('click', function () {
      const summary = window.TaxCalculator.calculateSummary(state.values.income, {
        bonus: state.values.bonus,
        retirementContribution: state.values.retirementContribution,
        ageGroup: state.options.ageGroup,
        taxYear: state.options.taxYear
      });      const message = [
        `South African tax summary (${summary.taxYear})`,
        `Annual income: ${formatCurrency(state.values.income)}`,
        `Bonus: ${formatCurrency(state.values.bonus)}`,
        `Retirement deduction: ${formatCurrency(state.values.retirementContribution)}`,
        `Taxable income: ${formatCurrency(summary.taxableIncome)}`,
        `Tax due: ${formatCurrency(summary.taxDue)}`,
        `Take-home: ${formatCurrency(summary.takeHome)}`,
        `Monthly take-home: ${formatCurrency(summary.monthlyTakeHome)}`
      ].join('\\n');


      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(function () {
          flashMessage('Summary copied to your clipboard.');
        }).catch(function () {
          flashMessage('Copy failed, but your summary is still on screen.');
        });
      } else {
        flashMessage('Clipboard copy is not supported in this browser.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadPreferences();
    bindElements();
    syncFieldCards();
    wireEvents();
    elements.taxYearSelect.value = state.options.taxYear;
    elements.ageGroupSelect.value = state.options.ageGroup;
    applyLook();
    selectField('income');
    updateBracketsTable();
    renderHistory();
    calculateAndRender({ skipHistory: true });
  });
})();
