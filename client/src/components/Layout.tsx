import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { cn } from "../lib/utils";
import {
  LayoutDashboard, Package, Tag, BarChart2, Wand2, Settings, LogOut,
  Sun, Moon, Menu, X, Bell, ChevronRight, Zap
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PerplexityAttribution } from "./PerplexityAttribution";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Дашборд" },
  { href: "/products", icon: Package, label: "Товары" },
  { href: "/listings", icon: Tag, label: "Карточки" },
  { href: "/analytics", icon: BarChart2, label: "Аналитика" },
  { href: "/ai-tools", icon: Wand2, label: "AI Инструменты" },
  { href: "/settings", icon: Settings, label: "Настройки" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-card border-r border-border transition-transform duration-300",
        "lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" aria-label="MarketAI logo">
              <path d="M12 2L3 7v10l9 5 9-5V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 7l5 3v5l-5 3-5-3v-5z" fill="currentColor" opacity="0.6"/>
              <circle cx="12" cy="12" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">MarketAI</div>
            <div className="text-xs text-muted-foreground">AI-менеджер</div>
          </div>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <a
                  data-testid={`nav-${label}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} />
                  {label}
                  {href === "/ai-tools" && (
                    <Badge className="ml-auto text-[10px] py-0 px-1.5 h-4 gradient-primary text-white border-0">AI</Badge>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{user.plan === "free" ? "Бесплатный" : user.plan}</div>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1">
            <span className="text-foreground font-medium">
              {navItems.find(n => n.href === location || (n.href !== "/" && location.startsWith(n.href)))?.label || "Дашборд"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs h-8">
              <Zap size={12} className="text-primary" />
              Upgrade
            </Button>
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Переключить тему"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
          <PerplexityAttribution />
        </main>
      </div>
    </div>
  );
}
