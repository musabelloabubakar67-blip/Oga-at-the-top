// WHAT THE OPPOSITION PROPOSES (plan 15.A4, 15.A5)
// Each rival speaks for a constituency and puts forward specific proposals,
// drawn from what is actually going wrong: a group left behind, a reform that
// hurts someone, a service that is failing, a theatre nobody is dealing with.
// Some proposals are right. The President can adopt one, negotiate a smaller
// version, defeat it, or commit to a different answer and show that it works.

import type { Cond, Fx } from '../engine/types';

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

export interface Proposal {
  id: string;
  /** The rival who makes it: 'alt', 'fire' or 'strong'. */
  rival: string;
  /** The constituency it speaks for. */
  for: string;
  title: string;
  text: string;
  /** When it is made. */
  when: Cond;
  /** Whether it is right: the problem it names is real and serious now. */
  right: Cond;
  /** If the President adopts it. */
  adopt: Fx[];
  /** The narrower version, if negotiated. */
  negotiate: Fx[];
  /** What the President would do instead, and the test that shows it worked. */
  alternative: { text: string; met: Cond };
  /** Each month it goes unanswered, it is campaigned on. */
  campaign: Fx[];
  /** If it asks for a reform to be undone. */
  reverses?: string;
}

export const PROPOSALS: Proposal[] = [
  { id: 'prop.fuelvouchers', rival: 'fire', for: 'Transport workers', title: 'Fuel vouchers for commercial drivers',
    text: 'Every registered bus, taxi and tricycle driver gets a monthly fuel voucher until the pump price falls. "The government took the subsidy from the people who move the country."',
    when: v('group.transport', '<', 38), right: v('group.transport', '<', 35),
    adopt: [['bonus.fiscal', -0.006], ['bloc.street', 4], ['pressure.fuelSupplyStress', -4]], negotiate: [['bonus.fiscal', -0.003], ['bloc.street', 2]],
    alternative: { text: 'Gas buses on the busiest routes instead: the CNG programme', met: v('venture.cng', '==', 1) },
    campaign: [['bloc.street', -0.3], ['zone.NW.approval', -0.15]] },
  { id: 'prop.farmbelt', rival: 'strong', for: 'Farmers', title: 'A fertiliser and security package for the farm belt',
    text: 'Subsidised fertiliser through the state governments, and soldiers on the farm roads for the planting season. The governors would distribute it, which is the point.',
    when: v('group.farmer', '<', 38), right: { all: [v('group.farmer', '<', 35), v('theatre.NC', '>=', 55)] },
    adopt: [['bonus.fiscal', -0.008], ['theatre.NC', -4], ['bloc.party', 4], ['nation.integrity', -1]], negotiate: [['bonus.fiscal', -0.004], ['theatre.NC', -2], ['bloc.party', 2]],
    alternative: { text: 'A guarded farm corridor and the farm-belt mission instead', met: { any: [v('venture.corridor_ops', '==', 1), v('mil.cooperation.NC', '>=', 55)] } },
    campaign: [['zone.NC.approval', -0.3], ['bloc.party', -0.15]] },
  { id: 'prop.pensions', rival: 'alt', for: 'Pensioners', title: 'Pay the pension arrears before starting anything new',
    text: 'A law that no new capital project may be started while pensions are in arrears. "You cannot cut ribbons with money you owe to the old."',
    when: v('debt.pensions', '>', 0.8), right: v('debt.pensions', '>', 1),
    adopt: [['debt.pensions', -0.5], ['nation.fiscalSpace', -0.5], ['bloc.street', 3], ['approval', 1]], negotiate: [['debt.pensions', -0.25], ['nation.fiscalSpace', -0.25], ['bloc.street', 1]],
    alternative: { text: 'Clear the arrears on a published schedule: the register of unpaid bills', met: { any: [v('agenda.tr2', '==', 1), v('debt.pensions', '<', 0.4)] } },
    campaign: [['bloc.street', -0.25], ['approval', -0.1]] },
  { id: 'prop.graduates', rival: 'fire', for: 'Young graduates', title: 'A jobs guarantee for every graduate',
    text: 'Two years of paid public work for every graduate who cannot find a job, funded by cutting the Villa\'s budget. "Educate them, then employ them."',
    when: v('group.graduate', '<', 30), right: { all: [v('group.graduate', '<', 28), v('nation.jobs', '<', 40)] },
    adopt: [['bonus.fiscal', -0.012], ['bloc.street', 5], ['nation.jobs', 2]], negotiate: [['bonus.fiscal', -0.006], ['bloc.street', 2], ['nation.jobs', 1]],
    alternative: { text: 'Technical colleges and apprenticeships, and the youth jobs corps', met: { any: [v('agenda.k8', '==', 1), v('inst.jobs', '>=', 0)] } },
    campaign: [['bloc.street', -0.35], ['zone.SW.approval', -0.15]] },
  { id: 'prop.repealvat', rival: 'fire', for: 'Salaried households', title: 'Repeal the VAT rise', reverses: 'x1',
    text: 'Bring VAT back to where it was. "The poor pay a bigger share of what they spend than anyone in this government."',
    when: { all: [v('agenda.x1', '==', 1), v('group.salaried', '<', 40)] }, right: v('group.salaried', '<', 32),
    adopt: [['bonus.fiscal', -0.035], ['bloc.street', 6], ['nation.inflation', -1]], negotiate: [['bonus.fiscal', -0.012], ['bloc.street', 3]],
    alternative: { text: 'Keep the VAT and protect the poorest with cash transfers', met: { any: [v('agenda.h3', '==', 1), v('agenda.h9', '==', 1)] } },
    campaign: [['bloc.street', -0.3], ['approval', -0.1]] },
  { id: 'prop.tariff', rival: 'strong', for: 'Households on the grid', title: 'Take the electricity tariff back down', reverses: 'p3',
    text: 'Restore the old tariff and make the distribution companies swallow the loss. "Light we cannot afford is darkness with a bill."',
    when: { all: [v('agenda.p3', '==', 1), v('nation.power', '<', 45)] }, right: v('nation.power', '<', 38),
    adopt: [['bonus.fiscal', -0.02], ['bonus.power', -0.05], ['bloc.street', 5]], negotiate: [['bonus.fiscal', -0.008], ['bloc.street', 2]],
    alternative: { text: 'Enforce the lifeline band so the poorest pay the old price', met: v('agenda.p11', '==', 1) },
    campaign: [['bloc.street', -0.25], ['zone.SE.approval', -0.15]] },
  { id: 'prop.statepolice', rival: 'strong', for: 'People in the North West', title: 'State police for the North West, now',
    text: 'Let the governors raise their own police immediately, by executive order, and fund them federally. "Abuja cannot find the North West on a map."',
    when: { all: [v('theatre.NW', '>=', 68), v('agenda.s4', '==', 0)] }, right: v('theatre.NW', '>=', 72),
    adopt: [['theatre.NW', -6], ['bloc.party', 4], ['nation.integrity', -2], ['bonus.fiscal', -0.008]], negotiate: [['theatre.NW', -3], ['bloc.party', 2]],
    alternative: { text: 'A North West mission with its conduct limits kept', met: v('mil.cooperation.NW', '>=', 55) },
    campaign: [['zone.NW.approval', -0.35]] },
  { id: 'prop.funding', rival: 'alt', for: 'Families using public services', title: 'Fund the free services properly, or stop calling them free',
    text: 'A costed budget line for every free service the government has promised. "A free clinic with no medicine is not free; it is a queue."',
    when: v('svc.durable', '<', 38), right: v('svc.durable', '<', 34),
    adopt: [['nation.fiscalSpace', -0.3], ['bloc.street', 3], ['nation.integrity', 2]], negotiate: [['nation.fiscalSpace', -0.15], ['bloc.street', 1]],
    alternative: { text: 'Raise the people\'s budget share above the usual', met: v('budget.people', '>=', 3) },
    campaign: [['bloc.press', -0.2], ['approval', -0.1]] },
];

export const PROPOSAL_BY_ID = Object.fromEntries(PROPOSALS.map((p) => [p.id, p]));
