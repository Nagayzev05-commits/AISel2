import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatDate, taskTypeLabel } from "../lib/utils";
import { Wand2, BarChart2, Image, Tag, Loader2, CheckCircle, Clock, AlertTriangle, Zap, FileText, Search } from "lucide-react";

const tools = [
  {
    id: "description",
    title: "AI Описание",
    desc: "Генерирует заголовок, описание товара и SEO-ключи на основе фото и характеристик",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "seo",
    title: "SEO Оптимизация",
    desc: "Подбирает ключевые слова с высоким объёмом поиска для WB и Ozon",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "price",
    title: "Анализ цен",
    desc: "Сравнивает с конкурентами и рекомендует оптимальную цену для роста продаж",
    icon: BarChart2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    id: "infographic",
    title: "Инфографика",
    desc: "Создаёт профессиональную инфографику для карточки товара",
    icon: Image,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "ab",
    title: "A/B Тестирование",
    desc: "Тестирует разные заголовки и находит вариант с лучшей конверсией",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "competitor",
    title: "Анализ конкурентов",
    desc: "Анализирует топ конкурентов: цены, ключи, инфографику, описания",
    icon: Tag,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export default function AiToolsPage() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedListing, setSelectedListing] = useState("");
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/ai-tasks"] });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });
  const { data: listings = [] } = useQuery<any[]>({ queryKey: ["/api/listings"] });

  const runTool = useMutation({
    mutationFn: async (toolId: string) => {
      setRunningTool(toolId);
      let endpoint = "";
      let body: Record<string, unknown> = {};

      if (toolId === "description" || toolId === "seo") {
        if (!selectedProduct) throw new Error("Выберите товар");
        endpoint = "/api/ai/generate-content";
        body = { productId: Number(selectedProduct), marketplace: "wb" };
      } else if (toolId === "price" || toolId === "ab" || toolId === "competitor") {
        if (!selectedListing) throw new Error("Выберите карточку");
        endpoint = toolId === "price" ? "/api/ai/analyze-price"
          : toolId === "ab" ? "/api/ai/ab-test"
          : "/api/ai/analyze-price";
        body = { listingId: Number(selectedListing), titleA: "Вариант заголовка A", titleB: "Вариант заголовка B" };
      } else if (toolId === "infographic") {
        if (!selectedProduct) throw new Error("Выберите товар");
        endpoint = "/api/ai/infographic";
        body = { productId: Number(selectedProduct) };
      }

      const res = await apiRequest("POST", endpoint, body);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tasks"] });
      toast({ title: "AI задача запущена", description: "Результат появится в истории" });
    },
    onError: (e: any) => toast({ title: e.message || "Ошибка", variant: "destructive" }),
    onSettled: () => setRunningTool(null),
  });

  const taskStatusIcon = (s: string) => {
    if (s === "done") return <CheckCircle size={14} className="text-green-500" />;
    if (s === "running") return <Clock size={14} className="text-blue-500 ai-pulse" />;
    return <AlertTriangle size={14} className="text-amber-500" />;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wand2 size={18} className="text-primary" />AI Инструменты
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Автоматически оптимизируйте карточки с помощью искусственного интеллекта</p>
        </div>

        {/* Selectors */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3">Выберите объект для работы</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Товар</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger data-testid="select-ai-product"><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Карточка</label>
              <Select value={selectedListing} onValueChange={setSelectedListing}>
                <SelectTrigger data-testid="select-ai-listing"><SelectValue placeholder="Выберите карточку" /></SelectTrigger>
                <SelectContent>
                  {listings.map((l: any) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.title || `Карточка #${l.id}`} ({l.marketplace === "wb" ? "WB" : "Ozon"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tool cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-card border border-border rounded-xl p-4 card-hover flex flex-col gap-3" data-testid={`tool-card-${tool.id}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon size={16} className={tool.color} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{tool.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.desc}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-auto hover:border-primary/50 hover:bg-primary/5 w-full"
                onClick={() => runTool.mutate(tool.id)}
                disabled={runTool.isPending && runningTool === tool.id}
                data-testid={`button-run-tool-${tool.id}`}
              >
                {runTool.isPending && runningTool === tool.id
                  ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Запускаем...</>
                  : <><Wand2 size={12} className="mr-1.5" />Запустить</>
                }
              </Button>
            </div>
          ))}
        </div>

        {/* Tasks history */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-sm">История AI задач</h2>
            <Badge variant="secondary">{tasks.length} задач</Badge>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : tasks.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Wand2 size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Запустите любой инструмент выше — история задач появится здесь</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((t: any) => {
                const output = t.outputData ? JSON.parse(t.outputData) : null;
                return (
                  <div key={t.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors" data-testid={`task-row-${t.id}`}>
                    <div className="mt-0.5">{taskStatusIcon(t.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{taskTypeLabel(t.type)}</span>
                        <Badge variant="secondary" className={`text-[10px] status-${t.status}`}>{
                          t.status === "done" ? "Готово" : t.status === "running" ? "Выполняется" : "Ошибка"
                        }</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</div>
                      {output && t.status === "done" && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 space-y-1">
                          {output.title && <div><span className="text-foreground font-medium">Заголовок:</span> {output.title}</div>}
                          {output.keywords && <div><span className="text-foreground font-medium">Ключи:</span> {output.keywords.slice(0, 4).join(", ")}</div>}
                          {output.recommendedPrice && <div><span className="text-foreground font-medium">Рекомендуемая цена:</span> {Math.round(output.recommendedPrice)} ₽</div>}
                          {output.winner && <div><span className="text-foreground font-medium">Победитель A/B:</span> Вариант {output.winner} ({output.confidence})</div>}
                          {output.generated && <div className="text-green-600">Инфографика создана</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
