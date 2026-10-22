import { EditRequest } from "@/components/EditRequest";
import { Footer, Header } from "@/components/SiteChrome";

export const metadata = { title: "Edit your gift" };

export default function EditPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20">
        <h1 className="font-display text-4xl">Edit your gift</h1>
        <p className="mt-3 text-muted">
          Enter the email you paid with. We&apos;ll send you a private edit link for each of your gifts.
        </p>
        <EditRequest />
      </main>
      <Footer />
    </>
  );
}
