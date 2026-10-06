'use client';

// EXCEPTIONAL RECRUITMENT (mock for R5)
// The four exceptional candidates in content/candidates.ts serve only on stated
// terms. Here the President approaches one, accepts or rejects each term, and
// sees the answer: refuse any term and the candidate declines, naming it. Once
// in office, each term becomes something the engine must watch, and breaking
// it has the stated consequence. R5 provides the recruitment states, the
// appointment with accepted terms, breach detection and the capability itself.

import { useState } from 'react';
import { CANDIDATES } from '../../content/candidates';
import { Choice, MockFrame } from './Mock';

const EXCEPTIONAL = CANDIDATES.filter((c) => c.exceptional);

export function ApproachMock() {
  const [id, setId] = useState(EXCEPTIONAL[0]?.id ?? '');
  const [terms, setTerms] = useState<Record<string, boolean>>({});
  const [asked, setAsked] = useState(false);
  const c = EXCEPTIONAL.find((x) => x.id === id);
  if (!c?.exceptional) return null;
  const conditions = c.exceptional.conditions;
  const refused = conditions.filter((k) => terms[k.id] === false);
  const decided = conditions.every((k) => terms[k.id] !== undefined);
  const pick = (next: string) => { setId(next); setTerms({}); setAsked(false); };

  return (
    <MockFrame id="approach" contract="R5 (negotiated appointment)" title="Approaching someone exceptional"
      purpose="Each term is accepted or refused before the answer comes. What the candidate would bring is a proposal until the appointment is made; afterwards every accepted term is watched.">
      <div className="flex flex-wrap gap-2">{EXCEPTIONAL.map((x) => <Choice key={x.id} active={x.id === id} on={() => pick(x.id)}>{x.name}</Choice>)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="text-[13px] leading-snug">
          <p className="font-serif text-lg">{c.name}</p>
          <p className="text-ink-soft">{c.expertise}</p>
          <p className="mt-1 italic">“{c.view}”</p>
          <p className="label mt-3 text-honour">Would bring</p>
          <ul className="mt-1 space-y-0.5">{c.exceptional.capabilities.map((k) => <li key={k.id}>{k.text}</li>)}</ul>
        </div>
        <div>
          <p className="label text-ink-soft">The terms</p>
          <ul className="mt-1 space-y-2">
            {conditions.map((k) => (
              <li key={k.id} className="border-l-2 border-ink/20 pl-2 text-[13px] leading-snug">
                <p>{k.text}</p>
                <p className="text-ink-soft">If broken: {k.breach}</p>
                <div className="mt-1 flex gap-2">
                  <Choice active={terms[k.id] === true} disabled={asked} on={() => setTerms({ ...terms, [k.id]: true })}>Accept</Choice>
                  <Choice active={terms[k.id] === false} disabled={asked} on={() => setTerms({ ...terms, [k.id]: false })}>Refuse</Choice>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Choice disabled={!decided || asked} why={decided ? undefined : 'Answer every term first.'} on={() => setAsked(true)}>Make the approach</Choice>
          </div>
          {asked && (
            <div className="mt-2 border-l-2 border-state pl-2 text-[13px] leading-snug">
              {refused.length > 0
                ? <p><span className="label mr-1 text-alarm">Declined</span>{c.short} thanks you and says no, because of this: “{refused[0].text}” The approach is remembered; a second one needs something to have changed.</p>
                : (
                  <>
                    <p><span className="label mr-1 text-state">Accepted</span>{c.short} takes the post on the terms agreed. The capability is in effect from the swearing-in.</p>
                    <p className="label mt-2 text-ink-soft">Watched from now on</p>
                    {/* The test text names the file it refers to for Codex; the reader needs only the sentence. */}
                    <ul className="mt-1 space-y-0.5">{conditions.map((k) => <li key={k.id}>{k.test.replace(/\s*\((as in|e\.g\.)[^)]*\)/g, '')}</li>)}</ul>
                  </>
                )}
            </div>
          )}
        </div>
      </div>
    </MockFrame>
  );
}
