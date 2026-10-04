'use client';

import { FINANCE_CANDIDATES } from '../content/names';
import { useCallback, useEffect, useState } from 'react';
import { verdict } from '../engine/legacy';
import { migrate } from '../engine/migrate';
import { applyAction, newGame } from '../engine/reduce';
import type { Action, GameState, Setup } from '../engine/types';
import { Desk } from './Desk';
import { ElectionNight } from './Election';
import { Papers } from './Paper';
import { handoverNotes, winnerOf } from '../engine/succession';
import { SetupScreen, Title, type Handover } from './Setup';
import { VerdictScreen } from './Verdict';

// One key from here on. Saves are brought forward by engine/migrate.ts, not abandoned.
const SAVE = 'oatt.save';
const OLD_SAVES = ['oatt.save.v5'];
const HISTORY = 'oatt.history.v1';

export interface HistoryRecord { name: string; party: string; years: string; epithet: string; ending: string }

function loadHistory(): HistoryRecord[] {
  try { return JSON.parse(localStorage.getItem(HISTORY) ?? '[]'); } catch { return []; }
}

export function Game() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<'title' | 'setup' | 'play'>('title');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  /** The finished presidency whose country the next President inherits. */
  const [previous, setPrevious] = useState<GameState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE) ?? OLD_SAVES.map((k) => localStorage.getItem(k)).find(Boolean);
      if (raw) {
        const s = migrate(JSON.parse(raw));
        if (s) setState(s);
      }
    } catch { /* a corrupt save is treated as no save */ }
    setHistory(loadHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (state) localStorage.setItem(SAVE, JSON.stringify(state));
      else localStorage.removeItem(SAVE);
    } catch { /* storage may be unavailable; the game still plays */ }
  }, [state, ready]);

  const dispatch = useCallback((a: Action) => setState((s) => (s ? applyAction(s, a) : s)), []);

  const start = (setup: Setup) => { setState(newGame(setup, previous ?? undefined)); setPrevious(null); setScreen('play'); };

  const remember = (s: GameState) => {
    const v = verdict(s);
    const rec: HistoryRecord = { name: s.president.name, party: s.president.partyShort, years: v.years, epithet: v.epithet, ending: v.endingLine };
    const next = [rec, ...history].slice(0, 20);
    setHistory(next);
    try { localStorage.setItem(HISTORY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const finish = () => {
    if (!state) return;
    remember(state);
    setState(null);
    setScreen('title');
  };

  /** The world carries on: the player becomes whoever won. */
  const succeedNow = () => {
    if (!state) return;
    remember(state);
    setPrevious(state);
    setScreen('setup');
  };

  const handover: Handover | undefined = previous ? (() => {
    const w = winnerOf(previous);
    return { party: w.party, partyShort: w.partyShort, sameParty: w.sameParty, how: w.how, notes: handoverNotes(previous), predecessor: previous.president.name, epithet: verdict(previous).epithet, served: [previous.chars.fin?.name, FINANCE_CANDIDATES[['gwarzo', 'ekpenyong', 'lohor'].indexOf(String(previous.flags['fin.pick']))]?.name].filter((x): x is string => !!x) };
  })() : undefined;

  if (!ready) return <p className="label p-8 text-mute">Consultations are ongoing…</p>;
  if (screen === 'setup') return <SetupScreen onStart={start} handover={handover} onBack={() => { setPrevious(null); if (previous) setState(null); setScreen('title'); }} />;
  if (screen === 'title' || !state) {
    return (
      <Title
        canContinue={!!state}
        history={history}
        onContinue={() => setScreen('play')}
        onNew={() => setScreen('setup')}
      />
    );
  }
  if (state.phase === 'verdict') return <VerdictScreen s={state} onDone={finish} onSucceed={succeedNow} />;
  if (state.phase === 'election' && state.election) {
    return <ElectionNight s={state} onDone={() => dispatch({ type: 'ELECTION_DONE' })} />;
  }
  return (
    <>
      <Desk s={state} dispatch={dispatch} onQuit={() => setScreen('title')} />
      {state.phase === 'papers' && state.papers.length > 0 && (
        <Papers pages={state.papers} onDismiss={() => dispatch({ type: 'DISMISS_PAPER' })} />
      )}
    </>
  );
}
