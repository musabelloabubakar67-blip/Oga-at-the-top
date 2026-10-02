import type { Cond } from '../engine/types';

// THE RECORD
// What the presidency has to show for itself, good and bad. Each line appears
// on the desk the moment its condition becomes true and stays for as long as
// it is true. Delivered reforms, failed bills and big bets are added by the
// engine; these are the things that come from decisions on the desk.

export const RECORD: { kind: 'win' | 'loss'; when: Cond; text: string }[] = [
  { kind: 'win', when: { flag: 'policy.subsidy', is: 'removed' }, text: 'Ended the petrol subsidy' },
  { kind: 'win', when: { flag: 'uni.agreement', is: 'implemented' }, text: 'Honoured the eleven-year-old university agreement' },
  { kind: 'loss', when: { flag: 'uni.agreement', is: 'broken' }, text: 'Broke the university agreement' },
  { kind: 'win', when: { flag: 'wage.agreement', is: 'funded' }, text: 'A minimum wage that is actually paid' },
  { kind: 'loss', when: { flag: 'wage.agreement', is: 'signed_unfunded' }, text: 'A minimum wage most states do not pay' },
  { kind: 'win', when: { flag: 'flood.defences' }, text: 'Committed to permanent flood defences' },
  { kind: 'win', when: { flag: 'refinery.sold' }, text: 'Sold the refinery to someone who will run it' },
  { kind: 'win', when: { flag: 'grain.reserve' }, text: 'Filled the strategic grain reserve' },
  { kind: 'win', when: { flag: 'drawer.sealed' }, text: 'Put the security vote on the books' },
  { kind: 'win', when: { flag: 'sovereign.fund' }, text: 'Locked ₦2tn in a stabilisation fund' },
  { kind: 'win', when: { flag: 'oil.metered' }, text: 'Metered every oil terminal' },
  { kind: 'win', when: { flag: 'statepolice.checked' }, text: 'Drew the line on abuse of state police' },
  { kind: 'win', when: { flag: 'minister.special', is: 'prosecuted' }, text: 'Prosecuted a serving minister' },
  { kind: 'win', when: { flag: 'handover.candid' }, text: 'Left honest handover notes' },
  { kind: 'win', when: { flag: 'tenure.disowned' }, text: 'Refused a tenure extension' },
  { kind: 'win', when: { flag: 'conceded' }, text: 'Conceded defeat on the night' },
  { kind: 'win', when: { flag: 'removal.survived' }, text: 'Survived an impeachment vote' },
  { kind: 'loss', when: { flag: 'protest.deaths' }, text: 'Fourteen protesters killed on your orders' },
  { kind: 'loss', when: { flag: 'court.ignored' }, text: 'Ignored a court order' },
  { kind: 'loss', when: { flag: 'press.gag' }, text: 'Sent a bill to gag the online press' },
  { kind: 'loss', when: { flag: 'ticket.bought' }, text: 'Bought your own party\'s primary' },
  { kind: 'loss', when: { flag: 'vat.reversed' }, text: 'Reversed your own VAT increase' },
  { kind: 'loss', when: { flag: 'policy.subsidy', is: 'full' }, text: 'Petrol sold below cost by decree' },
  { kind: 'loss', when: { flag: 'minister.special', is: 'reinstated' }, text: 'Reinstated the ₦38.7bn minister' },
  { kind: 'loss', when: { v: ['counter.committees', '>=', 3] }, text: 'Committees constituted; reports awaited' },
  { kind: 'loss', when: { v: ['count.grid.collapse', '>=', 2] }, text: 'The grid has collapsed repeatedly on your watch' },
  { kind: 'loss', when: { v: ['counter.tolerated', '>=', 3] }, text: 'Looked away, more than once' },
  { kind: 'loss', when: { v: ['ordered.print', '==', 1] }, text: 'Printed money to fund the budget' },
];

/** Standing policy: what is in force because the President decided it. */
export const IN_FORCE: { when: Cond; text: string }[] = [
  { when: { flag: 'policy.subsidy', is: 'removed' }, text: 'Petrol is sold at market price' },
  { when: { flag: 'policy.subsidy', is: 'partial' }, text: 'Petrol is partly subsidised' },
  { when: { flag: 'policy.subsidy', is: 'phasing' }, text: 'Subsidy is being phased out' },
  { when: { flag: 'policy.subsidy', is: 'full' }, text: 'Pump price frozen below cost' },
  { when: { all: [{ v: ['ordered.tax', '==', 1] }, { not: { flag: 'vat.reversed' } }] }, text: 'VAT at 12.5%' },
  { when: { flag: 'vat.exempt' }, text: 'Food and medicine exempt from VAT' },
  { when: { v: ['ordered.duties', '==', 1] }, text: 'No import duty on staple foods' },
  { when: { flag: 'wage.agreement', is: 'signed_unfunded' }, text: 'Minimum wage raised by law' },
  { when: { flag: 'wage.agreement', is: 'funded' }, text: 'Minimum wage raised and funded' },
  { when: { flag: 'lender.programme' }, text: 'Under a lender\'s programme' },
  { when: { flag: 'print.renounced' }, text: 'No central bank financing of the budget' },
  { when: { flag: 'sovereign.fund' }, text: 'Stabilisation fund in law' },
  { when: { flag: 'flood.defences' }, text: 'Flood defences on the Niger and Benue' },
];
