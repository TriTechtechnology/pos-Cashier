/**
 * INVENTORY ROUTE REDIRECT - SPA MIGRATION
 */

"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@/lib/store/navigation";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/loading";

export default function InventoryPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [REDIRECT] Inventory route accessed - redirecting to SPA root');
    useNavigationStore.getState().navigateToInventory();
    router.replace('/');
  }, [router]);

  return <Loading />;
}
