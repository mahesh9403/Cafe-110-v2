// Pure Tic-Tac-Toe rules and AI. No DOM, no dependencies.
// Ported verbatim from Seven Midway Plaza's src/components/tictactoe/logic.ts (types stripped).

export const EMPTY_BOARD = Object.freeze(Array(9).fill(null));

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function other(mark) {
  return mark === 'X' ? 'O' : 'X';
}

/** The winning mark and its line, or null when nobody has three in a row. */
export function findWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    const m = board[a];
    if (m && m === board[b] && m === board[c]) return { winner: m, line };
  }
  return null;
}

export function legalMoves(board) {
  const moves = [];
  board.forEach((cell, i) => { if (cell === null) moves.push(i); });
  return moves;
}

/** Full board with no winner. */
export function isDraw(board) {
  return findWinner(board) === null && legalMoves(board).length === 0;
}

export function isOver(board) {
  return findWinner(board) !== null || legalMoves(board).length === 0;
}

/** Returns a new board with `mark` placed at `index`; throws on an illegal move. */
export function play(board, index, mark) {
  if (!Number.isInteger(index) || index < 0 || index > 8 || board[index] !== null) throw new Error(`Illegal move ${index}`);
  const next = board.slice();
  next[index] = mark;
  return next;
}

/** Whose turn it is, assuming X moved first on an empty board. */
export function turnOf(board, first = 'X') {
  const placed = board.filter((c) => c !== null).length;
  return placed % 2 === 0 ? first : other(first);
}

/** Minimax score from `me`'s view: +1 win, 0 draw, -1 loss; faster wins and slower losses score better. */
function score(board, toMove, me, depth) {
  const result = findWinner(board);
  if (result) return result.winner === me ? 10 - depth : depth - 10;
  const moves = legalMoves(board);
  if (moves.length === 0) return 0;
  let best = toMove === me ? -Infinity : Infinity;
  for (const m of moves) {
    const s = score(play(board, m, toMove), other(toMove), me, depth + 1);
    best = toMove === me ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

/** Perfect move for `me` (never loses). Ties go to the lowest index, so it is deterministic. Null when the game is over. */
export function bestMove(board, me) {
  if (isOver(board)) return null;
  let best = -Infinity;
  let pick = null;
  for (const m of legalMoves(board)) {
    const s = score(play(board, m, me), other(me), me, 1);
    if (s > best) { best = s; pick = m; }
  }
  return pick;
}

/** A move that wins on the spot for `mark`, if any. */
export function winningMove(board, mark) {
  for (const m of legalMoves(board)) if (findWinner(play(board, m, mark))) return m;
  return null;
}

/**
 * Computer move. Hard = perfect minimax. Easy = random legal move, but takes an immediate win
 * about half the time. `random` returns [0, 1) and is injectable for tests.
 */
export function computerMove(board, me, difficulty, random = Math.random) {
  const moves = legalMoves(board);
  if (moves.length === 0 || findWinner(board)) return null;
  if (difficulty === 'hard') return bestMove(board, me);
  const win = winningMove(board, me);
  if (win !== null && random() < 0.5) return win;
  return moves[Math.floor(random() * moves.length)] ?? null;
}

/** Spoken label for a cell, e.g. "Row 1, column 2, empty". */
export function cellLabel(index, cell) {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  return `Row ${row}, column ${col}, ${cell ?? 'empty'}`;
}
