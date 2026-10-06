'use client';

// DESIGN MOCKS (plan: interface preparation while engine contracts are pending)
// One page, never linked from the game, showing how the screens that wait on
// engine contracts will work. Each mock uses the real authored content where it
// exists and simulates only the missing engine behaviour, in local state. When a
// contract lands, its mock is replaced by the real screen inside the game and
// removed from this page.

import { ApproachMock } from './Approach';
import { RequestsMock } from './Requests';
import { ReviewMock } from './Review';
import { TransitionMock } from './Transition';

const INDEX: [string, string, string][] = [
  ['transition', 'Transition and the first team', 'R6, R5'],
  ['requests', 'Requests and favours', 'R3'],
  ['review', 'A commitment review', 'R4'],
  ['approach', 'Approaching someone exceptional', 'R5'],
];

export function Mocks() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-ink">
      <header className="paper p-5 xl:p-8">
        <p className="label text-alarm">Not part of the game</p>
        <h1 className="mt-1 font-serif text-4xl">Oga at the Top · design mocks</h1>
        <p className="mt-2 max-w-prose text-[14px] text-ink-soft">Screens that wait on engine contracts, shown with the real characters, terms and dossiers. Choices here change nothing anywhere. Each one names the contract it waits on.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {INDEX.map(([id, title, contract]) => <li key={id}><a href={`#${id}`} className="label border border-ink/20 px-2 py-1 hover:border-state">{title} · {contract}</a></li>)}
        </ul>
      </header>
      <TransitionMock />
      <RequestsMock />
      <ReviewMock />
      <ApproachMock />
    </main>
  );
}
