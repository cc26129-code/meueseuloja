import { Link } from "@tanstack/react-router";
import { Heart, LockKeyhole, PackageCheck, QrCode } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-night text-[#f8f3fa]">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr] lg:py-20">
        <div>
          <p className="font-display text-3xl text-[#eadcf5]">meueseuloja</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#b9adbf]">
            Uma seleção enxuta de peças escolhidas com cuidado. Materiais nobres, acabamento
            impecável e atendimento próximo.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-luxe text-[#d8bff0]">Navegação</p>
          <ul className="mt-5 space-y-3 text-sm text-[#b9adbf]">
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
              <Link to="/favoritos" className="transition-colors hover:text-[#eadcf5]">
                Favoritos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-luxe text-[#d8bff0]">Sua conta</p>
          <ul className="mt-5 space-y-3 text-sm text-[#b9adbf]">
            <li>
              <Link to="/conta" className="transition-colors hover:text-[#eadcf5]">
                Meu perfil
              </Link>
            </li>
            <li>
              <Link to="/meus-pedidos" className="transition-colors hover:text-[#eadcf5]">
                Meus pedidos
              </Link>
            </li>
            <li>
              <Link to="/admin" className="transition-colors hover:text-[#eadcf5]">
                Área do lojista
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-luxe text-[#d8bff0]">Compra segura</p>
          <ul className="mt-5 space-y-4 text-sm text-[#b9adbf]">
            <li className="flex gap-3">
              <QrCode className="mt-0.5 size-4 shrink-0 text-[#d8bff0]" /> Pagamento rápido via PIX
            </li>
            <li className="flex gap-3">
              <PackageCheck className="mt-0.5 size-4 shrink-0 text-[#d8bff0]" /> Frete calculado no
              checkout
            </li>
            <li className="flex gap-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#d8bff0]" /> Dados protegidos
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center text-xs tracking-widest text-[#9f92a6]">
        © {new Date().getFullYear()} meueseuloja · feito com{" "}
        <Heart className="mx-1 inline size-3 text-[#d8bff0]" aria-hidden="true" /> cuidado
      </div>
    </footer>
  );
}
