import type { Metadata } from 'next';
import { Mocks } from '../../ui/mocks/Mocks';

export const metadata: Metadata = { title: 'Design mocks · Oga at the Top', robots: { index: false } };

export default function Page() {
  return <Mocks />;
}
