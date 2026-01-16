/**
 * ORDERS ROUTE REDIRECT - SPA MIGRATION
 */

"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/lib/store/navigation";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";

export default function OrdersPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [REDIRECT] Orders route accessed - redirecting to SPA root');
    useNavigationStore.getState().navigateToOrders();
    router.replace('/');
  }, [router]);

  return <Loading />;
}
