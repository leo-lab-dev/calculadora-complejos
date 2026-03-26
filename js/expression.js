(function (global) {
  const { Complex } = global.ComplexMath;

  function parseComplexToken(token) {
    const value = token.replace(/\s+/g, '').toLowerCase();

    if (!value.includes('i')) {
      const real = parseFloat(value);
      if (Number.isNaN(real)) return null;
      return new Complex(real, 0);
    }

    if (!value.endsWith('i')) return null;
    const withoutI = value.slice(0, -1);
    let splitIndex = -1;

    for (let i = 1; i < withoutI.length; i += 1) {
      if (withoutI[i] === '+' || withoutI[i] === '-') splitIndex = i;
    }

    if (splitIndex === -1) {
      if (withoutI === '' || withoutI === '+') return new Complex(0, 1);
      if (withoutI === '-') return new Complex(0, -1);
      const imagOnly = parseFloat(withoutI);
      if (Number.isNaN(imagOnly)) return null;
      return new Complex(0, imagOnly);
    }

    const real = parseFloat(withoutI.slice(0, splitIndex));
    if (Number.isNaN(real)) return null;

    const imagPart = withoutI.slice(splitIndex);
    let imag;
    if (imagPart === '+' || imagPart === '') imag = 1;
    else if (imagPart === '-') imag = -1;
    else imag = parseFloat(imagPart);

    if (Number.isNaN(imag)) return null;
    return new Complex(real, imag);
  }

  function tokenizeExpression(expression) {
    const src = expression.replace(/\s+/g, '');
    const tokens = [];
    let i = 0;

    const isUnaryContext = () => {
      if (tokens.length === 0) return true;
      const prev = tokens[tokens.length - 1];
      return prev.type === 'op' || (prev.type === 'paren' && prev.value === '(');
    };

    while (i < src.length) {
      const ch = src[i];

      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch, start: i, end: i + 1 });
        i += 1;
        continue;
      }

      if ('+-*/'.includes(ch)) {
        if ((ch === '+' || ch === '-') && isUnaryContext()) {
          if (i + 1 < src.length && src[i + 1] === '(') {
            tokens.push({ type: 'num', value: ch === '+' ? '1' : '-1', start: i, end: i + 1 });
            tokens.push({ type: 'op', value: '*', start: i, end: i + 1 });
            i += 1;
            continue;
          }

          let j = i + 1;
          let hasDigit = false;
          let hasDot = false;
          while (j < src.length) {
            if (/[0-9]/.test(src[j])) {
              hasDigit = true;
              j += 1;
              continue;
            }
            if (src[j] === '.' && !hasDot) {
              hasDot = true;
              j += 1;
              continue;
            }
            break;
          }

          if (j < src.length && /i/i.test(src[j])) j += 1;

          if (hasDigit || (j > i + 1 && /i/i.test(src[j - 1]))) {
            tokens.push({ type: 'num', value: src.slice(i, j), start: i, end: j });
            i = j;
            continue;
          }
        }

        tokens.push({ type: 'op', value: ch, start: i, end: i + 1 });
        i += 1;
        continue;
      }

      if (/[0-9.]/.test(ch) || /i/i.test(ch)) {
        let j = i;
        let hasDot = false;
        while (j < src.length) {
          if (/[0-9]/.test(src[j])) {
            j += 1;
            continue;
          }
          if (src[j] === '.' && !hasDot) {
            hasDot = true;
            j += 1;
            continue;
          }
          break;
        }

        if (j < src.length && /i/i.test(src[j])) {
          j += 1;
        } else if (j === i && /i/i.test(src[j])) {
          j += 1;
        }

        if (j === i) return { error: 'Token invalido en la expresion', index: i, length: 1 };
        tokens.push({ type: 'num', value: src.slice(i, j), start: i, end: j });
        i = j;
        continue;
      }

      return { error: 'Token invalido en la expresion', index: i, length: 1 };
    }

    return { tokens };
  }

  function toRpn(tokens) {
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const output = [];
    const operators = [];

    for (const token of tokens) {
      if (token.type === 'num') {
        output.push(token);
        continue;
      }

      if (token.type === 'op') {
        while (operators.length) {
          const top = operators[operators.length - 1];
          if (top.type !== 'op') break;
          if (precedence[top.value] >= precedence[token.value]) {
            output.push(operators.pop());
          } else {
            break;
          }
        }
        operators.push(token);
        continue;
      }

      if (token.type === 'paren' && token.value === '(') {
        operators.push(token);
        continue;
      }

      if (token.type === 'paren' && token.value === ')') {
        let foundOpen = false;
        while (operators.length) {
          const top = operators.pop();
          if (top.type === 'paren' && top.value === '(') {
            foundOpen = true;
            break;
          }
          output.push(top);
        }
        if (!foundOpen) return { error: 'Parentesis desbalanceados o expresion invalida', index: token.start, length: 1 };
      }
    }

    while (operators.length) {
      const top = operators.pop();
      if (top.type === 'paren') {
        return { error: 'Parentesis desbalanceados o expresion invalida', index: top.start, length: 1 };
      }
      output.push(top);
    }

    return { rpn: output };
  }

  function evalRpn(rpn, withSteps) {
    const stack = [];
    const steps = [];

    for (const token of rpn) {
      if (token.type === 'num') {
        const complex = parseComplexToken(token.value);
        if (!complex) {
          return {
            error: 'Numero complejo invalido en la expresion',
            index: token.start,
            length: Math.max(1, token.end - token.start)
          };
        }
        stack.push(complex);
        continue;
      }

      if (token.type === 'op') {
        if (stack.length < 2) {
          return {
            error: 'Expresion incompleta o mal formada',
            index: token.start,
            length: 1
          };
        }
        const right = stack.pop();
        const left = stack.pop();
        let partial;

        if (token.value === '+') partial = left.add(right);
        else if (token.value === '-') partial = left.sub(right);
        else if (token.value === '*') partial = left.mul(right);
        else if (token.value === '/') {
          partial = left.div(right);
          if (!partial) {
            return {
              error: 'Division por cero dentro de la expresion',
              index: token.start,
              length: 1
            };
          }
        } else {
          return { error: 'Operador no soportado en la expresion', index: token.start, length: 1 };
        }

        if (withSteps) {
          steps.push({
            left,
            right,
            op: token.value,
            result: partial
          });
        }

        stack.push(partial);
      }
    }

    if (stack.length !== 1) return { error: 'Expresion invalida' };
    return { result: stack[0], steps };
  }

  function evaluateComplexExpression(expression) {
    const tokenResult = tokenizeExpression(expression);
    if (tokenResult.error) return { error: tokenResult.error, errorIndex: tokenResult.index, errorLength: tokenResult.length };
    if (!tokenResult.tokens || tokenResult.tokens.length === 0) return { error: 'Expresion vacia o invalida' };
    const rpnResult = toRpn(tokenResult.tokens);
    if (rpnResult.error) return { error: rpnResult.error, errorIndex: rpnResult.index, errorLength: rpnResult.length };
    const evalResult = evalRpn(rpnResult.rpn, false);
    if (evalResult.error) return { error: evalResult.error, errorIndex: evalResult.index, errorLength: evalResult.length };
    return evalResult;
  }

  function evaluateComplexExpressionWithSteps(expression) {
    const tokenResult = tokenizeExpression(expression);
    if (tokenResult.error) return { error: tokenResult.error, errorIndex: tokenResult.index, errorLength: tokenResult.length };
    if (!tokenResult.tokens || tokenResult.tokens.length === 0) return { error: 'Expresion vacia o invalida' };
    const rpnResult = toRpn(tokenResult.tokens);
    if (rpnResult.error) return { error: rpnResult.error, errorIndex: rpnResult.index, errorLength: rpnResult.length };
    const evalResult = evalRpn(rpnResult.rpn, true);
    if (evalResult.error) return { error: evalResult.error, errorIndex: evalResult.index, errorLength: evalResult.length };
    return evalResult;
  }

  global.ComplexExpression = {
    evaluateComplexExpression,
    evaluateComplexExpressionWithSteps
  };
})(window);
