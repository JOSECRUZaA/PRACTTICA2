(() => {
  const pantalla = document.getElementById('display');
  const teclas = document.querySelector('.keys');
  let expresion = '';

  function actualizarPantalla() {
    pantalla.textContent = expresion || '0';
  }

  function evaluarSeguro(s) {
    // validar caracteres permitidos (números, operadores, paréntesis, punto y espacios)
    if (!/^[0-9+\-*/().\s]*$/.test(s)) throw new Error('Caracteres inválidos');
    s = s.replace(/\s+/g, '');
    // si termina en operador binario, quitarlo
    if (/[+\-*/]$/.test(s)) s = s.slice(0, -1);

    // Tokenizar: números (con punto), operadores y paréntesis
    function tokenize(str) {
      const tokens = [];
      let i = 0;
      while (i < str.length) {
        const ch = str[i];
        if (/[0-9.]/.test(ch)) {
          let num = ch;
          i++;
          while (i < str.length && /[0-9.]/.test(str[i])) { num += str[i++]; }
          if ((num.match(/\./g) || []).length > 1) throw new Error('Número con varios puntos');
          tokens.push({ type: 'number', value: parseFloat(num) });
          continue;
        }
        if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
          tokens.push({ type: 'op', value: ch });
          i++;
          continue;
        }
        if (ch === '(' || ch === ')') {
          tokens.push({ type: 'paren', value: ch });
          i++;
          continue;
        }
        // should not reach here because of validation above
        throw new Error('Token inválido: ' + ch);
      }
      return tokens;
    }

    // Shunting-yard: convertir a RPN
    function shuntingYard(tokens) {
      const out = [];
      const ops = [];

      const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, 'u-': 3 };
      const rightAssoc = { 'u-': true };

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type === 'number') {
          out.push(t);
          continue;
        }
        if (t.type === 'op') {
          // detectar signo unario (si es '-' y es inicio o viene después de otro operador o '(')
          let op = t.value;
          const prev = tokens[i - 1];
          if (op === '-' && (!prev || (prev.type === 'op') || (prev.type === 'paren' && prev.value === '('))) {
            op = 'u-';
          }
          while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.type !== 'op') break;
            const topOp = top.value;
            const p1 = precedence[op] || 0;
            const p2 = precedence[topOp] || 0;
            if ((rightAssoc[op] && p1 < p2) || (!rightAssoc[op] && p1 <= p2)) {
              out.push(ops.pop());
            } else break;
          }
          ops.push({ type: 'op', value: op });
          continue;
        }
        if (t.type === 'paren') {
          if (t.value === '(') { ops.push(t); continue; }
          // t == ')'
          let found = false;
          while (ops.length) {
            const top = ops.pop();
            if (top.type === 'paren' && top.value === '(') { found = true; break; }
            out.push(top);
          }
          if (!found) throw new Error('Paréntesis desbalanceados');
        }
      }

      while (ops.length) {
        const top = ops.pop();
        if (top.type === 'paren') throw new Error('Paréntesis desbalanceados');
        out.push(top);
      }
      return out;
    }

    // Evaluar RPN
    function evalRPN(rpn) {
      const stack = [];
      for (const tk of rpn) {
        if (tk.type === 'number') { stack.push(tk.value); continue; }
        if (tk.type === 'op') {
          if (tk.value === 'u-') {
            if (stack.length < 1) throw new Error('Expresión inválida');
            const a = stack.pop();
            stack.push(-a);
            continue;
          }
          if (stack.length < 2) throw new Error('Expresión inválida');
          const b = stack.pop();
          const a = stack.pop();
          let res;
          switch (tk.value) {
            case '+': res = a + b; break;
            case '-': res = a - b; break;
            case '*': res = a * b; break;
            case '/':
              if (b === 0) throw new Error('División por cero');
              res = a / b; break;
            default: throw new Error('Operador desconocido');
          }
          stack.push(res);
        }
      }
      if (stack.length !== 1) throw new Error('Expresión inválida');
      return stack[0];
    }

    const tokens = tokenize(s);
    const rpn = shuntingYard(tokens);
    return evalRPN(rpn);
  }

  teclas.addEventListener('click', e => {
    const boton = e.target.closest('button');
    if (!boton) return;
    const accion = boton.dataset.action;
    const valor = boton.dataset.value || boton.textContent.trim();

    if (accion === 'clear') {
      expresion = '';
      actualizarPantalla();
      return;
    }

    if (accion === 'back') {
      expresion = expresion.slice(0, -1);
      actualizarPantalla();
      return;
    }

    if (accion === 'equals') {
      try {
        const resultado = evaluarSeguro(expresion || '0');
        expresion = String(resultado);
      } catch (err) {
        expresion = 'Error';
      }
      actualizarPantalla();
      return;
    }

    // Validaciones: punto decimal y ceros a la izquierda
    const ultimoNumero = () => {
      const m = expresion.match(/([0-9.]+)$/);
      return m ? m[0] : '';
    };

    if (expresion === '' && /[+*/]/.test(valor)) return;

    // Si se intenta añadir un punto, evitar más de uno en el mismo número
    if (valor === '.') {
      if (ultimoNumero().includes('.')) return;
      if (ultimoNumero() === '') {
        // si nada antes o el anterior es operador, añadir 0.
        expresion += '0.';
        actualizarPantalla();
        return;
      }
      expresion += '.';
      actualizarPantalla();
      return;
    }

    // Si se añade un dígito y el último número es '0' sin punto, reemplazar el 0 (evitar 00...)
    if (/^[0-9]$/.test(valor)) {
      const ultimo = ultimoNumero();
      if (ultimo === '0') {
        expresion = expresion.slice(0, -1) + valor;
        actualizarPantalla();
        return;
      }
    }

    if (/[+\-*/.]$/.test(expresion) && /[+\-*/.]/.test(valor)) {
      expresion = expresion.slice(0, -1) + valor;
    } else {
      expresion += valor;
    }
    actualizarPantalla();
  });

  window.addEventListener('keydown', ev => {
    const tecla = ev.key;
    if (tecla >= '0' && tecla <= '9') return document.querySelector(`[data-value='${tecla}']`)?.click();
    if (tecla === '.') return document.querySelector(`[data-value='.']`)?.click();
    if (tecla === 'Enter' || tecla === '=') return document.querySelector(`[data-action='equals']`)?.click();
    if (tecla === 'Backspace') return document.querySelector(`[data-action='back']`)?.click();
    if (tecla === 'Escape') return document.querySelector(`[data-action='clear']`)?.click();
    if (['+', '-', '*', '/'].includes(tecla)) return document.querySelector(`[data-value='${tecla}']`)?.click();
  });

  actualizarPantalla();
})();
