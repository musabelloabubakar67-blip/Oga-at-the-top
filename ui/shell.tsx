'use client';

import { createContext, useContext } from 'react';
import type { Action } from '../engine/types';

/** True when a screen that used to open as a pop-up is shown as a section of the page instead. */
export const Inline = createContext(false);

/** What the player is pointing at, so the gauges can show where it would leave them. */
export const Preview = createContext<{ action: Action | null; set: (a: Action | null) => void }>({ action: null, set: () => {} });

/** A pop-up window, or, inside a section, just its contents. */
export function Overlay({ children, onClose, width = 'max-w-3xl', paper = false }: { children: React.ReactNode; onClose: () => void; width?: string; paper?: boolean }) {
  const inline = useContext(Inline);
  if (inline) return paper ? <div className="paper p-6 xl:p-8">{children}</div> : <>{children}</>;
  return (
    <div className="fade-in fixed inset-0 z-30 overflow-y-auto bg-pit/80 px-3 py-6 sm:py-10" onClick={onClose} role="dialog">
      <div className={`slide-in mx-auto ${width} ${paper ? 'paper p-5 sm:p-8' : ''}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/** Hover handlers that show an action's effect on the gauges. */
export function usePreview(action: Action | null, enabled = true) {
  const p = useContext(Preview);
  if (!enabled || !action) return {};
  return { onMouseEnter: () => p.set(action), onMouseLeave: () => p.set(null), onFocus: () => p.set(action), onBlur: () => p.set(null) };
}

/** The button that closes a pop-up; a section of the page has nothing to close. */
export function CloseButton({ onClose, className = 'mt-6' }: { onClose: () => void; className?: string }) {
  if (useContext(Inline)) return null;
  return <div className={`${className} text-right`}><button onClick={onClose} className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">Close</button></div>;
}
