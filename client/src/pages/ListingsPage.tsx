import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "../components/Layout";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatCurrency, statusLabel, marketplaceName } from "../lib/utils";
import { Plus, Tag, Eye, Trash2, TrendingUp, Star, Loader2, Filter } from "lucide-react";

export default function ListingsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ productId: "", marketplace: "wb", title: "", price: "", discountPercent: "0" });
  const { toast } = useToast();

  const { data: listings = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/listings"] });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const filtered = filter === "all" ? listings : listings.filter((l: any) => l.status === filter || l.marketplace === filter);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/listings", {
        productId: Number(form.productId),
        marketplace: form.marketplace,
        title: form.title,
        price: form.price ? Number(form.price) : null,
        discountPercent: Number(form.discountPercent),
        status: "draft",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setShowAdd(false);
      setForm({ productId: "", marketplace: "wb", title: "", price: "", discountPercent: "0" });
      toast({ title: "Карточка создана" });
    },
    onError: (e: any) => toast({ title: e.message || "Ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/listings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/listings"] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/listings/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/listings"] }),
  });

  const filters = [
    { value: "all", label: "Все" },
    { value: "draft", label: "Черновики" },
    { value: "active", label: "Активные" },
    { value: "paused", label: "На паузе" },
    { value: "wb", label: "Wildberries" },
    { value: "ozon", label: "Ozon" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">Карточки товаров</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{listings.length} карточек</p>
          </div>
          <Button onClick={() => setShowAdd(true)} data-testid="button-add-listing" className="gradient-primary text-white border-0 hover:opacity-90">
            <Plus size={15} className="mr-1.5" />Создать карточку
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={48} className="text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Нет карточек</h3>
            <p className="text-sm text-muted-foreground mb-4">Создайте карточку для Wildberries или Ozon</p>
            <Button onClick={() => setShowAdd(true)} className="gradient-primary text-white border-0">+ Создать</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((l: any) => {
              const product = products.find((p: any) => p.id === l.productId);
              const imgs = product?.images ? JSON.parse(product.images) : [];
              return (
                <div key={l.id} data-testid={`card-listing-${l.id}`} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group">
                  {/* Thumb */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {imgs[0] ? <img src={imgs[0]} className="w-full h-full object-cover" alt="" /> : <Tag size={20} className="m-auto mt-3 text-muted-foreground/40" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className={`text-[10px] ${l.marketplace === "wb" ? "text-purple-600 border-purple-200" : "text-blue-600 border-blue-200"}`}>
                        {marketplaceName(l.marketplace)}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] status-${l.status}`}>{statusLabel(l.status)}</Badge>
                      {l.abTestActive ? <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">A/B тест</Badge> : null}
                    </div>
                    <div className="font-medium text-sm truncate">{l.title || product?.name || "Без названия"}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {l.price && <span className="font-medium text-foreground">{formatCurrency(l.price)}</span>}
                      {l.discountPercent > 0 && <span className="text-green-600">-{l.discountPercent}%</span>}
                      {l.rating > 0 && <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" />{l.rating}</span>}
                      {l.reviewCount > 0 && <span>{l.reviewCount} отзывов</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {l.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus.mutate({ id: l.id, status: "active" })}>
                        Опубликовать
                      </Button>
                    )}
                    {l.status === "active" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: l.id, status: "paused" })}>
                        Пауза
                      </Button>
                    )}
                    {l.status === "paused" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200" onClick={() => updateStatus.mutate({ id: l.id, status: "active" })}>
                        Возобновить
                      </Button>
                    )}
                    <Link href={`/listings/${l.id}`}>
                      <a><Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-view-listing-${l.id}`}><Eye size={13} /></Button></a>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" onClick={() => deleteMutation.mutate(l.id)} data-testid={`button-delete-listing-${l.id}`}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Создать карточку</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Товар *</Label>
              <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                <SelectTrigger data-testid="select-product"><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Маркетплейс *</Label>
              <Select value={form.marketplace} onValueChange={v => setForm(f => ({ ...f, marketplace: v }))}>
                <SelectTrigger data-testid="select-marketplace"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wb">Wildberries</SelectItem>
                  <SelectItem value="ozon">Ozon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Заголовок карточки</Label>
              <Input data-testid="input-listing-title" placeholder="Заголовок для маркетплейса" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Цена (₽)</Label>
                <Input data-testid="input-price" type="number" placeholder="999" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Скидка (%)</Label>
                <Input data-testid="input-discount" type="number" min="0" max="90" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending || !form.productId} className="gradient-primary text-white border-0">
                {createMutation.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}Создать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
