(function (global) {
  function toFraction(x, maxDenominator = 1000) {
    if (!isFinite(x)) return x.toString();
    if (x === Math.round(x)) return x.toString();

    let bestNumerator = Math.round(x);
    let bestDenominator = 1;
    let bestError = Math.abs(x - bestNumerator);

    for (let denominator = 2; denominator <= maxDenominator; denominator += 1) {
      const numerator = Math.round(x * denominator);
      const error = Math.abs(x - numerator / denominator);

      if (error < bestError) {
        bestNumerator = numerator;
        bestDenominator = denominator;
        bestError = error;
      }

      if (bestError < 1e-10) break;
    }

    return bestDenominator === 1
      ? `${bestNumerator}`
      : `${bestNumerator}/${bestDenominator}`;
  }

  function fmt(n, decimals = 5) {
    if (!isFinite(n)) return n.toString();
    return parseFloat(n.toFixed(decimals)).toString();
  }

  function fmtComplex(c) {
    const realPart = fmt(c.re);
    const imagPart = fmt(Math.abs(c.im));

    if (c.im === 0) return `<span class="r">${realPart}</span>`;
    if (c.re === 0) return `<span class="i">${c.im < 0 ? '−' : ''}${imagPart}i</span>`;

    const sign = c.im < 0 ? '−' : '+';
    return `<span class="r">${realPart}</span><span class="op">${sign}</span><span class="i">${imagPart}i</span>`;
  }

  function fmtPreview(realValue, imagValue) {
    const real = parseFloat(realValue) || 0;
    const imag = parseFloat(imagValue) || 0;

    if (imag === 0) return `<span class="r">${real}</span>`;
    if (real === 0) return `<span class="i">${imag < 0 ? '−' : ''}${Math.abs(imag)}i</span>`;

    return `<span class="r">${real}</span>${imag < 0 ? ' − ' : ' + '}<span class="i">${Math.abs(imag)}i</span>`;
  }

  global.ComplexFormat = {
    toFraction,
    fmt,
    fmtComplex,
    fmtPreview
  };
})(window);
