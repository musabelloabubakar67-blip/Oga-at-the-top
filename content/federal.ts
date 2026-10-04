import type { ZoneId } from '../engine/types';

// FEDERAL CHARACTER
// Where the people the President appoints come from. The constitution asks that
// federal appointments reflect the country; every zone keeps count, and the one
// with nobody at the table says so. Authored characters are listed here; anyone
// appointed from the talent pool carries their own zone.

export const ORIGIN: Record<string, ZoneId> = {
  // The first cabinet and the Villa.
  'Engr. Chidi Ogbuagu': 'SE', 'Engr. Lanre Oyelaran': 'SW', 'Dr Aisha Dambatta': 'NW', 'Barr. Emeka Ezenagu': 'SE',
  'Maj. Gen. Danjuma Zakari (rtd)': 'NC', 'Mrs Kemi Oyetunde': 'SW', 'Alhaji Musa Dantsoho': 'NW', 'Otunba Kola Fadahunsi': 'SW',
  // The three who could run Finance.
  'Dr Halima Gwarzo': 'NW', 'Chief Benson Ekpenyong': 'SS', 'Senator Ezekiel Lohor': 'NC',
  // The first advisers in reserve.
  'Dr Nkechi Obidike': 'SE', 'Alhaji Sani Dankani': 'NW', 'Mrs Funmi Akinwale': 'SW', 'Mr Ibrahim Gwadabe': 'NW', 'Barr. Uche Nwankwor': 'SE', 'Mallam Hassan Gidado': 'NE',
  // The stock replacements.
  'Dr Zainab Madaki': 'NC', 'Engr. Tunde Adegbenro': 'SW', 'Dr Ifeoma Ezeala': 'SE', 'Mr Yusuf Garko': 'NW',
  'Chief Bayo Olaniyan': 'SW', 'Alhaji Garba Hadejia': 'NW', 'Hon. Nkem Anozie': 'SE', 'Otunba Wale Babatope': 'SW',
};

export const NORTH: ZoneId[] = ['NW', 'NE', 'NC'];
