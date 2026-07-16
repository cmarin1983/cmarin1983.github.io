/* ─── Estado global de la aplicación ─── */
let estado = {
  numerosMaximos: 200,          // Cantidad total de números disponibles
  cantidadGanadores: 1,         // Cuántos ganadores seleccionar
  participantes: {},            // { "1": "Nombre", "2": "Nombre", ... }
  ganadores: [],                // [1, 5, 32] — números ganadores
  numeroSeleccionado: null,     // Número que el usuario está editando
  estaAnimando: false,          // Evita acciones durante la animación
};

/* ─── Referencias al DOM ─── */
const tableroEl = document.getElementById('tablero');
const editorEl = document.getElementById('editor');
const numeroSeleccionadoEl = document.getElementById('numeroSeleccionado');
const nombreParticipanteEl = document.getElementById('nombreParticipante');
const contadorParticipantesEl = document.getElementById('contadorParticipantes');
const contadorLibresEl = document.getElementById('contadorLibres');
const btnGuardar = document.getElementById('btnGuardar');
const btnEliminar = document.getElementById('btnEliminar');
const btnCancelar = document.getElementById('btnCancelar');
const btnSortear = document.getElementById('btnSortear');
const btnReiniciar = document.getElementById('btnReiniciar');
const btnLimpiarResultados = document.getElementById('btnLimpiarResultados');
const animacionEl = document.getElementById('animacion');
const numeroGirandoEl = document.getElementById('numeroGirando');
const resultadosEl = document.getElementById('resultados');
const listaGanadoresEl = document.getElementById('listaGanadores');
const selectNumerosMaximos = document.getElementById('selectNumerosMaximos');
const selectCantidadGanadores = document.getElementById('selectCantidadGanadores');

/* ─── Genera un número aleatorio usando criptografía del navegador ─── */
function aleatorioCriptografico(minimo, maximo) {
  const rango = maximo - minimo + 1;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return minimo + (bytes[0] % rango);
}

/* ─── Guarda el estado completo en localStorage ─── */
function guardarEstado() {
  const datos = {
    numerosMaximos: estado.numerosMaximos,
    cantidadGanadores: estado.cantidadGanadores,
    participantes: estado.participantes,
    ganadores: estado.ganadores,
  };
  localStorage.setItem('estadoSorteo', JSON.stringify(datos));
}

/* ─── Recupera el estado guardado en localStorage ─── */
function cargarEstado() {
  const raw = localStorage.getItem('estadoSorteo');
  if (!raw) return;
  try {
    const datos = JSON.parse(raw);
    estado.numerosMaximos = datos.numerosMaximos || 200;
    estado.cantidadGanadores = datos.cantidadGanadores || 1;
    estado.participantes = datos.participantes || {};
    estado.ganadores = datos.ganadores || [];
  } catch {
    // Si hay error al leer, ignorar y usar valores por defecto
  }
}

/* ─── Dibuja el tablero con todos los números ─── */
function renderizarTablero() {
  const total = estado.numerosMaximos;
  let fragmento = document.createDocumentFragment();

  for (let i = 1; i <= total; i++) {
    const celda = document.createElement('div');
    celda.className = 'celda';
    celda.dataset.num = i;

    const spanNumero = document.createElement('span');
    spanNumero.className = 'numero';
    spanNumero.textContent = String(i).padStart(3, '0');
    celda.appendChild(spanNumero);

    const nombre = estado.participantes[i];
    if (nombre) {
      celda.classList.add('ocupado');
      const spanNombre = document.createElement('span');
      spanNombre.className = 'nombre';
      spanNombre.textContent = nombre;
      celda.appendChild(spanNombre);

      const indiceGanador = estado.ganadores.indexOf(i);
      if (indiceGanador !== -1) {
        celda.classList.add('ganador');
        const medalla = document.createElement('span');
        medalla.className = 'medalla';
        medalla.textContent = indiceGanador + 1;
        celda.appendChild(medalla);
      }
    }

    celda.addEventListener('click', () => abrirEditor(i));
    fragmento.appendChild(celda);
  }

  tableroEl.innerHTML = '';
  tableroEl.appendChild(fragmento);
  actualizarEstadisticas();
}

/* ─── Actualiza los contadores de participantes y números libres ─── */
function actualizarEstadisticas() {
  const ocupados = Object.keys(estado.participantes).length;
  contadorParticipantesEl.textContent = ocupados;
  contadorLibresEl.textContent = estado.numerosMaximos - ocupados;
}

