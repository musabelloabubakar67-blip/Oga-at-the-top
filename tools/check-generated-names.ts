import assert from 'node:assert/strict';
import { BLOCKED_NAMES, NAMES_BY_ZONE } from '../content/talent';
import { NOMINEES } from '../content/courts';
import { chooseGeneratedName, type NameBank } from '../engine/generated-names';
import { courtTick, bench } from '../engine/courts';
import { talent } from '../engine/talent';
import { newGame } from '../engine/reduce';
import { FINANCE_CANDIDATES } from '../content/names';

export function runGeneratedNameChecks(): number {
  let passed = 0;
  const check = (label: string, test: () => void) => { test(); passed++; process.stdout.write('PASS ' + label + '\n'); };
  const bank: NameBank = { zone: 'SE', firsts: NAMES_BY_ZONE.SE.m, lasts: NAMES_BY_ZONE.SE.last, titles: ['Dr'] };
  check('blocked random draws fall back deterministically without more dice', () => {
    let draws = 0;
    const draw = () => { draws++; return { first: 'Chinedu', last: 'Okeke', title: 'Dr', zone: 'SE' as const }; };
    const a = chooseGeneratedName(draw, [bank], new Set(), 6);
    assert.equal(draws, 6); assert.equal(BLOCKED_NAMES.has(a.first + ' ' + a.last), false);
    assert.deepEqual(chooseGeneratedName(draw, [bank], new Set(), 6), a);
  });
  check('fallback skips used names and can cross an exhausted zone while retaining its true zone', () => {
    const a: NameBank = { zone: 'SE', firsts: ['Chinedu'], lasts: ['Okeke'], titles: ['Dr'] };
    const b: NameBank = { zone: 'NW', firsts: ['Safe'], lasts: ['First', 'Second'], titles: ['Dr'] };
    const n = chooseGeneratedName(() => ({ first: 'Chinedu', last: 'Okeke', title: 'Dr', zone: 'SE' }), [a, b], new Set(['Dr Safe First']), 6);
    assert.deepEqual(n, { first: 'Safe', last: 'Second', title: 'Dr', zone: 'NW' });
  });
  check('an exhausted name bank fails explicitly instead of accepting a blocked or duplicate pair', () => {
    const blocked: NameBank = { zone: 'SE', firsts: ['Chinedu'], lasts: ['Okeke'], titles: ['Justice'] };
    assert.throws(() => chooseGeneratedName(() => ({ first: 'Chinedu', last: 'Okeke', title: 'Justice', zone: 'SE' }), [blocked], new Set(), 7), /No unused, unblocked/);
  });
  const base = newGame({ seed: 42, name: 'Tester', party: 'PSC', partyShort: 'PSC', home: 'KN', background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] });
  check('256 real talent pools contain no blocked generated pair and preserve game dice', () => {
    for (let seed = 1; seed <= 256; seed++) {
      const s = structuredClone(base); s.seed = seed; delete s.talent;
      const rng = s.rng, pool = talent(s).pool.filter((c) => /^c\d+$/.test(c.id));
      assert.equal(s.rng, rng);
      for (const c of pool) assert.equal([...BLOCKED_NAMES].some((n) => c.name.endsWith(' ' + n)), false, c.name);
      const copy = structuredClone(s); delete copy.talent;
      assert.deepEqual(talent(copy).pool, talent(s).pool);
    }
  });
  check('256 replenished court pools contain no blocked nominee pair', () => {
    for (let seed = 1; seed <= 256; seed++) {
      const s = structuredClone(base); s.seed = seed;
      s.bench = structuredClone(bench(s)); s.bench.spent = NOMINEES.map((n) => n.name); s.bench.extra = []; s.bench.seq = 0;
      const copy = structuredClone(s); courtTick(s); courtTick(copy);
      assert.deepEqual(s.bench.extra, copy.bench!.extra); assert.ok(s.bench.extra!.length >= 5);
      for (const n of s.bench.extra!) assert.equal(BLOCKED_NAMES.has(n.name.slice('Justice '.length)), false, n.name);
    }
  });
  check('existing saved generated names are not rerolled by reading the talent pool', () => {
    const s = structuredClone(base), c = talent(s).pool.find((c) => /^c\d+$/.test(c.id))!;
    c.name = 'Dr Chinedu Okeke'; const before = structuredClone(s.talent);
    talent(s); assert.deepEqual(s.talent, before);
  });
  return passed;
}
