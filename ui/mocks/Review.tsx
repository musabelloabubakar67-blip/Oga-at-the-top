'use client';

// COMMITMENT REVIEW (mock for R4)
// The register already shows commitments falling due (contract 1.0.0 marks them
// "review due" and gives no verdict). R4 asks for the verdict: met, missed,
// withheld (the government did not release what the work needed) or disputed,
// with the government's own contribution to any failure stated in figures. The
// example is the real commitment from the doctors' strike file.

import { useState } from 'react';
import type { Fx } from '../../engine/types';
import { Choice, Effects, MockFrame } from './Mock';

type Verdict = 'met' | 'missed' | 'withheld' | 'disputed';

const COMMITMENT = {
  text: 'Pay the remaining ₦19bn of the resident doctors\' allowances within three months.',
  responsible: 'The Minister of Finance',
  origin: 'Agreed to end the doctors\' strike (public).',
  due: 'Due this month',
  evidence: [
    { source: 'Office of the Accountant-General', says: '₦11bn paid to 14,200 doctors by the due date.' },
    { source: 'Association of Resident Physicians', says: 'Members in nine states report receiving nothing.' },
    { source: 'Budget Office', says: '₦8bn of the ₦19bn was not released from the supplementary allocation.' },
  ],
  contribution: 'The government itself withheld ₦8bn of the ₦19bn it allocated. The Minister paid what was released.',
};

const VERDICTS: Record<Verdict, { label: string; reading: string; fx: Fx[]; next: string }> = {
  met: { label: 'Met', reading: 'Only if the remaining ₦8bn is paid now. Declared met without it, the union will publish the nine states.', fx: [['pressure.wageGrievance', -6], ['bloc.street', 2]], next: 'Closes the commitment. The union\'s next demand starts from trust.' },
  missed: { label: 'Missed, by the Minister', reading: 'The record says the Minister paid everything released. Blaming the Minister for the government\'s own withholding is visible in the Budget Office figures.', fx: [['pressure.wageGrievance', 8], ['bloc.street', -2]], next: 'A strike notice within the quarter; the Minister\'s standing falls with the doctors and rises with nobody.' },
  withheld: { label: 'Withheld, by the government', reading: 'The honest verdict: the work was done with the money given, and the money given was short.', fx: [['pressure.wageGrievance', 3], ['nation.integrity', 1]], next: 'The commitment stays open with a new date and the ₦8bn named. The union accepts a date it can check.' },
  disputed: { label: 'Disputed', reading: 'The union and the Accountant-General disagree on who was paid. An independent audit of the payroll settles it in two months.', fx: [['pc', -2]], next: 'The commitment is paused, not closed. The audit becomes evidence for the next review (plan 08).' },
};

export function ReviewMock() {
  const [v, setV] = useState<Verdict | null>(null);
  return (
    <MockFrame id="review" contract="R4 (commitment verdicts)" title="A promise falls due"
      purpose="The review shows what was promised, who was responsible, what the evidence says from more than one source, and how much of any failure was the government's own doing, before a verdict is entered.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="text-[13px] leading-snug">
          <p className="font-serif text-lg leading-snug">{COMMITMENT.text}</p>
          <p className="text-ink-soft">{COMMITMENT.responsible} · {COMMITMENT.origin} · {COMMITMENT.due}</p>
          <p className="label mt-3 text-ink-soft">The evidence</p>
          <ul className="mt-1 space-y-1">{COMMITMENT.evidence.map((e) => <li key={e.source}><span className="text-ink-soft">{e.source}:</span> {e.says}</li>)}</ul>
          <p className="mt-3 border-l-2 border-honour pl-2"><span className="label mr-1 text-honour">{'The government\'s part'}</span>{COMMITMENT.contribution}</p>
        </div>
        <div>
          <p className="label text-ink-soft">Enter a verdict</p>
          <div className="mt-1 flex flex-wrap gap-2">{(Object.keys(VERDICTS) as Verdict[]).map((k) => <Choice key={k} active={v === k} on={() => setV(k)}>{VERDICTS[k].label}</Choice>)}</div>
          {v && (
            <div className="mt-2 space-y-1 border-l-2 border-state pl-2 text-[13px] leading-snug">
              <p>{VERDICTS[v].reading}</p>
              <Effects fx={VERDICTS[v].fx} />
              <p className="text-ink-soft">{VERDICTS[v].next}</p>
            </div>
          )}
        </div>
      </div>
    </MockFrame>
  );
}