/* ─── Muestra el panel de edición para un número específico ─── */
function abrirEditor(numero) {
  if (estado.estaAnimando) return;
  estado.numeroSeleccionado = numero;
  numeroSeleccionadoEl.textContent = String(numero).padStart(3, '0');
  nombreParticipanteEl.value = estado.participantes[numero] || '';
  editorEl.classList.remove('oculto');
  nombreParticipanteEl.focus();
}

/* ─── Cierra el panel de edición ─── */
function cerrarEditor() {
  editorEl.classList.add('oculto');
  estado.numeroSeleccionado = null;
}

/* ─── Guarda el nombre del participante en el número seleccionado ─── */
function guardarParticipante() {
  const numero = estado.numeroSeleccionado;
  if (numero === null) return;
  const nombre = nombreParticipanteEl.value.trim();
  if (!nombre) {
    nombreParticipanteEl.focus();
    return;
  }
  estado.participantes[numero] = nombre;

  // Si este número era ganador, se quita de la lista de ganadores
  const indiceGanador = estado.ganadores.indexOf(numero);
  if (indiceGanador !== -1) {
    estado.ganadores.splice(indiceGanador, 1);
  }

  guardarEstado();
  renderizarTablero();
  cerrarEditor();
}

/* ─── Libera el número seleccionado (elimina el participante) ─── */
function eliminarParticipante() {
  const numero = estado.numeroSeleccionado;
  if (numero === null) return;
  delete estado.participantes[numero];

  // Si este número era ganador, también se quita
  const indiceGanador = estado.ganadores.indexOf(numero);
  if (indiceGanador !== -1) {
    estado.ganadores.splice(indiceGanador, 1);
  }

  guardarEstado();
  renderizarTablero();
  cerrarEditor();
}

/* ─── Reinicia todo: participantes, ganadores y resultados ─── */
function reiniciarTodo() {
  if (estado.estaAnimando) return;
  if (Object.keys(estado.participantes).length === 0 && estado.ganadores.length === 0) return;
  if (!confirm('¿Estás seguro de reiniciar el sorteo? Se perderán todos los participantes y resultados.')) return;

  estado.participantes = {};
  estado.ganadores = [];
  guardarEstado();
  renderizarTablero();
  resultadosEl.classList.add('oculto');
  cerrarEditor();
}

/* ─── Limpia solo los resultados, mantiene los participantes ─── */
function limpiarResultados() {
  estado.ganadores = [];
  guardarEstado();
  renderizarTablero();
  resultadosEl.classList.add('oculto');
}

/* ─── Función para pausar la ejecución (async/await) ─── */
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ─── Animación del sorteo y selección de ganadores ─── */
async function animarSorteo(numerosDisponibles) {
  estado.estaAnimando = true;
  btnSortear.disabled = true;
  animacionEl.classList.remove('oculto');
  resultadosEl.classList.add('oculto');

  const total = estado.numerosMaximos;
  const vueltas = 20 + aleatorioCriptografico(5, 15);
  const retardo = 60; // milisegundos entre cada cambio de número

  // Fase 1: ruleta rápida de números aleatorios
  for (let r = 0; r < vueltas; r++) {
    const numeroFalso = aleatorioCriptografico(1, total);
    numeroGirandoEl.textContent = String(numeroFalso).padStart(3, '0');
    await esperar(retardo);
  }

  // Fase 2: seleccionar los ganadores uno por uno
  const ganadores = [];

  for (let w = 0; w < estado.cantidadGanadores; w++) {
    // Filtrar solo los números disponibles que aún no han ganado
    const participantesValidos = numerosDisponibles.filter(n => !ganadores.includes(n));
    if (participantesValidos.length === 0) break;

    const seleccion = aleatorioCriptografico(0, participantesValidos.length - 1);
    const numeroGanador = participantesValidos[seleccion];
    ganadores.push(numeroGanador);

    // Si hay más ganadores por mostrar, hacemos una pausa y otra ráfaga
    if (w < estado.cantidadGanadores - 1) {
      numeroGirandoEl.textContent = String(numeroGanador).padStart(3, '0');
      await esperar(800);
      // Ráfaga de números antes del siguiente ganador
      for (let r = 0; r < 10; r++) {
        const numeroFalso = aleatorioCriptografico(1, total);
        numeroGirandoEl.textContent = String(numeroFalso).padStart(3, '0');
        await esperar(50);
      }
    }
  }

  // Mostrar el último ganador
  if (ganadores.length > 0) {
    numeroGirandoEl.textContent = String(ganadores[ganadores.length - 1]).padStart(3, '0');
  }

  await esperar(500);
  animacionEl.classList.add('oculto');

  estado.ganadores = ganadores;
  guardarEstado();
  renderizarTablero();
  mostrarResultados(ganadores);
  estado.estaAnimando = false;
  btnSortear.disabled = false;
}

