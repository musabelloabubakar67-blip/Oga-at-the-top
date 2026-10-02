'use client';

import { NAMES } from '../content/names';
import { dateLabel } from '../engine/config';
import type { FrontPage } from '../engine/types';

export function Paper({ page, onDismiss }: { page: FrontPage; onDismiss: () => void }) {
  const chronicle = page.outlet === 'chronicle';
  return (
    <div className="fade-in fixed inset-0 z-40 overflow-y-auto bg-pit/85 px-3 py-6 sm:py-10" role="dialog" aria-label="This month's front page">
      <article className={`paper slide-in mx-auto max-w-3xl p-5 sm:p-9 ${chronicle ? '' : 'bg-white'}`}>
        <header className="border-b-4 border-double border-ink pb-3 text-center">
          {chronicle ? (
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{NAMES.CHRONICLE}</h1>
          ) : (
            <h1 className="font-sans text-4xl font-black uppercase italic tracking-tighter text-alarm sm:text-5xl">{NAMES.STREET}</h1>
          )}
          <p className="label mt-2 flex justify-between text-ink-soft">
            <span>{dateLabel(page.turn)}</span>
            <span>{page.special ?? (chronicle ? 'Abuja edition' : 'No long thing')}</span>
            <span>Vol. {30 + Math.floor(page.turn / 12)} · No. {page.turn}</span>
          </p>
        </header>

        <h2 className={chronicle
          ? 'mt-6 font-serif text-3xl uppercase leading-tight sm:text-[2.6rem] sm:leading-[1.08]'
          : 'mt-6 font-sans text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl'}>
          {page.lead}
        </h2>
        {page.body ? (
          <p className="mt-3 font-serif text-lg leading-relaxed">{page.body} <span className="text-ink-soft">{page.standfirst}</span></p>
        ) : (
          <p className="mt-3 font-serif text-lg leading-snug text-ink-soft">{page.standfirst}</p>
        )}
        {page.quotes && page.quotes.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.quotes.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-ink/40 pl-3">
                <p className="font-serif italic leading-snug">“{q.line}”</p>
                <p className="label mt-1 text-ink-soft">{q.who} · {q.role}</p>
              </blockquote>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 border-t rule pt-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            {page.others.map((h, i) => (
              <p key={i} className={`${i ? 'mt-4 border-t rule pt-4' : ''} ${chronicle ? 'font-serif text-xl uppercase leading-snug' : 'font-sans text-lg font-extrabold uppercase leading-tight'}`}>
                {h}
              </p>
            ))}
          </div>
          <aside className="border-ink/20 sm:border-l sm:pl-5">
            {page.figures ? (
              <>
                <p className="label text-ink-soft">The month in figures</p>
                <ul className="mt-1 space-y-0.5">
                  {page.figures.map((f) => (
                    <li key={f.label} className="flex items-baseline justify-between font-serif">
                      <span className="text-sm text-ink-soft">{f.label}</span>
                      <span>{f.value} <span className={f.dir === 0 ? 'text-ink-soft' : (f.dir > 0) === f.good ? 'text-state' : 'text-alarm'}>{f.dir > 0 ? '▲' : f.dir < 0 ? '▼' : '·'}</span></span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="label text-ink-soft">{page.number.label}</p>
                <p className="font-serif text-4xl">{page.number.value}</p>
              </>
            )}
            <p className="label mt-5 text-alarm">{page.sidebar.kicker}</p>
            <p className="mt-1 font-serif text-[15px] leading-snug">{page.sidebar.text}</p>
          </aside>
        </div>

        {page.editorial && (
          <p className="mt-6 border-t rule pt-4 font-serif leading-relaxed">
            <span className="label mr-2 text-ink-soft">{chronicle ? 'Editorial' : 'Our own'}</span>{page.editorial}
          </p>
        )}

        <div className="mt-8 text-right">
          <button onClick={onDismiss} autoFocus className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">
            Put the paper down
          </button>
        </div>
      </article>
    </div>
  );
}
