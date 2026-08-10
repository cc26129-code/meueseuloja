import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Loader2, LogOut, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProducts,
  formatBRL,
  stockStatus,
  stockStatusLabel,
  uploadProductImage,
  type ProductWithUrl,
} from "@/lib/products";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin" });
    }
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Painel administrativo — meueseuloja" },
      { name: "description", content: "Gerencie os produtos da meueseuloja." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel administrativo — meueseuloja" },
      { property: "og:description", content: "Gerencie os produtos da meueseuloja." },
    ],
  }),
  component: Dashboard,
});

type FormState = {
  id?: string;
  name: string;
  price: string;
  description: string;
  stock: string;
  file: File | null;
  currentImage: string | null;
  preview: string | null;
};

const emptyForm: FormState = {
  name: "",
  price: "",
  description: "",
  stock: "0",
  file: null,
  currentImage: null,
  preview: null,
};

type Filter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "in_stock", label: "Disponíveis" },
  { key: "low_stock", label: "Estoque baixo" },
  { key: "out_of_stock", label: "Esgotados" },
];

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleting, setDeleting] = useState<ProductWithUrl | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState("0");

  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const allProducts = (data ?? []) as ProductWithUrl[];
  const products = allProducts.filter(
    (p) => filter === "all" || stockStatus(Number(p.stock_quantity ?? 0)) === filter,
  );

  const saveStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: stock })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Estoque atualizado.");
      setStockEditId(null);
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível atualizar o estoque."),
  });


  const save = useMutation({
    mutationFn: async (state: FormState) => {
      let imagePath = state.currentImage;
      if (state.file) imagePath = await uploadProductImage(state.file);

      const payload = {
        name: state.name.trim(),
        price: Number(state.price.replace(",", ".")),
        description: state.description.trim(),
        stock_quantity: Math.max(0, Math.floor(Number(state.stock || "0"))),
        image_url: imagePath,
      };

      if (state.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", state.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(form.id ? "Produto atualizado." : "Produto adicionado.");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o produto."),
  });

  const remove = useMutation({
    mutationFn: async (product: ProductWithUrl) => {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      if (product.image_url) {
        await supabase.storage.from("product-images").remove([product.image_url]);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído.");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível excluir."),
  });

  function openNew() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: ProductWithUrl) {
    setForm({
      id: p.id,
      name: p.name,
      price: String(p.price),
      description: p.description ?? "",
      stock: String(p.stock_quantity ?? 0),
      file: null,
      currentImage: p.image_url,
      preview: p.signedUrl ?? null,
    });
    setOpen(true);
  }

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter até 5 MB.");
      return;
    }
    setForm((f) => ({ ...f, file, preview: URL.createObjectURL(file) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price.replace(",", "."));
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Informe um preço válido.");
      return;
    }
    if (form.description.trim().length < 5) {
      toast.error("Escreva uma breve descrição.");
      return;
    }
    save.mutate(form);
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="min-h-screen bg-night">
      <header className="border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-gold-gradient">meueseuloja</p>
            <p className="text-[0.6rem] uppercase tracking-luxe text-muted-foreground">
              painel administrativo
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/">
                <Store className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Ver loja</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={signOut}>
              <LogOut className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-4xl">Produtos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
            </p>
          </div>
          <Button onClick={openNew} className="rounded-xl tracking-widest">
            <Plus className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Adicionar produto</span>
          </Button>
        </div>

        <div className="mt-10 space-y-4">
          {isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          ) : products.length === 0 ? (
            <div className="border border-border bg-card px-6 py-20 text-center">
              <p className="font-display text-2xl">Nenhum produto ainda</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Adicione o primeiro produto para que ele apareça na vitrine.
              </p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="grid gap-4 border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="aspect-4/3 overflow-hidden bg-secondary sm:aspect-square">
                  {p.signedUrl ? (
                    <img
                      src={p.signedUrl}
                      alt={p.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <ImagePlus className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl">{p.name}</p>
                  <p className="mt-1 text-sm text-primary">{formatBRL(Number(p.price))}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="size-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 className="size-4 sm:mr-2" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">
              {form.id ? "Editar produto" : "Adicionar produto"}
            </DialogTitle>
            <DialogDescription>
              As alterações aparecem imediatamente na vitrine pública.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest">Foto</Label>
              <div className="flex items-center gap-4">
                <div className="size-20 shrink-0 overflow-hidden border border-border bg-secondary">
                  {form.preview ? (
                    <img src={form.preview} alt="Prévia" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <ImagePlus className="size-5" />
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="rounded-xl"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-widest">
                Nome
              </Label>
              <Input
                id="name"
                value={form.name}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs uppercase tracking-widest">
                Preço (R$)
              </Label>
              <Input
                id="price"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0,00"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs uppercase tracking-widest">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={form.description}
                maxLength={1000}
                rows={4}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending} className="rounded-xl">
                {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.name}” será removido definitivamente da vitrine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting);
              }}
            >
              {remove.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
