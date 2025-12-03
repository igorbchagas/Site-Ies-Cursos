import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, BarChart, AlertTriangle, Camera, X } from "lucide-react";

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
    label: "Momentos",
    icon: Camera,
    to: "/ies-admin/moments"
  },
  { 
    label: ".Log",
    icon: AlertTriangle,
    to: "/ies-admin/auditoria",
  }
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay Escuro (Fundo) - Só aparece no mobile quando aberto */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Principal */}
      <aside 
        className={`
          /* --- COMPORTAMENTO DE POSICIONAMENTO --- */
          /* Mobile: Fixed (sobrepõe tudo) */
          fixed inset-y-0 left-0 z-40
          
          /* Desktop: Sticky (trava no topo) + Altura da Tela (h-screen) */
          /* Isso garante que a sidebar nunca role para fora de vista */
          md:sticky md:top-0 md:h-screen

          /* --- ESTILO VISUAL --- */
          w-64 bg-zinc-950 border-r border-zinc-800/80 px-5 py-6 flex flex-col gap-8
          transition-transform duration-300 ease-in-out
          
          /* --- ESTADO (Aberto/Fechado no Mobile) --- */
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo / Título + Botão Fechar Mobile */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-bold shadow-lg text-white">
              IES
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm text-white">Painel</span>
              <span className="text-xs text-zinc-400">Administrativo</span>
            </div>
          </div>
          
          {/* Botão X para fechar no mobile */}
          <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navegação - overflow-y-auto garante scroll interno se a tela for muito pequena verticalmente */}
        <nav className="flex-1 flex flex-col gap-2 text-sm overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose} // Fecha a sidebar ao clicar em um link no mobile
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition flex-shrink-0
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

        {/* Rodapé da sidebar (fixo no fundo da sidebar) */}
        <div className="text-[11px] text-zinc-500 flex-shrink-0">
          IesCursos • Área interna
        </div>
      </aside>
    </>
  );
}