import Link from "next/link";
import { Heart, Search, User, Shield } from "lucide-react";
import { appConfig } from "@/lib/config";
import { isAdmin } from "@/lib/admin/isAdmin";

interface HeaderProps {
  user?: { email: string } | null;
}

export function Header({ user }: HeaderProps) {
  const admin = isAdmin(user);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-text">
          {appConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/browse" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
            Shop
          </Link>
          <Link href="/sell" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
            Sell
          </Link>
          {user && (
            <>
              <Link href="/watchlist" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
                Watchlist
              </Link>
              <Link href="/saved-searches" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
                Saved Searches
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
                Dashboard
              </Link>
            </>
          )}
          {admin && (
            <Link href="/admin" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/browse" className="p-2 text-text-muted hover:text-text md:hidden">
            <Search className="h-5 w-5" />
          </Link>
          {user ? (
            <Link href="/watchlist" className="p-2 text-text-muted hover:text-text">
              <Heart className="h-5 w-5" />
            </Link>
          ) : null}
          {user ? (
            <Link href="/account" className="p-2 text-text-muted hover:text-text">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
