"use client";

import { useState } from "react";

export function EditRequest() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  if (state === "sent") {
    return <p className="mt-6 rounded-2xl bg-blush p-4">If that email has gifts, the links are on their way. Check your inbox and spam folder.</p>;
  }
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const res = await fetch("/api/edit/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setState(res.ok ? "sent" : "error");
      }}
    >
      <input type="email" required className="input flex-1" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn-primary" disabled={state === "busy"}>Send link</button>
    </form>
  );
}
