// Sudoku game state + reducer + persistence.
// Ported verbatim from Seven Midway Plaza's src/lib/sudoku/game.ts (types stripped).

import { PUZZLE_BANK } from './sudoku-bank.js';
import { col, isGridString, isPeer, isSolved, parseGrid, row } from './sudoku-logic.js';

export const bankSize = (d) => PUZZLE_BANK[d].length;

export function newState(difficulty, index) {
  const idx = index % PUZZLE_BANK[difficulty].length;
  const p = PUZZLE_BANK[difficulty][idx] ?? PUZZLE_BANK[difficulty][0];
  if (!p) throw new Error('empty sudoku bank');
  const givens = parseGrid(p.puzzle);
  return {
    difficulty, index: idx, givens, solution: parseGrid(p.solution),
    values: givens, notes: Array(81).fill(0), selected: null, notesMode: false, mistakes: 0, hints: 0, elapsed: 0,
    history: [], won: false, hinted: null,
  };
}

const MAX_HISTORY = 200;
const snap = (s) => ({ values: s.values, notes: s.notes, mistakes: s.mistakes });
const push = (s) => [...s.history.slice(-(MAX_HISTORY - 1)), snap(s)];
const isGiven = (s, i) => s.givens[i] !== 0;

/** Clear digit `d` from the notes of every peer of `cell`. */
function pruneNotes(notes, cell, d) {
  const bit = 1 << (d - 1);
  return notes.map((n, i) => (isPeer(cell, i) ? n & ~bit : n));
}

function place(s, cell, d) {
  const wrong = d !== s.solution[cell];
  const values = s.values.map((v, i) => (i === cell ? d : v));
  const notes = pruneNotes(s.notes.map((n, i) => (i === cell ? 0 : n)), cell, d);
  return { ...s, history: push(s), values, notes, mistakes: s.mistakes + (wrong ? 1 : 0), won: isSolved(values, s.solution) };
}

export function reducer(s, a) {
  switch (a.type) {
    case 'load': return a.state;
    case 'new': return newState(a.difficulty, a.index ?? Math.floor(Math.random() * bankSize(a.difficulty)));
    case 'select': return { ...s, selected: a.cell };
    case 'move': {
      if (s.selected === null) return { ...s, selected: 40 };
      const r = Math.min(8, Math.max(0, row(s.selected) + a.dr));
      const c = Math.min(8, Math.max(0, col(s.selected) + a.dc));
      return { ...s, selected: r * 9 + c };
    }
    case 'toggleNotes': return { ...s, notesMode: !s.notesMode };
    case 'tick': return s.won ? s : { ...s, elapsed: s.elapsed + 1 };
    case 'clearHint': return s.hinted === null ? s : { ...s, hinted: null };
    case 'digit': {
      const c = s.selected;
      if (s.won || c === null || isGiven(s, c)) return s;
      if (s.notesMode) {
        if (s.values[c]) return s;
        const bit = 1 << (a.digit - 1);
        return { ...s, history: push(s), notes: s.notes.map((n, i) => (i === c ? n ^ bit : n)) };
      }
      if (s.values[c] === a.digit) return s;
      return place(s, c, a.digit);
    }
    case 'erase': {
      const c = s.selected;
      if (s.won || c === null || isGiven(s, c) || (!s.values[c] && !s.notes[c])) return s;
      return {
        ...s, history: push(s),
        values: s.values.map((v, i) => (i === c ? 0 : v)),
        notes: s.notes.map((n, i) => (i === c ? 0 : n)),
      };
    }
    case 'undo': {
      const last = s.history[s.history.length - 1];
      if (!last || s.won) return s;
      return { ...s, values: last.values, notes: last.notes, mistakes: last.mistakes, history: s.history.slice(0, -1) };
    }
    case 'hint': {
      if (s.won) return s;
      // Prefer the selected cell when it is open or wrong; otherwise the first open/wrong cell.
      const open = (i) => !isGiven(s, i) && s.values[i] !== s.solution[i];
      const target = s.selected !== null && open(s.selected) ? s.selected : s.values.findIndex((_, i) => open(i));
      if (target < 0) return s;
      const d = s.solution[target] ?? 0;
      const values = s.values.map((v, i) => (i === target ? d : v));
      const notes = pruneNotes(s.notes.map((n, i) => (i === target ? 0 : n)), target, d);
      return { ...s, history: push(s), values, notes, selected: target, hints: s.hints + 1, hinted: target, won: isSolved(values, s.solution) };
    }
    default: return s;
  }
}

// ---- persistence (callers wrap localStorage in try/catch; bad data degrades to a fresh game) ----
export const STORAGE_KEY = 'oneten-sudoku-v1';

export function serialize(s) {
  const saved = { v: 1, d: s.difficulty, i: s.index, values: s.values.join(''), notes: [...s.notes], mistakes: s.mistakes, hints: s.hints, elapsed: s.elapsed };
  return JSON.stringify(saved);
}

export function deserialize(raw) {
  try {
    const o = JSON.parse(raw);
    if (o.v !== 1 || !o.d || !(o.d in PUZZLE_BANK) || typeof o.i !== 'number' || typeof o.values !== 'string' || !isGridString(o.values)) return null;
    if (!Array.isArray(o.notes) || o.notes.length !== 81 || !o.notes.every((n) => Number.isInteger(n) && n >= 0 && n < 512)) return null;
    if (o.i < 0 || o.i >= PUZZLE_BANK[o.d].length) return null;
    const base = newState(o.d, o.i);
    const values = parseGrid(o.values);
    if (!base.givens.every((g, i) => g === 0 || g === values[i])) return null;
    const num = (n) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
    return { ...base, values, notes: o.notes, mistakes: num(o.mistakes), hints: num(o.hints), elapsed: num(o.elapsed), won: isSolved(values, base.solution) };
  } catch {
    return null;
  }
}
