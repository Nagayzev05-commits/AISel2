import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { Loader2, Wand2, BarChart2, Tag, Zap } from "lucide-react";

const features = [
  { icon: Wand2, text: "AI генерация описаний и SEO" },
  { icon: BarChart2, text: "Аналитика и конкуренты" },
  { icon: Tag, text: "Управление ценами и акциями" },
  { icon: Zap, text: "A/B тестирование карточек" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest("POST", mode === "login" ? "/api/auth/login" : "/api/auth/register", form);
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "Ошибка", variant: "destructive" }); return; }
      login(data.user, data.token);
    } catch {
      toast({ title: "Ошибка подключения", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 gradient-primary flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M12 2L3 7v10l9 5 9-5V7z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 7l5 3v5l-5 3-5-3v-5z" fill="white" opacity="0.6"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">MarketAI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Полный AI-менеджер<br />ваших маркетплейсов
          </h1>
          <p className="text-white/70 text-lg mb-10">
            Автоматизируйте Wildberries и Ozon: от обработки фото до аналитики продаж.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <Icon size={16} />
                </div>
                <span className="text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/50 text-sm">
          Сервис берёт % только с реальной прибыли карточки
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <path d="M12 2L3 7v10l9 5 9-5V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold">MarketAI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Вход в аккаунт" : "Регистрация"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {mode === "login" ? "Войдите чтобы управлять карточками" : "Создайте аккаунт бесплатно"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  placeholder="Иван Иванов"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder="ivan@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              data-testid="button-submit"
              disabled={loading}
              className="w-full gradient-primary text-white border-0 hover:opacity-90"
            >
              {loading && <Loader2 size={15} className="mr-2 animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              data-testid="button-toggle-mode"
              className="text-primary hover:underline font-medium"
              onClick={() => setMode(m => m === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-xs text-center text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </div>
        </div>
      </div>
    </div>
  );
}
