import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Layout from "../components/Layout";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatCurrency, formatNumber, statusLabel, marketplaceName } from "../lib/utils";
import { ArrowLeft, Wand2, BarChart2, TrendingUp, Users, Eye, ShoppingCart, Star, Loader2, CheckCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function ListingDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [priceForm, setPriceForm] = useState({ price: "", discount: "0" });
  const [abForm, setAbForm] = useState({ titleA: "", titleB: "" });
  const [taskId, setTaskId] = useState<number | null>(null);

  const { data: listing, isLoading } = useQuery<any>({ queryKey: [`/api/listings/${id}`] });
  const { data: analyticsData = [] } = useQuery<any[]>({ queryKey: [`/api/analytics/listing/${id}`] });
  const { data: competitors = [] } = useQuery<any[]>({ queryKey: [`/api/listings/${id}/competitors`] });
  const { data: priceHistory = [] } = useQuery<any[]>({ queryKey: [`/api/listings/${id}/price-history`] });

  const { data: taskData } = useQuery<any>({
    queryKey: [`/api/ai-tasks/${taskId}`],
    enabled: !!taskId,
    refetchInterval: (data) => (data?.status === "running" ? 2000 : false),
  });

  const priceMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/listings/${id}/price`, {
      price: Number(priceForm.price),
      discountPercent: Number(priceForm.discount),
      reason: "manual",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}/price-history`] });
      toast({ title: "Цена обновлена" });
    },
  });

  const analyzePrice = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/analyze-price", { listingId: Number(id) }).then(r => r.json()),
    onSuccess: (data) => { setTaskId(data.taskId); toast({ title: "Анализируем цену..." }); },
  });

  const abTestMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/ab-test", {
      listingId: Number(id), titleA: abForm.titleA, titleB: abForm.titleB
    }).then(r => r.json()),
    onSuccess: (data) => { setTaskId(data.taskId); toast({ title: "Запускаем A/B тест..." }); },
  });

  if (isLoading) return <Layout><div className="p-6"><Skeleton className="h-64" /></div></Layout>;
  if (!listing) return <Layout><div className="p-6 text-muted-foreground">Карточка не найдена</div></Layout>;

  const aiOutput = taskData?.outputData ? JSON.parse(taskData.outputData) : null;

  // Aggregate analytics
  const totals = analyticsData.reduce((acc, r) => ({
    views: acc.views + (r.views || 0),
    orders: acc.orders + (r.orders || 0),
    revenue: acc.revenue + (r.revenue || 0),
    clicks: acc.clicks + (r.clicks || 0),
  }), { views: 0, orders: 0, revenue: 0, clicks: 0 });

  const chartData = [...analyticsData].reverse().slice(-14).map(r => ({
    date: r.date?.slice(5),
    views: r.views,
    orders: r.orders,
    revenue: Math.round(r.revenue || 0),
  }));

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/listings"><a className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></a></Link>
          <h1 className="text-xl font-bold flex-1 truncate">{listing.title || "Карточка"}</h1>
          <Badge variant="outline" className={listing.marketplace === "wb" ? "text-purple-600 border-purple-200" : "text-blue-600 border-blue-200"}>
            {marketplaceName(listing.marketplace)}
          </Badge>
          <Badge variant="secondary" className={`status-${listing.status}`}>{statusLabel(listing.status)}</Badge>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Просмотры", value: formatNumber(totals.views), icon: Eye },
            { label: "Клики", value: formatNumber(totals.clicks), icon: Users },
            { label: "Заказы", value: totals.orders, icon: ShoppingCart },
            { label: "Выручка", value: formatCurrency(totals.revenue), icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Icon size={12} />{label}
              </div>
              <div className="font-bold text-lg">{value}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="analytics">
          <TabsList className="mb-4">
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
            <TabsTrigger value="price">Цена</TabsTrigger>
            <TabsTrigger value="competitors">Конкуренты</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Просмотры и заказы</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(243 75% 58%)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(243 75% 58%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="hsl(243 75% 58%)" fill="url(#viewsGrad)" name="Просмотры" />
                    <Area type="monotone" dataKey="orders" stroke="hsl(156 72% 42%)" fill="none" strokeDasharray="4 2" name="Заказы" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Нет данных</div>}
            </div>
          </TabsContent>

          {/* Price */}
          <TabsContent value="price" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-sm">Текущая цена</h3>
                <div className="text-3xl font-bold">{listing.price ? formatCurrency(listing.price) : "—"}</div>
                {listing.discountPercent > 0 && <Badge className="bg-green-100 text-green-700 border-0">-{listing.discountPercent}%</Badge>}

                <div className="space-y-3 pt-2">
                  <Label className="text-xs">Изменить цену</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input data-testid="input-new-price" type="number" placeholder="Новая цена" value={priceForm.price} onChange={e => setPriceForm(p => ({ ...p, price: e.target.value }))} />
                    <Input data-testid="input-new-discount" type="number" placeholder="Скидка %" min="0" max="90" value={priceForm.discount} onChange={e => setPriceForm(p => ({ ...p, discount: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gradient-primary text-white border-0" onClick={() => priceMutation.mutate()} disabled={!priceForm.price || priceMutation.isPending} data-testid="button-update-price">
                      {priceMutation.isPending ? <Loader2 size={13} className="mr-1 animate-spin" /> : null}Обновить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => analyzePrice.mutate()} disabled={analyzePrice.isPending} data-testid="button-analyze-price">
                      <Wand2 size={13} className="mr-1" />AI Анализ
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">История цен</h3>
                {priceHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">История пуста</p>
                ) : (
                  <div className="space-y-2">
                    {priceHistory.slice(0, 8).map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground text-xs">{new Date(h.changedAt).toLocaleDateString("ru-RU")}</span>
                        <span className="font-medium">{formatCurrency(h.price)}</span>
                        {h.discountPercent > 0 && <Badge variant="secondary" className="text-[10px]">-{h.discountPercent}%</Badge>}
                        <span className="text-xs text-muted-foreground">{h.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {aiOutput?.competitors && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-3">Результат анализа</h3>
                <p className="text-sm text-muted-foreground">{aiOutput.suggestion}</p>
                <p className="text-sm font-medium mt-1">Рекомендуемая цена: {formatCurrency(aiOutput.recommendedPrice)}</p>
              </div>
            )}
          </TabsContent>

          {/* Competitors */}
          <TabsContent value="competitors">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Конкуренты ({competitors.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {competitors.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {c.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" />{c.rating}
                        <span>·</span>{c.reviewCount} отзывов
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(c.price)}</div>
                      {listing.price && (
                        <div className={`text-xs ${c.price < listing.price ? "text-red-500" : "text-green-500"}`}>
                          {c.price < listing.price ? "↓ дешевле" : "↑ дороже"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Tools */}
          <TabsContent value="ai" className="space-y-4">
            {/* A/B Test */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Wand2 size={14} className="text-primary" />A/B Тестирование заголовков
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Вариант A</Label>
                  <Input data-testid="input-title-a" placeholder="Заголовок A" value={abForm.titleA} onChange={e => setAbForm(f => ({ ...f, titleA: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Вариант B</Label>
                  <Input data-testid="input-title-b" placeholder="Заголовок B" value={abForm.titleB} onChange={e => setAbForm(f => ({ ...f, titleB: e.target.value }))} />
                </div>
              </div>
              <Button
                size="sm"
                className="gradient-primary text-white border-0"
                onClick={() => abTestMutation.mutate()}
                disabled={!abForm.titleA || !abForm.titleB || abTestMutation.isPending}
                data-testid="button-run-ab-test"
              >
                {abTestMutation.isPending ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Wand2 size={13} className="mr-1" />}
                Запустить A/B тест
              </Button>
            </div>

            {/* Task result */}
            {taskData && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  {taskData.status === "done" ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-blue-500 ai-pulse" />}
                  {taskData.status === "done" ? "Результат готов" : "Обрабатываем..."}
                </div>
                {aiOutput && (
                  <div className="space-y-3 text-sm">
                    {aiOutput.variantA && (
                      <div className="grid md:grid-cols-2 gap-3">
                        {["A", "B"].map(v => (
                          <div key={v} className={`p-3 rounded-lg border-2 ${aiOutput.winner === v ? "border-primary bg-primary/5" : "border-border"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Вариант {v}</span>
                              {aiOutput.winner === v && <Badge className="text-[10px] gradient-primary text-white border-0">Победитель</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">{aiOutput[`variant${v}`].title}</div>
                            <div className="font-bold text-green-600">{aiOutput[`variant${v}`].conversion}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiOutput.confidence && (
                      <p className="text-xs text-muted-foreground">Уверенность: {aiOutput.confidence}</p>
                    )}
                    {aiOutput.suggestion && <p className="text-muted-foreground">{aiOutput.suggestion}</p>}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
