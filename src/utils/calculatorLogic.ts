const MAX_INPUT_LENGTH = 18;

type Token = number | '+' | '-' | '×' | '÷' | '%' | 'u-';

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const character = expression[index];
    if (character === ' ') {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      let value = '';
      let decimalFound = false;
      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        if (expression[index] === '.') {
          if (decimalFound) throw new Error('Invalid number');
          decimalFound = true;
        }
        value += expression[index];
        index += 1;
      }
      if (value === '.') throw new Error('Invalid number');
      tokens.push(Number(value));
      continue;
    }

    if (character === '+' || character === '-' || character === '×' || character === '÷' || character === '%') {
      const previous = tokens[tokens.length - 1];
      if (character === '-' && (previous === undefined || typeof previous === 'string' && previous !== '%')) {
        tokens.push('u-');
      } else if (character === '+' && (previous === undefined || typeof previous === 'string' && previous !== '%')) {
        // A leading or repeated plus sign does not change the value.
      } else {
        tokens.push(character);
      }
      index += 1;
      continue;
    }

    throw new Error('Invalid expression');
  }

  return tokens;
}

export function evaluateExpression(expression: string): number {
  const tokens = tokenize(expression);
  let position = 0;

  function parsePrimary(): number {
    const token = tokens[position];
    if (token === 'u-') {
      position += 1;
      return -parsePrimary();
    }
    if (typeof token !== 'number') throw new Error('Incomplete expression');
    position += 1;
    let value = token;
    while (tokens[position] === '%') {
      value /= 100;
      position += 1;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parsePrimary();
    while (tokens[position] === '×' || tokens[position] === '÷') {
      const operator = tokens[position++];
      const right = parsePrimary();
      if (operator === '÷' && right === 0) throw new Error('Cannot divide by zero');
      value = operator === '×' ? value * right : value / right;
    }
    return value;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const rightStart = position;
      const right = parseTerm();
      const isSimplePercent = tokens[rightStart + 1] === '%' &&
        (tokens[rightStart + 2] === undefined || tokens[rightStart + 2] === '+' || tokens[rightStart + 2] === '-');
      const operand = isSimplePercent ? value * right : right;
      value = operator === '+' ? value + operand : value - operand;
    }
    return value;
  }

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid result');
  return result;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number(value.toPrecision(12));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function appendDigit(expression: string, digit: string): string {
  const match = expression.match(/(\d*\.?\d*)$/);
  const current = match?.[0] ?? '';
  const next = digit === '00'
    ? current === '' || current === '0' ? '0' : `${current}00`
    : current === '0' && digit !== '0' ? digit : `${current}${digit}`;
  if (next.length > MAX_INPUT_LENGTH) return expression;
  return `${expression.slice(0, expression.length - current.length)}${next}`;
}

export function appendDecimal(expression: string): string {
  const match = expression.match(/(\d*\.?\d*)$/);
  const current = match?.[0] ?? '';
  if (current.includes('.')) return expression;
  return `${expression}${current === '' ? '0.' : '.'}`;
}
