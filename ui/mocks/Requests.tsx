'use client';

// REQUESTS AND FAVOURS (mock for R3)
// A request is a specific thing a specific person wants, with terms. Once
// answered it closes; it can come back only as a new request with something
// materially changed (a better offer, an appeal, a threat, a coalition, new
// evidence). Favours are a ledger in both directions, each with the uses it can
// be put to and why a use is or is not available. The example is the one in
// CONTRACT-REQUESTS.md: Governor Koroye and the dredging contract.

import { useState } from 'react';
import { PERSON_BY_ID } from '../../content/people';
import { TYCOON_BY_ID } from '../../content/tycoons';
import type { Fx } from '../../engine/types';
import { Choice, Effects, MockFrame } from './Mock';

type Answer = 'grant' | 'refuse' | 'substitute' | 'defer';
interface MockRequest { id: string; from: string; object: string; terms: string; changedBy?: string; options: Record<Answer, { label: string; result: string; fx: Fx[] }> }

const FIRST: MockRequest = {
  id: 'req.dredging.1', from: 'gov_ss',
  object: 'The Port Harcourt channel dredging contract, for a named firm',
  terms: 'Awarded without tender to Sure-Depth Dredging Limited, at the price in its letter.',
  options: {
    grant: { label: 'Award it as asked', result: 'The contract is signed. Koroye is grateful in the way that lasts until the next request.', fx: [['person.gov_ss', 10], ['nation.integrity', -2], ['pressure.scandalHeat', 3]] },
    refuse: { label: 'Refuse: it goes to open tender', result: 'Koroye is told no. The request is closed. The tender is advertised the same week.', fx: [['person.gov_ss', -8], ['nation.integrity', 1]] },
    substitute: { label: 'Offer something else: the firm may bid, and the state gets the jetty project', result: 'Koroye takes the jetty and lets the firm bid. A smaller thing, given willingly, is worth something.', fx: [['person.gov_ss', 3], ['nation.fiscalSpace', -0.05]] },
    defer: { label: 'Ask for time', result: 'The request stays open and grows heavier. Deferring is an answer; it is just not a final one.', fx: [['person.gov_ss', -2]] },
  },
};
const SECOND: MockRequest = {
  id: 'req.dredging.2', from: 'gov_ss', changedBy: 'offer',
  object: 'The same dredging contract',
  terms: 'Sure-Depth Dredging Limited now offers thirty per cent below the engineer\'s estimate, with a performance bond.',
  options: {
    grant: { label: 'Award it at the new price, with the bond', result: 'The contract is signed at the lower price. The engineers check the bond. The tender board notes that a refusal produced a better offer.', fx: [['person.gov_ss', 8], ['nation.fiscalSpace', 0.03]] },
    refuse: { label: 'Refuse again: it still goes to tender', result: 'Koroye takes it as personal, which the second time it is.', fx: [['person.gov_ss', -12], ['nation.integrity', 1]] },
    substitute: { label: 'Let the firm bid at that price in the open tender', result: 'The firm bids at its own price and wins on merit. Everybody can say they were right.', fx: [['person.gov_ss', 4], ['nation.integrity', 1]] },
    defer: { label: 'Ask for time', result: 'Koroye withdraws the offer within the month.', fx: [['person.gov_ss', -4]] },
  },
};

interface Favour { id: string; who: string; direction: 'owed to you' | 'you owe'; strength: 1 | 2 | 3; origin: string; uses: { use: string; ok: boolean; why: string }[] }
const LEDGER: Favour[] = [
  { id: 'fav.1', who: 'gov_ss', direction: 'owed to you', strength: 2, origin: 'You kept the federal road in his state funded through a lean budget.', uses: [{ use: 'Deliver the state\'s delegates at the convention', ok: true, why: 'Strength 2 is enough for a state\'s delegates.' }, { use: 'Support a senator\'s confirmation', ok: false, why: 'He has no senators on the committee.' }] },
  { id: 'fav.2', who: 'ty_bank', direction: 'you owe', strength: 3, origin: 'Paid for the second half of the campaign.', uses: [{ use: 'Settle with a concession she has asked for', ok: true, why: 'Matches her standing demand.' }, { use: 'Forgive', ok: false, why: 'You cannot forgive a debt you owe; only the creditor can.' }] },
  { id: 'fav.3', who: 'sen_approp', direction: 'owed to you', strength: 1, origin: 'A borehole programme in his district, last budget.', uses: [{ use: 'Move a bill out of the Appropriations committee', ok: true, why: 'One bill, once.' }, { use: 'Pass the whole budget unamended', ok: false, why: 'Strength 1 will not carry the budget.' }] },
];

const name = (id: string) => PERSON_BY_ID[id]?.name ?? TYCOON_BY_ID[id]?.name ?? id;

function RequestCard({ req, answer, setAnswer }: { req: MockRequest; answer: Answer | null; setAnswer: (a: Answer) => void }) {
  const chosen = answer ? req.options[answer] : null;
  return (
    <div className="border border-ink/20 p-3">
      <p className="label text-ink-soft">{name(req.from)} asks{req.changedBy ? ` again · changed by: ${req.changedBy}` : ''}</p>
      <p className="mt-1 font-serif text-lg leading-snug">{req.object}</p>
      <p className="text-[13px]">{req.terms}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(req.options) as Answer[]).map((a) => <Choice key={a} active={answer === a} disabled={!!answer && answer !== 'defer'} on={() => setAnswer(a)}>{req.options[a].label}</Choice>)}
      </div>
      {chosen && (
        <div className="mt-2 border-l-2 border-state pl-2 text-[13px]">
          <p>{chosen.result}</p>
          <Effects fx={chosen.fx} />
          <p className="label mt-1 text-ink-soft">Request {answer === 'defer' ? 'still open' : answer === 'substitute' ? 'closed · substituted' : answer === 'grant' ? 'closed · granted' : 'closed · refused'}</p>
        </div>
      )}
    </div>
  );
}

export function RequestsMock() {
  const [first, setFirst] = useState<Answer | null>(null);
  const [second, setSecond] = useState<Answer | null>(null);
  return (
    <MockFrame id="requests" contract="R3 (requests and favours)" title="What people ask for, and what they owe"
      purpose="A request closes when answered and can only come back changed. Favours run both ways, and each use says whether it is available and why.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <RequestCard req={FIRST} answer={first} setAnswer={setFirst} />
          {first === 'refuse' && (
            <>
              <p className="label text-ink-soft">Two months later</p>
              <RequestCard req={SECOND} answer={second} setAnswer={setSecond} />
            </>
          )}
          {first && first !== 'refuse' && <p className="text-[13px] italic text-ink-soft">Refuse the first request to see how a closed request returns as a new one with something changed.</p>}
        </div>
        <div>
          <p className="label text-ink-soft">The ledger</p>
          <ul className="mt-1 space-y-2">
            {LEDGER.map((f) => (
              <li key={f.id} className="border-l-2 border-ink/20 pl-2 text-[13px] leading-snug">
                <p><span className="font-serif text-base">{name(f.who)}</span> · {f.direction} · {'●'.repeat(f.strength)}</p>
                <p className="text-ink-soft">{f.origin}</p>
                <ul className="mt-1 space-y-0.5">
                  {f.uses.map((u) => <li key={u.use}><span className={`label mr-1 ${u.ok ? 'text-state' : 'text-alarm'}`}>{u.ok ? 'Available' : 'Not available'}</span>{u.use}. <span className="text-ink-soft">{u.why}</span></li>)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MockFrame>
  );
}
