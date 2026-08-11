import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-night">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl text-gold-gradient">meueseuloja</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Uma seleção enxuta de peças escolhidas com cuidado. Materiais nobres, acabamento
            impecável e atendimento próximo.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-luxe text-primary">Navegação</p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            <li>
              <a href="/#topo" className="transition-colors hover:text-primary">
                Início
              </a>
            </li>
            <li>
              <a href="/#produtos" className="transition-colors hover:text-primary">
                Nossos produtos
              </a>
            </li>
            <li>
              <a href="/#sobre" className="transition-colors hover:text-primary">
                Sobre a loja
              </a>
            </li>
            <li>
              <Link to="/admin" className="transition-colors hover:text-primary">
                Área do lojista
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-luxe text-primary">Redes</p>
          <div className="mt-5 flex gap-3">
            {[
              { icon: Instagram, label: "Instagram" },
              { icon: Facebook, label: "Facebook" },
              { icon: Mail, label: "E-mail" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-label={label}
                className="grid size-10 place-items-center border border-border text-muted-foreground transition-all duration-500 hover:border-primary hover:text-primary"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} meueseuloja. Todos os direitos reservados
      </div>
    </footer>
  );
}
