import { notFound } from "next/navigation";
import { DevPay } from "@/components/DevPay";
import { paymentsEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function DevCheckout() {
  if (paymentsEnabled || process.env.NODE_ENV === "production") notFound();
  return <DevPay />;
}
