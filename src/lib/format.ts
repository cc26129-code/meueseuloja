const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number) {
  return brl.format(value);
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
