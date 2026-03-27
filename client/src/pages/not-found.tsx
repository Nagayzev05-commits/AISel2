import { Link } from "wouter";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-6xl font-bold text-primary mb-4">404</div>
        <h1 className="text-xl font-semibold mb-2">Страница не найдена</h1>
        <p className="text-muted-foreground mb-6">Такой страницы не существует</p>
        <Link href="/"><a><Button className="gradient-primary text-white border-0">На главную</Button></a></Link>
      </div>
    </div>
  );
}
