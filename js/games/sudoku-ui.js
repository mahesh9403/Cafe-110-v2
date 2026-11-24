// Vanilla-DOM Sudoku UI. A rewrite of Seven Midway Plaza's SudokuGame.tsx + Board.tsx,
// keeping every feature: number pad with remaining counts, notes, erase, hint, undo,
// mistake + peer + same-digit highlighting, timer, difficulty, new game, win screen.
// Themed in OneTen's espresso/cream/gold palette via css/games.css.

import { STORAGE_KEY, bankSize, deserialize, newState, reducer, serialize } from './sudoku-game.js';
import { DIFFICULTIES, findConflicts, formatTime, isPeer, remainingCounts } from './sudoku-logic.js';

const LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  erase: '<path d="m7 21-4-4a2 2 0 0 1 0-3l10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3L12 21Z"/><path d="M22 21H7"/><path d="m6 12 6 6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  hint: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.3 1 2.3h6c0-1 .3-1.7 1-2.3A7 7 0 0 0 12 2Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export function mountSudoku(root) {
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Server-equivalent first state, then restore a saved game (or a random easy puzzle).
  let state = newState('easy', 0);

  // ---- build static structure once ----
  const wrap = el('div', 'sdk');

  // difficulty chips + timer
  const top = el('div', 'sdk-top');
  const chipRow = el('div', 'sdk-chips');
  chipRow.setAttribute('role', 'group');
  chipRow.setAttribute('aria-label', 'Difficulty');
  const chips = DIFFICULTIES.map((d) => {
    const b = el('button', 'sdk-chip', LABEL[d]);
    b.type = 'button';
    b.addEventListener('click', () => requestNew(d));
    chipRow.appendChild(b);
    return b;
  });
  const timer = el('p', 'sdk-timer');
  top.append(chipRow, timer);

  // board
  const grid = el('div');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Sudoku board');
  grid.setAttribute('aria-rowcount', '9');
  grid.setAttribute('aria-colcount', '9');
  grid.className = 'sdk-board';
  const cells = [];
  for (let r = 0; r < 9; r += 1) {
    const rowEl = el('div', 'sdk-row');
    rowEl.setAttribute('role', 'row');
    for (let c = 0; c < 9; c += 1) {
      const i = r * 9 + c;
      const b = el('button', 'sdk-cell');
      b.type = 'button';
      b.setAttribute('role', 'gridcell');
      b.setAttribute('aria-colindex', String(c + 1));
      b.dataset.box = String(Math.floor(r / 3) * 3 + Math.floor(c / 3));
      if (c % 3 === 2 && c < 8) b.dataset.br = 'true';
      if (r % 3 === 2 && r < 8) b.dataset.bb = 'true';
      b.addEventListener('click', () => dispatch({ type: 'select', cell: i }));
      rowEl.appendChild(b);
      cells.push(b);
    }
    grid.appendChild(rowEl);
  }
  grid.addEventListener('keydown', onKeyDown);
  const boardWrap = el('div', 'sdk-boardwrap');
  boardWrap.appendChild(grid);

  // stats + live region
  const stats = el('p', 'sdk-stats');
  const liveRegion = el('p', 'sr-only');
  liveRegion.setAttribute('aria-live', 'polite');

  // tools
  const tools = el('div', 'sdk-tools');
  const undoBtn = el('button', 'sdk-tool', `${icon('undo')}<span>Undo</span>`);
  undoBtn.type = 'button';
  undoBtn.addEventListener('click', () => dispatch({ type: 'undo' }));
  const notesBtn = el('button', 'sdk-tool', `${icon('pencil')}<span class="sdk-notes-label">Notes off</span>`);
  notesBtn.type = 'button';
  notesBtn.addEventListener('click', () => dispatch({ type: 'toggleNotes' }));
  const hintBtn = el('button', 'sdk-tool', `${icon('hint')}<span>Hint</span>`);
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => dispatch({ type: 'hint' }));
  tools.append(undoBtn, notesBtn, hintBtn);

  // number pad
  const pad = el('div', 'sdk-pad');
  pad.setAttribute('role', 'group');
  pad.setAttribute('aria-label', 'Number pad');
  const padBtns = DIGITS.map((d) => {
    const b = el('button', 'sdk-key', `<span class="sdk-key-digit">${d}</span><span class="sdk-key-left" aria-hidden="true"></span>`);
    b.type = 'button';
    b.addEventListener('click', () => dispatch({ type: 'digit', digit: d }));
    pad.appendChild(b);
    return b;
  });
  const eraseBtn = el('button', 'sdk-key sdk-key-erase', `${icon('erase')}<span>Erase</span>`);
  eraseBtn.type = 'button';
  eraseBtn.addEventListener('click', () => dispatch({ type: 'erase' }));
  pad.appendChild(eraseBtn);

  // new game
  const newRow = el('div', 'sdk-newrow');
  const newBtn = el('button', 'sdk-btn sdk-btn-secondary', 'New game');
  newBtn.type = 'button';
  newBtn.addEventListener('click', () => requestNew(state.difficulty));
  newRow.appendChild(newBtn);

  // confirm sheet
  const confirmSheet = buildSheet();
  confirmSheet.dialog.setAttribute('aria-labelledby', 'sdk-confirm-title');
  // win sheet
  const winSheet = buildSheet();
  winSheet.dialog.setAttribute('aria-labelledby', 'sdk-win-title');

  wrap.append(top, boardWrap, stats, liveRegion, tools, pad, newRow, confirmSheet.dialog, winSheet.dialog);
  root.appendChild(wrap);

  // ---- state plumbing ----
  let prevMistakes = 0;
  let winTimer = null;
  let hintTimer = null;
  let confirmTarget = null;

  function dispatch(action) {
    const next = reducer(state, action);
    if (next === state) return;
    const prevWon = state.won;
    const prevSelected = state.selected;
    state = next;
    render();
    persist();
    if (state.selected !== prevSelected) focusSelected();
    if (state.mistakes > prevMistakes) {
      liveRegion.textContent = `That number does not belong there. Mistakes: ${state.mistakes}.`;
    }
    prevMistakes = state.mistakes;
    if (state.hinted !== null) {
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(() => dispatch({ type: 'clearHint' }), 1200);
    }
    if (state.won && !prevWon) onWin();
    if (!state.won && prevWon) { winSheet.close(); }
  }

  function focusSelected() {
    if (state.selected === null) return;
    if (grid.contains(document.activeElement)) cells[state.selected]?.focus();
  }

  function requestNew(difficulty) {
    const hasProgress = state.values.some((v, i) => v !== state.givens[i]) || state.notes.some((n) => n !== 0);
    if (state.won || !hasProgress) { dispatch({ type: 'new', difficulty }); return; }
    confirmTarget = difficulty;
    confirmSheet.render(`
      <h2 id="sdk-confirm-title" class="sdk-sheet-title">Start a new puzzle?</h2>
      <p class="sdk-sheet-body">Your current ${LABEL[state.difficulty]} puzzle will be lost.</p>
      <div class="sdk-sheet-actions">
        <button type="button" class="sdk-btn sdk-btn-primary" data-act="confirm">New ${LABEL[difficulty]} puzzle</button>
        <button type="button" class="sdk-btn sdk-btn-secondary" data-act="cancel">Keep playing</button>
      </div>`);
    confirmSheet.dialog.querySelector('[data-act="confirm"]').addEventListener('click', () => {
      confirmSheet.close();
      dispatch({ type: 'new', difficulty: confirmTarget });
    });
    confirmSheet.dialog.querySelector('[data-act="cancel"]').addEventListener('click', () => confirmSheet.close());
    confirmSheet.open();
  }

  function onWin() {
    if (winTimer) clearTimeout(winTimer);
    boardWrap.dataset.won = 'true';
    const delay = reduce() ? 0 : 900;
    winTimer = setTimeout(() => {
      const mistakesTxt = state.mistakes === 0 ? 'No mistakes' : `${state.mistakes} ${state.mistakes === 1 ? 'mistake' : 'mistakes'}`;
      const hintsTxt = state.hints > 0 ? `, ${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}` : '';
      winSheet.render(`
        <p class="sdk-sheet-eyebrow">${LABEL[state.difficulty]} puzzle complete</p>
        <h2 id="sdk-win-title" class="sdk-sheet-title">Solved in ${formatTime(state.elapsed)}</h2>
        <p class="sdk-sheet-body">${mistakesTxt}${hintsTxt}. Well played.</p>
        <div class="sdk-sheet-actions">
          <button type="button" class="sdk-btn sdk-btn-primary" data-act="again">New puzzle</button>
          <a href="/table/" class="sdk-btn sdk-btn-secondary">Back to table</a>
        </div>`);
      winSheet.dialog.querySelector('[data-act="again"]').addEventListener('click', () => {
        winSheet.close();
        dispatch({ type: 'new', difficulty: state.difficulty });
      });
      winSheet.open();
    }, delay);
  }

  function persist() {
    try {
      if (state.won) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, serialize(state));
    } catch { /* storage unavailable */ }
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    const move = (dr, dc) => { e.preventDefault(); dispatch({ type: 'move', dr, dc }); };
    if (k === 'ArrowUp') move(-1, 0);
    else if (k === 'ArrowDown') move(1, 0);
    else if (k === 'ArrowLeft') move(0, -1);
    else if (k === 'ArrowRight') move(0, 1);
    else if (/^[1-9]$/.test(k)) { e.preventDefault(); dispatch({ type: 'digit', digit: Number(k) }); }
    else if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); dispatch({ type: 'erase' }); }
    else if (k === 'n' || k === 'N') { e.preventDefault(); dispatch({ type: 'toggleNotes' }); }
    else if (k === 'Escape') dispatch({ type: 'select', cell: null });
  }

  // ---- render ----
  function cellAria(i) {
    const v = state.values[i] ?? 0;
    const where = `Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}`;
    if (state.givens[i]) return `${where}, ${v}, given`;
    if (v) return `${where}, ${v}`;
    const n = state.notes[i] ?? 0;
    if (n) return `${where}, empty, notes ${NOTE_DIGITS.filter((d) => n & (1 << (d - 1))).join(' ')}`;
    return `${where}, empty`;
  }

  function render() {
    const conflicts = findConflicts(state.values);
    const left = remainingCounts(state.values);
    const sel = state.selected;
    const selValue = sel !== null ? (state.values[sel] ?? 0) : 0;
    const focusCell = sel ?? 0;

    timer.textContent = formatTime(state.elapsed);
    timer.setAttribute('aria-label', `Time ${formatTime(state.elapsed)}`);

    chips.forEach((b, idx) => b.setAttribute('aria-pressed', String(state.difficulty === DIFFICULTIES[idx])));

    for (let i = 0; i < 81; i += 1) {
      const b = cells[i];
      const v = state.values[i] ?? 0;
      const given = state.givens[i] !== 0;
      const isSel = sel === i;
      const conflict = v !== 0 && conflicts.has(i);
      const sameDigit = !isSel && selValue !== 0 && v === selValue;
      const peer = sel !== null && !isSel && isPeer(sel, i);
      const hinted = state.hinted === i;
      const notes = state.notes[i] ?? 0;

      b.dataset.sel = isSel ? 'true' : '';
      b.dataset.peer = peer ? 'true' : '';
      b.dataset.same = sameDigit ? 'true' : '';
      b.dataset.conflict = conflict ? 'true' : '';
      b.dataset.hinted = hinted ? 'true' : '';
      b.dataset.given = given ? 'true' : '';
      b.tabIndex = i === focusCell ? 0 : -1;
      b.setAttribute('aria-selected', String(isSel));
      b.setAttribute('aria-label', cellAria(i));

      let html = '';
      if (v) {
        html = `<span class="sdk-val">${v}</span>`;
      } else if (notes) {
        html = '<span class="sdk-notes" aria-hidden="true">' +
          NOTE_DIGITS.map((d) => `<span>${notes & (1 << (d - 1)) ? d : ''}</span>`).join('') + '</span>';
      }
      if (conflict) html += '<span class="sdk-flag" aria-hidden="true"></span>';
      if (b.innerHTML !== html) b.innerHTML = html;
    }

    stats.innerHTML = `<span>Mistakes <strong>${state.mistakes}</strong></span><span>Hints used <strong>${state.hints}</strong></span>`;

    undoBtn.disabled = state.history.length === 0 || state.won;
    hintBtn.disabled = state.won;
    notesBtn.disabled = state.won;
    notesBtn.setAttribute('aria-pressed', String(state.notesMode));
    notesBtn.dataset.on = state.notesMode ? 'true' : '';
    notesBtn.querySelector('.sdk-notes-label').textContent = `Notes ${state.notesMode ? 'on' : 'off'}`;

    pad.dataset.notes = state.notesMode ? 'true' : '';
    pad.setAttribute('aria-label', state.notesMode ? 'Number pad, notes mode' : 'Number pad');
    padBtns.forEach((b, idx) => {
      const d = DIGITS[idx];
      const remaining = left[d] ?? 0;
      const complete = remaining <= 0;
      b.disabled = state.won || complete;
      b.dataset.notes = state.notesMode ? 'true' : '';
      b.setAttribute('aria-label', complete ? `${d}, all placed` : `${d} ${remaining} left`);
      const leftSpan = b.querySelector('.sdk-key-left');
      leftSpan.innerHTML = complete ? icon('check') : `${remaining} left`;
    });
    eraseBtn.disabled = state.won;
  }

  // ---- startup: restore saved game, start timer ----
  let loaded = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    loaded = raw ? deserialize(raw) : null;
  } catch { /* storage unavailable */ }
  state = loaded && !loaded.won ? loaded : newState('easy', Math.floor(Math.random() * bankSize('easy')));
  prevMistakes = state.mistakes;
  render();
  persist();

  setInterval(() => {
    if (!document.hidden && !state.won) dispatch({ type: 'tick' });
  }, 1000);

  // ---- test hook: fill all but one correct cell so the win screen can be reached ----
  window.__sudoku = {
    getState: () => state,
    dispatch,
    nearSolve() {
      const empties = [];
      for (let i = 0; i < 81; i += 1) if (state.givens[i] === 0 && state.values[i] !== state.solution[i]) empties.push(i);
      for (let n = 0; n < empties.length - 1; n += 1) {
        const i = empties[n];
        dispatch({ type: 'select', cell: i });
        dispatch({ type: 'digit', digit: state.solution[i] });
      }
      const last = empties[empties.length - 1];
      dispatch({ type: 'select', cell: last });
      return last;
    },
  };
}

/** A reusable bottom-sheet built on <dialog>, styled by css/games.css + table.css tokens. */
function buildSheet() {
  const dialog = document.createElement('dialog');
  dialog.className = 'tbl-sheet sdk-sheet';
  const inner = el('div', 'tbl-sheet-inner');
  dialog.appendChild(inner);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  return {
    dialog,
    render(html) { inner.innerHTML = html; },
    open() { if (!dialog.open) dialog.showModal(); },
    close() { if (dialog.open) dialog.close(); },
  };
}
