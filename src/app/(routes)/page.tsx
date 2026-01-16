'use client';
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Server-side redirect - no JavaScript needed
  redirect('/login');
}
