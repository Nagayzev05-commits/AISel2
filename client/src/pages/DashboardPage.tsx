import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { useAuth } from "../components/AuthProvider";
import { formatCurrency, formatNumber, formatDate, taskTypeLabel, marketplaceName } from "../lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Package, Tag, TrendingUp, Eye, ShoppingCart, Wifi, Wand2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const taskStatusIcon = (s: string) => {
  if (s === "done") return <CheckCircle size={14} className="text-green-500" />;
  if (s === "running") return <Clock size={14} className="text-blue-500 ai-pulse" />;
  return <AlertCircle size={14} className="text-amber-500" />;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/dashboard"] });

  const stats = data?.stats || {};
  const chart = data?.chart || [];
  const tasks = data?.recentTasks || [];

  const statCards = [
    { label: "Товаров", value: stats.products || 0, icon: Package, color: "text-primary" },
    { label: "Карточек", value: stats.listings || 0, icon: Tag, color: "text-purple-500" },
    { label: "Выручка (30д)", value: formatCurrency(stats.revenue || 0), icon: TrendingUp, color: "text-green-500" },
    { label: "Просмотры (30д)", value: formatNumber(stats.views || 0), icon: Eye, color: "text-blue-500" },
    { label: "Заказы (30д)", value: stats.orders || 0, icon: ShoppingCart, color: "text-orange-500" },
    { label: "Подключений", value: stats.connections || 0, icon: Wifi, color: "text-cyan-500" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Добро пожаловать, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Вот что происходит с вашими магазинами</p>
          </div>
          <Link href="/products">
            <a><Button size="sm" className="gradient-primary text-white border-0 hover:opacity-90" data-testid="button-add-product">+ Добавить товар</Button></a>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 card-hover" data-testid={`stat-${label}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className={color} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              {isLoading
                ? <Skeleton className="h-6 w-16" />
                : <div className="text-lg font-bold leading-none">{value}</div>
              }
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Выручка (последние 7 дней)</h2>
              <Link href="/analytics">
                <a className="text-xs text-primary hover:underline">Подробнее →</a>
              </Link>
            </div>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243 75% 58%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(243 75% 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatNumber(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Дата: ${l}`} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(243 75% 58%)" strokeWidth={2} fill="url(#revGrad)" name="Выручка" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Нет данных. Добавьте карточки для отображения аналитики.
              </div>
            )}
          </div>

          {/* Recent AI tasks */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Wand2 size={14} className="text-primary" />AI Задачи
              </h2>
              <Link href="/ai-tools">
                <a className="text-xs text-primary hover:underline">Все →</a>
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Wand2 size={32} className="mx-auto mb-2 opacity-30" />
                Задачи появятся после использования AI инструментов
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    {taskStatusIcon(t.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{taskTypeLabel(t.type)}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(t.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/products", label: "Добавить товар", desc: "Загрузить фото и описание", icon: Package },
              { href: "/listings", label: "Создать карточку", desc: "Для WB или Ozon", icon: Tag },
              { href: "/ai-tools", label: "AI Описание", desc: "Автоматически с SEO", icon: Wand2 },
              { href: "/settings", label: "Подключить API", desc: "WB или Ozon кабинет", icon: Wifi },
            ].map(({ href, label, desc, icon: Icon }) => (
              <Link key={href} href={href}>
                <a data-testid={`quick-${label}`} className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[11px] text-muted-foreground">{desc}</div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
