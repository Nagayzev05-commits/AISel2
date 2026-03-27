import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useAuth } from "../components/AuthProvider";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatDate } from "../lib/utils";
import { Wifi, WifiOff, Trash2, Plus, Loader2, CheckCircle, AlertCircle, Settings, User, Link2 } from "lucide-react";

const marketplaces = [
  {
    id: "wb",
    name: "Wildberries",
    color: "text-purple-600",
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "🟣",
    help: "Получите API ключ в личном кабинете WB: Настройки → Доступ к API",
  },
  {
    id: "ozon",
    name: "Ozon",
    color: "text-blue-600",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "🔵",
    help: "Получите API ключ в кабинете Ozon Seller: Настройки → API ключи",
  },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const { data: connections = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/connections"] });

  const connectMutation = useMutation({
    mutationFn: async (marketplace: string) => {
      const key = apiKeys[marketplace];
      if (!key) throw new Error("Введите API ключ");
      const res = await apiRequest("POST", "/api/connections", {
        marketplace,
        apiKey: key,
        isActive: 1,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (_, mp) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setApiKeys(k => ({ ...k, [mp]: "" }));
      toast({ title: "Маркетплейс подключён" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({ title: "Отключено" });
    },
  });

  const getConnection = (mp: string) => connections.find((c: any) => c.marketplace === mp);

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Управление аккаунтом и подключениями</p>
        </div>

        <Tabs defaultValue="connections">
          <TabsList>
            <TabsTrigger value="connections"><Link2 size={13} className="mr-1.5" />Подключения</TabsTrigger>
            <TabsTrigger value="account"><User size={13} className="mr-1.5" />Аккаунт</TabsTrigger>
          </TabsList>

          {/* Connections */}
          <TabsContent value="connections" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium">Интеграция с маркетплейсами</p>
              <p className="text-xs text-muted-foreground">Подключите кабинеты WB и Ozon для синхронизации карточек, аналитики и управления ценами.</p>
            </div>

            {marketplaces.map((mp) => {
              const conn = getConnection(mp.id);
              const isConnecting = connectMutation.isPending;

              return (
                <div key={mp.id} className="bg-card border border-border rounded-xl overflow-hidden" data-testid={`connection-${mp.id}`}>
                  <div className={`flex items-center gap-3 p-4 ${conn ? mp.bg : ""}`}>
                    <span className="text-2xl">{mp.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{mp.name}</span>
                        {conn ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-0 status-active">Подключено</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Не подключено</Badge>
                        )}
                      </div>
                      {conn && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          API ключ: {conn.apiKey} · Подключено {formatDate(conn.connectedAt)}
                        </div>
                      )}
                    </div>
                    {conn ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => disconnectMutation.mutate(conn.id)}
                        data-testid={`button-disconnect-${mp.id}`}
                      >
                        <WifiOff size={13} className="mr-1.5" />Отключить
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {!conn && (
                    <div className="p-4 border-t border-border space-y-3">
                      <p className="text-xs text-muted-foreground">{mp.help}</p>
                      <div className="flex gap-2">
                        <Input
                          data-testid={`input-api-key-${mp.id}`}
                          placeholder="Вставьте API ключ"
                          type="password"
                          value={apiKeys[mp.id] || ""}
                          onChange={e => setApiKeys(k => ({ ...k, [mp.id]: e.target.value }))}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => connectMutation.mutate(mp.id)}
                          disabled={isConnecting || !apiKeys[mp.id]}
                          className="gradient-primary text-white border-0 hover:opacity-90"
                          data-testid={`button-connect-${mp.id}`}
                        >
                          {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <><Wifi size={13} className="mr-1.5" />Подключить</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Commission info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Как работает монетизация</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    MarketAI берёт {((user?.commissionRate || 0.05) * 100).toFixed(0)}% от прибыли с каждой карточки, которой управляет. Оплата происходит только с реальных продаж — без фиксированных абонентских платежей.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Account */}
          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-sm">Профиль</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                  <Badge variant="secondary" className="mt-1 text-xs capitalize">
                    {user?.plan === "free" ? "Бесплатный план" : user?.plan}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-sm">Тарифные планы</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { name: "Бесплатный", price: "0 ₽", features: ["До 3 товаров", "До 5 карточек", "Базовая аналитика"], current: user?.plan === "free" },
                  { name: "Про", price: "2 990 ₽/мес", features: ["Неограниченно товаров", "Все AI инструменты", "Расширенная аналитика", "Приоритетная поддержка"], current: user?.plan === "pro", highlight: true },
                  { name: "Бизнес", price: "7 490 ₽/мес", features: ["Всё из Про", "Команда до 5 человек", "Dedicated manager", "API интеграции"], current: user?.plan === "enterprise" },
                ].map(plan => (
                  <div key={plan.name} className={`rounded-xl border p-4 ${plan.highlight ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{plan.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{plan.price}</div>
                      </div>
                      {plan.current && <Badge className="text-[10px] gradient-primary text-white border-0">Текущий</Badge>}
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle size={10} className="text-green-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <Button size="sm" className="w-full mt-3 text-xs" variant={plan.highlight ? "default" : "outline"}
                        onClick={() => toast({ title: "Скоро! Оплата тарифов будет доступна в ближайшее время." })}>
                        Выбрать
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-3 text-destructive">Опасная зона</h2>
              <Button variant="destructive" size="sm" onClick={logout} data-testid="button-logout">
                Выйти из аккаунта
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
