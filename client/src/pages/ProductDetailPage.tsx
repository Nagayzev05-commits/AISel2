import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Layout from "../components/Layout";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { formatDate, statusLabel, marketplaceName } from "../lib/utils";
import { ArrowLeft, Tag, Wand2, Image, Loader2, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [taskId, setTaskId] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery<any>({ queryKey: [`/api/products/${id}`] });
  const { data: listings = [] } = useQuery<any[]>({ queryKey: ["/api/listings"] });
  const productListings = listings.filter((l: any) => l.productId === Number(id));

  const { data: taskData } = useQuery<any>({
    queryKey: [`/api/ai-tasks/${taskId}`],
    enabled: !!taskId,
    refetchInterval: (data) => (data?.status === "running" ? 2000 : false),
  });

  const generateMutation = useMutation({
    mutationFn: async (marketplace: string) => {
      const res = await apiRequest("POST", "/api/ai/generate-content", { productId: Number(id), marketplace });
      return res.json();
    },
    onSuccess: (data) => {
      setTaskId(data.taskId);
      toast({ title: "AI генерирует контент...", description: "Обычно занимает 10-30 секунд" });
    },
  });

  const infographicMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/infographic", { productId: Number(id) });
      return res.json();
    },
    onSuccess: (data) => {
      setTaskId(data.taskId);
      toast({ title: "Создаём инфографику..." });
    },
  });

  if (isLoading) return <Layout><div className="p-6"><Skeleton className="h-64" /></div></Layout>;
  if (!product) return <Layout><div className="p-6 text-muted-foreground">Товар не найден</div></Layout>;

  const images = product.images ? JSON.parse(product.images) : [];
  const aiOutput = taskData?.outputData ? JSON.parse(taskData.outputData) : null;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <a className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18} /></a>
          </Link>
          <h1 className="text-xl font-bold flex-1 truncate">{product.name}</h1>
          <Badge variant="outline" className={`status-${product.status}`}>{statusLabel(product.status)}</Badge>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Images */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-sm">Фотографии</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {images.map((src: string, i: number) => (
                  <div key={i} className={`rounded-xl overflow-hidden border border-border ${i === 0 ? "col-span-2 aspect-square" : "aspect-square"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <Image size={48} className="text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info + Actions */}
          <div className="lg:col-span-3 space-y-4">
            {/* Meta */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-sm">Информация</h2>
              {[
                { label: "Категория", val: product.category },
                { label: "Бренд", val: product.brand },
                { label: "Добавлен", val: formatDate(product.createdAt) },
              ].filter(r => r.val).map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
              {product.description && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Описание</div>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
              {product.characteristics && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Характеристики</div>
                  <pre className="text-xs font-mono whitespace-pre-wrap">{product.characteristics}</pre>
                </div>
              )}
            </div>

            {/* AI Actions */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Wand2 size={14} className="text-primary" />AI Инструменты
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 hover:border-primary/50"
                  onClick={() => generateMutation.mutate("wb")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-wb"
                >
                  {generateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  Описание для WB
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 hover:border-primary/50"
                  onClick={() => generateMutation.mutate("ozon")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-ozon"
                >
                  <Wand2 size={13} />Описание для Ozon
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 hover:border-primary/50 col-span-2"
                  onClick={() => infographicMutation.mutate()}
                  disabled={infographicMutation.isPending}
                  data-testid="button-infographic"
                >
                  <Image size={13} />Создать инфографику
                </Button>
              </div>

              {/* Task result */}
              {taskData && (
                <div className="border border-border rounded-lg p-3 bg-muted/40">
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium">
                    {taskData.status === "done" ? <CheckCircle size={13} className="text-green-500" /> : <Clock size={13} className="text-blue-500 ai-pulse" />}
                    {taskData.status === "done" ? "Готово" : "Генерируем..."}
                  </div>
                  {aiOutput && (
                    <div className="space-y-2 text-xs">
                      {aiOutput.title && (
                        <div>
                          <span className="text-muted-foreground">Заголовок: </span>
                          <span className="font-medium">{aiOutput.title}</span>
                        </div>
                      )}
                      {aiOutput.keywords && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Ключевые слова:</span>
                          <div className="flex flex-wrap gap-1">
                            {aiOutput.keywords.slice(0, 6).map((k: string) => (
                              <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiOutput.description && (
                        <div>
                          <span className="text-muted-foreground">Описание сгенерировано</span>
                          <Link href="/listings">
                            <a className="ml-2 text-primary hover:underline">Создать карточку →</a>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Listings */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm flex items-center gap-2"><Tag size={13} />Карточки</h2>
                <Link href="/listings">
                  <a className="text-xs text-primary hover:underline">+ Создать</a>
                </Link>
              </div>
              {productListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Карточек пока нет</p>
              ) : (
                <div className="space-y-2">
                  {productListings.map((l: any) => (
                    <Link key={l.id} href={`/listings/${l.id}`}>
                      <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                        <Badge variant="outline" className={l.marketplace === "wb" ? "text-purple-600 border-purple-200" : "text-blue-600 border-blue-200"}>
                          {marketplaceName(l.marketplace)}
                        </Badge>
                        <span className="text-sm flex-1 truncate">{l.title || "Без названия"}</span>
                        <Badge variant="secondary" className={`status-${l.status} text-[10px]`}>{statusLabel(l.status)}</Badge>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
