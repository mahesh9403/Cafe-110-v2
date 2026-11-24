// Vanilla-DOM Tic-Tac-Toe UI. A rewrite of Seven Midway Plaza's TicTacToeGame.tsx,
// keeping every feature: You vs OneTen / 2-player modes, Easy + Hard AI (hard = perfect
// minimax that never loses), winning-line highlight, score tracking, new round,
// keyboard play. Themed in OneTen's palette via css/games.css.

import { EMPTY_BOARD, cellLabel, computerMove, findWinner, isOver, play, turnOf } from './tictactoe-logic.js';

const STORAGE_KEY = 'oneten-tictactoe-mode';
const COMPUTER = 'O';
const THINK_MS = 350;
const CPU_LABEL = 'OneTen';

const initial = { mode: 'cpu', difficulty: 'easy', board: EMPTY_BOARD, starter: 'X', scores: { x: 0, o: 0, draws: 0 } };

function reducer(state, action) {
  switch (action.type) {
    case 'move': {
      if (isOver(state.board) || state.board[action.index] !== null) return state;
      const mark = turnOf(state.board, state.starter);
      const board = play(state.board, action.index, mark);
      const result = findWinner(board);
      let scores = state.scores;
      if (result) scores = result.winner === 'X' ? { ...scores, x: scores.x + 1 } : { ...scores, o: scores.o + 1 };
      else if (isOver(board)) scores = { ...scores, draws: scores.draws + 1 };
      return { ...state, board, scores };
    }
    case 'newRound':
      return { ...state, board: EMPTY_BOARD, starter: state.starter === 'X' ? 'O' : 'X' };
    case 'mode':
      return action.mode === state.mode ? state : { ...initial, mode: action.mode, difficulty: state.difficulty };
    case 'difficulty':
      return action.difficulty === state.difficulty ? state : { ...initial, mode: state.mode, difficulty: action.difficulty };
    default: return state;
  }
}

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const markGlyph = (mark) =>
  mark === 'X'
    ? '<svg viewBox="0 0 40 40" class="ttt-glyph" aria-hidden="true" focusable="false"><path d="M9 9 31 31M31 9 9 31" fill="none" stroke="var(--gold-light)" stroke-width="6" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 40 40" class="ttt-glyph" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="12" fill="none" stroke="var(--sand)" stroke-width="6"/></svg>';

