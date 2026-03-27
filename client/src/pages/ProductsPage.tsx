import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiUpload, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { formatDate, statusLabel } from "../lib/utils";
import { Plus, Upload, Package, Trash2, Eye, Image, X, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function ProductsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", category: "", brand: "", description: "", characteristics: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const addFiles = (newFiles: File[]) => {
    const imgs = newFiles.filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...imgs]);
    imgs.forEach(f => {
      const r = new FileReader();
      r.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      r.readAsDataURL(f);
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append("images", f));
      const res = await apiUpload("/api/products", fd);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAdd(false);
      setFiles([]); setPreviews([]); setForm({ name: "", category: "", brand: "", description: "", characteristics: "" });
      toast({ title: "Товар добавлен" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });

  return (
    <Layout>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Товары</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{products.length} товаров в базе</p>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            data-testid="button-add-product"
            className="gradient-primary text-white border-0 hover:opacity-90"
          >
            <Plus size={15} className="mr-1.5" />Добавить товар
          </Button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-1">Нет товаров</h3>
            <p className="text-sm text-muted-foreground mb-4">Добавьте первый товар, чтобы начать работу</p>
            <Button onClick={() => setShowAdd(true)} className="gradient-primary text-white border-0">
              <Plus size={15} className="mr-1.5" />Добавить товар
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p: any) => {
              const imgs = p.images ? JSON.parse(p.images) : [];
              return (
                <div key={p.id} data-testid={`card-product-${p.id}`} className="bg-card border border-border rounded-xl overflow-hidden card-hover group">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {imgs[0] ? (
                      <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {imgs.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        +{imgs.length - 1}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm line-clamp-2 mb-1">{p.name}</div>
                    <div className="flex items-center gap-1.5 mb-2">
                      {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                      {p.brand && <span className="text-xs text-muted-foreground">· {p.brand}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full status-${p.status}`}>{statusLabel(p.status)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/products/${p.id}`}>
                          <a data-testid={`button-view-product-${p.id}`}>
                            <Button size="icon" variant="ghost" className="h-7 w-7"><Eye size={13} /></Button>
                          </a>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => deleteMutation.mutate(p.id)}
                          data-testid={`button-delete-product-${p.id}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить товар</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            {/* Upload zone */}
            <div
              className={`upload-zone ${dragging ? "dragging" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles([...e.dataTransfer.files]); }}
              onClick={() => fileRef.current?.click()}
              data-testid="upload-zone"
            >
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => addFiles([...(e.target.files || [])])} />
              <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Перетащите фото или нажмите</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP до 20МБ</p>
            </div>

            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={src} className="w-full h-full object-cover" />
                    <button type="button" className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white" onClick={() => { setFiles(f => f.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Название товара *</Label>
              <Input data-testid="input-product-name" placeholder="Например: Кружка керамическая 350мл" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Категория</Label>
                <Input data-testid="input-category" placeholder="Посуда" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Бренд</Label>
                <Input data-testid="input-brand" placeholder="Brand Name" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Краткое описание</Label>
              <Textarea data-testid="input-description" placeholder="Коротко о товаре..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Характеристики</Label>
              <Textarea data-testid="input-characteristics" placeholder={"Вес: 250г\nМатериал: керамика\nРазмер: 10×10×12 см"} value={form.characteristics} onChange={e => setForm(f => ({ ...f, characteristics: e.target.value }))} rows={3} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gradient-primary text-white border-0">
                {createMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                Добавить
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
