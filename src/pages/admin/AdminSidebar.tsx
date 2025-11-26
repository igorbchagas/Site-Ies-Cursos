import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BarChart, AlertTriangle } from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/ies-admin",
  },
  {
    label: "Cursos",
    icon: BookOpen,
    to: "/ies-admin/cursos",
  },
  { 
    label: "Clientes",
    icon: BarChart,
    to: "/ies-admin/leads",
  },
    { 
    label: ".Log",
    icon: AlertTriangle,
    to: "/ies-admin/auditoria",
  }
  // no futuro dá pra adicionar:
  // { label: "Promoções", icon: Tag, to: "/ies-admin/promocoes" },
  // { label: "Configurações", icon: Settings, to: "/ies-admin/configuracoes" },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-zinc-950/90 border-r border-zinc-800/80 px-5 py-6 gap-8">
      {/* Logo / título */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-bold shadow-lg">
          Ies
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm">Painel</span>
          <span className="text-xs text-zinc-400">Administrativo</span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col gap-2 text-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                ${
                  isActive
                    ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
            >
              <Icon size={18} className={isActive ? "text-orange-400" : "text-zinc-400"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé da sidebar (pode colocar infos depois) */}
      <div className="text-[11px] text-zinc-500">
        IesCursos • Área interna
      </div>
    </aside>
  );
}
