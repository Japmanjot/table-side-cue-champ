import { Link } from "@tanstack/react-router";
import { CircleDot, History, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Play", icon: CircleDot },
  { to: "/stats", label: "Stats", icon: Trophy },
  { to: "/history", label: "History", icon: History },
  { to: "/players", label: "Players", icon: Users },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen pb-24">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <h1 className="display text-4xl uppercase text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>
      <main className="px-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-md">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors data-[status=active]:text-gold"
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
