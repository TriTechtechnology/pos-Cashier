/**
 * MENU ROUTE REDIRECT - SPA MIGRATION
 *
 * This route now redirects to the SPA root (/) with proper navigation state.
 * The actual menu page logic is in src/app/page.tsx
 */

"use client";

import { useEffect, Suspense } from "react";
import { useNavigationStore } from "@/lib/store/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/loading";

function MenuPageRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('🔄 [REDIRECT] Menu route accessed - redirecting to SPA root with menu state');

    // Get params from URL
    const slot = searchParams.get('slot');
    const type = searchParams.get('type') as 'dine-in' | 'take-away' | 'delivery' | null;
    const isDraft = searchParams.get('draft') === 'true';
    const isEdit = searchParams.get('edit') === 'true';
    const isPayment = searchParams.get('payment') === 'true';

    // Determine mode
    let mode: 'normal' | 'draft' | 'edit' | 'payment' = 'normal';
    if (isDraft) mode = 'draft';
    else if (isEdit) mode = 'edit';
    else if (isPayment) mode = 'payment';

    // Set navigation state to menu with params
    if (slot) {
      useNavigationStore.getState().navigateToMenu(slot, type || 'dine-in', mode);
    }

    // Redirect to root
    router.replace('/');
  }, [router, searchParams]);

  return <Loading />;
}

export default function MenuPageRedirect() {
  return (
    <Suspense fallback={<Loading />}>
      <MenuPageRedirectContent />
    </Suspense>
  );
}
