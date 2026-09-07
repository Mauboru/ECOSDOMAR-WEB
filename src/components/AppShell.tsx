import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, Cloud, LogOut, Leaf, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPending, syncPending } from "@/lib/offline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const NAV = [
  { to: "/" as const, label: "Painel" },
  { to: "/novo" as const, label: "Novo registro" },
  { to: "/registros" as const, label: "Registros" },
  { to: "/graficos" as const, label: "Gráficos" },
];

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function usePendingCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getPending().length);
    update();
    window.addEventListener("pending-changed", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("pending-changed", update);
      window.removeEventListener("online", update);
    };
  }, []);
  return count;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const pending = usePendingCount();
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    if (!online || !user || pending === 0) return;
    void syncPending(user.id).then((n) => {
      if (n > 0) {
        toast.success(`${n} registro(s) sincronizado(s)`);
        void queryClient.invalidateQueries();
      }
    });
  }, [online, user, pending, queryClient]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="size-4" />
            </span>
            Observatorio Caiçara
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant={online ? "secondary" : "destructive"} className="gap-1">
              {online ? <Cloud className="size-3" /> : <CloudOff className="size-3" />}
              {online ? "Online" : "Offline"}
              {pending > 0 ? ` · ${pending} pendente(s)` : ""}
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.nome || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpenMenu((v) => !v)}
              aria-label="Menu"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
        {openMenu && (
          <nav className="flex flex-col gap-1 border-t border-border/70 px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpenMenu(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
