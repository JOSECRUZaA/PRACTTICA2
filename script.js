(() => {
  const pantalla = document.getElementById('display');
  const teclas = document.querySelector('.keys');
  let expresion = '';

  function actualizarPantalla() {
    pantalla.textContent = expresion || '0';
  }

  function evaluarSeguro(s) {
    if (!/^[0-9+\-*/. ]*$/.test(s)) throw new Error('Caracteres inválidos');
    if (/[+\-*/. ]$/.test(s)) s = s.slice(0, -1);
    s = s.replace(/\s+/g, '');
    return Function('return (' + s + ')')();
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
