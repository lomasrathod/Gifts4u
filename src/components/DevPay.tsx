"use client";

import { useState } from "react";

// Stand-in for the payment page while no payment provider is configured.
export function DevPay() {
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    const order = new URLSearchParams(window.location.search).get("order");
    await fetch("/api/dev/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) });
    window.location.href = `/checkout/return?order=${order}`;
  };
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Development checkout</p>
      <h1 className="mt-2 font-display text-3xl">No payment provider is set up</h1>
      <p className="mt-3 text-muted">Add DODO_API_KEY and DODO_PRODUCT_ID to take real payments. This button pretends the payment succeeded.</p>
      <button onClick={pay} disabled={busy} className="btn-primary mt-6">{busy ? "Paying…" : "Simulate payment"}</button>
    </main>
  );
}
