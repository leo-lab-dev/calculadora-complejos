(function (global) {
  const { Complex } = global.ComplexMath;
  const { toFraction, fmt, fmtComplex, fmtPreview } = global.ComplexFormat;
  const { createGraph } = global.ComplexGraph;
  const { evaluateComplexExpression, evaluateComplexExpressionWithSteps } = global.ComplexExpression;
  const { createStore } = global.ComplexStore;

  const $ = (id) => document.getElementById(id);
  const ui = {
    z1r: $('z1r'),
    z1i: $('z1i'),
    z2r: $('z2r'),
    z2i: $('z2i'),
    prev1: $('prev1'),
    prev2: $('prev2'),
    opButtons: document.querySelectorAll('.op-btn'),
    calcButton: $('calcBtn'),
    resultCard: $('resultCard'),
    resultMain: $('resultMain'),
    resultDetails: $('resultDetails'),
    resultPolarBadge: $('resultPolarBadge'),
    detMod: $('detMod'),
    detArg: $('detArg'),
    detArgDeg: $('detArgDeg'),
    detPolar: $('detPolar'),
    detConj: $('detConj'),
    errorMsg: $('errorMsg'),
    fractionToggleRow: $('fractionToggleRow'),
    fractionToggle: $('fractionToggle'),
    fractionDisplay: $('fractionDisplay'),
    copyResult: $('copyResult'),
    stepsToggleRow: $('stepsToggleRow'),
    stepsToggle: $('stepsToggle'),
    stepsList: $('stepsList'),
    historyList: $('historyList'),
    exprInput: $('exprInput'),
    exprRow: $('exprRow'),
    exprModeTabs: $('exprModeTabs'),
    exprModeHint: $('exprModeHint'),
    simpleInputs: $('simpleInputs'),
    simpleOps: $('simpleOps'),
    inputModeTabs: $('inputModeTabs'),
    angleUnitTabs: $('angleUnitTabs'),
    modeHint: $('modeHint'),
    modeBadge: $('modeBadge'),
    unitRow: $('unitRow'),
    z1p: $('z1p'),
    z2p: $('z2p'),
    angleButtons: document.querySelectorAll('.angle-btn'),
    rectRows: document.querySelectorAll('.rect-row'),
    polarRows: document.querySelectorAll('.polar-row'),
    canvas: $('complexPlane'),
    graphEmpty: $('graphEmpty'),
    graphCard: $('graphCard'),
    gridToggle: $('gridToggle'),
    resetView: $('resetView'),
    clearHistory: $('clearHistory')
  };

  const graph = createGraph(ui.canvas);
  const store = createStore();
  let copyTimeoutId = null;
  let inputMode = 'rect';
  let angleUnit = 'rad';
  let gridEnabled = true;
  let stepsVisible = false;
  let lastSteps = [];
  let lastNormalizedExpression = '';
  let lastExpressionUsedPolar = false;
  let exprMode = 'simple';
  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');

  function updateGridButton() {
    ui.gridToggle.textContent = `Cuadricula ${gridEnabled ? 'ON' : 'OFF'}`;
    ui.gridToggle.classList.toggle('active', !gridEnabled);
  }

  function setError(message) {
    ui.errorMsg.textContent = message;
    ui.errorMsg.classList.add('show');
    ui.resultCard.classList.remove('has-result');
    ui.resultDetails.style.display = 'none';
    ui.fractionToggleRow.style.display = 'none';
    ui.fractionDisplay.classList.remove('show');
    resetCopyButton();
    ui.copyResult.disabled = true;
  }

  function clearError() {
    ui.errorMsg.classList.remove('show');
  }

  function clearExprErrorMarker() {
    ui.exprInput.classList.remove('expr-error');
    ui.exprInput.style.removeProperty('--err-x');
    ui.exprInput.style.removeProperty('--err-w');
    ui.exprInput.removeAttribute('title');
  }

  function applyExprErrorMarker(index, length) {
    if (index == null || length == null || length <= 0) {
      clearExprErrorMarker();
      return;
    }

    const style = window.getComputedStyle(ui.exprInput);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    measureContext.font = font;

    const prefix = ui.exprInput.value.slice(0, index);
    const token = ui.exprInput.value.slice(index, index + length) || ' ';
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const x = paddingLeft + measureContext.measureText(prefix).width;
    const w = Math.max(measureContext.measureText(token).width, 8);

    ui.exprInput.style.setProperty('--err-x', `${x}px`);
    ui.exprInput.style.setProperty('--err-w', `${w}px`);
    ui.exprInput.classList.add('expr-error');
    const safeToken = token.replace(/\s+/g, ' ').trim() || 'espacio';
    ui.exprInput.setAttribute('title', `Posicion ${index + 1}: ${safeToken}`);
  }

  function updatePreviews() {
    if (inputMode === 'polar') {
      const z1 = parsePolarInput(ui.z1p.value, angleUnit);
      const z2 = parsePolarInput(ui.z2p.value, angleUnit);
      ui.prev1.innerHTML = z1
        ? fmtPreview(z1.re, z1.im)
        : '<span class="i">—</span>';
      ui.prev2.innerHTML = z2
        ? fmtPreview(z2.re, z2.im)
        : '<span class="i">—</span>';
      return;
    }

    ui.prev1.innerHTML = fmtPreview(ui.z1r.value, ui.z1i.value);
    ui.prev2.innerHTML = fmtPreview(ui.z2r.value, ui.z2i.value);
  }

  function renderFraction(result) {
    if (!result) return;

    const realFraction = toFraction(result.re);
    const imagFraction = toFraction(Math.abs(result.im));
    const sign = result.im < 0 ? ' − ' : ' + ';

    if (result.im === 0) {
      ui.fractionDisplay.innerHTML = `<span class="fr">${realFraction}</span>`;
    } else if (result.re === 0) {
      ui.fractionDisplay.innerHTML = `<span class="fr">${result.im < 0 ? '−' : ''}${imagFraction}i</span>`;
    } else {
      ui.fractionDisplay.innerHTML = `<span class="fr">${realFraction}</span>${sign}<span class="fr">${imagFraction}i</span>`;
    }
  }

  function formatStepLine(step) {
    const left = formatPlainResult(step.left);
    const right = formatPlainResult(step.right);
    const result = formatPlainResult(step.result);
    const symbolMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    const symbol = symbolMap[step.op] || step.op;
    return `(${left}) ${symbol} (${right}) = ${result}`;
  }

  function renderSteps() {
    if (!lastSteps || lastSteps.length === 0) {
      ui.stepsList.innerHTML = '';
      ui.stepsList.style.display = 'none';
      ui.stepsToggleRow.style.display = 'none';
      return;
    }

    const cards = [];
    if (lastNormalizedExpression) {
      cards.push(
        `<div class="step-card">Expresion normalizada: ${lastNormalizedExpression}</div>`
      );
    }

    lastSteps.forEach((step, index) => {
      const line = formatStepLine(step);
      cards.push(`<div class="step-card">Paso ${index + 1}: ${line}</div>`);
    });

    ui.stepsList.innerHTML = cards.join('');

    ui.stepsToggleRow.style.display = 'flex';
    ui.stepsList.style.display = stepsVisible ? 'flex' : 'none';
    ui.stepsToggle.classList.toggle('active', stepsVisible);
    ui.stepsToggle.textContent = stepsVisible ? 'Ocultar pasos' : 'Ver pasos';
  }

  function formatPlainResult(result) {
    const real = toFraction(result.re);
    const imagAbs = toFraction(Math.abs(result.im));
    if (result.im === 0) return real;
    if (result.re === 0) return `${result.im < 0 ? '-' : ''}${imagAbs}i`;
    return `${real} ${result.im < 0 ? '-' : '+'} ${imagAbs}i`;
  }

  function formatMaybeFraction(value, maxDenominator = 50) {
    if (!isFinite(value)) return value.toString();
    const fraction = toFraction(value);
    if (!fraction.includes('/')) return fraction;
    const [numText, denText] = fraction.split('/');
    const numerator = parseFloat(numText);
    const denominator = parseFloat(denText);
    if (!denominator || Number.isNaN(numerator) || Number.isNaN(denominator)) {
      return fmt(value, 4);
    }
    if (denominator > maxDenominator) return fmt(value, 4);
    const approx = numerator / denominator;
    if (Math.abs(value - approx) > 1e-6) return fmt(value, 4);
    return fraction;
  }

  function resetCopyButton() {
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
      copyTimeoutId = null;
    }
    ui.copyResult.classList.remove('copied');
    ui.copyResult.textContent = 'Copiar';
  }

  async function handleCopyResult() {
    if (!store.state.lastResult) return;
    const textToCopy = formatPlainResult(store.state.lastResult);

    resetCopyButton();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      ui.copyResult.classList.add('copied');
      ui.copyResult.textContent = 'Copiado';
    } catch (err) {
      ui.copyResult.textContent = 'No se pudo copiar';
    }

    copyTimeoutId = setTimeout(() => {
      resetCopyButton();
    }, 1400);
  }

  function copyHistoryEntry(entry, button) {
    const text = entry.isExpression
      ? `${entry.expr} = ${formatPlainResult(entry.result)}`
      : `(${entry.z1}) ${entry.op} (${entry.z2}) = ${formatPlainResult(entry.result)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          if (button) {
            button.textContent = 'Copiado';
            button.classList.add('copied');
            setTimeout(() => {
              button.textContent = 'Copiar';
              button.classList.remove('copied');
            }, 1200);
          }
        },
        () => {}
      );
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    if (button) {
      button.textContent = 'Copiado';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = 'Copiar';
        button.classList.remove('copied');
      }, 1200);
    }
  }

  function renderResult(result) {
    ui.resultCard.classList.add('has-result');
    ui.resultMain.innerHTML = fmtComplex(result);
    resetCopyButton();
    ui.copyResult.disabled = false;

    const modValue = result.mod();
    const argValue = result.arg();
    const conjugate = result.conj();

    ui.detMod.textContent = formatMaybeFraction(modValue);
    const argRad = argValue;
    const argDeg = (argValue * 180) / Math.PI;
    const argDisplay = angleUnit === 'deg' ? argDeg : argRad;
    const unitLabel = angleUnit === 'deg' ? 'deg' : 'rad';
    ui.detArg.textContent = `${formatMaybeFraction(argRad)} rad`;
    ui.detArgDeg.textContent = `${formatMaybeFraction(argDeg)} deg`;
    ui.detPolar.textContent = `${formatMaybeFraction(modValue)} ∠ ${formatMaybeFraction(argDisplay)} ${unitLabel}`;
    ui.detConj.textContent = `${fmt(conjugate.re, 3)}${conjugate.im >= 0 ? '+' : ''}${fmt(conjugate.im, 3)}i`;
    ui.resultDetails.style.display = 'grid';
    if (exprMode === 'combined') {
      ui.resultPolarBadge.style.display = 'none';
    } else if (lastExpressionUsedPolar) {
      ui.resultPolarBadge.style.display = 'inline-flex';
      ui.resultPolarBadge.textContent = `Polar ${angleUnit}`;
    } else {
      ui.resultPolarBadge.style.display = 'none';
    }

    ui.fractionToggleRow.style.display = 'flex';
    if (ui.fractionToggle.checked) renderFraction(result);
  }

  function renderGraph() {
    const { lastZ1, lastZ2, lastResult } = store.state;
    if (!lastResult) return;
    ui.graphEmpty.style.display = 'none';
    ui.canvas.style.display = 'block';
    ui.graphCard.classList.add('has-result');
    graph.drawPlane(lastZ1, lastZ2, lastResult);
  }

  function renderHistory() {
    const { history } = store.state;
    if (history.length === 0) {
      ui.historyList.innerHTML = '<div class="history-empty">Sin operaciones aun</div>';
      return;
    }

    const formatHistoryResult = (result) => {
      const real = toFraction(result.re);
      const imagAbs = toFraction(Math.abs(result.im));
      if (result.im === 0) return real;
      if (result.re === 0) return `${result.im < 0 ? '-' : ''}${imagAbs}i`;
      return `${real} ${result.im < 0 ? '-' : '+'} ${imagAbs}i`;
    };

    ui.historyList.innerHTML = history
      .map(
        (entry, idx) =>
          `<div class="history-item" data-idx="${idx}">
            <span class="history-text">${entry.isExpression ? `${entry.expr} = ${formatHistoryResult(entry.result)}` : `(${entry.z1}) ${entry.op} (${entry.z2}) = ${formatHistoryResult(entry.result)}`}</span>
            <span class="history-actions">
              <span class="h-op">${entry.op}</span>
              <button class="history-copy" type="button" data-idx="${idx}">Copiar</button>
            </span>
          </div>`
      )
      .join('');

    ui.historyList.querySelectorAll('.history-item').forEach((item) => {
      item.addEventListener('click', () => {
        const entry = store.state.history[parseInt(item.dataset.idx, 10)];
        if (entry.isExpression) {
          setExprMode('combined');
          ui.exprInput.value = entry.expr;
          calculate();
          return;
        }

        setExprMode('simple');
        ui.exprInput.value = '';
        inputMode = entry.isPolar ? 'polar' : 'rect';
        angleUnit = entry.angleUnit || angleUnit;
        syncModeTabs();
        setInputMode(inputMode === 'polar');
        ui.z1r.value = entry.a;
        ui.z1i.value = entry.b;
        ui.z2r.value = entry.c;
        ui.z2i.value = entry.d;
        if (entry.isPolar) {
          ui.z1p.value = entry.z1p || '';
          ui.z2p.value = entry.z2p || '';
        }

        const symbolToOperation = { '+': '+', '−': '-', '×': '*', '÷': '/' };
        ui.opButtons.forEach((button) => {
          button.classList.toggle('active', button.dataset.op === symbolToOperation[entry.op]);
        });

        store.setSelectedOp(symbolToOperation[entry.op]);
        updatePreviews();
        calculate();
      });
    });

    ui.historyList.querySelectorAll('.history-copy').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const entry = store.state.history[parseInt(button.dataset.idx, 10)];
        copyHistoryEntry(entry, button);
      });
    });
  }

  function parsePolarInput(value, unit) {
    const raw = (value || '').trim();
    if (!raw) return null;

    const normalized = raw.replace(/\s+/g, '');
    const separatorIndex = normalized.indexOf('∠');
    const fallbackIndex = normalized.indexOf('<');
    const splitIndex = separatorIndex >= 0 ? separatorIndex : fallbackIndex;

    if (splitIndex <= 0) return null;
    const rText = normalized.slice(0, splitIndex);
    const thetaText = normalized.slice(splitIndex + 1);
    if (!rText || !thetaText) return null;

    const radius = parseFloat(rText);
    const theta = parseFloat(thetaText);
    if (Number.isNaN(radius) || Number.isNaN(theta)) return null;

    const radians = unit === 'deg' ? (theta * Math.PI) / 180 : theta;
    return new Complex(radius * Math.cos(radians), radius * Math.sin(radians));
  }

  function normalizeExpression(expression) {
    const regex = /([+-]?(?:\d+\.?\d*|\d*\.\d+))\s*[∠<]\s*([+-]?(?:\d+\.?\d*|\d*\.\d+))/g;
    let normalized = '';
    let lastIndex = 0;
    const map = [];

    expression.replace(regex, (match, rText, thetaText, offset) => {
      if (offset > lastIndex) {
        const segment = expression.slice(lastIndex, offset);
        const normStart = normalized.length;
        normalized += segment;
        map.push({
          origStart: lastIndex,
          origEnd: offset,
          normStart,
          normEnd: normalized.length
        });
      }

      const radius = parseFloat(rText);
      const theta = parseFloat(thetaText);
      let replacement = match;
      if (!Number.isNaN(radius) && !Number.isNaN(theta)) {
        const radians = angleUnit === 'deg' ? (theta * Math.PI) / 180 : theta;
        const re = radius * Math.cos(radians);
        const im = radius * Math.sin(radians);
        replacement = `(${re}${im >= 0 ? '+' : ''}${im}i)`;
      }

      const normStart = normalized.length;
      normalized += replacement;
      map.push({
        origStart: offset,
        origEnd: offset + match.length,
        normStart,
        normEnd: normalized.length
      });
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < expression.length) {
      const segment = expression.slice(lastIndex);
      const normStart = normalized.length;
      normalized += segment;
      map.push({
        origStart: lastIndex,
        origEnd: expression.length,
        normStart,
        normEnd: normalized.length
      });
    }

    return { normalized, map };
  }

  function mapErrorPosition(errorIndex, errorLength, map) {
    if (errorIndex == null || !map || map.length === 0) {
      return { index: errorIndex, length: errorLength };
    }

    const entry = map.find(
      (segment) => errorIndex >= segment.normStart && errorIndex < segment.normEnd
    );
    if (!entry) return { index: errorIndex, length: errorLength };

    const normLen = entry.normEnd - entry.normStart;
    const origLen = entry.origEnd - entry.origStart;
    if (origLen !== normLen) {
      return { index: entry.origStart, length: Math.max(1, origLen) };
    }

    const offset = errorIndex - entry.normStart;
    return { index: entry.origStart + offset, length: errorLength };
  }

  function validatePolarInput(input) {
    const raw = (input.value || '').trim();
    if (!raw) {
      input.style.borderColor = '';
      return;
    }

    const parsed = parsePolarInput(raw, angleUnit);
    input.style.borderColor = parsed ? '' : 'var(--error)';
  }

  function setInputMode(isPolar) {
    ui.rectRows.forEach((row) => {
      row.style.display = isPolar ? 'none' : 'flex';
    });
    ui.polarRows.forEach((row) => {
      row.style.display = isPolar ? 'flex' : 'none';
    });
    ui.unitRow.style.display = isPolar ? 'flex' : 'none';
    ui.modeHint.textContent = isPolar ? 'r∠θ' : 'Re/Im';
    ui.modeBadge.style.display = isPolar ? 'inline-flex' : 'none';
    updatePreviews();
  }

  function syncModeTabs() {
    ui.inputModeTabs.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === inputMode);
    });
    ui.angleUnitTabs.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.unit === angleUnit);
    });
  }

  function validateExpressionInput() {
    if (!ui.exprInput || exprMode !== 'combined') return;
    const expression = (ui.exprInput.value || '').trim();

    if (!expression) {
      ui.exprInput.style.borderColor = '';
      clearError();
      clearExprErrorMarker();
      return;
    }

    const normalization = normalizeExpression(expression);
    const evaluation = evaluateComplexExpression(normalization.normalized);
    if (evaluation.error) {
      ui.exprInput.style.borderColor = 'var(--error)';
      setError(evaluation.error);
      const mapped = mapErrorPosition(
        evaluation.errorIndex,
        evaluation.errorLength,
        normalization.map
      );
      applyExprErrorMarker(mapped.index, mapped.length || 1);
    } else {
      ui.exprInput.style.borderColor = '';
      clearError();
      clearExprErrorMarker();
    }
  }

  function calculate() {
    clearError();

    const isPolar = inputMode === 'polar';
    let z1;
    let z2;
    let a;
    let b;
    let c;
    let d;

    if (isPolar) {
      const parsedZ1 = parsePolarInput(ui.z1p.value, angleUnit);
      const parsedZ2 = parsePolarInput(ui.z2p.value, angleUnit);
      if (!parsedZ1 || !parsedZ2) {
        setError('Entrada polar invalida. Usa el formato r∠θ.');
        return;
      }
      z1 = parsedZ1;
      z2 = parsedZ2;
      a = z1.re;
      b = z1.im;
      c = z2.re;
      d = z2.im;
    } else {
      a = parseFloat(ui.z1r.value) || 0;
      b = parseFloat(ui.z1i.value) || 0;
      c = parseFloat(ui.z2r.value) || 0;
      d = parseFloat(ui.z2i.value) || 0;
      z1 = new Complex(a, b);
      z2 = new Complex(c, d);
    }
    const operationLabels = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    const expression = exprMode === 'combined'
      ? (ui.exprInput.value || '').trim()
      : '';
    let result;
    let historyEntry;

    if (expression) {
      const normalization = normalizeExpression(expression);
      lastExpressionUsedPolar = /[∠<]/.test(expression);
      const evaluated = evaluateComplexExpressionWithSteps(normalization.normalized);
      if (evaluated.error) {
        setError(evaluated.error);
        const mapped = mapErrorPosition(
          evaluated.errorIndex,
          evaluated.errorLength,
          normalization.map
        );
        applyExprErrorMarker(mapped.index, mapped.length || 1);
        return;
      }
      result = evaluated.result;
      lastSteps = evaluated.steps || [];
      lastNormalizedExpression = normalization.normalized;
      stepsVisible = false;
      clearExprErrorMarker();
      historyEntry = {
        expr: expression,
        op: 'Expr',
        result,
        isExpression: true
      };
    } else {
      switch (store.state.selectedOp) {
        case '+':
          result = z1.add(z2);
          break;
        case '-':
          result = z1.sub(z2);
          break;
        case '*':
          result = z1.mul(z2);
          break;
        case '/':
          result = z1.div(z2);
          if (!result) {
            setError('Division por cero — Z2 es igual a 0');
            return;
          }
          break;
        default:
          result = z1.add(z2);
      }

      const operationSymbol = operationLabels[store.state.selectedOp];
      const z1Label = isPolar ? formatPlainResult(z1) : `${a}${b >= 0 ? '+' : ''}${b}i`;
      const z2Label = isPolar ? formatPlainResult(z2) : `${c}${d >= 0 ? '+' : ''}${d}i`;
      historyEntry = {
        z1: z1Label,
        z2: z2Label,
        op: operationSymbol,
        result,
        a,
        b,
        c,
        d,
        z1p: isPolar ? ui.z1p.value.trim() : '',
        z2p: isPolar ? ui.z2p.value.trim() : '',
        angleUnit: isPolar ? angleUnit : '',
        isPolar,
        isExpression: false
      };

      lastSteps = [];
      lastNormalizedExpression = '';
      lastExpressionUsedPolar = false;
      stepsVisible = false;
      clearExprErrorMarker();
    }

    store.setResult(z1, z2, result);
    renderResult(result);
    renderSteps();
    renderGraph();
    store.addHistory(historyEntry);
    renderHistory();
  }

  [ui.z1r, ui.z1i, ui.z2r, ui.z2i].forEach((input) => {
    input.addEventListener('input', updatePreviews);
  });

  [ui.z1p, ui.z2p].forEach((input) => {
    input.addEventListener('input', () => {
      validatePolarInput(input);
      updatePreviews();
    });
  });

  ui.opButtons.forEach((button) => {
    button.addEventListener('click', () => {
      ui.opButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      store.setSelectedOp(button.dataset.op);
    });
  });

  ui.calcButton.addEventListener('click', calculate);
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isEditable =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    if (event.key === 'Enter') {
      calculate();
      return;
    }

    if (isEditable) return;

    const keyMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/'
    };
    const selected = keyMap[event.key];
    if (!selected) return;

    ui.opButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.op === selected);
    });
    store.setSelectedOp(selected);
  });

  if (ui.exprInput) {
    ui.exprInput.addEventListener('input', validateExpressionInput);
  }

  function setExprMode(nextMode) {
    exprMode = nextMode;
    ui.exprModeTabs.querySelectorAll('.mode-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === exprMode);
    });
    const isCombined = exprMode === 'combined';
    ui.simpleInputs.style.display = isCombined ? 'none' : 'grid';
    ui.simpleOps.style.display = isCombined ? 'none' : 'grid';
    ui.exprRow.style.display = isCombined ? 'flex' : 'none';
    ui.inputModeTabs.parentElement.style.display = isCombined ? 'none' : 'flex';
    if (isCombined) {
      ui.unitRow.style.display = 'none';
      ui.modeBadge.style.display = 'none';
    } else {
      setInputMode(inputMode === 'polar');
    }
    ui.exprModeHint.textContent = isCombined ? 'Expresion' : 'Z₁ y Z₂';
    if (!isCombined) {
      ui.exprInput.value = '';
      ui.exprInput.style.borderColor = '';
      clearExprErrorMarker();
    }
  }

  ui.exprModeTabs.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      setExprMode(button.dataset.mode);
    });
  });

  ui.inputModeTabs.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      inputMode = button.dataset.mode;
      syncModeTabs();
      setInputMode(inputMode === 'polar');
    });
  });

  ui.angleUnitTabs.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => {
      angleUnit = button.dataset.unit;
      syncModeTabs();
      validatePolarInput(ui.z1p);
      validatePolarInput(ui.z2p);
      updatePreviews();
      if (store.state.lastResult) renderResult(store.state.lastResult);
    });
  });

  ui.angleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = `${input.value.slice(0, start)}∠${input.value.slice(end)}`;
      const cursorPos = start + 1;
      input.setSelectionRange(cursorPos, cursorPos);
      input.focus();

      validatePolarInput(input);
      updatePreviews();
    });
  });

  ui.fractionToggle.addEventListener('change', () => {
    if (ui.fractionToggle.checked && store.state.lastResult) {
      renderFraction(store.state.lastResult);
      ui.fractionDisplay.classList.add('show');
    } else {
      ui.fractionDisplay.classList.remove('show');
    }
  });

  ui.clearHistory.addEventListener('click', () => {
    store.clearHistory();
    renderHistory();
  });

  ui.stepsToggle.addEventListener('click', () => {
    if (!lastSteps || lastSteps.length === 0) return;
    stepsVisible = !stepsVisible;
    renderSteps();
  });

  ui.gridToggle.addEventListener('click', () => {
    gridEnabled = !gridEnabled;
    updateGridButton();
    graph.setGridVisible(gridEnabled);
  });

  ui.resetView.addEventListener('click', () => {
    graph.resizeCanvas();
    renderGraph();
  });

  ui.copyResult.addEventListener('click', handleCopyResult);

  graph.resizeCanvas();
  updatePreviews();
  renderHistory();
  syncModeTabs();
  setInputMode(false);
  updateGridButton();
  setExprMode('simple');
})(window);
