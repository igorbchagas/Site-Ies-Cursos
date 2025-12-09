import { motion } from "framer-motion";
import { Shield, LogOut, Menu, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminTopbarProps {
  userName: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
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
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
        >
          <Menu size={22} />
        </button>

        <div className="hidden md:block">
            <Shield size={22} className="text-orange-400" />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-100">
            Área Admin
          </span>
          <span className="text-xs text-zinc-400 hidden sm:block">
            Gerencie conteúdos
          </span>
        </div>
      </div>

      {/* Direita: Botões e Usuário */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Info do Usuário (Esconde em telas pequenas) */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-200">{userName}</span>
          <span className="text-[11px] text-zinc-400">Administrador</span>
        </div>

        {/* Separador visual */}
        <div className="hidden sm:block w-px h-8 bg-zinc-800 mx-1"></div>

        {/* Botão VER SITE - AGORA NA MESMA ABA */}
        <Link
          to="/"
          // Removi o target="_blank" para abrir na mesma aba
          className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 hover:text-white px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
          title="Ir para o site público"
        >
          <Home size={18} />
          {/* Texto aparece apenas em telas maiores que mobile (sm) */}
          <span className="hidden sm:inline">Voltar ao site</span>
        </Link>

        {/* Botão SAIR */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 hover:text-red-300 px-3 py-2 rounded-lg border border-zinc-700 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
          title="Sair do sistema"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </motion.header>
  );
}