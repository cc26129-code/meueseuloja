import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { label: "Início", href: "/#topo" },
  { label: "Produtos", href: "/#produtos" },
  { label: "Sobre", href: "/#sobre" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl py-3"
          : "border-b border-transparent py-6"
      }`}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8">
        <Link to="/" className="min-w-0 group">
          <span className="block truncate font-display text-2xl leading-none tracking-wide text-gold-gradient sm:text-3xl">
            meueseuloja
          </span>
          <span className="mt-1 block text-[0.6rem] uppercase tracking-luxe text-muted-foreground">
            curadoria premium
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-xs uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-500 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
          <Button asChild variant="outline" size="sm" className="rounded-none">
            <Link to="/admin">Área do lojista</Link>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-border bg-card">
            <div className="mt-12 flex flex-col gap-7 px-6">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm uppercase tracking-[0.22em] text-muted-foreground hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
              <Button asChild variant="outline" className="rounded-none">
                <Link to="/admin" onClick={() => setOpen(false)}>
                  Área do lojista
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
