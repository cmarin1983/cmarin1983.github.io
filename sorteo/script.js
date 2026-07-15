/* ─── State ─── */
let state = {
  maxNumbers: 200,
  winnerCount: 1,
  participants: {},   // { "1": "Name", "2": "Name", ... }
  winners: [],        // [1, 5, 32]
  selectedNum: null,
  isAnimating: false,
};

/* ─── DOM refs ─── */
const boardEl = document.getElementById('board');
const editorEl = document.getElementById('editor');
const selectedNumberEl = document.getElementById('selectedNumber');
const participantNameEl = document.getElementById('participantName');
const participantCountEl = document.getElementById('participantCount');
const freeCountEl = document.getElementById('freeCount');
const btnSave = document.getElementById('btnSave');
const btnDelete = document.getElementById('btnDelete');
const btnCancel = document.getElementById('btnCancel');
const btnDraw = document.getElementById('btnDraw');
const btnReset = document.getElementById('btnReset');
const btnClearResults = document.getElementById('btnClearResults');
const animationEl = document.getElementById('animation');
const rollingEl = document.getElementById('rollingNumber');
const resultsEl = document.getElementById('results');
const winnerListEl = document.getElementById('winnerList');
const maxNumbersSelect = document.getElementById('maxNumbers');
const winnerCountSelect = document.getElementById('winnerCount');

/* ─── Crypto random ─── */
function cryptoRandom(min, max) {
  const range = max - min + 1;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return min + (bytes[0] % range);
}

/* ─── Persistence ─── */
function saveState() {
  const data = {
    maxNumbers: state.maxNumbers,
    winnerCount: state.winnerCount,
    participants: state.participants,
    winners: state.winners,
  };
  localStorage.setItem('sorteoState', JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem('sorteoState');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.maxNumbers = data.maxNumbers || 200;
    state.winnerCount = data.winnerCount || 1;
    state.participants = data.participants || {};
    state.winners = data.winners || [];
  } catch {
    // ignore corrupt data
  }
}

/* ─── Render board ─── */
function renderBoard() {
  const total = state.maxNumbers;
  let fragment = document.createDocumentFragment();

  for (let i = 1; i <= total; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.num = i;

    const numSpan = document.createElement('span');
    numSpan.className = 'number';
    numSpan.textContent = String(i).padStart(3, '0');
    cell.appendChild(numSpan);

    const name = state.participants[i];
    if (name) {
      cell.classList.add('taken');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = name;
      cell.appendChild(nameSpan);

      const winnerIdx = state.winners.indexOf(i);
      if (winnerIdx !== -1) {
        cell.classList.add('winner');
        const badge = document.createElement('span');
        badge.className = 'winner-badge';
        badge.textContent = winnerIdx + 1;
        cell.appendChild(badge);
      }
    }

    cell.addEventListener('click', () => openEditor(i));
    fragment.appendChild(cell);
  }

  boardEl.innerHTML = '';
  boardEl.appendChild(fragment);
  updateStats();
}

/* ─── Stats ─── */
function updateStats() {
  const taken = Object.keys(state.participants).length;
  participantCountEl.textContent = taken;
  freeCountEl.textContent = state.maxNumbers - taken;
}

/* ─── Editor ─── */
function openEditor(num) {
  if (state.isAnimating) return;
  state.selectedNum = num;
  selectedNumberEl.textContent = String(num).padStart(3, '0');
  participantNameEl.value = state.participants[num] || '';
  editorEl.classList.remove('hidden');
  participantNameEl.focus();
}

function closeEditor() {
  editorEl.classList.add('hidden');
  state.selectedNum = null;
}

/* ─── Save participant ─── */
function saveParticipant() {
  const num = state.selectedNum;
  if (num === null) return;
  const name = participantNameEl.value.trim();
  if (!name) {
    participantNameEl.focus();
    return;
  }
  state.participants[num] = name;
  // Remove from winners if reassigned
  const wIdx = state.winners.indexOf(num);
  if (wIdx !== -1) {
    state.winners.splice(wIdx, 1);
  }
  saveState();
  renderBoard();
  closeEditor();
}

/* ─── Delete participant ─── */
function deleteParticipant() {
  const num = state.selectedNum;
  if (num === null) return;
  delete state.participants[num];
  const wIdx = state.winners.indexOf(num);
  if (wIdx !== -1) {
    state.winners.splice(wIdx, 1);
  }
  saveState();
  renderBoard();
  closeEditor();
}

/* ─── Reset all ─── */
function resetAll() {
  if (state.isAnimating) return;
  if (Object.keys(state.participants).length === 0 && state.winners.length === 0) return;
  if (!confirm('¿Estás seguro de reiniciar el sorteo? Se perderán todos los participantes y resultados.')) return;
  state.participants = {};
  state.winners = [];
  saveState();
  renderBoard();
  resultsEl.classList.add('hidden');
  closeEditor();
}

/* ─── Clear results (keep participants) ─── */
function clearResults() {
  state.winners = [];
  saveState();
  renderBoard();
  resultsEl.classList.add('hidden');
}

