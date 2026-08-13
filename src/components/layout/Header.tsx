import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";

const links = [
  { label: "Início", href: "/#topo" },
  { label: "Produtos", href: "/#produtos" },
  { label: "Sobre", href: "/#sobre" },
];

function initials(name?: string) {
  return (name ?? "Usuário")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Header() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
  const { user, profile, isAdmin, loading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    try {
      await signOut();
      toast.success("Você saiu da sua conta.");
      void navigate({ to: "/" });
    } catch {
      toast.error("Não foi possível sair agora.");
    }
  }

  const accountLinks = (
    <>
      <Link to="/conta" className="flex items-center gap-2">
        <Settings className="size-4" /> Minha conta
      </Link>
      <Link to="/meus-pedidos" className="flex items-center gap-2">
        <Receipt className="size-4" /> Meus pedidos
      </Link>
      <Link to="/favoritos" className="flex items-center gap-2">
        <Heart className="size-4" /> Favoritos
      </Link>
      {isAdmin && (
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="size-4" /> Área do lojista
        </Link>
      )}
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl transition-all duration-500 ${scrolled ? "py-3 shadow-soft" : "py-5"}`}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-8">
        <Link to="/" className="group min-w-0">
          <span className="block truncate font-display text-2xl leading-none tracking-wide text-gold-gradient sm:text-3xl">
            meueseuloja
          </span>
          <span className="mt-1 block text-[0.6rem] uppercase tracking-luxe text-muted-foreground">
            curadoria premium
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <nav className="hidden items-center gap-7 lg:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/favoritos"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
            >
              Favoritos
            </Link>
          </nav>

          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="relative rounded-full"
            aria-label={`Carrinho com ${count} itens`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="size-5" />
            <span className="ml-2 hidden text-xs uppercase tracking-[0.16em] sm:inline">
              Carrinho
            </span>
            {count > 0 && (
              <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </Button>

          <div className="hidden md:block">
            {loading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader2 className="size-4 animate-spin" />
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 rounded-full px-2.5 sm:px-4">
                    <Avatar className="size-6">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt="Foto do usuário" />
                      <AvatarFallback className="text-[0.6rem]">
                        {initials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-28 truncate text-xs sm:inline">
                      {profile?.full_name?.split(" ")[0] ?? "Conta"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="block truncate">{profile?.full_name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {profile?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/conta">
                      <Settings className="size-4" /> Minha conta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/meus-pedidos">
                      <Receipt className="size-4" /> Meus pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favoritos">
                      <Heart className="size-4" /> Favoritos
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard">
                        <ShieldCheck className="size-4" /> Área do lojista
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void logout()}>
                    <LogOut className="size-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/entrar">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/cadastro">Criar conta</Link>
                </Button>
              </div>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-card">
              <div className="mt-12 flex flex-col gap-6 px-6">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="border-t border-border pt-6">
                  {loading ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : user ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(profile?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{profile?.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setOpen(false)}
                        className="flex flex-col gap-5 text-sm text-muted-foreground"
                      >
                        {accountLinks}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => void logout()}
                      >
                        <LogOut className="mr-2 size-4" /> Sair
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Button asChild variant="outline" className="rounded-full">
                        <Link to="/entrar" onClick={() => setOpen(false)}>
                          <UserRound className="mr-2 size-4" /> Entrar
                        </Link>
                      </Button>
                      <Button asChild className="rounded-full">
                        <Link to="/cadastro" onClick={() => setOpen(false)}>
                          Criar conta
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
