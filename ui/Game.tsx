'use client';

import { useCallback, useEffect, useState } from 'react';
import { verdict } from '../engine/legacy';
import { migrate } from '../engine/migrate';
import { applyAction, newGame } from '../engine/reduce';
import type { Action, GameState, Setup } from '../engine/types';
import { Desk } from './Desk';
import { ElectionNight } from './Election';
import { Papers } from './Paper';
import { SetupScreen, Title } from './Setup';
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

  const start = (setup: Setup) => { setState(newGame(setup)); setScreen('play'); };

  const finish = () => {
    if (!state) return;
    const v = verdict(state);
    const rec: HistoryRecord = { name: state.president.name, party: state.president.partyShort, years: v.years, epithet: v.epithet, ending: v.endingLine };
    const next = [rec, ...history].slice(0, 20);
    setHistory(next);
    try { localStorage.setItem(HISTORY, JSON.stringify(next)); } catch { /* ignore */ }
    setState(null);
    setScreen('title');
  };

  if (!ready) return <p className="label p-8 text-mute">Consultations are ongoing…</p>;
  if (screen === 'setup') return <SetupScreen onStart={start} onBack={() => setScreen('title')} />;
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
  if (state.phase === 'verdict') return <VerdictScreen s={state} onDone={finish} />;
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
