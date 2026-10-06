// THE SUPREME COURT
// Seven justices. Each leans one of three ways: towards you, towards nobody, or
// against you. Each has a retirement date, and the President fills the seat,
// subject to the Senate. Every name here was checked against real public figures.

export type Lean = 'you' | 'free' | 'them';

export interface JusticeDef {
  name: string;
  short: string;
  lean: Lean;
  /** 1 to 5. A justice of 2 or less can be reached by whoever is paying. */
  integrity: number;
  blurb: string;
}

export interface SeatDef extends JusticeDef {
  /** Months into the presidency when the seat falls vacant. */
  retires: number;
  chief?: boolean;
}

export const BENCH: SeatDef[] = [
  { name: 'Hon. Justice Mojisola Akintewe', short: 'Akintewe', lean: 'free', integrity: 4, retires: 120, chief: true, blurb: 'Chief Justice. Writes short judgments and expects them to be obeyed.' },
  { name: 'Hon. Justice Ebiere Opubo', short: 'Opubo', lean: 'you', integrity: 2, retires: 14, blurb: 'Appointed by a President of your party. Has never found against a sitting government, and does not intend to start.' },
  { name: 'Hon. Justice Nasiru Tsafe', short: 'Tsafe', lean: 'them', integrity: 2, retires: 22, blurb: 'Close to the opposition\'s founders. Dines with them, and is not discreet about it.' },
  { name: 'Hon. Justice Oghenekaro Edewor', short: 'Edewor', lean: 'free', integrity: 3, retires: 33, blurb: 'Careful, slow and hard to predict. Decides on the papers, mostly.' },
  { name: 'Hon. Justice Haruna Yawuri', short: 'Yawuri', lean: 'them', integrity: 3, retires: 46, blurb: 'Appointed by the government you defeated. Honest, and no friend of yours.' },
  { name: 'Hon. Justice Ifeoluwa Akinbiyi', short: 'Akinbiyi', lean: 'free', integrity: 4, retires: 70, blurb: 'A commercial lawyer before the bench. Reads contracts as carefully as constitutions.' },
  { name: 'Hon. Justice Chinelo Ezeokafor', short: 'Ezeokafor', lean: 'free', integrity: 5, retires: 85, blurb: 'The bench\'s conscience, by reputation and by temperament. Dissents often and well.' },
];

export interface NomineeDef extends JusticeDef {
  /** Senate support needed to confirm. 0 means confirmed without a fight. */
  senate: number;
  /** What appointing them says. */
  fx: [string, number][];
}

export const NOMINEES: NomineeDef[] = [
  { name: 'Justice Babatunde Olowofela', short: 'Olowofela', lean: 'free', integrity: 5, senate: 0, fx: [['bloc.press', 3], ['nation.integrity', 1]], blurb: 'The Bar\'s choice. Owes nobody, including you, and will remind you of it.' },
  { name: 'Justice Danladi Kachia', short: 'Kachia', lean: 'free', integrity: 4, senate: 0, fx: [['bloc.establishment', 2]], blurb: 'Twenty years on the Court of Appeal. Sound, unglamorous, and acceptable to everyone.' },
  { name: 'Justice Hauwa Gamawa', short: 'Gamawa', lean: 'you', integrity: 4, senate: 55, fx: [['bloc.press', -2]], blurb: 'Able and honest, and has been your friend for thirty years. The Senate knows both.' },
  { name: 'Justice Ngozi Anyaduba', short: 'Anyaduba', lean: 'you', integrity: 3, senate: 50, fx: [['bloc.press', -3], ['nation.integrity', -1]], blurb: 'Wrote the opinion that saved your party\'s last governorship. Expects to be remembered for it.' },
  { name: 'Justice Yakubu Ndaliman', short: 'Ndaliman', lean: 'you', integrity: 2, senate: 45, fx: [['bloc.party', 3], ['bloc.press', -4], ['nation.integrity', -2]], blurb: 'The party\'s recommendation. Will rule however the party needs, for whoever is paying the party.' },
];

// HOW EACH JUSTICE DECIDES (plan 04.A7)
// A legal philosophy, how strictly they hold the government to procedure, how
// well they run a court, and what happens when someone leans on them. Cases are
// decided on authority, evidence, precedent and procedure; a justice's lean is a
// sympathy, not a vote. Independence is not opposition.

export type Philosophy = 'textual' | 'purposive' | 'deferential' | 'rights';
export const PHILOSOPHY_NAME: Record<Philosophy, string> = {
  textual: 'asks first whether the power existed',
  purposive: 'asks what the law was for, and whether it was served',
  deferential: 'defers to the elected government unless the breach is plain',
  rights: 'asks first whether those affected were heard and the harm justified',
};

export interface JudicialProfile {
  philosophy: Philosophy;
  /** 1–5: how strictly they insist that those affected are heard and the rules followed. */
  procedure: number;
  /** 1–5: how well they run a court; a good administrator decides on time. */
  admin: number;
  /** What pressure does: 'firm' ignores it; 'bends' leans toward whoever applies it, if integrity is low. */
  pressure: 'firm' | 'bends';
}

export const PROFILE: Record<string, JudicialProfile> = {
  Akintewe: { philosophy: 'textual', procedure: 4, admin: 5, pressure: 'firm' },
  Opubo: { philosophy: 'deferential', procedure: 2, admin: 3, pressure: 'bends' },
  Tsafe: { philosophy: 'purposive', procedure: 2, admin: 2, pressure: 'bends' },
  Edewor: { philosophy: 'textual', procedure: 3, admin: 2, pressure: 'firm' },
  Yawuri: { philosophy: 'rights', procedure: 4, admin: 3, pressure: 'firm' },
  Akinbiyi: { philosophy: 'purposive', procedure: 3, admin: 4, pressure: 'firm' },
  Ezeokafor: { philosophy: 'rights', procedure: 5, admin: 3, pressure: 'firm' },
  Olowofela: { philosophy: 'textual', procedure: 4, admin: 4, pressure: 'firm' },
  Kachia: { philosophy: 'deferential', procedure: 3, admin: 4, pressure: 'firm' },
  Gamawa: { philosophy: 'purposive', procedure: 3, admin: 4, pressure: 'firm' },
  Anyaduba: { philosophy: 'deferential', procedure: 2, admin: 3, pressure: 'bends' },
  Ndaliman: { philosophy: 'deferential', procedure: 1, admin: 2, pressure: 'bends' },
};
