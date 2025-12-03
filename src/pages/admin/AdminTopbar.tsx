import { motion } from "framer-motion";
import { Shield, LogOut, Menu } from "lucide-react";

interface AdminTopbarProps {
  userName: string;
  onLogout: () => void;
  onToggleSidebar: () => void; // Nova prop
}

export default function AdminTopbar({ userName, onLogout, onToggleSidebar }: AdminTopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
      className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Esquerda: Botão Menu (Mobile) + Título */}
      <div className="flex items-center gap-3">
        {/* Botão de Menu - Só aparece no mobile (md:hidden) */}
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:block"> {/* Ícone Shield só no desktop para economizar espaço */}
            <Shield size={22} className="text-orange-400" />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            Área Admin
          </span>
          <span className="text-xs text-zinc-400 hidden sm:block"> {/* Subtítulo escondido em telas muito pequenas */}
            Gerencie conteúdos
          </span>
        </div>
      </div>

      {/* Direita: usuário + botão sair */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium">{userName}</span>
          <span className="text-[11px] text-zinc-400">Administrador</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 hover:text-red-300 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-red-500 transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span> {/* Texto "Sair" some em telas minúsculas */}
        </button>
      </div>
    </motion.header>
  );
}