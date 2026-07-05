import { AppLayout } from "@/components/layout/AppLayout";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-text">Purchase Complete</h1>
        <p className="mt-2 text-text-muted">
          Thank you for your purchase. The seller will ship your item soon.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/browse"><Button variant="outline">Continue Shopping</Button></Link>
          <Link href="/dashboard"><Button>View Dashboard</Button></Link>
        </div>
      </div>
    </AppLayout>
  );
}