export function mountTicTacToe(root) {
  let state = initial;
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wrap = el('div', 'ttt');

  // mode chips
  const modeRow = el('div', 'sdk-chips');
  modeRow.setAttribute('role', 'group');
  modeRow.setAttribute('aria-label', 'Mode');
  const modeCpu = el('button', 'sdk-chip', `You vs ${CPU_LABEL}`);
  modeCpu.type = 'button';
  modeCpu.addEventListener('click', () => dispatch({ type: 'mode', mode: 'cpu' }));
  const modeTwo = el('button', 'sdk-chip', '2 players');
  modeTwo.type = 'button';
  modeTwo.addEventListener('click', () => dispatch({ type: 'mode', mode: 'two' }));
  modeRow.append(modeCpu, modeTwo);

  // difficulty chips
  const diffRow = el('div', 'sdk-chips ttt-diff');
  diffRow.setAttribute('role', 'group');
  diffRow.setAttribute('aria-label', 'Difficulty');
  const diffEasy = el('button', 'sdk-chip', 'Easy');
  diffEasy.type = 'button';
  diffEasy.addEventListener('click', () => dispatch({ type: 'difficulty', difficulty: 'easy' }));
  const diffHard = el('button', 'sdk-chip', 'Hard');
  diffHard.type = 'button';
  diffHard.addEventListener('click', () => dispatch({ type: 'difficulty', difficulty: 'hard' }));
  diffRow.append(diffEasy, diffHard);

  // status
  const status = el('p', 'ttt-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  // board
  const board = el('div', 'ttt-board');
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', 'Tic-Tac-Toe board');
  const cells = [];
  for (let i = 0; i < 9; i += 1) {
    const b = el('button', 'ttt-cell');
    b.type = 'button';
    b.addEventListener('click', () => { if (!cellLocked(i)) dispatch({ type: 'move', index: i }); });
    b.addEventListener('keydown', (e) => onCellKeyDown(e, i));
    board.appendChild(b);
    cells.push(b);
  }

  // score
  const scoreList = el('ul', 'ttt-score');
  scoreList.setAttribute('aria-label', 'Score');
  const scoreItems = [el('li'), el('li'), el('li')];
  scoreItems.forEach((li) => scoreList.appendChild(li));

  // new round
  const newRow = el('div', 'sdk-newrow');
  const newBtn = el('button', 'sdk-btn sdk-btn-primary', 'New round');
  newBtn.type = 'button';
  newBtn.addEventListener('click', () => dispatch({ type: 'newRound' }));
  newRow.appendChild(newBtn);

  wrap.append(modeRow, diffRow, status, board, scoreList, newRow);
  root.appendChild(wrap);

  let thinkTimer = null;

  function cellLocked(i) {
    const over = isOver(state.board);
    const turn = turnOf(state.board, state.starter);
    const thinking = state.mode === 'cpu' && !over && turn === COMPUTER;
    return over || thinking || state.board[i] !== null;
  }

  function dispatch(action) {
    const next = reducer(state, action);
    if (next === state) return;
    state = next;
    persist();
    render();
    maybeThink();
  }

  function persist() {
    try { window.localStorage.setItem(STORAGE_KEY, state.mode); } catch { /* ignore */ }
  }

  function maybeThink() {
    if (thinkTimer) { clearTimeout(thinkTimer); thinkTimer = null; }
    const over = isOver(state.board);
    const turn = turnOf(state.board, state.starter);
    const thinking = state.mode === 'cpu' && !over && turn === COMPUTER;
    if (!thinking) return;
    thinkTimer = setTimeout(() => {
      const move = computerMove(state.board, COMPUTER, state.difficulty);
      if (move !== null) dispatch({ type: 'move', index: move });
    }, reduce() ? 0 : THINK_MS);
  }

  function onCellKeyDown(e, index) {
    const r = Math.floor(index / 3);
    const c = index % 3;
    let next = null;
    if (e.key === 'ArrowRight') next = r * 3 + Math.min(c + 1, 2);
    else if (e.key === 'ArrowLeft') next = r * 3 + Math.max(c - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(r + 1, 2) * 3 + c;
    else if (e.key === 'ArrowUp') next = Math.max(r - 1, 0) * 3 + c;
    if (next === null) return;
    e.preventDefault();
    cells[next]?.focus();
  }

  function render() {
    const { mode, difficulty, scores, starter } = state;
    const result = findWinner(state.board);
    const over = isOver(state.board);
    const turn = turnOf(state.board, starter);
    const thinking = mode === 'cpu' && !over && turn === COMPUTER;

    modeCpu.setAttribute('aria-pressed', String(mode === 'cpu'));
    modeTwo.setAttribute('aria-pressed', String(mode === 'two'));
    diffRow.hidden = mode !== 'cpu';
    diffEasy.setAttribute('aria-pressed', String(difficulty === 'easy'));
    diffHard.setAttribute('aria-pressed', String(difficulty === 'hard'));

    let text;
    if (result) text = mode === 'cpu' ? (result.winner === 'X' ? 'You win!' : `${CPU_LABEL} wins`) : `${result.winner} wins!`;
    else if (over) text = 'Draw';
    else if (mode === 'cpu') text = thinking ? `${CPU_LABEL} is thinking…` : 'Your turn';
    else text = `${turn}'s turn`;
    status.textContent = text;

    state.board.forEach((cell, i) => {
      const b = cells[i];
      const inLine = result ? result.line.includes(i) : false;
      const locked = over || thinking || cell !== null;
      b.dataset.inline = inLine ? 'true' : '';
      b.setAttribute('aria-label', cellLabel(i, cell));
      if (locked) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      const html = cell ? markGlyph(cell) : '';
      if (b.innerHTML !== html) b.innerHTML = html;
    });

    const labels = mode === 'cpu' ? { x: 'You', o: CPU_LABEL } : { x: 'X', o: 'O' };
    const rows = [[labels.x, scores.x], ['Draws', scores.draws], [labels.o, scores.o]];
    scoreItems.forEach((li, idx) => {
      const [label, value] = rows[idx];
      li.innerHTML = `<span class="ttt-score-label">${label}</span><strong>${value}</strong>`;
    });
  }

  // restore mode
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'cpu' || saved === 'two') state = { ...initial, mode: saved };
  } catch { /* storage unavailable */ }

  render();
  maybeThink();

  // test hook
  window.__ttt = { getState: () => state, dispatch };
}
