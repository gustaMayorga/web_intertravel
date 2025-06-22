import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard'); // Changed redirect to /dashboard
  return null; 
}
