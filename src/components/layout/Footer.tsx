import { appConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-semibold text-text">{appConfig.name}</p>
            <p className="mt-2 text-sm text-text-muted">
              Premium resale for girls&apos; and women&apos;s sports equipment.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-text">Shop</p>
            <ul className="mt-2 space-y-1 text-sm text-text-muted">
              <li><a href="/browse" className="hover:text-text">Browse All</a></li>
              <li><a href="/sell" className="hover:text-text">Sell an Item</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-text">Legal</p>
            <ul className="mt-2 space-y-1 text-sm text-text-muted">
              <li><a href="/terms" className="hover:text-text">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-text">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-text-muted">
          &copy; {new Date().getFullYear()} {appConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
