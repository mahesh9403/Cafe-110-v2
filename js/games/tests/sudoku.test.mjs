// Ported from Seven Midway Plaza's tests/sudoku.test.ts (node:test + node:assert).
import assert from 'node:assert/strict';
import test from 'node:test';
import { PUZZLE_BANK } from '../sudoku-bank.js';
import { countSolutions, findConflicts, parseGrid, remainingCounts, isSolved, formatTime } from '../sudoku-logic.js';
import { reducer, newState, serialize, deserialize } from '../sudoku-game.js';

const levels = Object.keys(PUZZLE_BANK);

test('bank has 12 puzzles per level', () => {
  for (const l of levels) assert.equal(PUZZLE_BANK[l].length, 12, l);
});

for (const level of levels) {
  PUZZLE_BANK[level].forEach((p, n) => {
    test(`${level} #${n}: valid, matches solution, unique`, () => {
      assert.match(p.puzzle, /^[0-9]{81}$/);
      assert.match(p.solution, /^[1-9]{81}$/);
      const puz = parseGrid(p.puzzle);
      const sol = parseGrid(p.solution);
      assert.equal(findConflicts(sol).size, 0, 'solution has no conflicts');
      assert.equal(findConflicts(puz).size, 0, 'puzzle has no conflicts');
      puz.forEach((v, i) => { if (v) assert.equal(v, sol[i], `given ${i} matches solution`); });
      assert.equal(countSolutions(puz, 2), 1, 'exactly one solution');
    });
  });
}

test('difficulty ordering: fewer clues at harder levels', () => {
  const clues = (l) => PUZZLE_BANK[l][0].puzzle.replaceAll('0', '').length;
  assert.ok(clues('easy') > clues('medium') && clues('medium') > clues('hard'));
});

test('puzzles are distinct', () => {
  const all = levels.flatMap((l) => PUZZLE_BANK[l].map((p) => p.puzzle));
  assert.equal(new Set(all).size, all.length);
});

test('findConflicts flags duplicates in row, column and box', () => {
  const g = Array(81).fill(0);
  g[0] = 5; g[8] = 5;
  assert.deepEqual([...findConflicts(g)].sort((a, b) => a - b), [0, 8]);
  const h = Array(81).fill(0);
  h[0] = 3; h[10] = 3;
  assert.equal(findConflicts(h).size, 2);
  const k = Array(81).fill(0);
  k[0] = 2; k[72] = 2;
  assert.equal(findConflicts(k).size, 2);
});

test('countSolutions detects multiple solutions', () => {
  assert.equal(countSolutions(Array(81).fill(0), 2), 2);
});

test('remainingCounts and formatTime', () => {
  const g = parseGrid(PUZZLE_BANK.easy[0].solution);
  assert.deepEqual(remainingCounts(g).slice(1), Array(9).fill(0));
  assert.equal(formatTime(754), '12:34');
});

test('reducer: wrong placement counts a mistake, undo restores', () => {
  let s = newState('easy', 0);
  const cell = s.givens.indexOf(0);
  const right = s.solution[cell] ?? 1;
  const wrong = right === 9 ? 1 : right + 1;
  s = reducer(s, { type: 'select', cell });
  s = reducer(s, { type: 'digit', digit: wrong });
  assert.equal(s.values[cell], wrong);
  assert.equal(s.mistakes, 1);
  s = reducer(s, { type: 'undo' });
  assert.equal(s.values[cell], 0);
  assert.equal(s.mistakes, 0);
});

test('reducer: givens immutable; notes toggle and prune on placement', () => {
  let s = newState('easy', 0);
  const given = s.givens.findIndex((v) => v !== 0);
  s = reducer(reducer(s, { type: 'select', cell: given }), { type: 'digit', digit: 1 });
  assert.equal(s.values[given], s.givens[given]);
  const cell = s.givens.indexOf(0);
  const peer = s.givens.findIndex((v, i) => v === 0 && i !== cell && Math.floor(i / 9) === Math.floor(cell / 9));
  const d = s.solution[cell] ?? 1;
  s = reducer(s, { type: 'toggleNotes' });
  s = reducer(reducer(s, { type: 'select', cell: peer }), { type: 'digit', digit: d });
  assert.equal((s.notes[peer] ?? 0) & (1 << (d - 1)), 1 << (d - 1));
  s = reducer(s, { type: 'toggleNotes' });
  s = reducer(reducer(s, { type: 'select', cell }), { type: 'digit', digit: d });
  assert.equal((s.notes[peer] ?? 0) & (1 << (d - 1)), 0, 'peer note pruned');
});

test('reducer: hints solve the puzzle and set won', () => {
  let s = newState('easy', 1);
  while (!s.won) s = reducer(s, { type: 'hint' });
  assert.ok(isSolved(s.values, s.solution));
  assert.ok(s.hints > 0);
});

test('persistence round-trips and rejects junk', () => {
  let s = newState('medium', 3);
  const cell = s.givens.indexOf(0);
  s = reducer(reducer(s, { type: 'select', cell }), { type: 'digit', digit: s.solution[cell] ?? 1 });
  const back = deserialize(serialize(s));
  assert.ok(back);
  assert.deepEqual(back.values, s.values);
  assert.equal(deserialize('not json'), null);
  assert.equal(deserialize('{"v":1,"d":"easy","i":99,"values":"","notes":[]}'), null);
});
