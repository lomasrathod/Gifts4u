import { Suspense } from "react";
import { CheckoutReturn } from "@/components/CheckoutReturn";
import { Header } from "@/components/SiteChrome";

export const metadata = { title: "Your gift", robots: { index: false } };

export default function ReturnPage() {
  return (
    <>
      <Header />
      <Suspense>
        <CheckoutReturn />
      </Suspense>
    </>
  );
}
