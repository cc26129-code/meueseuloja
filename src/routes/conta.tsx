import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, Receipt, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth-provider";

export const Route = createFileRoute("/conta")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Minha conta | meueseuloja" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user)
      void navigate({ to: "/entrar", search: { next: "/conta" }, replace: true });
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setAddress(profile.address);
  }, [profile]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !profile || saving) return;
    if (name.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (address.trim() && address.trim().length < 5) {
      toast.error("Informe um endereço válido.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", user.id);
      if (error) throw error;
      if (profile.address_id) {
        if (address.trim()) {
          const { error: addressError } = await supabase
            .from("addresses")
            .update({ address_text: address.trim() })
            .eq("id", profile.address_id)
            .eq("user_id", user.id);
          if (addressError) throw addressError;
        } else {
          await supabase
            .from("addresses")
            .delete()
            .eq("id", profile.address_id)
            .eq("user_id", user.id);
        }
      } else if (address.trim()) {
        const { error: addressError } = await supabase
          .from("addresses")
          .insert({ user_id: user.id, address_text: address.trim(), is_default: true });
        if (addressError) throw addressError;
      }
      await refreshProfile();
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file?: File) {
    if (!file || !user || !profile || uploading) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 3 MB.");
      return;
    }
    setUploading(true);
    try {
      const extension =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", user.id);
      if (updateError) throw updateError;
      if (profile.avatar_path) await supabase.storage.from("avatars").remove([profile.avatar_path]);
      await refreshProfile();
      toast.success("Foto de perfil atualizada.");
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
        <p className="text-[0.65rem] uppercase tracking-luxe text-primary">Área do cliente</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl">Minha conta</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Gerencie seus dados e sua foto de perfil.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/meus-pedidos">
              <Receipt className="mr-2 size-4" /> Meus pedidos
            </Link>
          </Button>
        </div>

        {loading || !profile ? (
          <Skeleton className="mt-10 h-96 rounded-2xl" />
        ) : (
          <div className="mt-10 grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-soft md:grid-cols-[12rem_minmax(0,1fr)] sm:p-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="size-32 border border-border">
                <AvatarImage src={profile.avatar_url ?? undefined} alt="Foto de perfil" />
                <AvatarFallback className="text-3xl">{initials || <UserRound />}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar"
                className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
              >
                {uploading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 size-4" />
                )}{" "}
                Alterar foto
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => void uploadAvatar(event.target.files?.[0])}
              />
              <p className="text-center text-xs text-muted-foreground">
                JPG, PNG ou WebP. Até 3 MB.
              </p>
            </div>
            <form onSubmit={save} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="rounded-xl opacity-70"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail identifica sua conta e não pode ser alterado nesta tela.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={500}
                  autoComplete="street-address"
                  className="min-h-24 rounded-xl"
                  placeholder="Opcional"
                />
              </div>
              <Button type="submit" disabled={saving} className="rounded-full px-7">
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}{" "}
                Salvar alterações
              </Button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
