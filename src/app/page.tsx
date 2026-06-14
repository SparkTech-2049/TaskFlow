import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage() {
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  redirect(isMobile ? '/m' : '/d');
}
