'use client';

import { useState } from 'react';
import { OUTLETS } from '../content/press';
import { dateLabel } from '../engine/config';
import type { FrontPage } from '../engine/types';

const HEAD: Record<FrontPage['outlet'], { mast: string; lead: string; other: string; bg: string }> = {
  chronicle: {
    mast: 'font-serif text-3xl tracking-tight sm:text-4xl',
    lead: 'font-serif text-2xl uppercase leading-tight sm:text-[2rem] sm:leading-[1.1]',
    other: 'font-serif text-lg uppercase leading-snug', bg: '',
  },
  street: {
    mast: 'font-sans text-3xl font-black uppercase italic tracking-tighter text-alarm sm:text-4xl',
    lead: 'font-sans text-2xl font-black uppercase leading-none tracking-tight sm:text-4xl',
    other: 'font-sans text-base font-extrabold uppercase leading-tight', bg: 'bg-white',
  },
  stakeholder: {
    mast: 'font-serif text-3xl font-bold italic text-state sm:text-4xl',
    lead: 'font-serif text-2xl font-bold leading-tight sm:text-[2rem] sm:leading-[1.1]',
    other: 'font-serif text-lg font-bold leading-snug', bg: 'bg-[#f6f1e4]',
  },
  rejoinder: {
    mast: 'font-sans text-3xl font-black uppercase tracking-tight sm:text-4xl',
    lead: 'font-sans text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-[2rem] sm:leading-[1.08]',
    other: 'font-sans text-base font-bold uppercase leading-tight', bg: 'bg-[#ece7dc]',
  },
};

function Page({ page }: { page: FrontPage }) {
  const o = OUTLETS[page.outlet];
  const h = HEAD[page.outlet];
  const tone = page.stance === 'loyal' ? 'text-state' : page.stance === 'hostile' ? 'text-alarm' : 'text-ink-soft';
  return (
    <article className={`paper flex h-full flex-col p-5 sm:p-7 ${h.bg}`}>
      <header className="border-b-4 border-double border-ink pb-3 text-center">
        <h1 className={h.mast}>{o.name}</h1>
        <p className="label mt-2 flex justify-between gap-2 text-ink-soft">
          <span>{dateLabel(page.turn)}</span>
          <span>{page.special ?? o.tagline}</span>
          <span>No. {page.turn}</span>
        </p>
        {page.owner && <p className={`label mt-1 ${tone}`}>{page.owner}</p>}
      </header>

      {(page.strap || page.series) && (
        <p className={`label mt-5 ${tone}`}>{[page.series, page.strap].filter(Boolean).join(' · ')}</p>
      )}
      <h2 className={`${page.strap || page.series ? 'mt-1.5' : 'mt-5'} ${h.lead}`}>{page.lead}</h2>
      {page.fact && (
        <p className="mt-2 border-l-2 border-ink/30 pl-2 text-[13px] leading-snug text-ink-soft"><span className="label mr-1.5">What happened</span>{page.fact}</p>
      )}
      {(page.body || page.standfirst) && (
        <p className="mt-3 font-serif text-[17px] leading-relaxed">
          {page.body} {page.standfirst && <span className={page.body ? 'text-ink-soft' : ''}>{page.standfirst}</span>}
        </p>
      )}
      {page.quotes && page.quotes.length > 0 && (
        <div className="mt-4 space-y-3">
          {page.quotes.map((q, i) => (
            <blockquote key={i} className="border-l-2 border-ink/40 pl-3">
              <p className="font-serif italic leading-snug">“{q.line}”</p>
              <p className="label mt-1 text-ink-soft">{q.who} · {q.role}</p>
            </blockquote>
          ))}
        </div>
      )}

      <div className="mt-5 border-t rule pt-4">
        {page.others.map((x, i) => (
          <p key={i} className={`${i ? 'mt-3 border-t rule pt-3' : ''} ${h.other}`}>{x}</p>
        ))}
      </div>

      {(page.figures || page.sidebar) && (
        <aside className="mt-5 grid gap-4 border-t rule pt-4 sm:grid-cols-2">
          {page.figures && (
            <div>
              <p className="label text-ink-soft">The month in figures</p>
              <ul className="mt-1 space-y-0.5">
                {page.figures.map((f) => (
                  <li key={f.label} className="flex items-baseline justify-between font-serif">
                    <span className="text-sm text-ink-soft">{f.label}</span>
                    <span>{f.value} <span className={f.dir === 0 ? 'text-ink-soft' : (f.dir > 0) === f.good ? 'text-state' : 'text-alarm'}>{f.dir > 0 ? '▲' : f.dir < 0 ? '▼' : '·'}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.sidebar && (
            <div>
              <p className="label text-alarm">{page.sidebar.kicker}</p>
              <p className="mt-1 font-serif text-[15px] leading-snug">{page.sidebar.text}</p>
            </div>
          )}
        </aside>
      )}

      {page.editorial && (
        <p className="mt-5 border-t rule pt-4 font-serif leading-relaxed">
          <span className="label mr-2 text-ink-soft">{page.outlet === 'street' ? 'Our own' : 'Editorial'}</span>{page.editorial}
        </p>
      )}
      <p className="mt-auto pt-5 text-[12px] leading-snug text-ink-soft">{o.note}</p>
    </article>
  );
}

/** The morning's papers: two of them, on the same story. */
export function Papers({ pages, onDismiss }: { pages: FrontPage[]; onDismiss: () => void }) {
  const [show, setShow] = useState(0);
  if (!pages.length) return null;
  return (
    <div className="fade-in fixed inset-0 z-40 overflow-y-auto bg-pit/85 px-3 py-6 sm:py-10" role="dialog" aria-label="This month's front pages">
      <div className="slide-in mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="label text-ivory/80">The papers on your desk this morning{pages.length > 1 ? ': two, on the same story' : ''}</p>
          {pages.length > 1 && (
            <div className="flex gap-2 lg:hidden">
              {pages.map((p, i) => (
                <button key={p.outlet} onClick={() => setShow(i)} className={`label border px-2 py-1 ${show === i ? 'border-honour text-honour' : 'border-ivory/20 text-ivory/70'}`}>{OUTLETS[p.outlet].name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          {pages.map((p, i) => (
            <div key={p.outlet} className={i === show ? '' : 'hidden lg:block'}><Page page={p} /></div>
          ))}
        </div>
        <div className="mt-5 text-right">
          <button onClick={onDismiss} autoFocus className="bg-paper px-5 py-2.5 font-serif text-ink hover:bg-white">Put the papers down</button>
        </div>
      </div>
    </div>
  );
}
