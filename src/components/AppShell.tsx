import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Mascot } from "./Mascot";
import { WalletButton } from "./WalletButton";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/wheel", label: "Roda" },
  { to: "/leaderboard", label: "Papan Skor" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b-[3px] border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <Mascot animal="cat" mood="wave" className="h-9 w-9" />
            <span className="font-display text-lg leading-none font-extrabold">
              Chibi<span className="text-primary">Split</span>
            </span>
          </Link>
          <ClientOnly fallback={<span className="chibi-chip bg-muted">Nimiq</span>}>
            <WalletButton />
          </ClientOnly>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-4 py-1.5 text-sm font-bold text-muted-foreground transition-colors"
              activeProps={{ className: cn("bg-primary text-primary-foreground") }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