/* ─── Muestra las tarjetas con los ganadores ─── */
function mostrarResultados(ganadores) {
  listaGanadoresEl.innerHTML = '';
  ganadores.forEach((numero, indice) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-ganador';
    tarjeta.innerHTML = `
      <div class="numero-ganador">#${String(numero).padStart(3, '0')}</div>
      <div class="nombre-ganador">${estado.participantes[numero] || '—'}</div>
    `;
    listaGanadoresEl.appendChild(tarjeta);
  });
  resultadosEl.classList.remove('oculto');
}

/* ─── Manejador principal del botón de sorteo ─── */
function manejarSorteo() {
  if (estado.estaAnimando) return;

  const ocupados = Object.keys(estado.participantes);
  if (ocupados.length === 0) {
    alert('No hay participantes registrados. Asigna al menos un número antes de sortear.');
    return;
  }

  if (ocupados.length < estado.cantidadGanadores) {
    alert(`Solo hay ${ocupados.length} participante(s) pero quieres seleccionar ${estado.cantidadGanadores} ganador(es). Reduce la cantidad de ganadores o agrega más participantes.`);
    return;
  }

  // Verificar que hay suficientes participantes sin contar ganadores anteriores
  const disponibles = ocupados.map(Number).filter(n => !estado.ganadores.includes(n));
  if (disponibles.length < estado.cantidadGanadores) {
    alert('No hay suficientes participantes disponibles para el sorteo (sin contar ganadores anteriores).');
    return;
  }

  animarSorteo(disponibles);
}

/* ─── Cambia la cantidad máxima de números ─── */
function manejarCambioNumerosMaximos() {
  const nuevoMaximo = parseInt(selectNumerosMaximos.value, 10);
  if (estado.estaAnimando) return;

  // Si se reduce la cantidad, advertir que se perderán participantes
  if (nuevoMaximo < estado.numerosMaximos) {
    const perdidos = Object.keys(estado.participantes)
      .map(Number)
      .filter(n => n > nuevoMaximo);

    if (perdidos.length > 0) {
      if (!confirm(`Se eliminarán ${perdidos.length} participante(s) con números mayores a ${nuevoMaximo}. ¿Continuar?`)) {
        selectNumerosMaximos.value = estado.numerosMaximos;
        return;
      }
      // Eliminar participantes y ganadores con números fuera del rango
      perdidos.forEach(n => {
        delete estado.participantes[n];
        const indiceGanador = estado.ganadores.indexOf(n);
        if (indiceGanador !== -1) estado.ganadores.splice(indiceGanador, 1);
      });
    }
  }

  estado.numerosMaximos = nuevoMaximo;
  guardarEstado();
  renderizarTablero();
}

/* ─── Cambia la cantidad de ganadores a seleccionar ─── */
function manejarCambioCantidadGanadores() {
  estado.cantidadGanadores = parseInt(selectCantidadGanadores.value, 10);
  guardarEstado();
}

/* ─── Inicialización de la aplicación ─── */
function inicializar() {
  cargarEstado();

  // Sincronizar los selects con el estado guardado
  selectNumerosMaximos.value = estado.numerosMaximos;
  selectCantidadGanadores.value = estado.cantidadGanadores;

  renderizarTablero();

  // Si hay ganadores previos, mostrarlos
  if (estado.ganadores.length > 0) {
    mostrarResultados(estado.ganadores);
  }

  // Registrar eventos de los botones
  btnGuardar.addEventListener('click', guardarParticipante);
  btnEliminar.addEventListener('click', eliminarParticipante);
  btnCancelar.addEventListener('click', cerrarEditor);
  btnSortear.addEventListener('click', manejarSorteo);
  btnReiniciar.addEventListener('click', reiniciarTodo);
  btnLimpiarResultados.addEventListener('click', limpiarResultados);
  selectNumerosMaximos.addEventListener('change', manejarCambioNumerosMaximos);
  selectCantidadGanadores.addEventListener('change', manejarCambioCantidadGanadores);

  // Teclas rápidas en el campo de nombre
  nombreParticipanteEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') guardarParticipante();
    if (e.key === 'Escape') cerrarEditor();
  });
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);