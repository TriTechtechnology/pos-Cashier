/**
 * HOME ROUTE REDIRECT - SPA MIGRATION
 *
 * This route now redirects to the SPA root (/) with proper navigation state.
 * The actual home page logic is in src/app/page.tsx
 */

"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/lib/store/navigation";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";

export default function HomePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [REDIRECT] Home route accessed - redirecting to SPA root with home state');

    // Set navigation state to home
    useNavigationStore.getState().navigateToHome();

    // Redirect to root
    router.replace('/');
  }, [router]);

  return <Loading />;
}
