import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { formatCurrency, formatNumber, marketplaceName } from "../lib/utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, ShoppingCart, BarChart2, Skeleton as SkeletonIcon } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery<any>({ queryKey: [`/api/analytics?days=${days}`] });
  const { data: listings = [] } = useQuery<any[]>({ queryKey: ["/api/listings"] });

  const totals = data?.totals || {};
  const chart = data?.chartData || [];

  const conversionRate = totals.views > 0 ? ((totals.orders / totals.views) * 100).toFixed(2) : "0.00";

  const wbListings = listings.filter((l: any) => l.marketplace === "wb").length;
  const ozonListings = listings.filter((l: any) => l.marketplace === "ozon").length;
  const pieData = [
    { name: "Wildberries", value: wbListings, color: "#8b5cf6" },
    { name: "Ozon", value: ozonListings, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: "Выручка", value: formatCurrency(totals.revenue || 0), icon: TrendingUp, color: "text-green-500" },
    { label: "Заказы", value: totals.orders || 0, icon: ShoppingCart, color: "text-blue-500" },
    { label: "Просмотры", value: formatNumber(totals.views || 0), icon: Eye, color: "text-purple-500" },
    { label: "Конверсия", value: conversionRate + "%", icon: BarChart2, color: "text-orange-500" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Аналитика</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Сводные данные по всем маркетплейсам</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${days === d ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                data-testid={`filter-days-${d}`}
              >
                {d}д
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Icon size={13} className={color} />{label}
              </div>
              {isLoading ? <Skeleton className="h-6 w-20" /> : <div className="text-xl font-bold">{value}</div>}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4">Выручка по дням</h2>
            {isLoading ? <Skeleton className="h-56" /> : chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243 75% 58%)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="hsl(243 75% 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5) || d} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatNumber(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(243 75% 58%)" strokeWidth={2} fill="url(#revGrad2)" name="Выручка" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart2 size={36} className="mb-2 opacity-30" />
                <span className="text-sm">Нет данных. Создайте карточки для отображения.</span>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4">По маркетплейсам</h2>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                      <span className="ml-auto font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Нет карточек
              </div>
            )}
          </div>
        </div>

        {/* Orders chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">Заказы по дням</h2>
          {isLoading ? <Skeleton className="h-40" /> : chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5) || d} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(156 72% 42%)" radius={[3, 3, 0, 0]} name="Заказы" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Нет данных</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
