// The Finance Minister's oil forecast. What the budget is built on is a range
// from a named person: how far off it is depends on their competence, and which
// way it leans depends on whose interests they serve (more oil money on paper
// means more to spend). Each forecast is recorded and checked against what oil
// actually did, so the player can learn how far to trust it.

import { adviser } from './advice';
import type { GameState } from './types';
import { clamp } from './vars';

function hash(t: string): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return (Math.abs(h) % 10000) / 10000;
}

/** Where oil would average over the next year if nothing surprising happened: the price drifts towards the path. */
export function trueOutlook(s: GameState): { mid: number; low: number; high: number } {
  let p = s.oil.price;
  let sum = 0;
  for (let t = s.turn + 1; t <= s.turn + 12; t++) {
    const level = s.oil.path?.find(([until]) => t <= until)?.[1] ?? 72;
    p += (level - p) * 0.07;
    sum += p;
  }
  const mid = sum / 12;
  return { mid, low: mid - 10, high: mid + 10 };
}

export interface OilForecast { mid: number; low: number; high: number; by: string; title: string; note: string; record: string | null }

export function oilForecast(s: GameState): OilForecast {
  const t = trueOutlook(s);
  const a = adviser(s, 'fin');
  if (!a) return { ...t, by: 'The Budget Office', title: '', note: '', record: null };
  const year = Math.floor((s.turn - 1) / 12);
  // Competence sets how far off it can be; the error is fixed for the year, so asking again does not change it.
  const council = s.agenda.done.includes('t6') ? 0.5 : 1;
  const err = (hash(`oil.${year}.${a.name}`) - 0.5) * 2 * Math.max(1, 5 - a.competence) * 4 * council;
  // A minister close to a camp sincerely expects good times: a higher figure means more to spend, including on the camp's projects.
  const lean = council < 1 ? 0 : a.patron !== 'president' ? 4 : a.integrity <= 2 ? 3 : 0;
  const mid = clamp(t.mid + err + lean, 35, 125);
  const width = 8 + Math.max(0, 4 - a.competence) * 3;
  const note = council < 1 ? 'Checked by the Fiscal Council.' : a.competence >= 4 ? 'A careful forecast.' : a.competence <= 2 ? 'The working papers are thin.' : 'An ordinary forecast.';
  return { mid: Math.round(mid), low: Math.round(mid - width), high: Math.round(mid + width), by: a.name, title: a.title, note, record: recordLine(s) };
}

/** Called when a budget is signed: the forecast is written down, to be checked a year later. */
export function logOilForecast(s: GameState): void {
  const f = oilForecast(s);
  (s.oilForecasts ??= []).push({ turn: s.turn, said: f.mid, by: f.by, sum: 0, n: 0 });
  if (s.oilForecasts.length > 8) s.oilForecasts = s.oilForecasts.slice(-8);
}

/** Every month: the open forecasts collect the price oil actually sold at. */
export function oilForecastTick(s: GameState): void {
  for (const f of s.oilForecasts ?? []) {
    if (f.n >= 12) continue;
    f.sum += s.oil.price;
    f.n += 1;
  }
}

function recordLine(s: GameState): string | null {
  const done = (s.oilForecasts ?? []).filter((f) => f.n >= 12);
  if (!done.length) return null;
  const parts = done.slice(-3).map((f) => {
    const actual = f.sum / f.n;
    const miss = Math.round(actual - f.said);
    return `${f.by.split(' ').slice(-1)[0]} said $${f.said}; it averaged $${Math.round(actual)} (${miss === 0 ? 'on the mark' : `${Math.abs(miss)} ${miss > 0 ? 'under' : 'over'}`})`;
  });
  return parts.join(' · ');
}
