"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { playNavTap } from "@/lib/sounds";

type Item = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (pathname: string) => boolean;
};

const ITEMS: Item[] = [
  {
    href: "/app",
    label: "Início",
    icon: Home,
    match: (p) => p === "/app",
  },
  {
    href: "/app/cursos",
    label: "Cursos",
    icon: BookOpen,
    match: (p) => p.startsWith("/app/cursos"),
  },
  {
    href: "/app/liga",
    label: "Liga",
    icon: Trophy,
    match: (p) => p.startsWith("/app/liga"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Em rotas de player de lição, a tela é imersiva. Sem nav.
  if (pathname.startsWith("/app/licao")) return null;
  // Só renderiza dentro do app autenticado.
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (!active) playNavTap();
              }}
              className={cn(
                "btn-squash flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                active ? "text-brand-green" : "text-text-muted hover:text-text",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-110",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
