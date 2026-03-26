(function (global) {
  function createGraph(canvasElement) {
    const context = canvasElement.getContext('2d');
    const { fmt } = global.ComplexFormat;

    let lastResult = null;
    let lastZ1 = null;
    let lastZ2 = null;
    let gridVisible = true;

    function resizeCanvas() {
      const width = canvasElement.parentElement.clientWidth - 44;
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvasElement.width = width * devicePixelRatio;
      canvasElement.height = width * devicePixelRatio;
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${width}px`;

      if (lastResult) drawPlane(lastZ1, lastZ2, lastResult);
    }

    function drawPlane(z1, z2, result) {
      lastZ1 = z1;
      lastZ2 = z2;
      lastResult = result;
      if (!lastResult) return;

      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = canvasElement.width;
      const height = canvasElement.height;
      const centerX = width / 2;
      const centerY = height / 2;

      const points = [lastZ1, lastZ2, lastResult].filter(Boolean);
      const maxValue = Math.max(
        1,
        ...points.map((point) => Math.max(Math.abs(point.re), Math.abs(point.im)))
      );
      const padding = 0.2;
      const scale = (width / 2 * (1 - padding)) / maxValue;

      function niceStep(range) {
        const rough = range / 4;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
        for (const multiplier of [1, 2, 5, 10]) {
          if (magnitude * multiplier >= rough) return magnitude * multiplier;
        }
        return magnitude * 10;
      }

      const step = niceStep(maxValue);
      const maxIndex = Math.ceil(maxValue / step) + 1;

      context.clearRect(0, 0, width, height);

      if (gridVisible) {
        context.strokeStyle = 'rgba(90, 98, 86, 0.55)';
        context.lineWidth = 1;
        for (let n = -maxIndex; n <= maxIndex; n += 1) {
          const x = centerX + n * step * scale;
          const y = centerY + n * step * scale;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, height);
          context.stroke();

          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y);
          context.stroke();
        }
      }

      context.strokeStyle = 'rgba(198, 172, 124, 0.55)';
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(0, centerY);
      context.lineTo(width, centerY);
      context.stroke();
      context.beginPath();
      context.moveTo(centerX, 0);
      context.lineTo(centerX, height);
      context.stroke();

      const arrow = 7 * devicePixelRatio;
      context.fillStyle = 'rgba(198, 172, 124, 0.7)';
      context.beginPath();
      context.moveTo(width - 4, centerY);
      context.lineTo(width - 4 - arrow, centerY - arrow * 0.5);
      context.lineTo(width - 4 - arrow, centerY + arrow * 0.5);
      context.closePath();
      context.fill();

      context.beginPath();
      context.moveTo(centerX, 4);
      context.lineTo(centerX - arrow * 0.5, 4 + arrow);
      context.lineTo(centerX + arrow * 0.5, 4 + arrow);
      context.closePath();
      context.fill();

      context.font = `${11 * devicePixelRatio}px 'IBM Plex Mono', monospace`;
      context.fillStyle = 'rgba(198, 172, 124, 0.75)';
      context.textAlign = 'left';
      context.fillText('Re', width - 24 * devicePixelRatio, centerY - 7 * devicePixelRatio);
      context.textAlign = 'center';
      context.fillText('Im', centerX + 9 * devicePixelRatio, 16 * devicePixelRatio);

      context.font = `${9 * devicePixelRatio}px 'IBM Plex Mono', monospace`;
      context.fillStyle = 'rgba(198, 172, 124, 0.45)';
      for (let n = -maxIndex; n <= maxIndex; n += 1) {
        if (n === 0) continue;
        const x = centerX + n * step * scale;
        const y = centerY - n * step * scale;
        const label = fmt(n * step, 2);
        context.textAlign = 'center';
        context.fillText(label, x, centerY + 13 * devicePixelRatio);
        context.textAlign = 'right';
        context.fillText(`${label}i`, centerX - 4 * devicePixelRatio, y + 3 * devicePixelRatio);
      }

      const toCanvas = (re, im) => ({ x: centerX + re * scale, y: centerY - im * scale });

      const resultArgument = lastResult.arg();
      const arcRadius = Math.min(32 * devicePixelRatio, lastResult.mod() * scale * 0.3);
      if (arcRadius > 5) {
        context.beginPath();
        context.arc(centerX, centerY, arcRadius, 0, -resultArgument, resultArgument < 0);
        context.strokeStyle = 'rgba(224,92,58,0.22)';
        context.lineWidth = 1.5;
        context.stroke();
      }

      function drawVector(point, color, label) {
        if (!point) return;

        const p = toCanvas(point.re, point.im);
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 2) return;

        const ux = dx / len;
        const uy = dy / len;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(p.x, p.y);
        context.strokeStyle = color;
        context.lineWidth = 2 * devicePixelRatio;
        context.stroke();

        const arrowLength = 9 * devicePixelRatio;
        const arrowWidth = 4.5 * devicePixelRatio;
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(p.x - ux * arrowLength - uy * arrowWidth, p.y - uy * arrowLength + ux * arrowWidth);
        context.lineTo(p.x - ux * arrowLength + uy * arrowWidth, p.y - uy * arrowLength - ux * arrowWidth);
        context.closePath();
        context.fillStyle = color;
        context.fill();

        context.setLineDash([3 * devicePixelRatio, 4 * devicePixelRatio]);
        context.strokeStyle = color;
        context.globalAlpha = 0.2;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(p.x, centerY);
        context.stroke();
        context.beginPath();
        context.moveTo(p.x, p.y);
        context.lineTo(centerX, p.y);
        context.stroke();
        context.setLineDash([]);
        context.globalAlpha = 1;

        context.beginPath();
        context.arc(p.x, p.y, 4.5 * devicePixelRatio, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#141210';
        context.lineWidth = 1.5 * devicePixelRatio;
        context.stroke();

        const offsetX = dx > 0 ? 13 * devicePixelRatio : -13 * devicePixelRatio;
        const offsetY = dy > 0 ? 14 * devicePixelRatio : -11 * devicePixelRatio;
        context.font = `bold ${11 * devicePixelRatio}px 'IBM Plex Sans', sans-serif`;
        context.fillStyle = color;
        context.textAlign = dx > 0 ? 'left' : 'right';
        context.fillText(label, p.x + offsetX, p.y + offsetY);

        context.font = `${8.5 * devicePixelRatio}px 'IBM Plex Mono', monospace`;
        context.globalAlpha = 0.65;
        context.fillText(`${fmt(point.re, 3)} + ${fmt(point.im, 3)}i`, p.x + offsetX, p.y + offsetY + 11 * devicePixelRatio);
        context.globalAlpha = 1;
      }

      drawVector(lastZ1, '#e8a44a', 'Z₁');
      drawVector(lastZ2, '#7fc8b4', 'Z₂');
      drawVector(lastResult, '#e05c3a', 'Z');

      context.beginPath();
      context.arc(centerX, centerY, 3 * devicePixelRatio, 0, Math.PI * 2);
      context.fillStyle = 'rgba(138,122,104,0.5)';
      context.fill();
    }

    window.addEventListener('resize', resizeCanvas);

    return {
      resizeCanvas,
      drawPlane,
      setGridVisible(isVisible) {
        gridVisible = isVisible;
        if (lastResult) drawPlane(lastZ1, lastZ2, lastResult);
      }
    };
  }

  global.ComplexGraph = {
    createGraph
  };
})(window);