/* ─── Animate draw ─── */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateDraw(numbers) {
  state.isAnimating = true;
  btnDraw.disabled = true;
  animationEl.classList.remove('hidden');
  resultsEl.classList.add('hidden');

  const total = state.maxNumbers;
  const rounds = 20 + cryptoRandom(5, 15);
  const delay = 60;

  for (let r = 0; r < rounds; r++) {
    const fake = cryptoRandom(1, total);
    rollingEl.textContent = String(fake).padStart(3, '0');
    await sleep(delay);
  }

  // Final result
  let result = [];
  const available = numbers.filter(n => !state.winners.includes(n));

  for (let w = 0; w < state.winnerCount; w++) {
    if (available.length === 0) break;

    // Eliminate already selected in this draw
    const pool = available.filter(n => !result.includes(n));
    if (pool.length === 0) break;

    const pick = cryptoRandom(0, pool.length - 1);
    const winnerNum = pool[pick];
    result.push(winnerNum);

    if (w < state.winnerCount - 1) {
      // Show interim number briefly
      rollingEl.textContent = String(winnerNum).padStart(3, '0');
      await sleep(800);
      // Flicker again before next winner
      for (let r = 0; r < 10; r++) {
        const fake = cryptoRandom(1, total);
        rollingEl.textContent = String(fake).padStart(3, '0');
        await sleep(50);
      }
    }
  }

  // Show last winner
  if (result.length > 0) {
    rollingEl.textContent = String(result[result.length - 1]).padStart(3, '0');
  }

  await sleep(500);
  animationEl.classList.add('hidden');

  state.winners = result;
  saveState();
  renderBoard();
  showResults(result);
  state.isAnimating = false;
  btnDraw.disabled = false;
}

/* ─── Show results ─── */
function showResults(winners) {
  winnerListEl.innerHTML = '';
  winners.forEach((num, idx) => {
    const card = document.createElement('div');
    card.className = 'winner-card';
    card.innerHTML = `
      <div class="winner-number">#${String(num).padStart(3, '0')}</div>
      <div class="winner-name">${state.participants[num] || '—'}</div>
    `;
    winnerListEl.appendChild(card);
  });
  resultsEl.classList.remove('hidden');
}

/* ─── Draw handler ─── */
function handleDraw() {
  if (state.isAnimating) return;
  const taken = Object.keys(state.participants);
  if (taken.length === 0) {
    alert('No hay participantes registrados. Asigna al menos un número antes de sortear.');
    return;
  }
  if (taken.length < state.winnerCount) {
    alert(`Solo hay ${taken.length} participante(s) pero quieres seleccionar ${state.winnerCount} ganador(es). Reduce la cantidad de ganadores o agrega más participantes.`);
    return;
  }
  // Also check we have enough distinct available numbers
  const available = taken.map(Number).filter(n => !state.winners.includes(n));
  if (available.length < state.winnerCount) {
    alert('No hay suficientes participantes disponibles para el sorteo (sin contar ganadores anteriores).');
    return;
  }
  animateDraw(available);
}

/* ─── Config changes ─── */
function handleMaxChange() {
  const newMax = parseInt(maxNumbersSelect.value, 10);
  if (state.isAnimating) return;

  if (newMax < state.maxNumbers) {
    // Removing numbers - check if any participants would be lost
    const lost = Object.keys(state.participants)
      .map(Number)
      .filter(n => n > newMax);
    if (lost.length > 0) {
      if (!confirm(`Se eliminarán ${lost.length} participante(s) con números mayores a ${newMax}. ¿Continuar?`)) {
        maxNumbersSelect.value = state.maxNumbers;
        return;
      }
      // Remove lost participants and their winners
      lost.forEach(n => {
        delete state.participants[n];
        const wIdx = state.winners.indexOf(n);
        if (wIdx !== -1) state.winners.splice(wIdx, 1);
      });
    }
  }

  state.maxNumbers = newMax;
  saveState();
  renderBoard();
}

function handleWinnerCountChange() {
  state.winnerCount = parseInt(winnerCountSelect.value, 10);
  saveState();
}

/* ─── Init ─── */
function init() {
  loadState();

  // Sync selects to state
  maxNumbersSelect.value = state.maxNumbers;
  winnerCountSelect.value = state.winnerCount;

  renderBoard();

  // If there are winners, show them
  if (state.winners.length > 0) {
    showResults(state.winners);
  }

  // Events
  btnSave.addEventListener('click', saveParticipant);
  btnDelete.addEventListener('click', deleteParticipant);
  btnCancel.addEventListener('click', closeEditor);
  btnDraw.addEventListener('click', handleDraw);
  btnReset.addEventListener('click', resetAll);
  btnClearResults.addEventListener('click', clearResults);
  maxNumbersSelect.addEventListener('change', handleMaxChange);
  winnerCountSelect.addEventListener('change', handleWinnerCountChange);

  // Enter key in name input
  participantNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveParticipant();
    if (e.key === 'Escape') closeEditor();
  });
}

document.addEventListener('DOMContentLoaded', init);