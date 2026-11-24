// Ported from Seven Midway Plaza's tests/tictactoe.test.ts (node:test + node:assert).
import assert from 'node:assert/strict';
import test from 'node:test';
import { EMPTY_BOARD, LINES, bestMove, cellLabel, computerMove, findWinner, isDraw, legalMoves, other, play, winningMove } from '../tictactoe-logic.js';

const b = (s) => [...s].map((c) => (c === 'X' || c === 'O' ? c : null));

test('winner detection covers all 8 lines for both marks', () => {
  assert.equal(LINES.length, 8);
  for (const mark of ['X', 'O']) {
    for (const line of LINES) {
      const board = EMPTY_BOARD.map((_, i) => (line.includes(i) ? mark : null));
      const r = findWinner(board);
      assert.deepEqual(r, { winner: mark, line }, `${mark} ${line}`);
    }
  }
});

test('rows, columns and diagonals by example', () => {
  assert.equal(findWinner(b('XXX......'))?.winner, 'X');
  assert.equal(findWinner(b('O..O..O..'))?.winner, 'O');
  assert.deepEqual(findWinner(b('X...X...X'))?.line, [0, 4, 8]);
  assert.deepEqual(findWinner(b('..O.O.O..'))?.line, [2, 4, 6]);
  assert.equal(findWinner(b('XX.OO....')), null);
  assert.equal(findWinner(EMPTY_BOARD), null);
});

test('draw detection', () => {
  const draw = b('XOXXOOOXX');
  assert.equal(findWinner(draw), null);
  assert.equal(isDraw(draw), true);
  assert.equal(isDraw(b('XOX......')), false);
  assert.equal(isDraw(b('XXXOO.OXO')), false, 'a win is not a draw');
});

test('legal moves and play', () => {
  assert.deepEqual(legalMoves(EMPTY_BOARD), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const next = play(EMPTY_BOARD, 4, 'X');
  assert.equal(next[4], 'X');
  assert.equal(EMPTY_BOARD[4], null, 'does not mutate');
  assert.throws(() => play(next, 4, 'O'));
  assert.throws(() => play(next, 9, 'O'));
});

test('hard AI takes an immediate win', () => {
  assert.equal(bestMove(b('XX.OO....'), 'X'), 2);
  assert.equal(bestMove(b('XX.OO....'), 'O'), 5);
  assert.equal(bestMove(b('X.XO.O...'), 'X'), 1);
});

test('hard AI blocks an immediate loss', () => {
  assert.equal(bestMove(b('XX.O.....'), 'O'), 2);
  assert.equal(bestMove(b('X..X.....'), 'O'), 6);
});

test('hard AI is a corner/centre opener and returns null when over', () => {
  assert.ok([0, 2, 4, 6, 8].includes(bestMove(EMPTY_BOARD, 'X') ?? -1));
  assert.equal(bestMove(b('XXXOO....'), 'O'), null);
  assert.equal(bestMove(b('XOXXOOOXX'), 'X'), null);
});

/** Plays every opponent move sequence against the hard AI; returns [games, aiLosses]. */
function exhaust(board, aiMark, toMove) {
  const result = findWinner(board);
  if (result) return [1, result.winner === aiMark ? 0 : 1];
  const moves = legalMoves(board);
  if (moves.length === 0) return [1, 0];
  if (toMove === aiMark) {
    const m = bestMove(board, aiMark);
    assert.notEqual(m, null);
    return exhaust(play(board, m, aiMark), aiMark, other(aiMark));
  }
  let games = 0;
  let losses = 0;
  for (const m of moves) {
    const [g, l] = exhaust(play(board, m, toMove), aiMark, other(toMove));
    games += g;
    losses += l;
  }
  return [games, losses];
}

test('hard AI never loses, as O (opponent moves first)', () => {
  const [games, losses] = exhaust(EMPTY_BOARD, 'O', 'X');
  assert.ok(games > 100);
  assert.equal(losses, 0);
});

test('hard AI never loses, as X (AI moves first)', () => {
  const [games, losses] = exhaust(EMPTY_BOARD, 'X', 'X');
  assert.ok(games > 20);
  assert.equal(losses, 0);
});

test('easy AI: random legal moves, takes the immediate win about half the time', () => {
  const board = b('XX.OO....');
  assert.equal(winningMove(board, 'X'), 2);
  assert.equal(computerMove(board, 'X', 'easy', () => 0.1), 2, 'low roll takes the win');
  assert.notEqual(computerMove(board, 'X', 'easy', () => 0.9), 2, 'high roll plays a random legal move');
  for (let i = 0; i < 200; i++) {
    const m = computerMove(board, 'X', 'easy');
    assert.ok(m !== null && legalMoves(board).includes(m));
  }
  assert.equal(computerMove(b('XXXOO....'), 'O', 'easy'), null);
  assert.equal(computerMove(board, 'X', 'hard'), 2);
});

test('cell labels', () => {
  assert.equal(cellLabel(1, null), 'Row 1, column 2, empty');
  assert.equal(cellLabel(8, 'O'), 'Row 3, column 3, O');
});
