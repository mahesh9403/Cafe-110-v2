// Pure Sudoku rules. Ported verbatim from Seven Midway Plaza's src/lib/sudoku/logic.ts
// (TypeScript types stripped; behaviour identical). No DOM, no dependencies.

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const row = (i) => Math.floor(i / 9);
export const col = (i) => i % 9;
export const box = (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
export const isPeer = (a, b) =>
  a !== b && (row(a) === row(b) || col(a) === col(b) || box(a) === box(b));

/** Parse an 81-char digit string ('0' = empty) into numbers. */
export function parseGrid(s) {
  return Array.from(s, (ch) => Number(ch));
}

/** True when the grid string is 81 digits. */
export const isGridString = (s) => /^[0-9]{81}$/.test(s);

/** Cells whose (non-zero) value repeats in their row, column or box. */
export function findConflicts(values) {
  const bad = new Set();
  for (let i = 0; i < 81; i += 1) {
    const v = values[i];
    if (!v) continue;
    for (let j = i + 1; j < 81; j += 1) {
      if (values[j] === v && isPeer(i, j)) { bad.add(i); bad.add(j); }
    }
  }
  return bad;
}

/** Remaining count of each digit 1..9 (index 0 unused): 9 minus placements. May go negative on over-placement. */
export function remainingCounts(values) {
  const left = [0, 9, 9, 9, 9, 9, 9, 9, 9, 9];
  for (const v of values) if (v) left[v] = (left[v] ?? 0) - 1;
  return left;
}

export function isSolved(values, solution) {
  return values.length === 81 && values.every((v, i) => v === solution[i]);
}

/** Count solutions of a grid up to `limit` (backtracking with minimum-remaining-values). */
export function countSolutions(grid, limit = 2) {
  const c = [...grid];
  let n = 0;
  const canPlace = (i, d) => {
    for (let k = 0; k < 81; k += 1) if (c[k] === d && isPeer(i, k)) return false;
    return true;
  };
  const search = () => {
    if (n >= limit) return;
    let best = -1;
    let options = [];
    for (let i = 0; i < 81; i += 1) {
      if (c[i]) continue;
      const o = [];
      for (let d = 1; d <= 9; d += 1) if (canPlace(i, d)) o.push(d);
      if (o.length === 0) return;
      if (best < 0 || o.length < options.length) { best = i; options = o; if (o.length === 1) break; }
    }
    if (best < 0) { n += 1; return; }
    for (const d of options) { c[best] = d; search(); c[best] = 0; if (n >= limit) return; }
  };
  search();
  return n;
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
